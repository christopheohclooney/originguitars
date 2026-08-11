/*
 * The contact form's state contract, shared by the action that produces it and
 * the form that renders it.
 *
 * A file of its own because actions.ts carries "use server", and such a file
 * may only export async functions — a plain `initialContactFormState` object
 * exported from there compiles, then throws "A 'use server' file can only
 * export async functions, found object" when the module is first evaluated on
 * a request. The types alone would have been erased and survived; the constant
 * is what forces the split, and keeping the types beside it means the contract
 * is in one place rather than two.
 */

export type ContactField =
  | "name"
  | "email"
  | "orderNumber"
  | "subject"
  | "message";

export type ContactFormState = {
  status: "idle" | "sent" | "error";
  /* Whole-form message. Field-level problems go in `errors`. */
  message?: string;
  errors?: Partial<Record<ContactField, string>>;
  /*
   * What they typed, handed back on failure.
   *
   * React resets a form once its action resolves, so without this a rejected
   * submission would clear the message somebody had just spent five minutes
   * writing — the single most annoying thing a contact form can do. The client
   * seeds each field's `defaultValue` from here.
   *
   * Not returned on success: that form is gone from the page, and echoing an
   * address back into a fresh one is how the next visitor on a shared machine
   * finds somebody else's details.
   */
  values?: Partial<Record<ContactField, string>>;
};

export const initialContactFormState: ContactFormState = { status: "idle" };
