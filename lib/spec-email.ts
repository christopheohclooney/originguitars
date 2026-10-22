import type { SpecDetails } from "@/app/(site)/spec-sheet/submission";
import { formatDelta, formatPrice } from "@/lib/pricing";
import type { SpecLine } from "@/lib/spec";

/*
 * The confirmation a customer gets when they submit a build, with the orders
 * inbox copied in. One message, one thread: the customer's reply and the
 * team's follow-up land in the same conversation, with the PDF attached.
 *
 * HTML for the branded version, plain text alongside for clients that do not
 * render it. Every value the customer typed is escaped before it goes into
 * the HTML — the spec lines are ours, but names, addresses and notes are not.
 *
 * Email HTML is its own dialect: tables for layout, inline styles, no web
 * fonts, no SVG. Hence the PNG logo and the system font stack.
 */

const C = {
  page: "#0a0a0a",
  card: "#0f0f0f",
  line: "#1f1f1f",
  strong: "#333333",
  ink: "#f2f2f2",
  muted: "#8c8c8c",
  white: "#ffffff",
} as const;

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/*
 * Where the logo is served from. An email cannot use a relative URL, so this
 * is the site's own origin: SITE_URL when set, else the production domain
 * Vercel provides, else the current Vercel address.
 */
function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "https://originguitars.vercel.app";
}

/* The four steps after submission, as the customer team runs them today. */
export const NEXT_STEPS = [
  {
    title: "Our customer team will reach out",
    body: "Someone from our UK team will be in touch personally to talk through your build.",
  },
  {
    title: "Your final invoice, and any tweaks",
    body: "They'll send your final invoice, along with any tweaks or considerations for the build ahead of it.",
  },
  {
    title: "Payment",
    body: "Once you're happy with everything, the customer team will take you through payment.",
  },
  {
    title: "Built, checked and on its way",
    body: "Your guitar is built, then checked and set up by our UK team before it's sent to you.",
  },
] as const;

export type ConfirmationInput = {
  reference: string;
  modelName: string;
  lines: SpecLine[];
  totalPence: number;
  details: SpecDetails;
  /* Whether the PDF made it — the copy only promises an attachment if so. */
  hasPdf: boolean;
};

const introLine = (modelName: string, hasPdf: boolean) =>
  `We really appreciate you taking the time to spec out your Origin ${modelName}. ${
    hasPdf
      ? "Your build sheet is attached as a PDF, and the full spec is below for reference."
      : "The full spec is below for reference."
  }`;

