import json, copy, sys

S = "/tmp/claude-0/-home-user-originguitars/76038984-cd42-5dab-9708-9a4ba07ece2a/scratchpad"
P = f"{S}/build/renegade-spec.json"
spec = json.load(open(P))
tC = copy.deepcopy(spec["componentTree"][0])
tM = copy.deepcopy(spec["materials"][0])

# ---- proportions measured off the front reference (bbox h=2144px, total len = 1.00) ----
# headstock 0.174 | neck(nut->body) 0.392 | body 0.434 ; body width 0.304, depth 0.045
def C(cid, name, level, role, parent, prim, topo, rat, dims, pos, mat,
      imp=0.7, conf=0.85, feats=None, att=None, anim="static", rot=(0,0,0)):
    c = copy.deepcopy(tC)
    c["id"], c["name"], c["level"], c["role"] = cid, name, level, role
    c["parent"], c["primitive"], c["importance"], c["confidence"] = parent, prim, imp, conf
    c["topologyClass"], c["topologyRationale"] = topo, rat
    c["dimensions"] = {"width": dims[0], "height": dims[1], "depth": dims[2],
                       "units": "relative", "confidence": conf}
    c["transform"] = {"position": list(pos), "rotation": list(rot), "scale": [1, 1, 1]}
    c["materialId"] = mat
    c["material"] = mat
    c["actionProfile"].setdefault("destruction", {})["debrisMaterial"] = mat
    c["localFeatures"] = feats or []
    c["attachment"] = att
    c["actionProfile"]["animationRole"] = anim
    return c

def A(socket, ls, le, contact, embed, gap=0.001):
    return {"parentSocket": socket, "localStart": list(ls), "localEnd": list(le),
            "contactType": contact, "embedDepth": embed, "overlap": embed, "gapTolerance": gap}

def F(fid, kind, desc, method, conf):
    return {"id": fid, "kind": kind, "description": desc, "method": method, "confidence": conf}

comps = []
# ============ MACRO ============
comps.append(C("root", "Renegade by HMI Superstrat", "macro", "assembly", None, "box",
    "assembled-solid", "Root container; three macro units bolt together.",
    (0.304, 1.0, 0.045), (0, 0, 0), "bodyFinish", 1.0, 0.95, anim="root"))

comps.append(C("body", "Solid body", "macro", "body", "root", "extrude",
    "continuous-surface",
    "NOT a box: an offset double-cutaway outline extruded then contoured on both faces. "
    "Silhouette is a closed 2D Shape (bezier), so it must be Shape+ExtrudeGeometry with a bevel, "
    "never a scaled primitive.",
    (0.304, 0.434, 0.045), (0, -0.283, 0), "bodyFinish", 1.0, 0.93,
    feats=[F("hornProfile", "contour", "Bass horn longer/more pointed than treble horn; offset cutaways.", "bezier outline control points traced from front view", 0.93),
           F("edgeBevel", "edge-treatment", "Continuous rounded perimeter bevel catching a bright rim highlight.", "ExtrudeGeometry bevelEnabled, bevelSize~0.004, bevelSegments 4", 0.88),
           F("forearmContour", "contour", "Forearm bevel, front upper treble bout.", "vertex displacement / boolean-free sculpt on front face", 0.80),
           F("bellyContour", "contour", "Deep smooth belly scoop, back treble side.", "vertex displacement on rear face, radial falloff", 0.87)]))

comps.append(C("neck", "Bolt-on neck", "macro", "neck", "root", "box",
    "continuous-surface",
    "Continuous tapered shaft with a rounded (C-profile) rear; a box would read flat. "
    "Rear profile is INFERRED - no side view.",
    (0.055, 0.392, 0.022), (0, 0.108, -0.004), "mapleSatin", 0.95, 0.72,
    feats=[F("neckTaper", "contour", "Width tapers nut->heel; rear is a rounded C.", "lathe/loft between nut and heel cross-sections", 0.72),
           F("heel", "joint", "Contoured heel entering the neck pocket.", "boolean-free overlap into body pocket", 0.78)],
    att=A("neckPocket", (0, -0.196, 0), (0, 0.196, 0), "socketed", 0.035)))

