/*
 * The address check, in a file of its own so the browser can share it: the
 * spec sheet checks an address before it renders a PDF, and the server runs
 * the same pattern on what arrives. lib/form-input.ts re-exports it for the
 * server-side forms.
 *
 * Deliberately permissive. The job here is to catch a typo before it becomes a
 * reply that bounces, not to adjudicate the RFC — every regex that tries to do
 * the latter ends up rejecting somebody's real address.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