export function confirmationSubject({ reference, modelName }: ConfirmationInput) {
  return `We've received your Origin ${modelName} spec (${reference})`;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

function detailRows(details: SpecDetails): [string, string][] {
  return (
    [
      ["Name", details.name],
      ["Email", details.email],
      ["Phone", details.phone],
      ["Delivery address", details.address],
      ["Order number", details.order],
      ["Signed by", details.signedBy],
      ["Date", details.date],
    ] as [string, string][]
  ).filter(([, value]) => value.trim());
}

const lineDelta = (line: SpecLine) =>
  line.key === "base" ? formatPrice(line.pence) : formatDelta(line.pence);

export function confirmationText(input: ConfirmationInput) {
  const { reference, modelName, lines, totalPence, details, hasPdf } = input;
  const name = firstName(details.name);
  return [
    `Thanks for your order${name ? `, ${name}` : ""}.`,
    "",
    introLine(modelName, hasPdf),
    "",
    `Reference: ${reference}`,
    "",
    "WHAT HAPPENS NEXT",
    ...NEXT_STEPS.map((s, i) => `${i + 1}. ${s.title}. ${s.body}`),
    "",
    "YOUR SPEC",
    ...lines.map((l) => `${l.label}: ${l.value} (${lineDelta(l)})`),
    `Total: ${formatPrice(totalPence)}`,
    "",
    "YOUR DETAILS",
    ...detailRows(details).map(([k, v]) => `${k}: ${v}`),
    ...(details.notes.trim() ? ["", "NOTES FOR THE WORKSHOP", details.notes.trim()] : []),
    "",
    "Any questions in the meantime? Reply to this email and it comes straight to our team.",
    "",
    "Origin Guitars",
    "Built to order in the United Kingdom",
  ].join("\n");
}

export function confirmationHtml(input: ConfirmationInput) {
  const { reference, modelName, lines, totalPence, details, hasPdf } = input;
  const e = escapeHtml;
  const name = firstName(details.name);

  const label = (text: string) =>
    `<p style="margin:0 0 12px;font-family:${MONO};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.muted};">${text}</p>`;

  const steps = NEXT_STEPS.map(
    (s, i) => `
      <tr>
        <td valign="top" style="padding:0 16px 18px 0;width:28px;">
          <div style="width:28px;height:28px;border:1px solid ${C.strong};border-radius:14px;text-align:center;line-height:28px;font-family:${MONO};font-size:12px;color:${C.ink};">${i + 1}</div>
        </td>
        <td valign="top" style="padding:3px 0 18px;">
          <p style="margin:0;font-size:15px;font-weight:600;color:${C.ink};">${s.title}</p>
          <p style="margin:4px 0 0;font-size:14px;line-height:1.55;color:${C.muted};">${s.body}</p>
        </td>
      </tr>`,
  ).join("");

  const specRows = lines
    .map(
      (l) => `
      <tr>
        <td style="padding:9px 12px 9px 0;border-top:1px solid ${C.line};font-size:13px;color:${C.muted};width:38%;">${e(l.label)}</td>
        <td style="padding:9px 12px 9px 0;border-top:1px solid ${C.line};font-size:13px;color:${C.ink};">${e(l.value)}</td>
        <td align="right" style="padding:9px 0;border-top:1px solid ${C.line};font-family:${MONO};font-size:12px;color:${C.muted};white-space:nowrap;">${e(lineDelta(l))}</td>
      </tr>`,
    )
    .join("");

  const details_ = detailRows(details)
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:9px 12px 9px 0;border-top:1px solid ${C.line};font-size:13px;color:${C.muted};width:38%;">${e(k)}</td>
        <td style="padding:9px 0;border-top:1px solid ${C.line};font-size:13px;color:${C.ink};">${e(v)}</td>
      </tr>`,
    )
    .join("");

  const notes = details.notes.trim()
    ? `${label("Notes for the workshop")}
       <div style="margin:0 0 32px;padding:14px 16px;border:1px solid ${C.line};border-radius:10px;font-size:13px;line-height:1.6;color:${C.ink};white-space:pre-wrap;">${e(details.notes.trim())}</div>`
    : "";

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${e(confirmationSubject(input))}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;">Thanks for your order. Here's what happens next with your Origin ${e(modelName)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:${SANS};color:${C.ink};">
        <tr>
          <td style="padding:0 4px 28px;">
            <img src="${siteUrl()}/email/origin-logo-white.png" width="120" height="25" alt="Origin Guitars" style="display:block;border:0;width:120px;height:25px;">
          </td>
        </tr>
        <tr>
          <td style="background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:36px 32px;">
            ${label(`Build received &middot; ${e(reference)}`)}
            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;font-weight:500;letter-spacing:-0.02em;color:${C.white};">Thanks for your order${name ? `, ${e(name)}` : ""}.</h1>
            <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:${C.muted};">${e(introLine(modelName, hasPdf))}</p>

            ${label("What happens next")}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">${steps}</table>

            ${label(`Your Origin ${e(modelName)}`)}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">${specRows}</table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;border-top:1px solid ${C.strong};">
              <tr>
                <td style="padding:14px 0 0;font-family:${MONO};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.muted};">Total</td>
                <td align="right" style="padding:14px 0 0;font-family:${MONO};font-size:22px;color:${C.white};">${formatPrice(totalPence)}</td>
              </tr>
            </table>

            ${label("Your details")}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">${details_}</table>

            ${notes}

            <p style="margin:0;font-size:15px;line-height:1.6;color:${C.ink};">Any questions in the meantime? Reply to this email and it comes straight to our team.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 4px 0;font-family:${MONO};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.muted};">
            Origin Guitars &middot; Built to order in the United Kingdom
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
