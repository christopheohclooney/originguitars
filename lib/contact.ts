/*
 * The contact details, in one place.
 *
 * Separate from lib/email.ts on purpose. That file holds an API key and a
 * Resend client, so it can only ever be imported on the server; these are
 * content — printed on the page, used as the form's fallback, and used as the
 * inbox the action sends to. Keeping them here is what lets the client form
 * show the address without dragging the transport into the browser bundle.
 */

export const CONTACT_INBOX = "hello@originguitars.com";

/*
 * Both forms of the number: the one you read and the one the protocol takes.
 * `tel:` wants E.164 — no spaces, no brackets, leading +. The printed form
 * keeps the grouping, because a number is easier to read back to somebody in
 * groups than as eleven digits in a row. Deriving one from the other at
 * runtime would be a regex standing where a constant does the job.
 */
export const PHONE_DISPLAY = "(+44) 7883 066880";
export const PHONE_HREF = "tel:+447883066880";
