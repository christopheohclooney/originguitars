# TeX Gyre Heros

The site's body, UI and label type. Live — the `@font-face` blocks in
`app/globals.css` point at the two woff2 files here.

## What is in this folder

| File | What it is |
|---|---|
| `texgyreheros-regular.woff2` | 400, subset. What the site serves. |
| `texgyreheros-bold.woff2` | 700, subset. What the site serves. |
| `texgyreheros-regular.otf` | The unmodified CTAN original, kept as source. |
| `texgyreheros-bold.otf` | The unmodified CTAN original, kept as source. |
| `GUST-FONT-LICENCE.txt` | Taken from the fonts' own name table. |

The OTFs are kept for the same reason `element-full.jpg` sits beside
`element-side.jpg`: the served file is derived, and the derivation should be
repeatable without going back to CTAN.

## How the woff2 files were made

Subset to latin + latin-ext and compressed, which takes each cut from ~120KB
to ~34KB:

```bash
pip install fonttools brotli

LATIN="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD"
LATIN_EXT="U+0100-02AF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"

for w in regular bold; do
  pyftsubset "texgyreheros-$w.otf" \
    --unicodes="$LATIN,$LATIN_EXT" --layout-features='*' --flavor=woff2 \
    --output-file="texgyreheros-$w.woff2"
done
```

That is the Google Fonts latin range with one addition: **U+2192 (→)**. The
standard range carries ↑ and ↓ but not →, which the style guide sets in the
wordmark lean figure. Coverage was checked against every character the site
can actually render rather than assumed — if you re-subset, check it again.

## If the type ever looks subtly wrong

Both cuts are in the stack ahead of Helvetica, Nimbus Sans, Liberation Sans
and Arial, all of which are metrically identical to Heros. That is deliberate
— it means a failed font load costs letterforms and not layout — but it also
means a broken woff2 falls back to something that looks nearly right. Confirm
what actually loaded rather than trusting your eye:

```js
[...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`);
```

Both `TeX Gyre Heros` entries should read `loaded`.

## Licence

GUST Font Licence, legally identical to the LaTeX Project Public Licence —
free to use, modify and redistribute, including on a commercial site. Full
text in `GUST-FONT-LICENCE.txt`, matching how `app/fonts/archivo-OFL.txt` sits
with the display face.

The condensed cuts (`texgyreheroscn-*`) were removed — nothing uses them, and
they are one CTAN download away if a condensed variant is ever wanted.