comps.append(C("headstock", "Headstock", "macro", "headstock", "root", "extrude",
    "assembled-solid",
    "Pointed six-in-line plate, extruded from a traced 2D outline; angled back off the neck plane.",
    (0.075, 0.174, 0.014), (0, 0.391, 0.004), "mapleSatin", 0.9, 0.90, rot=(-0.22, 0, 0),
    feats=[F("pointProfile", "contour", "Sharp asymmetric point with concave lower sweep.", "traced bezier outline, extruded", 0.92),
           F("headstockAngle", "contour", "Backward break angle off the neck plane. INFERRED - unseen in all 3 views.", "assumed 13deg", 0.45)],
    att=A("nutEnd", (0, -0.087, 0), (0, 0.087, 0), "fused", 0.01)))

# ============ MESO ============
meso = [
 ("fretboard", "Fretboard", "fretboard", "root", "extrude", "continuous-surface",
  "Thin cambered slab laminated to the neck face; camber is a cylindrical arc, not flat.",
  (0.055, 0.392, 0.011), (0, 0.108, 0.013), "rosewood", 0.9, 0.90,
  [F("camber", "contour", "Compound/cylindrical radius across the board.", "arc-swept plane", 0.70),
   F("binding", "edge-treatment", "Cream binding both edges, capping fret ends.", "thin side strips, creamBinding material", 0.85)], None),
 ("neckPlate", "4-bolt neck plate", "hardware", "body", "box", "hard-surface-panel",
  "Flat chrome plate with rounded corners on the body back.",
  (0.058, 0.058, 0.002), (0, -0.09, -0.024), "chrome", 0.75, 0.93,
  [F("engraving", "painted-linework", "HMI script + serial H25000001 engraved.", "albedo/roughness decal", 0.90)], None),
 ("cavityCover", "Control cavity cover", "panel", "body", "extrude", "hard-surface-panel",
  "Black rounded-teardrop cover, recessed into the body back with a visible seam.",
  (0.085, 0.135, 0.002), (-0.055, -0.34, -0.023), "blackPlastic", 0.7, 0.90,
  [F("recessSeam", "seam", "Cover sits in a routed recess; seam reads as a dark line.", "inset geometry + AO", 0.85)], None),
 ("headstockFace", "Black headstock face", "panel", "headstock", "extrude", "hard-surface-panel",
  "Gloss-black faceplate over the maple headstock, inset from the cream binding edge.",
  (0.070, 0.168, 0.001), (0, 0, 0.008), "blackGloss", 0.85, 0.92,
  [F("logo", "painted-linework", "'Renegade' script + 'by HMI' + 'HMI SERIES' wordmark.", "canvas-texture decal, albedo only", 0.95),
   F("binding", "edge-treatment", "Cream binding visible as a rim around the black face.", "parent maple showing past inset face", 0.90)], None),
 ("nut", "Nut", "hardware", "root", "box", "hard-surface-panel",
  "Thin nut at the fretboard/headstock junction.",
  (0.055, 0.005, 0.014), (0, 0.304, 0.013), "creamBinding", 0.5, 0.80, [], None),
 ("pickupNeck", "Neck humbucker", "hardware", "body", "box", "hard-surface-panel",
  "Black humbucker: two bobbins with a centre split line and four corner mounting screws.",
  (0.070, 0.030, 0.010), (0, -0.155, 0.026), "blackPlastic", 0.9, 0.90,
  [F("splitLine", "seam", "Centre seam between the two bobbins.", "inset groove", 0.88),
   F("cornerScrews", "fastener", "Four chrome mounting screws at the corners.", "instanced screw micro-part", 0.88)], None),
 ("pickupBridge", "Bridge humbucker", "hardware", "body", "box", "hard-surface-panel",
  "Second black humbucker, angled slightly, nearer the bridge.",
  (0.070, 0.030, 0.010), (0, -0.235, 0.026), "blackPlastic", 0.9, 0.90,
  [F("splitLine", "seam", "Centre seam between the two bobbins.", "inset groove", 0.88),
   F("cornerScrews", "fastener", "Four chrome mounting screws at the corners.", "instanced screw micro-part", 0.88)], None),
 ("bridgeUnit", "Tune-o-matic bridge", "hardware", "body", "box", "assembled-solid",
  "Chrome base carrying six individual brass/gold-toned saddles on height posts. "
  "Two-tone metal is evidence-backed; individual saddle geometry is APPROXIMATED.",
  (0.072, 0.014, 0.014), (0, -0.30, 0.028), "chrome", 0.9, 0.72,
  [F("heightPosts", "fastener", "Two chrome height-adjustment posts.", "cylinder pair", 0.75)], None),
 ("knobVolume", "Volume knob", "hardware", "body", "cylinder", "hard-surface-panel",
  "Chrome dome knob, lower bout treble side.",
  (0.022, 0.014, 0.022), (0.075, -0.262, 0.028), "chrome", 0.7, 0.94, [], None),
 ("knobTone", "Tone knob", "hardware", "body", "cylinder", "hard-surface-panel",
  "Second chrome dome knob, below and outboard of the first.",
  (0.022, 0.014, 0.022), (0.088, -0.335, 0.028), "chrome", 0.7, 0.94, [], None),
 ("toggleSwitch", "3-way toggle", "hardware", "body", "cylinder", "assembled-solid",
  "Angled toggle with a black tip, set between the two knobs.",
  (0.008, 0.030, 0.008), (0.083, -0.30, 0.030), "blackPlastic", 0.6, 0.91,
  [F("blackTip", "material-zone", "Black plastic tip on a chrome shaft.", "two-material split along the lever", 0.90)], None),
 ("strapButtonHorn", "Strap button (bass horn)", "hardware", "body", "cylinder", "hard-surface-panel",
  "Chrome strap button at the upper bass horn tip.",
  (0.013, 0.010, 0.013), (-0.132, -0.10, 0.0), "chrome", 0.4, 0.85, [], None),
 ("strapButtonTail", "Strap button (tail)", "hardware", "body", "cylinder", "hard-surface-panel",
  "Chrome strap button at the body tail.",
  (0.013, 0.010, 0.013), (0, -0.50, 0.0), "chrome", 0.4, 0.85, [], None),
 ("outputJack", "Output jack", "hardware", "body", "cylinder", "hard-surface-panel",
  "Jack on the lower treble edge. Position partially INFERRED.",
  (0.016, 0.012, 0.016), (0.125, -0.40, 0.0), "chrome", 0.3, 0.60, [], None),
]
for (cid, nm, role, par, prim, topo, rat, dm, ps, mat, imp, cf, fts, at) in meso:
    comps.append(C(cid, nm, "meso", role, par, prim, topo, rat, dm, ps, mat, imp, cf, fts, at))

