# TeX Gyre Heros — files still to be added

The site's body, UI and label type is set in TeX Gyre Heros. **The font files
are not in this repository yet**, and this folder is where they go.

Until they land, the stack in `app/globals.css` falls through to the nearest
Helvetica-metric face on the visitor's machine — Helvetica, Nimbus Sans,
Liberation Sans or Arial. Heros is itself a Helvetica clone, so the metrics
and every line break are identical; only the letterforms differ slightly, and
anyone who already has Heros installed sees the real thing today.

## Why they are not here

TeX Gyre Heros is published by GUST on CTAN. It is not on npm, not on
Google Fonts, and CTAN was unreachable from the environment this was built in
(the network policy refused the connection). Rather than ship a different
typeface under the Heros name, the declaration was left ready and empty.

## What to add

Two files, in this folder:

- `texgyreheros-regular.woff2`
- `texgyreheros-bold.woff2`

Then uncomment the two `@font-face` blocks in `app/globals.css`. That is the
entire switch-over — no component changes and no token changes.

## Getting them

Download the OTFs from CTAN (`https://ctan.org/pkg/tex-gyre`, the
`qhv` files: `texgyreheros-regular.otf` and `texgyreheros-bold.otf`), then
convert:

```bash
pip install fonttools brotli
fonttools ttLib.woff2 compress texgyreheros-regular.otf
fonttools ttLib.woff2 compress texgyreheros-bold.otf
```

Subsetting to latin + latin-ext will cut the files further if size matters.

## Licence

GUST Font Licence (a LaTeX Project Public Licence variant) — free to use,
modify and redistribute, including on a commercial site. Keep the licence
file alongside the fonts when you add them, as `app/fonts/archivo-black-OFL.txt`
does for the display face.
