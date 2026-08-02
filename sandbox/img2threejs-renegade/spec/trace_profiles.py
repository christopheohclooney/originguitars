"""Trace real 2D outlines off the front reference and write them into
geometryDescriptor.profile2D so the generator extrudes THIS guitar's silhouette
instead of falling back to _DEFAULT_EXTRUDE_PROFILE (a 0.6x0.6 square)."""
import json, math
from PIL import Image

S = "/tmp/claude-0/-home-user-originguitars/76038984-cd42-5dab-9708-9a4ba07ece2a/scratchpad"
P = f"{S}/build/renegade-spec.json"

im = Image.open(f"{S}/refs/renegade-front.png").convert("RGB")
W, H = im.size
px = im.load()

def mask(y0, y1, x0=0, x1=W):
    """binary mask rows y0..y1, non-white = object"""
    m = [[0] * W for _ in range(H)]
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b = px[x, y]
            if not (r > 236 and g > 236 and b > 236):
                m[y][x] = 1
    return m

def trace(m, y0, y1):
    """Moore-neighbour boundary trace of the largest blob."""
    start = None
    for y in range(y0, y1):
        for x in range(W):
            if m[y][x]:
                start = (x, y); break
        if start: break
    if not start: return []
    nbr = [(1,0),(1,1),(0,1),(-1,1),(-1,0),(-1,-1),(0,-1),(1,-1)]
    def solid(x, y): return 0 <= x < W and y0 <= y < y1 and m[y][x]
    contour = [start]; cur = start; bdir = 4
    for _ in range(200000):
        found = False
        for k in range(8):
            d = (bdir + 1 + k) % 8
            nx, ny = cur[0] + nbr[d][0], cur[1] + nbr[d][1]
            if solid(nx, ny):
                bdir = (d + 4) % 8
                cur = (nx, ny); contour.append(cur); found = True; break
        if not found: break
        if cur == start and len(contour) > 8: break
    return contour

def rdp(pts, eps):
    if len(pts) < 3: return pts
    def d(p, a, b):
        if a == b: return math.hypot(p[0]-a[0], p[1]-a[1])
        t = ((p[0]-a[0])*(b[0]-a[0]) + (p[1]-a[1])*(b[1]-a[1])) / ((b[0]-a[0])**2 + (b[1]-a[1])**2)
        t = max(0, min(1, t)); px_, py_ = a[0]+t*(b[0]-a[0]), a[1]+t*(b[1]-a[1])
        return math.hypot(p[0]-px_, p[1]-py_)
    dmax, idx = 0, 0
    for i in range(1, len(pts)-1):
        dd = d(pts[i], pts[0], pts[-1])
        if dd > dmax: dmax, idx = dd, i
    if dmax > eps:
        return rdp(pts[:idx+1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]

def profile(y0, y1, target_h, eps=3.0, max_pts=90):
    m = mask(y0, y1)
    c = trace(m, y0, y1)
    if not c: return None, None
    c = rdp(c, eps)
    while len(c) > max_pts:
        eps *= 1.35; c = rdp(trace(m, y0, y1), eps)
    xs = [p[0] for p in c]; ys = [p[1] for p in c]
    cx = (min(xs) + max(xs)) / 2.0; cy = (min(ys) + max(ys)) / 2.0
    pw = max(xs) - min(xs); ph = max(ys) - min(ys)
    # generator emits UNIT primitives and scales them by dimensions{}, so the profile
    # must span 1.0 on both axes or it gets scaled twice.
    pts = [[round((x - cx) / pw, 5), round((cy - y) / ph, 5)] for x, y in c]
    return pts, (pw / ph) * target_h

spec = json.load(open(P))
byid = {c["id"]: c for c in spec["componentTree"]}

# body: rows below the horn tips through the tail (measured off the front bbox)
body_pts, body_w = profile(1318, 2266, target_h=0.434)
# headstock: top of image through the nut
head_pts, head_w = profile(112, 500, target_h=0.174, eps=2.0)

for cid, pts, depth, w in (("body", body_pts, 0.045, body_w),
                           ("headstock", head_pts, 0.014, head_w)):
    if not pts:
        print(f"{cid}: TRACE FAILED"); continue
    c = byid[cid]
    c["geometryDescriptor"]["profile2D"] = {"points": pts, "depth": 1.0}
    c["geometryDescriptor"]["topologyIntent"] = (
        "reference-traced closed outline, extruded with a perimeter bevel")
    c["dimensions"]["width"] = round(w, 4)
    print(f"{cid}: {len(pts)} pts, traced width {w:.4f}")

# fretboard + thin panels: simple rectangles are correct, but give them real ones
def rect(w, h, depth):
    return {"points": [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]], "depth": 1.0}
for cid in ("fretboard", "cavityCover", "headstockFace"):
    c = byid[cid]; d = c["dimensions"]
    c["geometryDescriptor"]["profile2D"] = rect(d["width"], d["height"], d["depth"])

json.dump(spec, open(P, "w"), indent=2)
print("profile2D written")
