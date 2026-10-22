import { headers } from "next/headers";

/*
 * Input handling shared by the site's forms: the contact form and the spec
 * sheet's submission. Lifted out of the contact action once a second form
 * needed the same cleaning, address check and rate limit.
 *
 * Server-only: `callerKey` reads request headers. Import it from "use server"
 * files and route handlers, never from a component.
 */

export { EMAIL_PATTERN } from "@/lib/email-pattern";

/*
 * Single-line fields get their control characters removed before they go
 * anywhere near a mail header. Resend takes JSON over HTTPS rather than
 * speaking SMTP, so a newline in a subject is not the header-injection hole it
 * would be against a raw sendmail — but the value is still being pasted into a
 * header by somebody downstream, and stripping is one line.
 */
export function singleLine(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function multiLine(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "")
    .trim();
}

/*
 * Rate limiting, in memory, and honest about what that is worth: the counter
 * lives in one server instance, so a platform running several of them enforces
 * this per instance and a cold start forgets everything. It is a speed bump
 * against a script hammering one endpoint, not a defence — the honeypot below
 * catches more, and a real limiter needs a store this project does not have
 * yet. Worth having anyway: it costs nothing and it caps the damage a single
 * loop can do to the sending reputation of the domain.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

export function overRateLimit(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((at) => now - at < WINDOW_MS);

  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(key, hits);
    return true;
  }

  hits.push(now);
  recent.set(key, hits);

  /* Keep the map from growing forever on a long-lived instance. */
  if (recent.size > 5000) {
    for (const [k, times] of recent) {
      if (times.every((at) => now - at >= WINDOW_MS)) recent.delete(k);
    }
  }

  return false;
}

export async function callerKey(): Promise<string> {
  const h = await headers();
  /*
   * x-forwarded-for is set by the proxy in front of this and can be a list;
   * the first entry is the client. Spoofable in principle, which is another
   * reason the limiter above is described as a speed bump.
   */
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
