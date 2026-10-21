"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { OptionControl } from "@/components/builder/option-control";
import { buttonClasses, buttonDisabledClasses } from "@/components/ui/button";
import { ModelBadge } from "@/components/ui/model-badge";
import { availableModels, models } from "@/data/models";
import {
  BASE_PRICE_PENCE,
  builderSteps,
  type BuilderStep,
  type OptionGroup,
} from "@/data/options";
import { applyRules, defaultSelections } from "@/lib/builder-rules";
import {
  calculateTotalPence,
  formatDelta,
  formatFromPrice,
  formatPrice,
  selectedOption,
  visibleGroups,
  type Selections,
} from "@/lib/pricing";
import { cardSurface, fieldControl, fieldLabel, slant } from "@/lib/style";

/*
 * The build spec sheet — an interim, printable record of a build that the
 * customer and the workshop both sign off.
 *
 * Every option, price and rule comes from the builder's own sources:
 * builderSteps for the list, applyRules for the conditional logic and
 * calculateTotalPence for the total. Nothing about the instrument is restated
 * here, so a change to the builder's options lands on this sheet too.
 *
 * The one decision this file makes for itself is presentation: which groups
 * read as a dropdown rather than as pills. That is a layout choice for a long
 * single-page form, not a fact about the option, so it stays here rather than
 * on the shared data. A group not listed falls back to the builder's own
 * rendering, which is what keeps a new group visible without touching this.
 */
const DROPDOWN_GROUPS = new Set(["fretboard", "inlay", "headstockFinish"]);

/* The draft lives in this browser only, so a refresh does not lose a sheet. */
const DRAFT_KEY = "origin-spec-draft-v1";

type Details = {
  name: string;
  email: string;
  phone: string;
  order: string;
  address: string;
  notes: string;
  signedBy: string;
  date: string;
};

const emptyDetails: Details = {
  name: "",
  email: "",
  phone: "",
  order: "",
  address: "",
  notes: "",
  signedBy: "",
  date: "",
};

type Checks = { spec: boolean; time: boolean };

const SIGN_OFF: { id: keyof Checks; label: string }[] = [
  { id: "spec", label: "I confirm this spec is the guitar I want built." },
  {
    id: "time",
    label:
      "I understand fulfilment can take up to six months, depending on the spec. Origin will tell me directly if it will take longer.",
  },
];

type DetailField = {
  id: keyof Details;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  wide?: boolean;
};

const DETAIL_FIELDS: DetailField[] = [
  { id: "name", label: "Name", placeholder: "Full name", autoComplete: "name" },
  {
    id: "email",
    label: "Email",
    placeholder: "you@example.com",
    type: "email",
    autoComplete: "email",
  },
  { id: "phone", label: "Phone", placeholder: "07…", type: "tel", autoComplete: "tel" },
  { id: "order", label: "Order number", placeholder: "Emailed after payment" },
  {
    id: "address",
    label: "Delivery address",
    placeholder: "House, street, town, postcode",
    autoComplete: "street-address",
    wide: true,
  },
];

/* Every group with the step it belongs to, in builder order. */
const ALL_GROUPS = builderSteps.flatMap((step) =>
  step.groups.map((group) => ({ step, group })),
);

/*
 * The summary's row name for a group. A step with one group is named by the
 * step; a second group is named by its own label, prefixed with the step's
 * title when the label alone would be ambiguous ("Finish" means two things).
 */
function rowLabel(step: BuilderStep, group: OptionGroup) {
  if (step.groups.length < 2 || !group.label) return step.title;
  const label = group.label.toLowerCase();
  const title = step.title.toLowerCase();
  if (label === title || label.includes(title)) return group.label;
  return `${step.title} ${label}`;
}

/*
 * A saved draft is read back through the same rules as a click, and only for
 * ids the builder still has, so a draft from before an option was renamed or
 * removed cannot put a stale or impossible choice on the sheet.
 */