# evidence routing: which reference view is ground truth for each component
BACK_EV = {"neckPlate", "cavityCover", "strapButtonTail"}
TQ_EV = {"root"}
for c in comps:
    c["materialLayers"] = [c["materialId"]]
    if c["id"] in BACK_EV:
        c["evidenceRefs"] = ["back"]
    elif c["id"] in TQ_EV:
        c["evidenceRefs"] = ["front", "back", "three-quarter"]
    elif c["id"] in {"body", "neck"}:
        c["evidenceRefs"] = ["front", "back", "three-quarter"]
    elif c["id"] in ("headstock", "fretboard", "nut"):
        c["evidenceRefs"] = ["front", "back"]
    else:
        c["evidenceRefs"] = ["front", "three-quarter"]

# --- coordinate fix ---------------------------------------------------------
# Hardware was authored in WORLD coordinates but parented to `body`, so the body's
# own offset got added a second time (parts floated below the guitar). Convert them
# to body-local. Also centre the body in depth: ExtrudeGeometry runs 0..depth, so
# the slab sat entirely in front of z=0.
_by = {c["id"]: c for c in comps}
_body = _by["body"]
_body["transform"]["position"][2] = -_body["dimensions"]["depth"] / 2.0
_bp = list(_body["transform"]["position"])
for c in comps:
    if c["parent"] == "body":
        p_ = c["transform"]["position"]
        c["transform"]["position"] = [round(p_[i] - _bp[i], 5) for i in range(3)]
# CylinderGeometry's axis is +Y; knobs/buttons/jack face the player along +Z.
for cid in ("knobVolume", "knobTone", "strapButtonHorn", "strapButtonTail", "outputJack"):
    _by[cid]["transform"]["rotation"] = [1.5708, 0, 0]
