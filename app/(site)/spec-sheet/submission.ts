/*
 * The spec sheet submission's contract, shared by the page and the action.
 *
 * Its own file because actions.ts carries "use server" and may only export
 * async functions (see contact/form-state.ts for the same split). The checks
 * live here too, so the page can point at a missing field before it spends
 * time rendering a PDF, and the action can run the very same checks on what
 * actually arrives.
 */

import { EMAIL_PATTERN } from "@/lib/email-pattern";

export type SpecDetails = {
  name: string;
  email: string;
  phone: string;
  order: string;
  address: string;
  notes: string;
  signedBy: string;
  date: string;
};

export type SpecChecks = { spec: boolean; time: boolean };

/** What the page sends, alongside the PDF file. */
export type SpecPayload = {
  modelSlug: string;
  selections: Record<string, string>;
  touched: string[];
  details: SpecDetails;
  checks: SpecChecks;
  /** The honeypot — empty for every person. */
  company: string;
};

export type SubmitField = "name" | "email" | "spec" | "time";

export type SubmitResult =
  | { status: "sent"; reference: string; email: string; hasPdf: boolean }
  | {
      status: "error";
      message: string;
      errors?: Partial<Record<SubmitField, string>>;
    };

export const DETAIL_LIMITS: Record<keyof SpecDetails, number> = {
  name: 120,
  email: 200,
  phone: 40,
  order: 64,
  address: 300,
  notes: 4000,
  signedBy: 120,
  date: 10,
};

/*
 * The fields a build cannot go in without: somebody to reply to, and both
 * sign-off boxes. Everything else is useful and optional — the customer team
 * confirms the rest when they get in touch.
 */
export function validateSubmission(
  details: SpecDetails,
  checks: SpecChecks,
): Partial<Record<SubmitField, string>> {
  const errors: Partial<Record<SubmitField, string>> = {};
  if (!details.name.trim()) errors.name = "Add your name so we know who the build is for.";
  if (!details.email.trim()) errors.email = "Add an email address for your confirmation.";
  else if (!EMAIL_PATTERN.test(details.email.trim()))
    errors.email = "That doesn't look like an email address.";
  if (!checks.spec) errors.spec = "Confirm this is the guitar you want built.";
  if (!checks.time) errors.time = "Confirm you understand the lead time.";
  return errors;
}
