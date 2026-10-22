"use server";

import { randomBytes } from "node:crypto";

import {
  DETAIL_LIMITS,
  validateSubmission,
  type SpecChecks,
  type SpecDetails,
  type SpecPayload,
  type SubmitResult,
} from "@/app/(site)/spec-sheet/submission";
import { CONTACT_INBOX } from "@/lib/contact";
import { sendEmail } from "@/lib/email";
import {
  callerKey,
  multiLine,
  overRateLimit,
  singleLine,
} from "@/lib/form-input";
import {
  orderableModel,
  restoreSelections,
  specLines,
  specTotalPence,
} from "@/lib/spec";
import {
  confirmationHtml,
  confirmationSubject,
  confirmationText,
} from "@/lib/spec-email";

/*
 * The spec sheet's submit.
 *
 * Sends one email: the customer's confirmation, with their PDF attached and
 * the orders inbox copied in, so the customer team is on the thread from the
 * first message and Reply goes to them.
 *
 * Nothing the page sends is trusted. The details are cleaned and capped, the
 * selections are read back through the builder's rules, and the price in the
 * email is worked out here from those selections — never taken from the page.
 * The PDF is the customer's own copy, attached as sent; the email body is the
 * record the team works from.
 */

/*
 * Where builds land. SPEC_SHEET_ORDERS_EMAIL when set, so orders can go to a
 * different inbox from general enquiries; the contact inbox otherwise.
 */
const ORDERS_INBOX = process.env.SPEC_SHEET_ORDERS_EMAIL || CONTACT_INBOX;

const MAX_PDF_BYTES = 2.5 * 1024 * 1024;

/*
 * A short reference for the customer and the team to quote: OG, the date,
 * and four random characters. Unambiguous letters and digits only, so it can
 * be read down a phone line.
 */
function makeReference() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const random = [...randomBytes(4)].map((b) => alphabet[b % alphabet.length]).join("");
  const d = new Date();
  const date = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `OG-${date}-${random}`;
}

function cleanDetails(raw: unknown): SpecDetails {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const clip = (key: keyof SpecDetails, value: string) =>
    value.slice(0, DETAIL_LIMITS[key]);
  return {
    name: clip("name", singleLine(d.name)),
    email: clip("email", singleLine(d.email)),
    phone: clip("phone", singleLine(d.phone)),
    order: clip("order", singleLine(d.order)),
    address: clip("address", singleLine(d.address)),
    notes: clip("notes", multiLine(d.notes)),
    signedBy: clip("signedBy", singleLine(d.signedBy)),
    date: clip("date", singleLine(d.date)),
  };
}

function cleanChecks(raw: unknown): SpecChecks {
  const c = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { spec: c.spec === true, time: c.time === true };
}

/* The PDF, if one arrived and it is one. A missing PDF does not stop a build. */
async function readPdf(entry: FormDataEntryValue | null): Promise<Buffer | null> {
  if (!(entry instanceof File) || entry.size === 0 || entry.size > MAX_PDF_BYTES) return null;
  const buffer = Buffer.from(await entry.arrayBuffer());
  return buffer.subarray(0, 5).toString("latin1") === "%PDF-" ? buffer : null;
}

export async function submitBuild(formData: FormData): Promise<SubmitResult> {
  let payload: Partial<SpecPayload>;
  try {
    const raw = formData.get("payload");
    payload = typeof raw === "string" ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }

  /*
   * The honeypot. Answered as a success, without sending anything: telling a
   * bot which check it failed is how the next version of it gets past.
   */
  if (singleLine(payload.company)) {
    return { status: "sent", reference: makeReference(), email: "", hasPdf: false };
  }

  const model = orderableModel(payload.modelSlug);
  if (!model) {
    return {
      status: "error",
      message: "That model can't be ordered yet. Choose an available model and try again.",
    };
  }

  const details = cleanDetails(payload.details);
  const checks = cleanChecks(payload.checks);
  const errors = validateSubmission(details, checks);
  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "A few details are missing. They're marked on the sheet.",
      errors,
    };
  }

  if (overRateLimit(`spec:${await callerKey()}`)) {
    return {
      status: "error",
      message: `That's several submissions in a short space of time. Give it a few minutes, or email ${ORDERS_INBOX} directly.`,
    };
  }

  const touched = new Set(
    Array.isArray(payload.touched)
      ? payload.touched.filter((t): t is string => typeof t === "string")
      : [],
  );
  const selections = restoreSelections(payload.selections, touched);
  const lines = specLines(selections, model);
  const totalPence = specTotalPence(selections, model);
  const reference = makeReference();
  const pdf = await readPdf(formData.get("pdf"));

  const email = {
    reference,
    modelName: model.name,
    lines,
    totalPence,
    details,
    hasPdf: pdf !== null,
  };

  const result = await sendEmail({
    to: details.email,
    cc: ORDERS_INBOX,
    replyTo: ORDERS_INBOX,
    subject: confirmationSubject(email),
    text: confirmationText(email),
    html: confirmationHtml(email),
    attachments: pdf
      ? [
          {
            filename: `Origin-${model.name.replace(/\s+/g, "-")}-spec-${reference}.pdf`,
            content: pdf.toString("base64"),
          },
        ]
      : undefined,
  });

  if (!result.ok) {
    /*
     * Every failure here is ours. The build is still on the page and saved in
     * the browser, so the customer loses nothing by trying again — and they
     * can download the PDF and email it as a fallback.
     */
    return {
      status: "error",
      message: `We couldn't send your build just now. Nothing's lost — try again in a moment, or download the PDF and email it to ${ORDERS_INBOX}.`,
    };
  }

  return { status: "sent", reference, email: details.email, hasPdf: pdf !== null };
}