# fretboard sits on the neck's front face, not floating above it
_by["fretboard"]["transform"]["position"][2] = 0.007

spec["componentTree"] = comps

# ============ MATERIALS ============
def M(mid, name, color, metal, rough, extra=None, notes="", cc=0.0, ccr=0.0):
    m = copy.deepcopy(tM)
    m["id"], m["name"] = mid, name
    m["baseColor"] = m["color"] = color
    m["albedo"]["dominant"] = color
    m["albedo"]["secondary"] = (extra or [color, color])[:2]
    m["colorVariation"]["palette"] = [color] + (extra or [])
    m["metalness"], m["roughness"] = metal, rough
    m["clearcoat"], m["clearcoatRoughness"] = cc, ccr
    m["samplingNotes"] = notes
    return m

spec["materials"] = [
 M("bodyFinish", "Gunmetal metallic flake", "#5A5C55", 0.62, 0.34,
   ["#43443F", "#7E8177", "#2E2F2B"], cc=0.85, ccr=0.10,
   notes="Dark pewter/gunmetal green-grey. Flake is a SEPARATE high-frequency normal+roughness band, "
         "not baked into albedo. Clearcoat over flake gives the satin sheen. Flake resolves individually "
         "at full reference resolution - do not approximate with flat albedo."),
 M("chrome", "Polished chrome", "#D8DBDE", 1.0, 0.08, ["#FFFFFF", "#8C9096"],
   notes="Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."),
 M("brassSaddle", "Brass/gold saddle alloy", "#B9964F", 1.0, 0.26, ["#D8B972", "#8A6E33"],
   notes="Saddles read distinctly warmer than the chrome base - two-tone bridge is evidence-backed."),
 M("rosewood", "Rosewood fretboard", "#4A3327", 0.0, 0.62, ["#5E4234", "#33221A"],
   notes="Open-pore grain; anisotropic length-wise streak. Grain direction runs along the neck."),
 M("mapleSatin", "Satin natural maple", "#D9BE8E", 0.0, 0.48, ["#E8D2AA", "#BFA173"],
   notes="Neck rear + headstock rear. Sharply lighter than both board and body - a common failure "
         "is carrying the body finish onto the neck."),
 M("blackPlastic", "Black ABS", "#141414", 0.0, 0.55, ["#242424", "#0A0A0A"],
   notes="Pickup covers, cavity cover, switch tip. Semi-matte, NOT gloss."),
 M("blackGloss", "Gloss black headstock face", "#0C0C0C", 0.0, 0.12, ["#1A1A1A"], cc=0.9, ccr=0.06,
   notes="Distinctly glossier than the pickup plastic; carries the painted logo."),
 M("fretNickel", "Nickel-silver fretwire", "#C6C4BE", 1.0, 0.18, ["#E0DED8"],
   notes="Bright specular line array across a dark board."),
 M("creamBinding", "Cream binding plastic", "#E6DCC0", 0.0, 0.40, ["#F2EAD4"],
   notes="Fretboard edges, headstock rim, nut."),
]

