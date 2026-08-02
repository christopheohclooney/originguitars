# img2threejs — Renegade by HMI reconstruction (test harness)

Standalone test of the img2threejs pipeline. **Not wired into the Next.js app**
(`sandbox` is excluded in tsconfig.json). Nothing here is imported by the site.

- `spec/` — pre-spec assessment, ObjectSculptSpec, and the authoring scripts
  (`author_spec.py`, `fix_materials.py`, `trace_profiles.py`)
- `src/createRenegadeModel.ts` — generated Three.js factory (blockout pass)
- `harness/` — standalone render harness (three + esbuild + playwright-core)
- `renders/` — pass screenshots
- `evidence/` — traced outlines, detail contact sheet, per-material crops

Reference images: `public/models/renegade/`.

## Run

```bash
cd harness && npm install three esbuild playwright-core
npx esbuild entry.ts --bundle --format=esm --outfile=bundle.js
node shoot.mjs front,back,three-quarter
```

## Status

Pipeline reached the `blockout` pass. Intake, detail inventory, spec authoring
and validation (0 errors) are complete. Blockout geometry is NOT yet correct —
see the session notes: the traced body extrude is not rendering and component
scaling is still wrong.
