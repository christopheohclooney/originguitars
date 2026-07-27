import Link from "next/link";

/*
 * Stage 0 placeholder. The real home page is Stage 1 — this exists only so the
 * root route isn't create-next-app boilerplate while the style guide is under
 * review.
 */
export default function Home() {
  return (
    <main className="flex flex-1 items-center py-24">
      <div className="mx-auto w-full max-w-[1180px] px-6 md:px-10">
        <p className="font-mono text-[0.8125rem] text-ink-muted">
          Origin Guitars · Stage 0
        </p>
        <h1 className="mt-6 text-[clamp(2rem,4.5vw,2.75rem)] font-bold leading-[1.06] tracking-[-0.025em]">
          Design foundation under review
        </h1>
        <Link
          href="/style-guide"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-black px-7 text-[0.9375rem] font-medium text-white transition-colors hover:bg-[#262626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          View the style guide
        </Link>
      </div>
    </main>
  );
}