function restoreSelections(saved: unknown, touched: ReadonlySet<string>) {
  const next = defaultSelections();
  if (saved && typeof saved === "object") {
    for (const { group } of ALL_GROUPS) {
      const id = (saved as Record<string, unknown>)[group.id];
      if (typeof id === "string" && group.options.some((o) => o.id === id)) {
        next[group.id] = id;
      }
    }
  }
  return applyRules(next, touched);
}

/* The section header's counter: "03 / 14", on the builder's slant divider. */
function StepCount({ index, total }: { index: number; total: number }) {
  return (
    <span className="shrink-0 font-mono text-[0.8125rem] text-ink-muted tabular-nums">
      {String(index).padStart(2, "0")}
      <span
        aria-hidden
        className="mx-2 inline-block h-3 w-px translate-y-[1px] bg-line-strong"
        style={slant}
      />
      {String(total).padStart(2, "0")}
    </span>
  );
}

function Section({
  id,
  title,
  index,
  total,
  intro,
  children,
}: {
  id: string;
  title: string;
  index: number;
  total: number;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-5 border-t border-line py-8 md:py-10"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id={id}
          className="text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.015em]"
        >
          {title}
        </h2>
        <StepCount index={index} total={total} />
      </div>
      {intro && (
        <p className="-mt-2 max-w-[62ch] text-[0.9375rem] leading-[1.55] text-ink-muted">
          {intro}
        </p>
      )}
      {children}
    </section>
  );
}

const groupLabel =
  "text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted";