# ============ REPETITION SYSTEMS ============
spec["repetitionSystems"] = [
 {"id": "fretArray", "name": "Frets", "count": 24, "instanced": True, "componentRef": "fretboard",
  "materialId": "fretNickel", "distribution": "monotonic 12th-root-of-2 scale spacing, nut->body",
  "variation": {"scale": 0.0, "rotation": 0.0}, "confidence": 0.88,
  "notes": "Spacing MUST follow the equal-temperament rule; uniform spacing is an instant tell."},
 {"id": "inlayArray", "name": "Dot inlays", "count": 12, "instanced": True, "componentRef": "fretboard",
  "materialId": "creamBinding", "distribution": "single dots at 3,5,7,9,12,15,17,19,21,24 positions",
  "variation": {"scale": 0.0, "rotation": 0.0}, "confidence": 0.90, "notes": "Centred on the board."},
 {"id": "tunerArray", "name": "Tuners", "count": 6, "instanced": True, "componentRef": "headstock",
  "materialId": "chrome", "distribution": "six-in-line along one headstock edge, even spacing",
  "variation": {"scale": 0.0, "rotation": 0.0}, "confidence": 0.93,
  "notes": "Enclosed housing + post + kidney button; button visible from the rear view."},
 {"id": "stringArray", "name": "Strings", "count": 6, "instanced": True, "componentRef": "root",
  "materialId": "chrome", "distribution": "nut to bridge, fanning slightly wider toward the bridge",
  "variation": {"scale": 0.35, "rotation": 0.0}, "confidence": 0.90,
  "notes": "Gauge varies monotonically low->high; scale variation carries the gauge taper."},
 {"id": "saddleArray", "name": "Bridge saddles", "count": 6, "instanced": True, "componentRef": "bridgeUnit",
  "materialId": "brassSaddle", "distribution": "six across the bridge base, staggered intonation offsets",
  "variation": {"scale": 0.0, "rotation": 0.0}, "confidence": 0.70,
  "notes": "APPROXIMATED - individual saddle geometry is below the resolving power of the references."},
 {"id": "ferruleArray", "name": "String ferrules", "count": 6, "instanced": True, "componentRef": "body",
  "materialId": "chrome", "distribution": "straight row on the body back, matching string spacing",
  "variation": {"scale": 0.0, "rotation": 0.0}, "confidence": 0.86,
  "notes": "Confirms string-through-body construction."},
 {"id": "screwArray", "name": "Hardware screws", "count": 14, "instanced": True, "componentRef": "root",
  "materialId": "chrome", "distribution": "4 neck plate + 8 pickup corners + cavity cover perimeter",
  "variation": {"scale": 0.0, "rotation": 1.0}, "confidence": 0.85,
  "notes": "Random rotation per instance; identical slot angles read as fake."},
]

# ============ FEATURE REVIEW TARGETS ============
spec["featureReviewTargets"] = [
 {"id": "body-silhouette", "name": "Offset double-cutaway body silhouette", "tier": "critical",
  "passIds": ["blockout", "form-refinement"], "minimumScore": 0.85, "mustPass": True,
  "componentRefs": ["body"], "evidenceRefs": ["front", "three-quarter"]},
 {"id": "neck-headstock-line", "name": "Neck + pointed headstock proportion", "tier": "critical",
  "passIds": ["blockout", "structural-pass"], "minimumScore": 0.82, "mustPass": True,
  "componentRefs": ["neck", "headstock"], "evidenceRefs": ["front", "back"]},
 {"id": "hardware-layout", "name": "Pickup/bridge/control placement", "tier": "critical",
  "passIds": ["structural-pass"], "minimumScore": 0.80, "mustPass": True,
  "componentRefs": ["pickupNeck", "pickupBridge", "bridgeUnit", "knobVolume", "knobTone", "toggleSwitch"],
  "evidenceRefs": ["front", "three-quarter"]},
 {"id": "flake-finish-response", "name": "Metallic flake finish response", "tier": "critical",
  "passIds": ["material-pass", "surface-pass"], "minimumScore": 0.78, "mustPass": True,
  "componentRefs": ["body"], "evidenceRefs": ["front", "three-quarter"]},
 {"id": "material-zone-separation", "name": "Maple neck vs rosewood board vs gunmetal body", "tier": "critical",
  "passIds": ["material-pass"], "minimumScore": 0.80, "mustPass": True,
  "componentRefs": ["neck", "fretboard", "body"], "evidenceRefs": ["back", "front"]},
 {"id": "back-hardware", "name": "Neck plate, cavity cover, ferrules", "tier": "important",
  "passIds": ["structural-pass", "surface-pass"], "minimumScore": 0.72, "mustPass": False,
  "componentRefs": ["neckPlate", "cavityCover"], "evidenceRefs": ["back"]},
 {"id": "fret-inlay-array", "name": "Fret + inlay spacing", "tier": "important",
  "passIds": ["structural-pass"], "minimumScore": 0.72, "mustPass": False,
  "componentRefs": ["fretboard"], "evidenceRefs": ["front"]},
 {"id": "headstock-logo", "name": "Renegade/HMI headstock artwork", "tier": "important",
  "passIds": ["surface-pass"], "minimumScore": 0.70, "mustPass": False,
  "componentRefs": ["headstockFace"], "evidenceRefs": ["front"]},
]

