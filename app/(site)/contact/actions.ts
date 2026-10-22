"use server";

import type {
  ContactField,
  ContactFormState,
} from "@/app/(site)/contact/form-state";
import { CONTACT_INBOX } from "@/lib/contact";
import { sendEmail } from "@/lib/email";
import {
  callerKey,
  EMAIL_PATTERN,
  multiLine,
  overRateLimit,
  singleLine,
} from "@/lib/form-input";

/*
 * The contact form's action.
 *
 * A Server Action rather than a route handler: the form is the only caller,
 * there is no second client for a JSON endpoint to serve, and React submits it
 * through this even before the page has hydrated.
 *
 * Everything below runs on the server for a reason. The `required` attributes
 * and `type="email"` in the markup are a courtesy to somebody filling the form
 * in — they are not a check. A Server Action is reachable by POST directly, so
 * this treats every field as if it arrived from a script, because sooner or
 * later one will.
 */

const LIMITS = {
  name: 120,
  email: 200,
  orderNumber: 64,
  subject: 160,
  message: 5000,
} as const;

export async function sendContactMessage(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = {
    name: singleLine(formData.get("name")),
    email: singleLine(formData.get("email")),
    orderNumber: singleLine(formData.get("orderNumber")),
    subject: singleLine(formData.get("subject")),
    message: multiLine(formData.get("message")),
  };

  /*
   * The honeypot. A field no human sees, so anything in it came from something
   * filling every input on the page. It is answered with the success state
   * rather than an error: telling a bot which check it failed is how the next
   * version of it gets past.
   */
  if (singleLine(formData.get("company"))) {
    return { status: "sent" };
  }

  const errors: Partial<Record<ContactField, string>> = {};

  if (!values.name) errors.name = "Tell us who you are.";
  else if (values.name.length > LIMITS.name) errors.name = "That is longer than we can store.";

  if (!values.email) errors.email = "We need an address to reply to.";
  else if (values.email.length > LIMITS.email || !EMAIL_PATTERN.test(values.email))
    errors.email = "That does not look like an email address.";

  if (values.orderNumber.length > LIMITS.orderNumber)
    errors.orderNumber = "That is longer than an order number.";

  if (!values.subject) errors.subject = "A few words on what this is about.";
  else if (values.subject.length > LIMITS.subject)
    errors.subject = "Keep the subject to a line.";

  if (!values.message) errors.message = "The message is empty.";
  else if (values.message.length > LIMITS.message)
    errors.message = `Messages are capped at ${LIMITS.message.toLocaleString("en-GB")} characters. Email us directly for anything longer.`;

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      /* "above" — this banner renders under the grid, beside the button. */
      message: "Have a look at the fields marked above.",
      errors,
      values,
    };
  }

  if (overRateLimit(await callerKey())) {
    return {
      status: "error",
      message: `That is several messages in a short space of time. Give it a few minutes, or email ${CONTACT_INBOX} directly.`,
      values,
    };
  }

  /*
   * Plain text, laid out as the fields were given. Whoever opens this wants to
   * see the order number without reading a paragraph to find it.
   */
  const body = [
    `From: ${values.name} <${values.email}>`,
    `Order number: ${values.orderNumber || "— not given —"}`,
    `Subject: ${values.subject}`,
    "",
    values.message,
    "",
    "—",
    "Sent from the contact form on originguitars.com",
  ].join("\n");

  const result = await sendEmail({
    to: CONTACT_INBOX,
    subject: `Contact form — ${values.subject}`,
    text: body,
    /* Reply in the inbox answers the person who wrote, not ourselves. */
    replyTo: values.email,
  });

  if (!result.ok) {
    /*
     * Every failure here is ours, so none of them blame the visitor or ask
     * them to try again into the same fault. They get the address instead —
     * the message is still in the box in front of them, ready to copy.
     */
    return {
      status: "error",
      message: `Something went wrong at our end and the message was not sent. Email ${CONTACT_INBOX} directly and it will reach the same place.`,
      values,
    };
  }

  return { status: "sent" };
}
