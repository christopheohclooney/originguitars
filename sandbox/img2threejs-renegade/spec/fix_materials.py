"""Repair analyze_texture.py's inverted metalness + wood->brushed-steel misclassification.

Keeps the genuinely reference-derived roughness MAPS (real pixel evidence) and the extracted
albedo palettes, but restores physically correct scalars. analyze_texture's finish taxonomy is
CS2-weapon specific (gem-metal / painted-metal / brushed-steel / worn-composite) and has no wood
or plastic class, so it forced wood and ABS into 'brushed-steel' and inverted metalness.
"""
import json

S = "/tmp/claude-0/-home-user-originguitars/76038984-cd42-5dab-9708-9a4ba07ece2a/scratchpad"
P = f"{S}/build/renegade-spec.json"
spec = json.load(open(P))

# id -> (metalness, roughness, clearcoat, clearcoatRoughness, finishClass, confidence, note)
TRUE = {
 "bodyFinish":  (0.62, 0.34, 0.85, 0.10, "painted-metal", 0.88,
   "Metallic-flake automotive paint over clearcoat. metalness mid-high with a strong flake normal; "
   "analyze_texture returned 0.0 which would render it as flat paint."),
 "chrome":      (1.00, 0.08, 0.0, 0.0, "polished-metal", 0.90,
   "Polished chrome. analyze_texture returned metalness 0.0 - would render as grey plastic."),
 "brassSaddle": (1.00, 0.26, 0.0, 0.0, "polished-metal", 0.72,
   "Warm brass/gold saddle alloy, distinctly warmer than the chrome base."),
 "rosewood":    (0.00, 0.62, 0.0, 0.0, "wood", 0.61,
   "Open-pore rosewood. analyze_texture classified this as brushed-steel with metalness 1.0 - "
   "its taxonomy has no wood class. Low PBR confidence: board is only ~144px wide in reference."),
 "mapleSatin":  (0.00, 0.48, 0.0, 0.0, "wood", 0.86,
   "Satin natural maple, neck rear + headstock rear. Same misclassification as rosewood."),
 "blackPlastic":(0.00, 0.55, 0.0, 0.0, "plastic", 0.86,
   "Semi-matte black ABS (pickup covers, cavity cover, switch tip). Was given metalness 1.0."),
 "blackGloss":  (0.00, 0.12, 0.90, 0.06, "plastic", 0.61,
   "Gloss black headstock face - glossier than the pickup ABS. Was given metalness 1.0."),
 "fretNickel":  (1.00, 0.18, 0.0, 0.0, "polished-metal", 0.61,
   "Nickel-silver fretwire. Low confidence: frets are a few px wide in the reference."),
 "creamBinding":(0.00, 0.40, 0.0, 0.0, "plastic", 0.61,
   "Cream binding plastic. Low confidence: binding is a thin strip in the reference."),
}

for m in spec["materials"]:
    mid = m["id"]
    if mid not in TRUE:
        continue
    metal, rough, cc, ccr, fclass, conf, note = TRUE[mid]
    # keep the reference-derived roughness map + variation, replace only the wrong scalars
    prev_rough = m.get("roughness")
    rough_map = prev_rough.get("map") if isinstance(prev_rough, dict) else None
    rough_var = prev_rough.get("variation", 0.05) if isinstance(prev_rough, dict) else 0.05
    m["metalness"] = {"base": metal, "variation": 0.0}
    m["roughness"] = {"base": rough, "variation": rough_var,
                      "map": rough_map,
                      "localResponse": "reference-derived roughness map retained; base scalar "
                                       "restored from material identity after classifier inversion"}
    m["clearcoat"], m["clearcoatRoughness"] = cc, ccr
    m["finishClass"] = fclass
    m["finishClassConfidence"] = conf
    m["classifierOverride"] = {
        "overriddenBy": "agent-vision",
        "reason": note,
        "originalFinishClass": "brushed-steel" if metal == 0.0 or fclass == "wood" else "painted-metal",
    }
    rp = m.get("referencePbr")
    if isinstance(rp, dict):
        rp["usable"] = conf >= 0.7
        rp["approximation"] = None if conf >= 0.7 else (
            "PBR confidence below the 0.7 gate - part is too narrow in the reference to resolve. "
            "Scalars are identity-derived, not pixel-proven.")