# ============ VIEW EVIDENCE (all three, one object) ============
spec["viewEvidence"] = [
 {"id": "front", "viewpoint": "front", "path": f"{S}/refs/renegade-front.png",
  "admitted": True, "pHash": 18445479264840097797, "coverage": 0.1479,
  "provides": ["body silhouette", "horn offset", "hardware layout", "fretboard", "headstock logo", "flake finish"]},
 {"id": "back", "viewpoint": "back", "path": f"{S}/refs/renegade-back.png",
  "admitted": True, "pHash": 12153733976984173738, "coverage": 0.1368,
  "provides": ["neck plate + serial", "cavity cover", "string ferrules", "belly contour", "maple neck rear", "tuner buttons"]},
 {"id": "three-quarter", "viewpoint": "three-quarter", "path": f"{S}/refs/renegade-three-quarter.png",
  "admitted": True, "pHash": 13810496789788272802, "coverage": 0.1263,
  "provides": ["forearm contour", "body edge bevel", "depth cue", "hardware relief"]},
]
spec["visualEvidence"] = [
 {"id": v["id"], "kind": "reference-photo", "path": v["path"], "viewpoint": v["viewpoint"],
  "description": "Admitted reference view: " + ", ".join(v["provides"]),
  "admitted": True, "confidence": 0.95}
 for v in spec["viewEvidence"]
]
spec["assumptions"] = spec["preSpecAssessment"]["unknownsToResolveBeforeImplementation"]
spec["risks"] = [
 "No side view: body depth and neck profile are inferred, not measured. Any 90-degree orbit view is the weakest angle.",
 "Bridge saddle geometry approximated - below reference resolving power.",
 "Headstock break angle unseen in all three views; mirrored/assumed.",
 "Flake finish is the highest-risk material: flat albedo will read as plastic, over-strong flake as glitter.",
]
# ============ NORMALIZE to validator vocabularies ============
TOPO_MAP = {"continuous-surface": "continuous-sculpt", "hard-surface-panel": "surface-relief"}
MAT_CLASS = {"bodyFinish": "metal", "chrome": "metal", "brassSaddle": "metal",
             "rosewood": "wood", "mapleSatin": "wood", "blackPlastic": "plastic",
             "blackGloss": "plastic", "fretNickel": "metal", "creamBinding": "plastic"}
MATS = {m["id"]: m for m in spec["materials"]}

def rgba(hx, a=1.0):
    hx = hx.lstrip("#")
    return f"rgba({int(hx[0:2],16)}, {int(hx[2:4],16)}, {int(hx[4:6],16)}, {a})"

for c in spec["componentTree"]:
    c["topologyClass"] = TOPO_MAP.get(c["topologyClass"], c["topologyClass"])
    mid = c["material"]; m = MATS[mid]
    sec = (m["albedo"]["secondary"] or [m["baseColor"]])[0]
    c["colorMaterialRecipe"] = {
        "dominantAlbedo": rgba(m["baseColor"]),
        "secondaryAlbedo": rgba(sec),
        "materialClass": MAT_CLASS[mid],
        "materialClassConfidence": round(c["confidence"], 2),
        "evidenceRefs": c["evidenceRefs"],
        "notes": m.get("samplingNotes", ""),
    }
    # NOTE: an attachment with localStart/localEnd makes the generator emit
    # CylinderGeometry from the endpoints INSTEAD of the component's real primitive
    # (see mesh_<id>Geometry ternary). Strict-quality wants an attachment on every
    # non-root part, but honouring that replaces the traced body outline with a tube.
    # Geometry correctness wins; the strict warning is accepted and documented.
    c["attachment"] = None
    # the generator emits UNIT box/cylinder primitives and never scales them by
    # dimensions{}, so real size has to ride on transform.scale.
    d = c["dimensions"]
    # root is a CONTAINER: scaling it multiplies every descendant, so leave it at 1.
    if c["id"] != "root" and c["primitive"] in ("box", "cylinder", "sphere", "capsule", "cone"):
        c["transform"]["scale"] = [d["width"], d["height"], d["depth"]]

for r in spec["repetitionSystems"]:
    r["buildsGeometry"] = True
    r["realization"] = "instanced-geometry"

json.dump(spec, open(P, "w"), indent=2)
print("components:", len(comps), "| materials:", len(spec["materials"]),
      "| repetitionSystems:", len(spec["repetitionSystems"]),
      "| featureReviewTargets:", len(spec["featureReviewTargets"]))
