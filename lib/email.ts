import { Resend } from "resend";

import { CONTACT_INBOX } from "@/lib/contact";

/*
 * The mail layer.
 *
 * Everything the site sends goes through here. Today that is the contact form;
 * the order confirmation that Stripe's checkout will need is the next caller,
 * which is why this is a transport with a `sendEmail` on it rather than a
 * function called `sendContactMessage` with an API key inside it. A second
 * caller should have to supply a subject and a body, not a provider.
 *
 * Server-only by construction — it reads a secret and talks to Resend, so it
 * must never be imported from a component that ships to the browser. There is
 * no `server-only` package in this project to enforce that with, and adding a
 * dependency to state a rule felt worse than stating it here: the one importer
 * is a "use server" file.
 */

/*
 * The envelope sender. Resend will only accept a `from` on a domain verified
 * in the account it belongs to, so this is an env var rather than a literal:
 * whoever holds the Resend account decides what has been verified, and until
 * originguitars.com is, this can be pointed at a sandbox sender without a code
 * change.
 *
 * Note it is deliberately not the visitor's address. Sending as the person who
 * filled the form is what gets a domain marked as a spoofer by SPF and DMARC —
 * their address goes in `replyTo`, which is what makes Reply in the inbox do
 * the obvious thing anyway.
 */
const FROM = process.env.RESEND_FROM_EMAIL ?? `Origin Guitars <${CONTACT_INBOX}>`;

/*
 * Why a result object rather than a thrown error: every caller so far is a
 * form action whose job is to tell somebody what happened, and the three
 * outcomes are genuinely different messages. "Not configured" is our problem
 * and should say so; "rejected" is usually an address Resend would not accept;
 * "unavailable" is the network. A thrown error would flatten the three into
 * one apology.
 */
export type SendResult =
  | { ok: true; id: string }
  | { ok: false; reason: "unconfigured" | "rejected" | "unavailable" };

export type SendEmailInput = {
  to: string;
  subject: string;
  /*
   * Plain text only, and no `html` sibling. Nothing being sent today is worth
   * a layout, and a text body cannot carry markup written by whoever filled
   * the form into a mail client that renders it.
   */
  text: string;
  replyTo?: string;
};

/*
 * Constructed per call rather than at module load. A client built at import
 * time reads the key at import time, which means a missing key is a crash
 * during the build rather than a message on a form — and it also caches a
 * value that a redeploy with a rotated key would not pick up.
 */
function client() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

export async function sendEmail({
  to,
  subject,
  text,
  replyTo,
}: SendEmailInput): Promise<SendResult> {
  const resend = client();

  if (!resend) {
    /*
     * Logged rather than thrown, and logged loudly. A form that says "email us
     * instead" while the server says nothing is a fault nobody finds until
     * somebody complains that they never got a reply.
     */
    console.error(
      "[email] RESEND_API_KEY is not set — no mail will be sent from this deployment.",
    );
    return { ok: false, reason: "unconfigured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      text,
      replyTo,
    });

    if (error) {
      console.error(`[email] Resend rejected the message: ${error.message}`);
      return { ok: false, reason: "rejected" };
    }

    /* Typed as nullable by the SDK even on the success branch. */
    if (!data) {
      console.error("[email] Resend returned neither an id nor an error.");
      return { ok: false, reason: "rejected" };
    }

    return { ok: true, id: data.id };
  } catch (cause) {
    /* Network, DNS, a timeout — anything that never reached Resend. */
    console.error("[email] Sending failed before Resend answered.", cause);
    return { ok: false, reason: "unavailable" };
  }
}