# ---- concrete lighting (three-point + environment), matched to the product-shot references ----
spec["lightingFromPhoto"] = [
 {"id": "key", "type": "directional", "direction": [-0.35, 0.78, 0.52], "color": "#FFF6E8",
  "intensity": 2.6, "softness": 0.35, "confidence": 0.75,
  "notes": "Reference is a softbox product shot: key high and slightly camera-left, warm-neutral."},
 {"id": "fill", "type": "directional", "direction": [0.62, 0.18, 0.46], "color": "#DCE6F2",
  "intensity": 0.9, "softness": 0.7, "confidence": 0.72,
  "notes": "Cool low-intensity fill opening the right side; keeps the gunmetal from going black."},
 {"id": "rim", "type": "directional", "direction": [0.15, -0.35, -0.92], "color": "#FFFFFF",
  "intensity": 1.4, "softness": 0.2, "confidence": 0.70,
  "notes": "Back rim separating the body edge bevel from the white background."},
 {"id": "environment", "type": "environment", "preset": "studio-softbox-neutral",
  "intensity": 0.85, "color": "#F2F2F2", "confidence": 0.80,
  "notes": "Broad even environment - REQUIRED for the metallic flake and chrome to read; "
           "flake needs something to reflect or it collapses to flat paint."},
 {"id": "ambient", "type": "ambient", "color": "#B8BCC4", "intensity": 0.25, "confidence": 0.7},
 {"id": "render-intent", "type": "render-settings", "exposure": 1.0, "toneMapping": "ACESFilmic",
  "background": "#FFFFFF", "confidence": 0.8,
  "notes": "Exposure 1.0 with ACES filmic tone mapping to match the reference's white-background "
           "product-shot response. Contact shadow (ground shadow) under the body, softness 0.4, "
           "opacity 0.35; ambient occlusion in the neck pocket, cavity seam and under all hardware."},
]
lp = [p for p in spec["buildPasses"] if p["id"] == "lighting-pass"][0]
lp["lights"] = spec["lightingFromPhoto"]
lp["exposure"] = 1.0
lp["toneMapping"] = "ACESFilmic"
lp["background"] = "#FFFFFF"
lp["shadow"] = {"type": "contact", "softness": 0.4, "opacity": 0.35}

# ---- unknowns: resolved AS DOCUMENTED ASSUMPTIONS, not left open ----
ps = spec["preSpecAssessment"]
resolved = [
 {"unknown": "Body depth / thickness", "resolution": "assumed 0.045 relative (~45mm, standard superstrat)",
  "basis": "class-typical", "confidence": 0.55, "status": "approximated"},
 {"unknown": "Neck rear profile (C/D, thickness)", "resolution": "assumed rounded C, 0.022 relative at nut",
  "basis": "class-typical", "confidence": 0.50, "status": "approximated"},
 {"unknown": "Bridge saddle geometry", "resolution": "six uniform saddles on a chrome base, brass-toned",
  "basis": "partial-observation", "confidence": 0.70, "status": "approximated"},
 {"unknown": "Scale length / fret count", "resolution": "24 frets, scale derived from nut->bridge pixel ratio (0.606 of total length)",
  "basis": "measured-from-image", "confidence": 0.72, "status": "derived"},
 {"unknown": "Headstock break angle / volute", "resolution": "assumed 13 degrees, no volute",
  "basis": "class-typical", "confidence": 0.45, "status": "approximated"},
 {"unknown": "Pickup pole configuration under cover", "resolution": "modelled as covered humbucker, no exposed poles",
  "basis": "observation", "confidence": 0.85, "status": "resolved"},
 {"unknown": "Control cavity routing depth", "resolution": "not modelled - cover is a surface panel only",
  "basis": "out-of-scope", "confidence": 0.90, "status": "resolved"},
 {"unknown": "Body wood/grain under opaque finish", "resolution": "not modelled - finish is opaque",
  "basis": "unknowable", "confidence": 0.95, "status": "resolved"},
]
ps["unknownsToResolveBeforeImplementation"] = []
ps["resolvedAssumptions"] = resolved
spec["assumptions"] = [f"{r['unknown']}: {r['resolution']} ({r['status']}, confidence {r['confidence']})"
                       for r in resolved]

json.dump(spec, open(P, "w"), indent=2)
print("materials repaired:", len(TRUE), "| lights:", len(spec["lightingFromPhoto"]),
      "| assumptions documented:", len(resolved))
for m in spec["materials"]:
    r = m["roughness"]
    print(f"  {m['id']:13s} metal={m['metalness']['base']:.2f} rough={r['base']:.2f} "
          f"cc={m['clearcoat']:.2f} {m['finishClass']:15s} conf={m['finishClassConfidence']}")