function GroupControl({
  step,
  group,
  selections,
  onChoose,
}: {
  step: BuilderStep;
  group: OptionGroup;
  selections: Selections;
  onChoose: (groupId: string, optionId: string) => void;
}) {
  const selectId = useId();
  const shown = group.options.filter(
    (o) => group.optionVisible?.(o, selections) ?? true,
  );
  const isAvailable = (o: (typeof shown)[number]) =>
    group.optionAvailable?.(o, selections) ?? true;
  const current = selectedOption(group, selections);
  const hasUnavailable = shown.some((o) => !isAvailable(o));
  const label = group.label ?? step.title;

  if (DROPDOWN_GROUPS.has(group.id)) {
    return (
      <div className="grid gap-3">
        <label htmlFor={selectId} className={groupLabel}>
          {label}
        </label>
        <div className="relative max-w-[26rem]">
          <select
            id={selectId}
            value={selections[group.id]}
            onChange={(e) => onChoose(group.id, e.target.value)}
            className={`${fieldControl} h-12 cursor-pointer appearance-none rounded-full pr-12 text-[0.9375rem]`}
          >
            {shown.map((o) => (
              <option key={o.id} value={o.id} disabled={!isAvailable(o)}>
                {o.label} — {formatDelta(o.priceDeltaPence)}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M3 6l5 5 5-5" strokeLinecap="square" />
          </svg>
        </div>
        {current?.tooltip && (
          <p className="max-w-[60ch] text-[0.875rem] leading-[1.5] text-ink-muted">
            {current.tooltip}
          </p>
        )}
        {hasUnavailable && group.unavailableNote && (
          <p className="max-w-[56ch] text-[0.8125rem] leading-[1.5] text-ink-muted">
            {group.unavailableNote}
          </p>
        )}
      </div>
    );
  }

  return (
    <fieldset className="grid gap-3">
      {/* Visible only when the step has more than one group, as in the builder. */}
      <legend
        className={step.groups.length > 1 ? `${groupLabel} mb-3` : "sr-only"}
      >
        {label}
      </legend>
      <div className="flex flex-wrap items-center gap-3 p-1">
        {shown.map((o) => (
          <OptionControl
            key={o.id}
            group={group}
            option={o}
            isSelected={selections[group.id] === o.id}
            isAvailable={isAvailable(o)}
            onSelect={() => onChoose(group.id, o.id)}
          />
        ))}
      </div>
      {shown.some((o) => o.swatch) && current && (
        <p className="text-[0.875rem] text-ink-muted">
          <span className="font-medium text-ink">{current.label}</span>
          <span className="mx-2 text-line-strong">·</span>
          <span className="font-mono text-[0.8125rem]">
            {formatDelta(current.priceDeltaPence)}
          </span>
        </p>
      )}
      {hasUnavailable && group.unavailableNote && (
        <p className="max-w-[56ch] text-[0.8125rem] leading-[1.5] text-ink-muted">
          {group.unavailableNote}
        </p>
      )}
    </fieldset>
  );
}

/*
 * The A4 page the PDF is rasterised from.
 *
 * Kept off-screen rather than display:none, which html2canvas cannot draw.
 * Colours are the palette's hex values written inline: the rasteriser reads
 * computed styles, and a fixed sheet should not shift because a token moved.
 * 794px is A4's width at 96dpi, so the layout is the paper's.
 */
const PDF = {
  surface: "#0a0a0a",
  ink: "#f2f2f2",
  muted: "#8c8c8c",
  disabled: "#545454",
  line: "#1f1f1f",
  strong: "#333333",
} as const;

const pdfLabel: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: PDF.muted,
  margin: "18px 0 8px",
};

const pdfCell: React.CSSProperties = {
  padding: "6px 0",
  borderTop: `1px solid ${PDF.line}`,
  verticalAlign: "top",
};

type Row = { key: string; label: string; value: string; delta: string };

function PdfSheet({
  sheetRef,
  modelName,
  rows,
  total,
  details,
  checks,
}: {
  sheetRef: React.Ref<HTMLDivElement>;
  modelName: string;
  rows: Row[];
  total: string;
  details: Details;
  checks: Checks;
}) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const signedOn = details.date
    ? new Date(`${details.date}T12:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const dash = (v: string) => v.trim() || " ";

  const table = (children: React.ReactNode) => (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
      <tbody>{children}</tbody>
    </table>
  );

  const signLine = (value: string, caption: string) => (
    <div>
      <div
        style={{
          borderBottom: `1px solid ${PDF.strong}`,
          height: 28,
          fontSize: 12.5,
          display: "flex",
          alignItems: "flex-end",
          paddingBottom: 6,
        }}
      >
        {dash(value)}
      </div>
      <div style={{ ...pdfLabel, margin: "6px 0 0", letterSpacing: "0.12em" }}>
        {caption}
      </div>
    </div>
  );

  return (
    <div
      ref={sheetRef}
      aria-hidden
      style={{
        position: "fixed",
        left: -10000,
        top: 0,
        width: 794,
        background: PDF.surface,
        color: PDF.ink,
        fontFamily: "var(--font-geist-sans)",
        padding: "48px 56px 40px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingBottom: 24,
          borderBottom: `1px solid ${PDF.line}`,
        }}
      >
        {/*
          A plain <img>: this node exists only to be rasterised, and
          next/image's lazy loading and srcset would leave the rasteriser
          drawing a logo that has not arrived yet.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Origin%20-%20Standard%20(White).svg"
          alt=""
          width={120}
          height={25}
          style={{ display: "block", width: 120, height: "auto" }}
        />
        <div
          style={{
            ...pdfLabel,
            margin: 0,
            fontSize: 11,
            textAlign: "right",
            lineHeight: 1.8,
          }}
        >
          Build spec sheet
          <br />
          {details.order.trim()
            ? `Order ${details.order.trim()}`
            : "Order number to follow"}
          <br />
          {today}
        </div>
      </div>

      <div
        style={{
          fontFamily: "var(--font-archivo)",
          fontSize: 40,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          margin: "24px 0 6px",
          color: "#ffffff",
        }}
      >
        Origin {modelName}
      </div>
      <p style={{ color: PDF.muted, fontSize: 13, margin: "0 0 12px" }}>
        Specified by you, built by us. Built to order in the United Kingdom.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
        <div>
          <div style={pdfLabel}>Customer</div>
          {table(
            (
              [
                ["Name", details.name],
                ["Email", details.email],
                ["Phone", details.phone],
                ["Delivery", details.address],
              ] as const
            ).map(([k, v]) => (
              <tr key={k}>
                <td style={{ ...pdfCell, color: PDF.muted, width: "38%" }}>{k}</td>
                <td style={pdfCell}>{dash(v)}</td>
              </tr>
            )),
          )}
          <div style={pdfLabel}>Notes for the workshop</div>
          <div
            style={{
              fontSize: 12.5,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              border: `1px solid ${PDF.line}`,
              borderRadius: 10,
              padding: "12px 14px",
              minHeight: 48,
            }}
          >
            {details.notes.trim() || (
              <span style={{ color: PDF.disabled }}>None</span>
            )}
          </div>
        </div>

        <div>
          <div style={pdfLabel}>Specification</div>
          {table(
            rows.map((r) => (
              <tr key={r.key}>
                <td style={{ ...pdfCell, color: PDF.muted, width: "38%" }}>
                  {r.label}
                </td>
                <td style={pdfCell}>{r.value}</td>
                <td
                  style={{
                    ...pdfCell,
                    textAlign: "right",
                    fontFamily: "var(--font-geist-mono)",
                    color: PDF.muted,
                    fontSize: 11.5,
                    width: "22%",
                  }}
                >
                  {r.delta}
                </td>
              </tr>
            )),
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderTop: `1px solid ${PDF.strong}`,
              marginTop: 4,
              paddingTop: 12,
            }}
          >
            <span style={{ ...pdfLabel, margin: 0 }}>Total</span>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 22 }}>
              {total}
            </span>
          </div>
        </div>
      </div>

      <div style={{ ...pdfLabel, marginTop: 24 }}>Sign-off</div>
      {table(
        SIGN_OFF.map((c) => (
          <tr key={c.id}>
            <td style={{ ...pdfCell, width: 24 }}>
              {checks[c.id] ? "✓" : "☐"}
            </td>
            <td style={pdfCell}>{c.label}</td>
          </tr>
        )),
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px 32px",
          marginTop: 16,
        }}
      >
        {signLine(details.signedBy, "Customer · signature")}
        {signLine(signedOn, "Date")}
        {signLine("", "Origin workshop · signature")}
        {signLine("", "Date")}
      </div>

      <div
        style={{
          ...pdfLabel,
          margin: "28px 0 0",
          paddingTop: 16,
          borderTop: `1px solid ${PDF.line}`,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Origin Guitars</span>
        <span>Built to order in the United Kingdom</span>
      </div>
    </div>
  );
}

/*
 * Rasterises the sheet onto a single A4 page. A sign-off sheet split across
 * two pages invites signing one and losing the other, so a sheet that runs
 * long is scaled down to fit rather than sliced. Both libraries are imported
 * on click, so nobody who only fills the form in pays for them.
 */
async function downloadPdf(node: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  await document.fonts.ready;

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: PDF.surface,
    logging: false,
    windowWidth: 794,
  });

  const pageW = 210;
  const pageH = 297;
  const fit = Math.min(1, (pageH * canvas.width) / (pageW * canvas.height));
  const w = pageW * fit;
  const h = (canvas.height * w) / canvas.width;

  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  // The page is painted first, so whatever the image does not cover is black.
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pageW, pageH, "F");
  pdf.addImage(
    canvas.toDataURL("image/jpeg", 0.92),
    "JPEG",
    (pageW - w) / 2,
    0,
    w,
    h,
  );
  pdf.save(filename);
}

const toSlug = (v: string) =>
  v.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function SpecSheet() {
  const [{ selections, touched }, setState] = useState<{
    selections: Selections;
    touched: ReadonlySet<string>;
  }>(() => ({
    selections: applyRules(defaultSelections(), new Set()),
    touched: new Set<string>(),
  }));
  const [modelSlug, setModelSlug] = useState(availableModels[0]?.slug ?? "element");
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [checks, setChecks] = useState<Checks>({ spec: false, time: false });
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({
    text: "",
  });
  const [busy, setBusy] = useState(false);
  /* Whether the draft has been read yet, so the first save cannot wipe it. */
  const [restored, setRestored] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const formId = useId();

  /*
   * Read after mount rather than during render: the server has no storage,
   * and reading it in the initialiser would hydrate a page the server never
   * drew.
   */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const draft = raw ? JSON.parse(raw) : null;
      if (draft && typeof draft === "object") {
        const touchedIds = new Set<string>(
          Array.isArray(draft.touched)
            ? draft.touched.filter((t: unknown) => typeof t === "string")
            : [],
        );
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off restore from browser storage, which only exists after mount
        setState({
          selections: restoreSelections(draft.selections, touchedIds),
          touched: touchedIds,
        });
        if (draft.details && typeof draft.details === "object") {
          const next = { ...emptyDetails };
          for (const key of Object.keys(emptyDetails) as (keyof Details)[]) {
            if (typeof draft.details[key] === "string") next[key] = draft.details[key];
          }
          setDetails(next);
        }
        if (draft.checks && typeof draft.checks === "object") {
          setChecks({ spec: !!draft.checks.spec, time: !!draft.checks.time });
        }
      }
    } catch {
      // Storage blocked or the draft unreadable: start from the base spec.
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ selections, touched: [...touched], details, checks }),
      );
    } catch {
      // A draft is a convenience; failing to save one is not an error.
    }
  }, [restored, selections, touched, details, checks]);

  const choose = useCallback((groupId: string, optionId: string) => {
    setState((prev) => {
      const nextTouched = new Set(prev.touched).add(groupId);
      return {
        touched: nextTouched,
        selections: applyRules(
          { ...prev.selections, [groupId]: optionId },
          nextTouched,
        ),
      };
    });
  }, []);

  const model = models.find((m) => m.slug === modelSlug) ?? models[0];

  /*
   * The builder's total, rebased onto the chosen model. Only orderable models
   * can be picked, and today that is the Element, whose base is the builder's
   * base — so this is calculateTotalPence exactly. Written as a rebase so a
   * second orderable model is priced from its own base rather than silently
   * from the Element's.
   */
  const totalPence =
    calculateTotalPence(selections) - BASE_PRICE_PENCE + model.fromPricePence;

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [
      {
        key: "base",
        label: "Base",
        value: model.name,
        delta: formatPrice(model.fromPricePence),
      },
    ];
    for (const step of builderSteps) {
      for (const group of visibleGroups(step, selections)) {
        const option = selectedOption(group, selections);
        if (!option) continue;
        out.push({
          key: group.id,
          label: rowLabel(step, group),
          value: option.label,
          delta: formatDelta(option.priceDeltaPence),
        });
      }
    }
    return out;
  }, [selections, model]);

  const total = formatPrice(totalPence);
  const sectionCount = builderSteps.length + 4;

  const setDetail = (id: keyof Details) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDetails((d) => ({ ...d, [id]: e.target.value }));

  const reset = () => {
    setState({
      selections: applyRules(defaultSelections(), new Set()),
      touched: new Set(),
    });
    setModelSlug(availableModels[0]?.slug ?? "element");
    setStatus({ text: `Reset to the ${availableModels[0]?.name ?? "base"} base spec. Your details are kept.` });
  };

  const download = async () => {
    if (!sheetRef.current) return;
    setBusy(true);
    setStatus({ text: "Preparing your PDF…" });
    const filename = `${[
      "Origin",
      toSlug(model.name),
      "spec",
      toSlug(details.order) || toSlug(details.name),
    ]
      .filter(Boolean)
      .join("-")}.pdf`;
    try {
      await downloadPdf(sheetRef.current, filename);
      setStatus({ text: `Saved ${filename}.` });
    } catch {
      setStatus({
        text: "Couldn't create the PDF. Try again in a moment.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  };

  let index = 0;
  const next = () => ++index;

  return (
    <>
      <div className="grid gap-8 pb-24 md:pb-32 lg:grid-cols-[minmax(0,1fr)_21.25rem] lg:items-start lg:gap-12">
        <form
          className="flex min-w-0 flex-col"
          noValidate
          onSubmit={(e) => e.preventDefault()}
        >
          <Section
            id={`${formId}-details`}
            title="Your details"
            index={next()}
            total={sectionCount}
          >
            <div className="grid gap-6 md:grid-cols-2 md:gap-x-8">
              {DETAIL_FIELDS.map((f) => {
                const id = `${formId}-${f.id}`;
                return (
                  <div key={f.id} className={f.wide ? "md:col-span-2" : undefined}>
                    <label htmlFor={id} className={fieldLabel}>
                      {f.label}
                    </label>
                    <input
                      id={id}
                      type={f.type ?? "text"}
                      autoComplete={f.autoComplete}
                      placeholder={f.placeholder}
                      value={details[f.id]}
                      onChange={setDetail(f.id)}
                      className={`${fieldControl} mt-2.5 h-12`}
                    />
                  </div>
                );
              })}
            </div>
          </Section>

          <Section
            id={`${formId}-model`}
            title="Model"
            index={next()}
            total={sectionCount}
          >
            <div
              role="radiogroup"
              aria-labelledby={`${formId}-model`}
              className="grid gap-3 sm:grid-cols-3"
            >
              {models.map((m) => {
                const orderable = m.status === "available";
                const selected = m.slug === modelSlug;
                return (
                  <label
                    key={m.slug}
                    data-option-tile
                    className={`${cardSurface} relative grid content-start gap-1 px-5 py-5 ${
                      orderable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    } ${selected ? "border-ink ring-1 ring-ink hover:border-ink" : ""}`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={m.slug}
                      checked={selected}
                      disabled={!orderable}
                      onChange={() => setModelSlug(m.slug)}
                      className="sr-only"
                    />
                    <span className="mb-2 justify-self-start">
                      <ModelBadge status={m.status} />
                    </span>
                    <span className="font-display text-[1.375rem] font-medium tracking-[-0.01em]">
                      {m.name}
                    </span>
                    <span className="text-[0.875rem] text-ink-muted">{m.subtitle}</span>
                    <span className="mt-2 font-mono text-[0.8125rem] text-ink-muted tabular-nums">
                      From {formatFromPrice(m.fromPricePence)}
                    </span>
                  </label>
                );
              })}
            </div>
          </Section>

          {builderSteps.map((step) => (
            <Section
              key={step.id}
              id={`${formId}-${step.id}`}
              title={step.title}
              intro={step.intro}
              index={next()}
              total={sectionCount}
            >
              {visibleGroups(step, selections).map((group) => (
                <GroupControl
                  key={group.id}
                  step={step}
                  group={group}
                  selections={selections}
                  onChoose={choose}
                />
              ))}
            </Section>
          ))}

          <Section
            id={`${formId}-notes`}
            title="Anything else"
            intro="Requests the options above don't cover. We'll confirm what's possible before the build starts."
            index={next()}
            total={sectionCount}
          >
            <div>
              <label htmlFor={`${formId}-notes-field`} className={fieldLabel}>
                Notes for the workshop
              </label>
              <textarea
                id={`${formId}-notes-field`}
                rows={5}
                placeholder="Tuning you play in, string gauge, setup preferences…"
                value={details.notes}
                onChange={setDetail("notes")}
                className={`${fieldControl} mt-2.5 min-h-[8rem] resize-y py-3.5 leading-[1.6]`}
              />
            </div>
          </Section>

          <Section
            id={`${formId}-sign`}
            title="Sign-off"
            index={next()}
            total={sectionCount}
          >
            <div className="grid gap-3">
              {SIGN_OFF.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-start gap-3.5 text-[0.9375rem] leading-[1.45]"
                >
                  <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0">
                    <input
                      type="checkbox"
                      checked={checks[c.id]}
                      onChange={(e) =>
                        setChecks((prev) => ({ ...prev, [c.id]: e.target.checked }))
                      }
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-line-strong bg-white/[0.025] transition-colors checked:border-ink checked:bg-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    />
                    <svg
                      aria-hidden
                      viewBox="0 0 16 16"
                      className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 text-ink-inverse opacity-0 peer-checked:opacity-100"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="square" />
                    </svg>
                  </span>
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2 md:gap-x-8">
              <div>
                <label htmlFor={`${formId}-signed-by`} className={fieldLabel}>
                  Signed by
                </label>
                <input
                  id={`${formId}-signed-by`}
                  type="text"
                  placeholder="Customer name"
                  value={details.signedBy}
                  onChange={setDetail("signedBy")}
                  className={`${fieldControl} mt-2.5 h-12`}
                />
              </div>
              <div>
                <label htmlFor={`${formId}-date`} className={fieldLabel}>
                  Date
                </label>
                <input
                  id={`${formId}-date`}
                  type="date"
                  value={details.date}
                  onChange={setDetail("date")}
                  className={`${fieldControl} mt-2.5 h-12 [color-scheme:dark]`}
                />
              </div>
            </div>
          </Section>
        </form>

        <aside
          aria-labelledby={`${formId}-summary`}
          className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]"
        >
          <div className="grid gap-5 rounded-2xl border border-line bg-canvas p-6">
            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                Your build
              </p>
              <h2
                id={`${formId}-summary`}
                className="mt-1 font-display text-[1.5rem] font-medium tracking-[-0.01em]"
              >
                Origin {model.name}
              </h2>
            </div>

            <ul className="grid">
              {rows.map((r, i) => (
                <li
                  key={r.key}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 text-[0.875rem] ${
                    i === 0 ? "pb-2.5" : "border-t border-line py-2.5"
                  }`}
                >
                  <span className="col-span-2 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-muted">
                    {r.label}
                  </span>
                  <span className="min-w-0">{r.value}</span>
                  <span className="text-right font-mono text-[0.8125rem] text-ink-muted tabular-nums">
                    {r.delta}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-baseline justify-between border-t border-line-strong pt-4">
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                Total
              </span>
              <span className="font-mono text-[1.5rem] tabular-nums">{total}</span>
            </div>

            <div className="grid gap-2.5">
              <button
                type="button"
                onClick={download}
                disabled={busy}
                className={`${buttonClasses({ size: "md" })} ${buttonDisabledClasses} gap-3.5`}
              >
                <span>{busy ? "Preparing…" : "Download PDF"}</span>
                <span
                  aria-hidden
                  className="inline-block h-5 w-px bg-ink-inverse/30"
                  style={slant}
                />
                <span className="font-mono text-[0.8125rem] tabular-nums">{total}</span>
              </button>
              <button
                type="button"
                onClick={reset}
                className={buttonClasses({ variant: "secondary", size: "md" })}
              >
                Reset to base spec
              </button>
              <p
                role="status"
                aria-live="polite"
                className={`min-h-[1.2em] text-[0.8125rem] ${
                  status.error ? "text-danger" : "text-ink-muted"
                }`}
              >
                {status.text}
              </p>
            </div>
          </div>
        </aside>
      </div>

      <PdfSheet
        sheetRef={sheetRef}
        modelName={model.name}
        rows={rows}
        total={total}
        details={details}
        checks={checks}
      />
    </>
  );
}
