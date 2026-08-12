import { Disclosure, DisclosureItem } from "@/components/ui/disclosure";

/*
 * The FAQ disclosure list. Used by the FAQ page and by Contact's three-question
 * preview — one component, so the two cannot drift apart in feel.
 *
 * The row shell and the whole motion recipe now live in
 * components/ui/disclosure.tsx, lifted out when the model detail page needed
 * the same accordion at a smaller scale. What stays here is only what is
 * FAQ-shaped: the entry type the data file builds against, and the answer's
 * paragraph treatment. The rendering is identical to before the extraction —
 * that was the constraint the refactor was done under.
 */

export type FaqEntry = {
  q: string;
  a: string[];
};

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  return (
    <div>
      {items.map((item) => (
        <Disclosure key={item.q} label={item.q} size="faq">
          {item.a.map((para, i) => (
            <DisclosureItem
              key={i}
              as="p"
              className={`max-w-[62ch] text-[1.0625rem] leading-[1.7] text-ink-muted ${
                i > 0 ? "mt-4" : ""
              }`}
            >
              {para}
            </DisclosureItem>
          ))}
        </Disclosure>
      ))}
    </div>
  );
}
