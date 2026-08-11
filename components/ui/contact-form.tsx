"use client";

import { useActionState, useId } from "react";

import { sendContactMessage } from "@/app/(site)/contact/actions";
import {
  initialContactFormState,
  type ContactField,
} from "@/app/(site)/contact/form-state";
import { buttonClasses, buttonDisabledClasses } from "@/components/ui/button";
import { CONTACT_INBOX } from "@/lib/contact";
import { proseLink } from "@/lib/style";

/*
 * The contact form.
 *
 * A client component because it reports back — pending state while the message
 * is in flight, field errors when the server rejects it, and a confirmation
 * once it has gone. Without those three it is a form that appears to do
 * nothing, which on a page whose whole promise is "this reaches somebody" is
 * the worst thing it could be.
 *
 * It still submits before it hydrates. `useActionState` is wired to a Server
 * Action through the form's `action`, which React queues and replays — so a
 * visitor on a slow connection who fills this in during the first second is
 * not typing into a dead box. What they lose without JavaScript is the inline
 * reporting, not the send.
 *
 * No `noValidate`: the browser's own required/type checks are the cheapest
 * possible feedback and cost nothing to keep. They are a courtesy on top of
 * the server's checks, never a substitute — see actions.ts.
 */

/*
 * Shared by every control, so a field and its textarea cannot drift apart.
 *
 * The fill is white alpha rather than a token: the card is already the lifted
 * tone, so a field set on --color-surface reads as a hole cut through it, and
 * there is no third ground in the palette to reach for. 2.5% over the card is
 * the reference's relationship — the field sits just above the panel it is in.
 * Same device as the method cards' icon chips a section above.
 *
 * Placeholders are set in the mono face, which is the reference's one real
 * typographic decision here: it makes "000-000-000" read as a format rather
 * than as somebody's actual order number, and it tells an empty field from a
 * filled one at a glance, since anything typed comes back in the body face.
 */
const controlClasses =
  "w-full rounded-xl border border-line bg-white/[0.025] px-4 text-[1.0625rem] text-ink transition-colors placeholder:font-mono placeholder:text-ink-muted hover:border-line-strong focus-visible:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-[invalid=true]:border-danger";

const labelClasses = "block text-[0.9375rem] font-medium text-ink";

type FieldSpec = {
  name: ContactField;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: "text" | "email";
  autoComplete?: string;
  /* Full width on the desktop two-column grid. */
  wide?: boolean;
  multiline?: boolean;
};

const fields: FieldSpec[] = [
  {
    name: "name",
    label: "Full name",
    placeholder: "John Carter",
    required: true,
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Email address",
    placeholder: "email@example.com",
    required: true,
    type: "email",
    autoComplete: "email",
  },
  /*
   * The one optional field, and the only one without an asterisk. Most people
   * writing in do not have an order yet — asking for it as a requirement would
   * turn a question about a specification into a form you cannot submit.
   */
  {
    name: "orderNumber",
    label: "Order number",
    placeholder: "000-000-000",
  },
  {
    name: "subject",
    label: "Subject",
    placeholder: "Order request",
    required: true,
  },
  {
    name: "message",
    label: "Message",
    placeholder: "Write your message here...",
    required: true,
    wide: true,
    multiline: true,
  },
];

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    initialContactFormState,
  );
  const formId = useId();
  const statusId = `${formId}-status`;

  if (state.status === "sent") {
    return (
      <div className="rounded-2xl border border-line bg-canvas px-8 py-14 text-center md:px-12">
        {/*
          `role="status"` rather than an alert: the form it replaces was the
          thing being interacted with, so this is announced politely on the
          swap rather than interrupting.
        */}
        <div role="status">
          <h3 className="font-display text-[1.5rem] font-medium leading-[1.2] tracking-[-0.015em]">
            Message sent
          </h3>
          <p className="mx-auto mt-4 max-w-[46ch] text-[1.0625rem] leading-[1.7] text-ink-muted">
            It has landed in the UK team&apos;s inbox and a reply will come back
            to the address you gave. Nothing else to do at your end.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-line bg-canvas p-6 sm:p-8 md:p-12"
    >
      {/*
        The honeypot. Off-screen rather than `display: none` — some bots skip
        what is obviously hidden — and out of the tab order and the
        accessibility tree, so nobody using the page can land in it by
        accident. `autoComplete="off"` keeps a browser from helpfully filling
        it in and failing the check on a real person's behalf.
      */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${formId}-company`}>Company</label>
        <input
          id={`${formId}-company`}
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 md:gap-x-8 md:gap-y-7">
        {fields.map((field) => {
          const id = `${formId}-${field.name}`;
          const error = state.errors?.[field.name];
          const errorId = `${id}-error`;

          return (
            <div key={field.name} className={field.wide ? "md:col-span-2" : undefined}>
              <label htmlFor={id} className={labelClasses}>
                {field.label}
                {field.required && (
                  /*
                    The palette reserves --color-danger for validation and
                    never for decoration. A required marker is the validation
                    system speaking before you have got anything wrong, which
                    is the one decorative-looking use it is actually for.

                    aria-hidden because `required` on the control already tells
                    a screen reader the same thing, and "asterisk" read aloud
                    after every other label is noise.
                  */
                  <span aria-hidden className="ml-1 text-danger">
                    *
                  </span>
                )}
              </label>

              <div className="mt-2.5">
                {field.multiline ? (
                  <textarea
                    id={id}
                    name={field.name}
                    rows={5}
                    required={field.required}
                    defaultValue={state.values?.[field.name]}
                    placeholder={field.placeholder}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className={`${controlClasses} min-h-[10rem] resize-y py-3.5 leading-[1.6]`}
                  />
                ) : (
                  <input
                    id={id}
                    name={field.name}
                    type={field.type ?? "text"}
                    required={field.required}
                    autoComplete={field.autoComplete}
                    defaultValue={state.values?.[field.name]}
                    placeholder={field.placeholder}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className={`${controlClasses} h-14`}
                  />
                )}
              </div>

              {error && (
                <p id={errorId} className="mt-2 text-[0.875rem] leading-[1.5] text-danger">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/*
        The whole-form message: what went wrong when it is not a field, and the
        way out when the fault is ours. Live, because after a failed submit the
        focus is still on the button and nothing else announces the change.
      */}
      <p
        id={statusId}
        role={state.status === "error" ? "alert" : undefined}
        aria-live="polite"
        className={`mt-7 text-[0.9375rem] leading-[1.6] text-danger empty:mt-0 ${
          state.message ? "" : "sr-only"
        }`}
      >
        {state.message ?? ""}
      </p>

      <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          aria-describedby={statusId}
          className={`${buttonClasses({ size: "lg" })} ${buttonDisabledClasses} w-full sm:w-auto`}
        >
          {pending ? "Sending…" : "Send message"}
        </button>

        {/*
          The address, kept beside the button rather than only inside an error.
          Somebody who would rather write from their own mail client should not
          have to fail at this form first to find out they can.
        */}
        <p className="text-[0.9375rem] leading-[1.6] text-ink-muted">
          Or email{" "}
          <a href={`mailto:${CONTACT_INBOX}`} className={proseLink}>
            {CONTACT_INBOX}
          </a>{" "}
          directly.
        </p>
      </div>
    </form>
  );
}
