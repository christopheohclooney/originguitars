import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  textureSize?: number;
  textureAnisotropy?: number;
  qualityPriority?: 'reference-fidelity' | 'balanced';
};

export type ProceduralModelRuntime = {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh>;
  sockets: Record<string, THREE.Object3D>;
  colliders: Record<string, unknown>;
  destructionGroups: Record<string, THREE.Object3D[]>;
};

type SculptMaterialSpec = Record<string, any>;

// bevelEnabled defaults to true on THREE.ExtrudeGeometry and rounds every
// corner — sharp/pointed profiles (blades, fork tines, spikes) need
// bevelEnabled: false plus lineTo()-only path segments near the tip, since a
// curve command cannot produce a true converging point.
function buildExtrudeShape(points: [number, number][], holes?: [number, number][][]): THREE.Shape {
  const shape = new THREE.Shape();
  if (points.length > 0) {
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) {
      shape.lineTo(points[i][0], points[i][1]);
    }
  }
  // Cutouts (e.g. an oval wire-cutter hole) as THREE.Path added to shape.holes —
  // dep-free boolean subtraction via the tessellator, no CSG library needed.
  for (const loop of holes ?? []) {
    if (loop.length < 3) continue;
    const path = new THREE.Path();
    path.moveTo(loop[0][0], loop[0][1]);
    for (let i = 1; i < loop.length; i += 1) path.lineTo(loop[i][0], loop[i][1]);
    path.closePath();
    shape.holes.push(path);
  }
  return shape;
}

// Build an N-gon oval loop (for hole authoring from a compact {cx,cy,rx,ry} descriptor).
function ovalLoop(cx: number, cy: number, rx: number, ry: number, seg = 24): [number, number][] {
  const loop: [number, number][] = [];
  for (let i = 0; i < seg; i += 1) {
    const a = (i / seg) * Math.PI * 2;
    loop.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return loop;
}

function buildExtrudeGeometry(profile: { points: [number, number][]; depth: number; holes?: [number, number][][]; ovalHoles?: { cx: number; cy: number; rx: number; ry: number }[] }): THREE.ExtrudeGeometry {
  const holes = [...(profile.holes ?? []), ...((profile.ovalHoles ?? []).map((o) => ovalLoop(o.cx, o.cy, o.rx, o.ry)))];
  const shape = buildExtrudeShape(profile.points, holes);
  return new THREE.ExtrudeGeometry(shape, {
    depth: profile.depth,
    bevelEnabled: false,
    steps: 1,
  });
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function readLayerNumber(value: unknown, keys: string[], fallback: number): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      if (typeof record[key] === 'number') return record[key] as number;
    }
  }
  return fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = /^#[0-9a-f]{3}$/i.test(hex)
    ? '#' + hex.slice(1).split('').map((part) => part + part).join('')
    : hex;
  const value = /^#[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized.slice(1), 16) : 0x8a7a5f;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function materialPalette(spec: SculptMaterialSpec): string[] {
  const palette = spec.colorVariation?.palette;
  if (Array.isArray(palette) && palette.length > 0) return palette.filter((value) => typeof value === 'string');
  const secondary = spec.albedo?.secondary;
  const colors = [spec.baseColor ?? spec.color ?? spec.albedo?.dominant, ...(Array.isArray(secondary) ? secondary : [])];
  return colors.filter((value): value is string => typeof value === 'string' && value.startsWith('#'));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothCurve(value: number): number {
  return value * value * (3 - 2 * value);
}

function periodicHash(x: number, y: number, seed: number, periodX: number, periodY: number): number {
  const wrappedX = ((x % periodX) + periodX) % periodX;
  const wrappedY = ((y % periodY) + periodY) % periodY;
  let value = Math.imul(wrappedX + seed * 17, 374761393) ^ Math.imul(wrappedY + seed * 31, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function periodicValueNoise(u: number, v: number, seed: number, periodX: number, periodY: number): number {
  const x = u * periodX;
  const y = v * periodY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothCurve(x - x0);
  const ty = smoothCurve(y - y0);
  const a = periodicHash(x0, y0, seed, periodX, periodY);
  const b = periodicHash(x0 + 1, y0, seed, periodX, periodY);
  const c = periodicHash(x0, y0 + 1, seed, periodX, periodY);
  const d = periodicHash(x0 + 1, y0 + 1, seed, periodX, periodY);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
}

type SurfaceBand = {
  frequency: number;
  amplitude: number;
  stretchX: number;
  stretchY: number;
  ridge: boolean;
};

function surfaceBands(spec: SculptMaterialSpec): SurfaceBand[] {
  const source = Array.isArray(spec.surfaceFrequencyBands) ? spec.surfaceFrequencyBands : [];
  const parsed = source.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const band = item as Record<string, unknown>;
    const frequency = typeof band.frequency === 'number' ? band.frequency : 0;
    const amplitude = typeof band.amplitude === 'number' ? band.amplitude : 0;
    if (frequency <= 0 || amplitude <= 0) return [];
    const stretch = Array.isArray(band.stretch) ? band.stretch : [1, 1];
    const description = `${String(band.pattern ?? '')} ${String(band.role ?? '')}`.toLowerCase();
    return [{
      frequency,
      amplitude,
      stretchX: typeof stretch[0] === 'number' ? Math.max(0.1, stretch[0]) : 1,
      stretchY: typeof stretch[1] === 'number' ? Math.max(0.1, stretch[1]) : 1,
      ridge: /(ridge|groove|grain|fiber|striated|crack)/.test(description),
    }];
  });
  return parsed.length > 0 ? parsed : [
    { frequency: 2, amplitude: 0.42, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 12, amplitude: 0.22, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 56, amplitude: 0.08, stretchX: 1, stretchY: 1, ridge: false },
  ];
}

function sampleSurface(u: number, v: number, bands: SurfaceBand[], seed: number): number {
  let value = 0;
  let weight = 0;
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    const periodX = Math.max(1, Math.round(band.frequency * band.stretchX));
    const periodY = Math.max(1, Math.round(band.frequency * band.stretchY));
    let sample = periodicValueNoise(u, v, seed + index * 1013, periodX, periodY);
    if (band.ridge) sample = 1 - Math.abs(sample * 2 - 1);
    value += sample * band.amplitude;
    weight += band.amplitude;
  }
  return weight > 0 ? clamp01(value / weight) : 0.5;
}

function mixPalette(colors: [number, number, number][], value: number): [number, number, number] {
  if (colors.length === 1) return colors[0];
  const scaled = clamp01(value) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const a = colors[index];
  const b = colors[index + 1];
  return [
    Math.round(THREE.MathUtils.lerp(a[0], b[0], mix)),
    Math.round(THREE.MathUtils.lerp(a[1], b[1], mix)),
    Math.round(THREE.MathUtils.lerp(a[2], b[2], mix)),
  ];
}

type ColorGradientStop = { offset: number; color: string };
type ColorGradientSpec = {
  type: 'linear' | 'radial';
  axis: [number, number];
  stops: ColorGradientStop[];
};

function parseRgba(value: string): [number, number, number] {
  const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
  if (!match) return [138, 122, 95];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

// Analytical per-pixel gradient sample. The extraction schema's colorGradient carries
// exact rgba(...) stop colors (see extract_part_color_recipe.py), so this samples the
// same trend directly in JS math rather than round-tripping through a Canvas 2D
// createLinearGradient/createRadialGradient object — same visual result, and it composes
// directly with the existing noise/height-correlated colorVariation blend below.
function sampleColorGradient(gradient: ColorGradientSpec, u: number, v: number): [number, number, number] {
  const stops = gradient.stops.length >= 2 ? gradient.stops : [{ offset: 0, color: 'rgba(138,122,95,1)' }, { offset: 1, color: 'rgba(138,122,95,1)' }];
  let t: number;
  if (gradient.type === 'radial') {
    const [cx, cy] = gradient.axis;
    const dx = u - cx;
    const dy = v - cy;
    const maxRadius = Math.max(0.001, Math.hypot(Math.max(cx, 1 - cx), Math.max(cy, 1 - cy)));
    t = clamp01(Math.hypot(dx, dy) / maxRadius);
  } else {
    const [ax, ay] = gradient.axis;
    const projection = (u - 0.5) * ax + (v - 0.5) * ay;
    const maxProjection = 0.5 * (Math.abs(ax) + Math.abs(ay)) || 0.5;
    t = clamp01(projection / maxProjection + 0.5);
  }
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.max(0, Math.floor(scaled)));
  const mix = scaled - index;
  const a = parseRgba(stops[index].color);
  const b = parseRgba(stops[index + 1].color);
  return [
    THREE.MathUtils.lerp(a[0], b[0], mix),
    THREE.MathUtils.lerp(a[1], b[1], mix),
    THREE.MathUtils.lerp(a[2], b[2], mix),
  ];
}

function writePixel(data: Uint8ClampedArray, offset: number, red: number, green: number, blue: number): void {
  data[offset] = Math.max(0, Math.min(255, Math.round(red)));
  data[offset + 1] = Math.max(0, Math.min(255, Math.round(green)));
  data[offset + 2] = Math.max(0, Math.min(255, Math.round(blue)));
  data[offset + 3] = 255;
}

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function createMapTexture(
  canvas: HTMLCanvasElement,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [2, 2];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 2,
    typeof repeat[1] === 'number' ? repeat[1] : 2,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

type ProceduralTextureSet = {
  albedo: THREE.Texture;
  roughness: THREE.Texture;
  height: THREE.Texture;
  normal: THREE.Texture;
  ao: THREE.Texture;
  source: 'reference-pixel-extraction' | 'procedural';
};

function referenceMapUrl(spec: SculptMaterialSpec, channel: string): string | null {
  const reference = spec.referencePbr;
  if (!reference || typeof reference !== 'object') return null;
  if (reference.usable === false) return null;
  const confidence = typeof reference.confidence === 'number'
    ? reference.confidence
    : (typeof reference.estimatedFidelity === 'number' ? reference.estimatedFidelity : 0);
  const threshold = typeof reference.targetThreshold === 'number' ? reference.targetThreshold : 0.7;
  if (confidence < threshold) return null;
  const maps = reference.maps;
  if (!maps || typeof maps !== 'object') return null;
  const map = (maps as Record<string, unknown>)[channel];
  if (!map || typeof map !== 'object') return null;
  const record = map as Record<string, unknown>;
  const url = typeof record.url === 'string' && record.url.trim() ? record.url : record.path;
  return typeof url === 'string' && url.trim() ? url : null;
}

function createLoadedMapTexture(
  url: string,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.Texture {
  const texture = new THREE.TextureLoader().load(url);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [1, 1];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 1,
    typeof repeat[1] === 'number' ? repeat[1] : 1,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

function makeReferenceTextureSet(spec: SculptMaterialSpec, options: ProceduralModelOptions): ProceduralTextureSet | null {
  const albedo = referenceMapUrl(spec, 'albedo');
  const roughness = referenceMapUrl(spec, 'roughness');
  const height = referenceMapUrl(spec, 'height');
  const normal = referenceMapUrl(spec, 'normal');
  const ao = referenceMapUrl(spec, 'ao');
  if (!albedo || !roughness || !height || !normal || !ao) return null;
  return {
    albedo: createLoadedMapTexture(albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createLoadedMapTexture(roughness, THREE.NoColorSpace, spec, options),
    height: createLoadedMapTexture(height, THREE.NoColorSpace, spec, options),
    normal: createLoadedMapTexture(normal, THREE.NoColorSpace, spec, options),
    ao: createLoadedMapTexture(ao, THREE.NoColorSpace, spec, options),
    source: 'reference-pixel-extraction',
  };
}

function makeProceduralTextureSet(
  id: string,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): ProceduralTextureSet | null {
  if (typeof document === 'undefined') return null;
  const qualityFirst = (options.qualityPriority ?? 'reference-fidelity') === 'reference-fidelity';
  const requested = options.textureSize ?? spec.textureResolution;
  const requestedSize = typeof requested === 'number' && Number.isFinite(requested)
    ? requested
    : (qualityFirst ? 1024 : 512);
  const size = Math.max(256, Math.min(2048, 2 ** Math.round(Math.log2(requestedSize))));
  const canvases = {
    albedo: makeCanvas(size),
    roughness: makeCanvas(size),
    height: makeCanvas(size),
    normal: makeCanvas(size),
    ao: makeCanvas(size),
  };
  const contexts = {
    albedo: canvases.albedo.getContext('2d'),
    roughness: canvases.roughness.getContext('2d'),
    height: canvases.height.getContext('2d'),
    normal: canvases.normal.getContext('2d'),
    ao: canvases.ao.getContext('2d'),
  };
  if (!contexts.albedo || !contexts.roughness || !contexts.height || !contexts.normal || !contexts.ao) return null;
  const images = {
    albedo: contexts.albedo.createImageData(size, size),
    roughness: contexts.roughness.createImageData(size, size),
    height: contexts.height.createImageData(size, size),
    normal: contexts.normal.createImageData(size, size),
    ao: contexts.ao.createImageData(size, size),
  };
  const seed = hashString(id);
  const bands = surfaceBands(spec);
  const heightField = new Float32Array(size * size);
  const roughnessField = new Float32Array(size * size);
  const palette = materialPalette(spec);
  const fallback = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
  const colors = (palette.length >= 2 ? palette : [fallback, '#6E614B', '#A08F70']).map(hexToRgb);
  const baseRoughness = clamp01(readLayerNumber(spec.roughness, ['base'], 0.76));
  const roughnessVariation = clamp01(readLayerNumber(spec.roughness, ['variation'], 0.18));
  const colorAmplitude = clamp01(readLayerNumber(spec.colorVariation, ['amplitude', 'variation'], 0.18));
  const heightCorrelation = clamp01(readLayerNumber(spec.colorVariation, ['heightCorrelation'], 0.3));
  const colorGradient: ColorGradientSpec | undefined = spec.colorGradient;
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const index = y * size + x;
      const height = sampleSurface(u, v, bands, seed + 101);
      const roughNoise = sampleSurface(u, v, bands, seed + 7001);
      const colorNoise = sampleSurface(u, v, bands, seed + 15013);
      heightField[index] = height;
      roughnessField[index] = clamp01(baseRoughness + (roughNoise - 0.5) * roughnessVariation * 2);
      let color: [number, number, number];
      if (colorGradient) {
        // Evidence-derived spatial gradient (Plan 1.3 Workstream C) takes priority
        // over the noise-based palette blend below — it is a measured trend, not a guess.
        color = sampleColorGradient(colorGradient, u, v);
      } else {
        const paletteValue = clamp01(
          0.5 + (colorNoise - 0.5) * colorAmplitude * 2 + (height - 0.5) * heightCorrelation
        );
        color = mixPalette(colors, paletteValue);
      }
      writePixel(images.albedo.data, index * 4, color[0], color[1], color[2]);
    }
  }
  const normalStrength = Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35));
  const aoStrength = clamp01(readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35));
  for (let y = 0; y < size; y += 1) {
    const up = ((y - 1 + size) % size) * size;
    const down = ((y + 1) % size) * size;
    for (let x = 0; x < size; x += 1) {
      const left = (x - 1 + size) % size;
      const right = (x + 1) % size;
      const index = y * size + x;
      const center = heightField[index];
      const dx = (heightField[y * size + right] - heightField[y * size + left]) * normalStrength * 6;
      const dy = (heightField[down + x] - heightField[up + x]) * normalStrength * 6;
      const inverseLength = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const normalX = -dx * inverseLength;
      const normalY = -dy * inverseLength;
      const normalZ = inverseLength;
      const neighborAverage = (
        heightField[y * size + left] + heightField[y * size + right]
        + heightField[up + x] + heightField[down + x]
      ) * 0.25;
      const cavity = Math.max(0, neighborAverage - center);
      const ao = clamp01(1 - aoStrength * (cavity * 12 + (1 - center) * 0.16));
      const offset = index * 4;
      const heightByte = center * 255;
      const roughnessByte = roughnessField[index] * 255;
      writePixel(images.height.data, offset, heightByte, heightByte, heightByte);
      writePixel(images.roughness.data, offset, roughnessByte, roughnessByte, roughnessByte);
      writePixel(
        images.normal.data, offset,
        (normalX * 0.5 + 0.5) * 255,
        (normalY * 0.5 + 0.5) * 255,
        (normalZ * 0.5 + 0.5) * 255,
      );
      writePixel(images.ao.data, offset, ao * 255, ao * 255, ao * 255);
    }
  }
  contexts.albedo.putImageData(images.albedo, 0, 0);
  contexts.roughness.putImageData(images.roughness, 0, 0);
  contexts.height.putImageData(images.height, 0, 0);
  contexts.normal.putImageData(images.normal, 0, 0);
  contexts.ao.putImageData(images.ao, 0, 0);
  return {
    albedo: createMapTexture(canvases.albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createMapTexture(canvases.roughness, THREE.NoColorSpace, spec, options),
    height: createMapTexture(canvases.height, THREE.NoColorSpace, spec, options),
    normal: createMapTexture(canvases.normal, THREE.NoColorSpace, spec, options),
    ao: createMapTexture(canvases.ao, THREE.NoColorSpace, spec, options),
    source: 'procedural',
  };
}

function createSculptMaterial(id: string, spec: SculptMaterialSpec, options: ProceduralModelOptions): THREE.MeshPhysicalMaterial {
  const textures = makeReferenceTextureSet(spec, options) ?? makeProceduralTextureSet(id, spec, options);
  const material = new THREE.MeshPhysicalMaterial({
    color: textures ? 0xffffff : new THREE.Color(typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F'),
    roughness: textures ? 1 : clamp01(readLayerNumber(spec.roughness, ['base'], 0.76)),
    metalness: clamp01(readLayerNumber(spec.metalness, ['base'], 0.0)),
    clearcoat: clamp01(readLayerNumber(spec.clearcoat, ['base', 'amount'], 0)),
    clearcoatRoughness: clamp01(readLayerNumber(spec.clearcoatRoughness, ['base'], 0.25)),
    transmission: clamp01(readLayerNumber(spec.transmission, ['base', 'amount'], 0)),
    ior: Math.max(1, readLayerNumber(spec.ior, ['base', 'value'], 1.5)),
    thickness: Math.max(0, readLayerNumber(spec.thickness, ['base', 'amount'], 0)),
    attenuationDistance: Math.max(0.001, readLayerNumber(spec.attenuationDistance, ['base', 'value'], Infinity)),
    attenuationColor: new THREE.Color(typeof spec.attenuationColor === 'string' ? spec.attenuationColor : '#ffffff'),
    sheen: clamp01(readLayerNumber(spec.sheen, ['base', 'amount'], 0)),
    sheenColor: new THREE.Color(typeof spec.sheenColor === 'string' ? spec.sheenColor : '#ffffff'),
    sheenRoughness: clamp01(readLayerNumber(spec.sheenRoughness, ['base'], 1.0)),
    iridescence: clamp01(readLayerNumber(spec.iridescence, ['base', 'amount'], 0)),
    iridescenceIOR: Math.max(1, readLayerNumber(spec.iridescenceIOR, ['base', 'value'], 1.3)),
    anisotropy: clamp01(readLayerNumber(spec.anisotropy, ['base', 'amount'], 0)),
    anisotropyRotation: readLayerNumber(spec.anisotropy, ['rotation'], 0),
    specularIntensity: clamp01(readLayerNumber(spec.specularIntensity, ['base'], 1.0)),
    specularColor: new THREE.Color(typeof spec.specularColor === 'string' ? spec.specularColor : '#ffffff'),
    emissive: new THREE.Color(typeof spec.emissive === 'string' ? spec.emissive : '#000000'),
    emissiveIntensity: Math.max(0, readLayerNumber(spec.emissiveIntensity, ['base'], 1.0)),
    opacity: clamp01(readLayerNumber(spec.opacity, ['base'], 1)),
    transparent: readLayerNumber(spec.transmission, ['base', 'amount'], 0) > 0 || readLayerNumber(spec.opacity, ['base'], 1) < 1,
    alphaTest: Math.max(0, readLayerNumber(spec.alpha, ['cutoff', 'alphaTest'], 0)),
    wireframe: options.wireframe ?? false,
    side: spec.doubleSided === true ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (textures) {
    material.map = textures.albedo;
    material.roughnessMap = textures.roughness;
    material.normalMap = textures.normal;
    material.normalScale.setScalar(Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35)));
    material.aoMap = textures.ao;
    material.aoMap.channel = 0;
    material.aoMapIntensity = readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35);
    const bumpScale = Math.max(0, readLayerNumber(spec.bump, ['amplitude', 'strength'], 0));
    if (bumpScale > 0) {
      material.bumpMap = textures.height;
      material.bumpScale = bumpScale;
    }
    const displacementScale = Math.max(0, readLayerNumber(spec.displacement, ['amplitude', 'strength'], 0));
    if (displacementScale > 0) {
      material.displacementMap = textures.height;
      material.displacementScale = displacementScale;
      material.displacementBias = -displacementScale * 0.5;
    }
  }
  material.envMapIntensity = readLayerNumber(spec, ['envMapIntensity'], 0.8);
  material.userData.sculptMaterial = spec;
  material.userData.proceduralMapsIndependent = true;
  material.userData.pbrTextureSource = textures?.source ?? 'flat-fallback';
  material.userData.referencePbr = spec.referencePbr ?? null;
  material.needsUpdate = true;
  return material;
}

type AttachmentEndpoint = {
  start: THREE.Vector3;
  midpoint: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
  baseRadius: number;
  endRadius: number;
};

function readVector3(value: unknown, fallback: [number, number, number]): THREE.Vector3 {
  if (Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number')) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function makeAttachmentEndpoint(attachment: unknown): AttachmentEndpoint | null {
  if (!attachment || typeof attachment !== 'object') return null;
  const record = attachment as Record<string, unknown>;
  const start = readVector3(record.localStart, [0, 0, 0]);
  const end = readVector3(record.localEnd, [0, 1, 0]);
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (length <= 0.0001) return null;
  const direction = delta.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const baseRadius = Math.max(0.005, readNumber(record.baseRadius, 0.06));
  const endRadius = Math.max(0.003, readNumber(record.endRadius, baseRadius * 0.55));
  return {
    start,
    midpoint: delta.multiplyScalar(0.5),
    quaternion,
    length,
    baseRadius,
    endRadius,
  };
}

// Generated from ObjectSculptSpec target: Renegade by HMI Superstrat Electric Guitar
// Sculpt build pass: blockout
// This factory is intentionally pass-gated. Finish browser screenshot review before unlocking deeper passes.
export function createRenegadeByHMISuperstratElectricGuitarModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = "Renegade by HMI Superstrat Electric Guitar";
  root.userData.reconstructionEvidence = {"itemFamily": null, "subtype": null, "componentAdapter": null, "route": null, "exactnessTier": null, "referenceCamera": {"solved": false, "fovDegrees": 40.0, "aspect": 1.0, "orientation": {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}, "positionHint": [0.0, 0.0, 3.0], "note": "For likeness work, solve the reference camera (forge/stage1_intake/solve_camera_pose.py) so the review render aligns with the photo and the reference can be projected. Confirm by overlay review."}, "approximationNotes": []};

  const materialMap: Record<string, THREE.Material> = {};
  materialMap["bodyFinish"] = createSculptMaterial(
    "bodyFinish",
    {"id": "bodyFinish", "name": "Gunmetal metallic flake", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#5A5C55", "color": "#5A5C55", "albedo": {"dominant": "#5A5C55", "secondary": ["#43443F", "#7E8177"], "samplingNotes": "Use image-observed local color zones, not a single averaged color."}, "colorVariation": {"palette": ["#5A5C55", "#43443F", "#7E8177", "#2E2F2B"], "pattern": "mottled", "amplitude": 0.15, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.34, "variation": 0.05, "map": null, "localResponse": "reference-derived roughness map retained; base scalar restored from material identity after classifier inversion"}, "metalness": {"base": 0.62, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "clearcoat": 0.85, "clearcoatRoughness": 0.1, "samplingNotes": "Dark pewter/gunmetal green-grey. Flake is a SEPARATE high-frequency normal+roughness band, not baked into albedo. Clearcoat over flake gives the satin sheen. Flake resolves individually at full reference resolution - do not approximate with flat albedo.", "finishClass": "painted-metal", "finishClassConfidence": 0.88, "classifierOverride": {"overriddenBy": "agent-vision", "reason": "Metallic-flake automotive paint over clearcoat. metalness mid-high with a strong flake normal; analyze_texture returned 0.0 which would render it as flat paint.", "originalFinishClass": "painted-metal"}},
    options
  );
  materialMap["chrome"] = createSculptMaterial(
    "chrome",
    {"id": "chrome", "name": "Polished chrome", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#D8DBDE", "color": "#D8DBDE", "albedo": {"dominant": "#D8DBDE", "secondary": ["#FFFFFF", "#8C9096"], "samplingNotes": "Use image-observed local color zones, not a single averaged color."}, "colorVariation": {"palette": ["#D8DBDE", "#FFFFFF", "#8C9096"], "pattern": "mottled", "amplitude": 0.15, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.08, "variation": 0.05, "map": null, "localResponse": "reference-derived roughness map retained; base scalar restored from material identity after classifier inversion"}, "metalness": {"base": 1.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "clearcoat": 0.0, "clearcoatRoughness": 0.0, "samplingNotes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules.", "finishClass": "polished-metal", "finishClassConfidence": 0.9, "classifierOverride": {"overriddenBy": "agent-vision", "reason": "Polished chrome. analyze_texture returned metalness 0.0 - would render as grey plastic.", "originalFinishClass": "painted-metal"}},
    options
  );
  materialMap["brassSaddle"] = createSculptMaterial(
    "brassSaddle",
    {"id": "brassSaddle", "name": "Brass/gold saddle alloy", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#B9964F", "color": "#B9964F", "albedo": {"dominant": "#B9964F", "secondary": ["#D8B972", "#8A6E33"], "samplingNotes": "Use image-observed local color zones, not a single averaged color."}, "colorVariation": {"palette": ["#B9964F", "#D8B972", "#8A6E33"], "pattern": "mottled", "amplitude": 0.15, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.26, "variation": 0.05, "map": null, "localResponse": "reference-derived roughness map retained; base scalar restored from material identity after classifier inversion"}, "metalness": {"base": 1.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "clearcoat": 0.0, "clearcoatRoughness": 0.0, "samplingNotes": "Saddles read distinctly warmer than the chrome base - two-tone bridge is evidence-backed.", "finishClass": "polished-metal", "finishClassConfidence": 0.72, "classifierOverride": {"overriddenBy": "agent-vision", "reason": "Warm brass/gold saddle alloy, distinctly warmer than the chrome base.", "originalFinishClass": "painted-metal"}},
    options
  );
  materialMap["rosewood"] = createSculptMaterial(
    "rosewood",
    {"id": "rosewood", "name": "Rosewood fretboard", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#4A3327", "color": "#4A3327", "albedo": {"dominant": "#4A3327", "secondary": ["#5E4234", "#33221A"], "samplingNotes": "Use image-observed local color zones, not a single averaged color."}, "colorVariation": {"palette": ["#4A3327", "#5E4234", "#33221A"], "pattern": "mottled", "amplitude": 0.15, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.62, "variation": 0.05, "map": null, "localResponse": "reference-derived roughness map retained; base scalar restored from material identity after classifier inversion"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "clearcoat": 0.0, "clearcoatRoughness": 0.0, "samplingNotes": "Open-pore grain; anisotropic length-wise streak. Grain direction runs along the neck.", "finishClass": "wood", "finishClassConfidence": 0.61, "classifierOverride": {"overriddenBy": "agent-vision", "reason": "Open-pore rosewood. analyze_texture classified this as brushed-steel with metalness 1.0 - its taxonomy has no wood class. Low PBR confidence: board is only ~144px wide in reference.", "originalFinishClass": "brushed-steel"}},
    options
  );
  materialMap["mapleSatin"] = createSculptMaterial(
    "mapleSatin",
    {"id": "mapleSatin", "name": "Satin natural maple", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#D9BE8E", "color": "#D9BE8E", "albedo": {"dominant": "#D9BE8E", "secondary": ["#E8D2AA", "#BFA173"], "samplingNotes": "Use image-observed local color zones, not a single averaged color."}, "colorVariation": {"palette": ["#D9BE8E", "#E8D2AA", "#BFA173"], "pattern": "mottled", "amplitude": 0.15, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.48, "variation": 0.05, "map": null, "localResponse": "reference-derived roughness map retained; base scalar restored from material identity after classifier inversion"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "clearcoat": 0.0, "clearcoatRoughness": 0.0, "samplingNotes": "Neck rear + headstock rear. Sharply lighter than both board and body - a common failure is carrying the body finish onto the neck.", "finishClass": "wood", "finishClassConfidence": 0.86, "classifierOverride": {"overriddenBy": "agent-vision", "reason": "Satin natural maple, neck rear + headstock rear. Same misclassification as rosewood.", "originalFinishClass": "brushed-steel"}},
    options
  );
  materialMap["blackPlastic"] = createSculptMaterial(
    "blackPlastic",
    {"id": "blackPlastic", "name": "Black ABS", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#141414", "color": "#141414", "albedo": {"dominant": "#141414", "secondary": ["#242424", "#0A0A0A"], "samplingNotes": "Use image-observed local color zones, not a single averaged color."}, "colorVariation": {"palette": ["#141414", "#242424", "#0A0A0A"], "pattern": "mottled", "amplitude": 0.15, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.55, "variation": 0.05, "map": null, "localResponse": "reference-derived roughness map retained; base scalar restored from material identity after classifier inversion"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "clearcoat": 0.0, "clearcoatRoughness": 0.0, "samplingNotes": "Pickup covers, cavity cover, switch tip. Semi-matte, NOT gloss.", "finishClass": "plastic", "finishClassConfidence": 0.86, "classifierOverride": {"overriddenBy": "agent-vision", "reason": "Semi-matte black ABS (pickup covers, cavity cover, switch tip). Was given metalness 1.0.", "originalFinishClass": "brushed-steel"}},
    options
  );
  materialMap["blackGloss"] = createSculptMaterial(
    "blackGloss",
    {"id": "blackGloss", "name": "Gloss black headstock face", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#0C0C0C", "color": "#0C0C0C", "albedo": {"dominant": "#0C0C0C", "secondary": ["#1A1A1A"], "samplingNotes": "Use image-observed local color zones, not a single averaged color."}, "colorVariation": {"palette": ["#0C0C0C", "#1A1A1A"], "pattern": "mottled", "amplitude": 0.15, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.12, "variation": 0.05, "map": null, "localResponse": "reference-derived roughness map retained; base scalar restored from material identity after classifier inversion"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "clearcoat": 0.9, "clearcoatRoughness": 0.06, "samplingNotes": "Distinctly glossier than the pickup plastic; carries the painted logo.", "finishClass": "plastic", "finishClassConfidence": 0.61, "classifierOverride": {"overriddenBy": "agent-vision", "reason": "Gloss black headstock face - glossier than the pickup ABS. Was given metalness 1.0.", "originalFinishClass": "brushed-steel"}},
    options
  );
  materialMap["fretNickel"] = createSculptMaterial(
    "fretNickel",
    {"id": "fretNickel", "name": "Nickel-silver fretwire", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#C6C4BE", "color": "#C6C4BE", "albedo": {"dominant": "#C6C4BE", "secondary": ["#E0DED8"], "samplingNotes": "Use image-observed local color zones, not a single averaged color."}, "colorVariation": {"palette": ["#C6C4BE", "#E0DED8"], "pattern": "mottled", "amplitude": 0.15, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.18, "variation": 0.05, "map": null, "localResponse": "reference-derived roughness map retained; base scalar restored from material identity after classifier inversion"}, "metalness": {"base": 1.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "clearcoat": 0.0, "clearcoatRoughness": 0.0, "samplingNotes": "Bright specular line array across a dark board.", "finishClass": "polished-metal", "finishClassConfidence": 0.61, "classifierOverride": {"overriddenBy": "agent-vision", "reason": "Nickel-silver fretwire. Low confidence: frets are a few px wide in the reference.", "originalFinishClass": "painted-metal"}},
    options
  );
  materialMap["creamBinding"] = createSculptMaterial(
    "creamBinding",
    {"id": "creamBinding", "name": "Cream binding plastic", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#E6DCC0", "color": "#E6DCC0", "albedo": {"dominant": "#E6DCC0", "secondary": ["#F2EAD4"], "samplingNotes": "Use image-observed local color zones, not a single averaged color."}, "colorVariation": {"palette": ["#E6DCC0", "#F2EAD4"], "pattern": "mottled", "amplitude": 0.15, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.4, "variation": 0.05, "map": null, "localResponse": "reference-derived roughness map retained; base scalar restored from material identity after classifier inversion"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.35, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0.0, "scale": 1.0}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "clearcoat": 0.0, "clearcoatRoughness": 0.0, "samplingNotes": "Fretboard edges, headstock rim, nut.", "finishClass": "plastic", "finishClassConfidence": 0.61, "classifierOverride": {"overriddenBy": "agent-vision", "reason": "Cream binding plastic. Low confidence: binding is a thin strip in the reference.", "originalFinishClass": "brushed-steel"}},
    options
  );

  const nodes: Record<string, THREE.Object3D> = { root };
  const meshes: Record<string, THREE.Mesh> = {};
  const sockets: Record<string, THREE.Object3D> = {};
  const colliders: Record<string, unknown> = {};
  const destructionGroups: Record<string, THREE.Object3D[]> = {};

  const attachment_root_0 = null;
  const endpoint_root_0 = makeAttachmentEndpoint(attachment_root_0);
  const node_root_0 = new THREE.Group();
  node_root_0.name = "Renegade by HMI Superstrat__pivot";
  if (endpoint_root_0) {
    node_root_0.position.copy(endpoint_root_0.start);
    node_root_0.rotation.set(0, 0, 0);
    node_root_0.scale.set(1, 1, 1);
  } else {
    node_root_0.position.set(0.0, 0.0, 0.0);
    node_root_0.rotation.set(0.0, 0.0, 0.0);
    node_root_0.scale.set(1.0, 1.0, 1.0);
  }
  node_root_0.userData.sculptComponent = {"id": "root", "name": "Renegade by HMI Superstrat", "level": "macro", "role": "assembly", "importance": 1.0, "confidence": 0.95, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Root container; three macro units bolt together.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": null, "attachment": null, "dimensions": {"width": 0.304, "height": 1.0, "depth": 0.045, "units": "relative", "confidence": 0.95}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodyFinish"}}, "material": "bodyFinish", "materialLayers": ["bodyFinish"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "bodyFinish", "colorMaterialRecipe": {"dominantAlbedo": "rgba(90, 92, 85, 1.0)", "secondaryAlbedo": "rgba(67, 68, 63, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.95, "evidenceRefs": ["front", "back", "three-quarter"], "notes": "Dark pewter/gunmetal green-grey. Flake is a SEPARATE high-frequency normal+roughness band, not baked into albedo. Clearcoat over flake gives the satin sheen. Flake resolves individually at full reference resolution - do not approximate with flat albedo."}};
  node_root_0.userData.actionProfile = {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodyFinish"}};
  (nodes["root"] ?? root).add(node_root_0);
  nodes["root"] = node_root_0;
  const mesh_root_0Geometry = endpoint_root_0
    ? new THREE.CylinderGeometry(endpoint_root_0.endRadius, endpoint_root_0.baseRadius, endpoint_root_0.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_root_0 = new THREE.Mesh(
    mesh_root_0Geometry,
    materialMap["bodyFinish"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_root_0.name = "Renegade by HMI Superstrat";
  if (endpoint_root_0) {
    mesh_root_0.position.copy(endpoint_root_0.midpoint);
    mesh_root_0.quaternion.copy(endpoint_root_0.quaternion);
  }
  mesh_root_0.castShadow = options.castShadow ?? true;
  mesh_root_0.receiveShadow = options.receiveShadow ?? true;
  mesh_root_0.userData.sculptComponent = {"id": "root", "name": "Renegade by HMI Superstrat", "level": "macro", "role": "assembly", "importance": 1.0, "confidence": 0.95, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Root container; three macro units bolt together.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": null, "attachment": null, "dimensions": {"width": 0.304, "height": 1.0, "depth": 0.045, "units": "relative", "confidence": 0.95}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodyFinish"}}, "material": "bodyFinish", "materialLayers": ["bodyFinish"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "bodyFinish", "colorMaterialRecipe": {"dominantAlbedo": "rgba(90, 92, 85, 1.0)", "secondaryAlbedo": "rgba(67, 68, 63, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.95, "evidenceRefs": ["front", "back", "three-quarter"], "notes": "Dark pewter/gunmetal green-grey. Flake is a SEPARATE high-frequency normal+roughness band, not baked into albedo. Clearcoat over flake gives the satin sheen. Flake resolves individually at full reference resolution - do not approximate with flat albedo."}};
  node_root_0.add(mesh_root_0);
  meshes["root"] = mesh_root_0;
  colliders["root"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_root_0);

  const attachment_body_1 = null;
  const endpoint_body_1 = makeAttachmentEndpoint(attachment_body_1);
  const node_body_1 = new THREE.Group();
  node_body_1.name = "Solid body__pivot";
  if (endpoint_body_1) {
    node_body_1.position.copy(endpoint_body_1.start);
    node_body_1.rotation.set(0, 0, 0);
    node_body_1.scale.set(1, 1, 1);
  } else {
    node_body_1.position.set(0.0, -0.283, -0.0225);
    node_body_1.rotation.set(0.0, 0.0, 0.0);
    node_body_1.scale.set(1.0, 1.0, 1.0);
  }
  node_body_1.userData.sculptComponent = {"id": "body", "name": "Solid body", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.93, "primitive": "extrude", "topologyClass": "continuous-sculpt", "topologyRationale": "NOT a box: an offset double-cutaway outline extruded then contoured on both faces. Silhouette is a closed 2D Shape (bezier), so it must be Shape+ExtrudeGeometry with a bevel, never a scaled primitive.", "geometryDescriptor": {"topologyIntent": "reference-traced closed outline, extruded with a perimeter bevel", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "profile2D": {"points": [[-0.12022, 0.217], [-0.0977, 0.217], [-0.0954, 0.18942], [-0.08574, 0.16137], [-0.06735, 0.1416], [-0.04896, 0.13379], [-0.03471, 0.137], [-0.02735, 0.1462], [-0.02506, 0.217], [0.02781, 0.217], [0.02827, 0.10896], [0.03701, 0.09701], [0.0462, 0.09241], [0.05494, 0.09149], [0.06735, 0.09379], [0.08528, 0.1062], [0.09586, 0.12413], [0.10551, 0.16413], [0.11057, 0.16643], [0.11701, 0.16551], [0.1239, 0.15769], [0.13034, 0.13838], [0.12988, 0.1085], [0.12666, 0.09287], [0.10597, 0.04138], [0.10367, 0.02391], [0.10827, 0.0069], [0.12528, -0.02896], [0.14137, -0.07034], [0.14919, -0.10298], [0.15011, -0.12781], [0.14919, -0.14252], [0.14321, -0.15539], [0.14459, -0.15861], [0.14275, -0.16321], [0.12666, -0.18022], [0.10505, -0.19539], [0.06735, -0.20643], [-0.00069, -0.20872], [0.00253, -0.21516], [-0.00667, -0.217], [-0.0108, -0.21516], [-0.01034, -0.21194], [-0.00713, -0.20964], [-0.00897, -0.20872], [-0.06184, -0.20735], [-0.09494, -0.19815], [-0.11333, -0.18804], [-0.12344, -0.17976], [-0.14091, -0.15723], [-0.15011, -0.13057], [-0.14919, -0.09885], [-0.1331, -0.04551], [-0.10781, 0.01517], [-0.10275, 0.03954], [-0.10551, 0.06758], [-0.1239, 0.12045], [-0.13126, 0.15585], [-0.12988, 0.19263], [-0.12666, 0.20505], [-0.12022, 0.217]], "depth": 0.045}}, "parent": "root", "attachment": null, "dimensions": {"width": 0.3002, "height": 0.434, "depth": 0.045, "units": "relative", "confidence": 0.93}, "transform": {"position": [0, -0.283, -0.0225], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodyFinish"}}, "material": "bodyFinish", "materialLayers": ["bodyFinish"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "hornProfile", "kind": "contour", "description": "Bass horn longer/more pointed than treble horn; offset cutaways.", "method": "bezier outline control points traced from front view", "confidence": 0.93}, {"id": "edgeBevel", "kind": "edge-treatment", "description": "Continuous rounded perimeter bevel catching a bright rim highlight.", "method": "ExtrudeGeometry bevelEnabled, bevelSize~0.004, bevelSegments 4", "confidence": 0.88}, {"id": "forearmContour", "kind": "contour", "description": "Forearm bevel, front upper treble bout.", "method": "vertex displacement / boolean-free sculpt on front face", "confidence": 0.8}, {"id": "bellyContour", "kind": "contour", "description": "Deep smooth belly scoop, back treble side.", "method": "vertex displacement on rear face, radial falloff", "confidence": 0.87}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "bodyFinish", "colorMaterialRecipe": {"dominantAlbedo": "rgba(90, 92, 85, 1.0)", "secondaryAlbedo": "rgba(67, 68, 63, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.93, "evidenceRefs": ["front", "back", "three-quarter"], "notes": "Dark pewter/gunmetal green-grey. Flake is a SEPARATE high-frequency normal+roughness band, not baked into albedo. Clearcoat over flake gives the satin sheen. Flake resolves individually at full reference resolution - do not approximate with flat albedo."}};
  node_body_1.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodyFinish"}};
  (nodes["root"] ?? root).add(node_body_1);
  nodes["body"] = node_body_1;
  const mesh_body_1Geometry = endpoint_body_1
    ? new THREE.CylinderGeometry(endpoint_body_1.endRadius, endpoint_body_1.baseRadius, endpoint_body_1.length, 32, 12)
    : buildExtrudeGeometry({"points": [[-0.12022, 0.217], [-0.0977, 0.217], [-0.0954, 0.18942], [-0.08574, 0.16137], [-0.06735, 0.1416], [-0.04896, 0.13379], [-0.03471, 0.137], [-0.02735, 0.1462], [-0.02506, 0.217], [0.02781, 0.217], [0.02827, 0.10896], [0.03701, 0.09701], [0.0462, 0.09241], [0.05494, 0.09149], [0.06735, 0.09379], [0.08528, 0.1062], [0.09586, 0.12413], [0.10551, 0.16413], [0.11057, 0.16643], [0.11701, 0.16551], [0.1239, 0.15769], [0.13034, 0.13838], [0.12988, 0.1085], [0.12666, 0.09287], [0.10597, 0.04138], [0.10367, 0.02391], [0.10827, 0.0069], [0.12528, -0.02896], [0.14137, -0.07034], [0.14919, -0.10298], [0.15011, -0.12781], [0.14919, -0.14252], [0.14321, -0.15539], [0.14459, -0.15861], [0.14275, -0.16321], [0.12666, -0.18022], [0.10505, -0.19539], [0.06735, -0.20643], [-0.00069, -0.20872], [0.00253, -0.21516], [-0.00667, -0.217], [-0.0108, -0.21516], [-0.01034, -0.21194], [-0.00713, -0.20964], [-0.00897, -0.20872], [-0.06184, -0.20735], [-0.09494, -0.19815], [-0.11333, -0.18804], [-0.12344, -0.17976], [-0.14091, -0.15723], [-0.15011, -0.13057], [-0.14919, -0.09885], [-0.1331, -0.04551], [-0.10781, 0.01517], [-0.10275, 0.03954], [-0.10551, 0.06758], [-0.1239, 0.12045], [-0.13126, 0.15585], [-0.12988, 0.19263], [-0.12666, 0.20505], [-0.12022, 0.217]], "depth": 0.045});
  const mesh_body_1 = new THREE.Mesh(
    mesh_body_1Geometry,
    materialMap["bodyFinish"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_body_1.name = "Solid body";
  if (endpoint_body_1) {
    mesh_body_1.position.copy(endpoint_body_1.midpoint);
    mesh_body_1.quaternion.copy(endpoint_body_1.quaternion);
  }
  mesh_body_1.castShadow = options.castShadow ?? true;
  mesh_body_1.receiveShadow = options.receiveShadow ?? true;
  mesh_body_1.userData.sculptComponent = {"id": "body", "name": "Solid body", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.93, "primitive": "extrude", "topologyClass": "continuous-sculpt", "topologyRationale": "NOT a box: an offset double-cutaway outline extruded then contoured on both faces. Silhouette is a closed 2D Shape (bezier), so it must be Shape+ExtrudeGeometry with a bevel, never a scaled primitive.", "geometryDescriptor": {"topologyIntent": "reference-traced closed outline, extruded with a perimeter bevel", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "profile2D": {"points": [[-0.12022, 0.217], [-0.0977, 0.217], [-0.0954, 0.18942], [-0.08574, 0.16137], [-0.06735, 0.1416], [-0.04896, 0.13379], [-0.03471, 0.137], [-0.02735, 0.1462], [-0.02506, 0.217], [0.02781, 0.217], [0.02827, 0.10896], [0.03701, 0.09701], [0.0462, 0.09241], [0.05494, 0.09149], [0.06735, 0.09379], [0.08528, 0.1062], [0.09586, 0.12413], [0.10551, 0.16413], [0.11057, 0.16643], [0.11701, 0.16551], [0.1239, 0.15769], [0.13034, 0.13838], [0.12988, 0.1085], [0.12666, 0.09287], [0.10597, 0.04138], [0.10367, 0.02391], [0.10827, 0.0069], [0.12528, -0.02896], [0.14137, -0.07034], [0.14919, -0.10298], [0.15011, -0.12781], [0.14919, -0.14252], [0.14321, -0.15539], [0.14459, -0.15861], [0.14275, -0.16321], [0.12666, -0.18022], [0.10505, -0.19539], [0.06735, -0.20643], [-0.00069, -0.20872], [0.00253, -0.21516], [-0.00667, -0.217], [-0.0108, -0.21516], [-0.01034, -0.21194], [-0.00713, -0.20964], [-0.00897, -0.20872], [-0.06184, -0.20735], [-0.09494, -0.19815], [-0.11333, -0.18804], [-0.12344, -0.17976], [-0.14091, -0.15723], [-0.15011, -0.13057], [-0.14919, -0.09885], [-0.1331, -0.04551], [-0.10781, 0.01517], [-0.10275, 0.03954], [-0.10551, 0.06758], [-0.1239, 0.12045], [-0.13126, 0.15585], [-0.12988, 0.19263], [-0.12666, 0.20505], [-0.12022, 0.217]], "depth": 0.045}}, "parent": "root", "attachment": null, "dimensions": {"width": 0.3002, "height": 0.434, "depth": 0.045, "units": "relative", "confidence": 0.93}, "transform": {"position": [0, -0.283, -0.0225], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "bodyFinish"}}, "material": "bodyFinish", "materialLayers": ["bodyFinish"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "hornProfile", "kind": "contour", "description": "Bass horn longer/more pointed than treble horn; offset cutaways.", "method": "bezier outline control points traced from front view", "confidence": 0.93}, {"id": "edgeBevel", "kind": "edge-treatment", "description": "Continuous rounded perimeter bevel catching a bright rim highlight.", "method": "ExtrudeGeometry bevelEnabled, bevelSize~0.004, bevelSegments 4", "confidence": 0.88}, {"id": "forearmContour", "kind": "contour", "description": "Forearm bevel, front upper treble bout.", "method": "vertex displacement / boolean-free sculpt on front face", "confidence": 0.8}, {"id": "bellyContour", "kind": "contour", "description": "Deep smooth belly scoop, back treble side.", "method": "vertex displacement on rear face, radial falloff", "confidence": 0.87}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "bodyFinish", "colorMaterialRecipe": {"dominantAlbedo": "rgba(90, 92, 85, 1.0)", "secondaryAlbedo": "rgba(67, 68, 63, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.93, "evidenceRefs": ["front", "back", "three-quarter"], "notes": "Dark pewter/gunmetal green-grey. Flake is a SEPARATE high-frequency normal+roughness band, not baked into albedo. Clearcoat over flake gives the satin sheen. Flake resolves individually at full reference resolution - do not approximate with flat albedo."}};
  node_body_1.add(mesh_body_1);
  meshes["body"] = mesh_body_1;
  colliders["body"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_body_1);

  const attachment_neck_2 = null;
  const endpoint_neck_2 = makeAttachmentEndpoint(attachment_neck_2);
  const node_neck_2 = new THREE.Group();
  node_neck_2.name = "Bolt-on neck__pivot";
  if (endpoint_neck_2) {
    node_neck_2.position.copy(endpoint_neck_2.start);
    node_neck_2.rotation.set(0, 0, 0);
    node_neck_2.scale.set(1, 1, 1);
  } else {
    node_neck_2.position.set(0.0, 0.108, -0.004);
    node_neck_2.rotation.set(0.0, 0.0, 0.0);
    node_neck_2.scale.set(0.055, 0.392, 0.022);
  }
  node_neck_2.userData.sculptComponent = {"id": "neck", "name": "Bolt-on neck", "level": "macro", "role": "neck", "importance": 0.95, "confidence": 0.72, "primitive": "box", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous tapered shaft with a rounded (C-profile) rear; a box would read flat. Rear profile is INFERRED - no side view.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 0.055, "height": 0.392, "depth": 0.022, "units": "relative", "confidence": 0.72}, "transform": {"position": [0, 0.108, -0.004], "rotation": [0, 0, 0], "scale": [0.055, 0.392, 0.022]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "mapleSatin"}}, "material": "mapleSatin", "materialLayers": ["mapleSatin"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "neckTaper", "kind": "contour", "description": "Width tapers nut->heel; rear is a rounded C.", "method": "lathe/loft between nut and heel cross-sections", "confidence": 0.72}, {"id": "heel", "kind": "joint", "description": "Contoured heel entering the neck pocket.", "method": "boolean-free overlap into body pocket", "confidence": 0.78}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "mapleSatin", "colorMaterialRecipe": {"dominantAlbedo": "rgba(217, 190, 142, 1.0)", "secondaryAlbedo": "rgba(232, 210, 170, 1.0)", "materialClass": "wood", "materialClassConfidence": 0.72, "evidenceRefs": ["front", "back", "three-quarter"], "notes": "Neck rear + headstock rear. Sharply lighter than both board and body - a common failure is carrying the body finish onto the neck."}};
  node_neck_2.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "mapleSatin"}};
  (nodes["root"] ?? root).add(node_neck_2);
  nodes["neck"] = node_neck_2;
  const mesh_neck_2Geometry = endpoint_neck_2
    ? new THREE.CylinderGeometry(endpoint_neck_2.endRadius, endpoint_neck_2.baseRadius, endpoint_neck_2.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_neck_2 = new THREE.Mesh(
    mesh_neck_2Geometry,
    materialMap["mapleSatin"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_neck_2.name = "Bolt-on neck";
  if (endpoint_neck_2) {
    mesh_neck_2.position.copy(endpoint_neck_2.midpoint);
    mesh_neck_2.quaternion.copy(endpoint_neck_2.quaternion);
  }
  mesh_neck_2.castShadow = options.castShadow ?? true;
  mesh_neck_2.receiveShadow = options.receiveShadow ?? true;
  mesh_neck_2.userData.sculptComponent = {"id": "neck", "name": "Bolt-on neck", "level": "macro", "role": "neck", "importance": 0.95, "confidence": 0.72, "primitive": "box", "topologyClass": "continuous-sculpt", "topologyRationale": "Continuous tapered shaft with a rounded (C-profile) rear; a box would read flat. Rear profile is INFERRED - no side view.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 0.055, "height": 0.392, "depth": 0.022, "units": "relative", "confidence": 0.72}, "transform": {"position": [0, 0.108, -0.004], "rotation": [0, 0, 0], "scale": [0.055, 0.392, 0.022]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "mapleSatin"}}, "material": "mapleSatin", "materialLayers": ["mapleSatin"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "neckTaper", "kind": "contour", "description": "Width tapers nut->heel; rear is a rounded C.", "method": "lathe/loft between nut and heel cross-sections", "confidence": 0.72}, {"id": "heel", "kind": "joint", "description": "Contoured heel entering the neck pocket.", "method": "boolean-free overlap into body pocket", "confidence": 0.78}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "mapleSatin", "colorMaterialRecipe": {"dominantAlbedo": "rgba(217, 190, 142, 1.0)", "secondaryAlbedo": "rgba(232, 210, 170, 1.0)", "materialClass": "wood", "materialClassConfidence": 0.72, "evidenceRefs": ["front", "back", "three-quarter"], "notes": "Neck rear + headstock rear. Sharply lighter than both board and body - a common failure is carrying the body finish onto the neck."}};
  node_neck_2.add(mesh_neck_2);
  meshes["neck"] = mesh_neck_2;
  colliders["neck"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_neck_2);

  const attachment_headstock_3 = null;
  const endpoint_headstock_3 = makeAttachmentEndpoint(attachment_headstock_3);
  const node_headstock_3 = new THREE.Group();
  node_headstock_3.name = "Headstock__pivot";
  if (endpoint_headstock_3) {
    node_headstock_3.position.copy(endpoint_headstock_3.start);
    node_headstock_3.rotation.set(0, 0, 0);
    node_headstock_3.scale.set(1, 1, 1);
  } else {
    node_headstock_3.position.set(0.0, 0.391, 0.004);
    node_headstock_3.rotation.set(-0.22, 0.0, 0.0);
    node_headstock_3.scale.set(1.0, 1.0, 1.0);
  }
  node_headstock_3.userData.sculptComponent = {"id": "headstock", "name": "Headstock", "level": "macro", "role": "headstock", "importance": 0.9, "confidence": 0.9, "primitive": "extrude", "topologyClass": "assembled-solid", "topologyRationale": "Pointed six-in-line plate, extruded from a traced 2D outline; angled back off the neck plane.", "geometryDescriptor": {"topologyIntent": "reference-traced closed outline, extruded with a perimeter bevel", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "profile2D": {"points": [[-0.0238, 0.087], [-0.01058, 0.08488], [0.00106, 0.07907], [0.01058, 0.06955], [0.02063, 0.04839], [0.0238, 0.04945], [0.02644, 0.05738], [0.0275, 0.04416], [0.02539, 0.04522], [0.02274, 0.0431], [0.0275, 0.02935], [0.0275, -0.00978], [0.02591, -0.01084], [0.0275, -0.01084], [0.0275, -0.087], [0.01375, -0.087], [0.01322, -0.07854], [0.01269, -0.087], [-0.0275, -0.087], [-0.02063, -0.01878], [-0.02063, 0.03834], [-0.02486, 0.08277], [-0.0238, 0.087]], "depth": 0.014}}, "parent": "root", "attachment": null, "dimensions": {"width": 0.055, "height": 0.174, "depth": 0.014, "units": "relative", "confidence": 0.9}, "transform": {"position": [0, 0.391, 0.004], "rotation": [-0.22, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "mapleSatin"}}, "material": "mapleSatin", "materialLayers": ["mapleSatin"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "pointProfile", "kind": "contour", "description": "Sharp asymmetric point with concave lower sweep.", "method": "traced bezier outline, extruded", "confidence": 0.92}, {"id": "headstockAngle", "kind": "contour", "description": "Backward break angle off the neck plane. INFERRED - unseen in all 3 views.", "method": "assumed 13deg", "confidence": 0.45}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back"], "details": [], "fidelityTier": "blockout", "materialId": "mapleSatin", "colorMaterialRecipe": {"dominantAlbedo": "rgba(217, 190, 142, 1.0)", "secondaryAlbedo": "rgba(232, 210, 170, 1.0)", "materialClass": "wood", "materialClassConfidence": 0.9, "evidenceRefs": ["front", "back"], "notes": "Neck rear + headstock rear. Sharply lighter than both board and body - a common failure is carrying the body finish onto the neck."}};
  node_headstock_3.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "mapleSatin"}};
  (nodes["root"] ?? root).add(node_headstock_3);
  nodes["headstock"] = node_headstock_3;
  const mesh_headstock_3Geometry = endpoint_headstock_3
    ? new THREE.CylinderGeometry(endpoint_headstock_3.endRadius, endpoint_headstock_3.baseRadius, endpoint_headstock_3.length, 32, 12)
    : buildExtrudeGeometry({"points": [[-0.0238, 0.087], [-0.01058, 0.08488], [0.00106, 0.07907], [0.01058, 0.06955], [0.02063, 0.04839], [0.0238, 0.04945], [0.02644, 0.05738], [0.0275, 0.04416], [0.02539, 0.04522], [0.02274, 0.0431], [0.0275, 0.02935], [0.0275, -0.00978], [0.02591, -0.01084], [0.0275, -0.01084], [0.0275, -0.087], [0.01375, -0.087], [0.01322, -0.07854], [0.01269, -0.087], [-0.0275, -0.087], [-0.02063, -0.01878], [-0.02063, 0.03834], [-0.02486, 0.08277], [-0.0238, 0.087]], "depth": 0.014});
  const mesh_headstock_3 = new THREE.Mesh(
    mesh_headstock_3Geometry,
    materialMap["mapleSatin"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_headstock_3.name = "Headstock";
  if (endpoint_headstock_3) {
    mesh_headstock_3.position.copy(endpoint_headstock_3.midpoint);
    mesh_headstock_3.quaternion.copy(endpoint_headstock_3.quaternion);
  }
  mesh_headstock_3.castShadow = options.castShadow ?? true;
  mesh_headstock_3.receiveShadow = options.receiveShadow ?? true;
  mesh_headstock_3.userData.sculptComponent = {"id": "headstock", "name": "Headstock", "level": "macro", "role": "headstock", "importance": 0.9, "confidence": 0.9, "primitive": "extrude", "topologyClass": "assembled-solid", "topologyRationale": "Pointed six-in-line plate, extruded from a traced 2D outline; angled back off the neck plane.", "geometryDescriptor": {"topologyIntent": "reference-traced closed outline, extruded with a perimeter bevel", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "profile2D": {"points": [[-0.0238, 0.087], [-0.01058, 0.08488], [0.00106, 0.07907], [0.01058, 0.06955], [0.02063, 0.04839], [0.0238, 0.04945], [0.02644, 0.05738], [0.0275, 0.04416], [0.02539, 0.04522], [0.02274, 0.0431], [0.0275, 0.02935], [0.0275, -0.00978], [0.02591, -0.01084], [0.0275, -0.01084], [0.0275, -0.087], [0.01375, -0.087], [0.01322, -0.07854], [0.01269, -0.087], [-0.0275, -0.087], [-0.02063, -0.01878], [-0.02063, 0.03834], [-0.02486, 0.08277], [-0.0238, 0.087]], "depth": 0.014}}, "parent": "root", "attachment": null, "dimensions": {"width": 0.055, "height": 0.174, "depth": 0.014, "units": "relative", "confidence": 0.9}, "transform": {"position": [0, 0.391, 0.004], "rotation": [-0.22, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "mapleSatin"}}, "material": "mapleSatin", "materialLayers": ["mapleSatin"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "pointProfile", "kind": "contour", "description": "Sharp asymmetric point with concave lower sweep.", "method": "traced bezier outline, extruded", "confidence": 0.92}, {"id": "headstockAngle", "kind": "contour", "description": "Backward break angle off the neck plane. INFERRED - unseen in all 3 views.", "method": "assumed 13deg", "confidence": 0.45}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back"], "details": [], "fidelityTier": "blockout", "materialId": "mapleSatin", "colorMaterialRecipe": {"dominantAlbedo": "rgba(217, 190, 142, 1.0)", "secondaryAlbedo": "rgba(232, 210, 170, 1.0)", "materialClass": "wood", "materialClassConfidence": 0.9, "evidenceRefs": ["front", "back"], "notes": "Neck rear + headstock rear. Sharply lighter than both board and body - a common failure is carrying the body finish onto the neck."}};
  node_headstock_3.add(mesh_headstock_3);
  meshes["headstock"] = mesh_headstock_3;
  colliders["headstock"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_headstock_3);

  const attachment_fretboard_4 = null;
  const endpoint_fretboard_4 = makeAttachmentEndpoint(attachment_fretboard_4);
  const node_fretboard_4 = new THREE.Group();
  node_fretboard_4.name = "Fretboard__pivot";
  if (endpoint_fretboard_4) {
    node_fretboard_4.position.copy(endpoint_fretboard_4.start);
    node_fretboard_4.rotation.set(0, 0, 0);
    node_fretboard_4.scale.set(1, 1, 1);
  } else {
    node_fretboard_4.position.set(0.0, 0.108, 0.007);
    node_fretboard_4.rotation.set(0.0, 0.0, 0.0);
    node_fretboard_4.scale.set(1.0, 1.0, 1.0);
  }
  node_fretboard_4.userData.sculptComponent = {"id": "fretboard", "name": "Fretboard", "level": "meso", "role": "fretboard", "importance": 0.9, "confidence": 0.9, "primitive": "extrude", "topologyClass": "continuous-sculpt", "topologyRationale": "Thin cambered slab laminated to the neck face; camber is a cylindrical arc, not flat.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "profile2D": {"points": [[-0.0275, -0.196], [0.0275, -0.196], [0.0275, 0.196], [-0.0275, 0.196]], "depth": 0.011}}, "parent": "root", "attachment": null, "dimensions": {"width": 0.055, "height": 0.392, "depth": 0.011, "units": "relative", "confidence": 0.9}, "transform": {"position": [0, 0.108, 0.007], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "rosewood"}}, "material": "rosewood", "materialLayers": ["rosewood"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "camber", "kind": "contour", "description": "Compound/cylindrical radius across the board.", "method": "arc-swept plane", "confidence": 0.7}, {"id": "binding", "kind": "edge-treatment", "description": "Cream binding both edges, capping fret ends.", "method": "thin side strips, creamBinding material", "confidence": 0.85}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back"], "details": [], "fidelityTier": "blockout", "materialId": "rosewood", "colorMaterialRecipe": {"dominantAlbedo": "rgba(74, 51, 39, 1.0)", "secondaryAlbedo": "rgba(94, 66, 52, 1.0)", "materialClass": "wood", "materialClassConfidence": 0.9, "evidenceRefs": ["front", "back"], "notes": "Open-pore grain; anisotropic length-wise streak. Grain direction runs along the neck."}};
  node_fretboard_4.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "rosewood"}};
  (nodes["root"] ?? root).add(node_fretboard_4);
  nodes["fretboard"] = node_fretboard_4;
  const mesh_fretboard_4Geometry = endpoint_fretboard_4
    ? new THREE.CylinderGeometry(endpoint_fretboard_4.endRadius, endpoint_fretboard_4.baseRadius, endpoint_fretboard_4.length, 32, 12)
    : buildExtrudeGeometry({"points": [[-0.0275, -0.196], [0.0275, -0.196], [0.0275, 0.196], [-0.0275, 0.196]], "depth": 0.011});
  const mesh_fretboard_4 = new THREE.Mesh(
    mesh_fretboard_4Geometry,
    materialMap["rosewood"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_fretboard_4.name = "Fretboard";
  if (endpoint_fretboard_4) {
    mesh_fretboard_4.position.copy(endpoint_fretboard_4.midpoint);
    mesh_fretboard_4.quaternion.copy(endpoint_fretboard_4.quaternion);
  }
  mesh_fretboard_4.castShadow = options.castShadow ?? true;
  mesh_fretboard_4.receiveShadow = options.receiveShadow ?? true;
  mesh_fretboard_4.userData.sculptComponent = {"id": "fretboard", "name": "Fretboard", "level": "meso", "role": "fretboard", "importance": 0.9, "confidence": 0.9, "primitive": "extrude", "topologyClass": "continuous-sculpt", "topologyRationale": "Thin cambered slab laminated to the neck face; camber is a cylindrical arc, not flat.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "profile2D": {"points": [[-0.0275, -0.196], [0.0275, -0.196], [0.0275, 0.196], [-0.0275, 0.196]], "depth": 0.011}}, "parent": "root", "attachment": null, "dimensions": {"width": 0.055, "height": 0.392, "depth": 0.011, "units": "relative", "confidence": 0.9}, "transform": {"position": [0, 0.108, 0.007], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "rosewood"}}, "material": "rosewood", "materialLayers": ["rosewood"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "camber", "kind": "contour", "description": "Compound/cylindrical radius across the board.", "method": "arc-swept plane", "confidence": 0.7}, {"id": "binding", "kind": "edge-treatment", "description": "Cream binding both edges, capping fret ends.", "method": "thin side strips, creamBinding material", "confidence": 0.85}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back"], "details": [], "fidelityTier": "blockout", "materialId": "rosewood", "colorMaterialRecipe": {"dominantAlbedo": "rgba(74, 51, 39, 1.0)", "secondaryAlbedo": "rgba(94, 66, 52, 1.0)", "materialClass": "wood", "materialClassConfidence": 0.9, "evidenceRefs": ["front", "back"], "notes": "Open-pore grain; anisotropic length-wise streak. Grain direction runs along the neck."}};
  node_fretboard_4.add(mesh_fretboard_4);
  meshes["fretboard"] = mesh_fretboard_4;
  colliders["fretboard"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_fretboard_4);

  const attachment_neckPlate_5 = null;
  const endpoint_neckPlate_5 = makeAttachmentEndpoint(attachment_neckPlate_5);
  const node_neckPlate_5 = new THREE.Group();
  node_neckPlate_5.name = "4-bolt neck plate__pivot";
  if (endpoint_neckPlate_5) {
    node_neckPlate_5.position.copy(endpoint_neckPlate_5.start);
    node_neckPlate_5.rotation.set(0, 0, 0);
    node_neckPlate_5.scale.set(1, 1, 1);
  } else {
    node_neckPlate_5.position.set(0.0, 0.193, -0.0015);
    node_neckPlate_5.rotation.set(0.0, 0.0, 0.0);
    node_neckPlate_5.scale.set(0.058, 0.058, 0.002);
  }
  node_neckPlate_5.userData.sculptComponent = {"id": "neckPlate", "name": "4-bolt neck plate", "level": "meso", "role": "hardware", "importance": 0.75, "confidence": 0.93, "primitive": "box", "topologyClass": "surface-relief", "topologyRationale": "Flat chrome plate with rounded corners on the body back.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.058, "height": 0.058, "depth": 0.002, "units": "relative", "confidence": 0.93}, "transform": {"position": [0, 0.193, -0.0015], "rotation": [0, 0, 0], "scale": [0.058, 0.058, 0.002]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "engraving", "kind": "painted-linework", "description": "HMI script + serial H25000001 engraved.", "method": "albedo/roughness decal", "confidence": 0.9}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["back"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.93, "evidenceRefs": ["back"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_neckPlate_5.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}};
  (nodes["body"] ?? root).add(node_neckPlate_5);
  nodes["neckPlate"] = node_neckPlate_5;
  const mesh_neckPlate_5Geometry = endpoint_neckPlate_5
    ? new THREE.CylinderGeometry(endpoint_neckPlate_5.endRadius, endpoint_neckPlate_5.baseRadius, endpoint_neckPlate_5.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_neckPlate_5 = new THREE.Mesh(
    mesh_neckPlate_5Geometry,
    materialMap["chrome"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_neckPlate_5.name = "4-bolt neck plate";
  if (endpoint_neckPlate_5) {
    mesh_neckPlate_5.position.copy(endpoint_neckPlate_5.midpoint);
    mesh_neckPlate_5.quaternion.copy(endpoint_neckPlate_5.quaternion);
  }
  mesh_neckPlate_5.castShadow = options.castShadow ?? true;
  mesh_neckPlate_5.receiveShadow = options.receiveShadow ?? true;
  mesh_neckPlate_5.userData.sculptComponent = {"id": "neckPlate", "name": "4-bolt neck plate", "level": "meso", "role": "hardware", "importance": 0.75, "confidence": 0.93, "primitive": "box", "topologyClass": "surface-relief", "topologyRationale": "Flat chrome plate with rounded corners on the body back.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.058, "height": 0.058, "depth": 0.002, "units": "relative", "confidence": 0.93}, "transform": {"position": [0, 0.193, -0.0015], "rotation": [0, 0, 0], "scale": [0.058, 0.058, 0.002]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "engraving", "kind": "painted-linework", "description": "HMI script + serial H25000001 engraved.", "method": "albedo/roughness decal", "confidence": 0.9}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["back"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.93, "evidenceRefs": ["back"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_neckPlate_5.add(mesh_neckPlate_5);
  meshes["neckPlate"] = mesh_neckPlate_5;
  colliders["neckPlate"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_neckPlate_5);

  const attachment_cavityCover_6 = null;
  const endpoint_cavityCover_6 = makeAttachmentEndpoint(attachment_cavityCover_6);
  const node_cavityCover_6 = new THREE.Group();
  node_cavityCover_6.name = "Control cavity cover__pivot";
  if (endpoint_cavityCover_6) {
    node_cavityCover_6.position.copy(endpoint_cavityCover_6.start);
    node_cavityCover_6.rotation.set(0, 0, 0);
    node_cavityCover_6.scale.set(1, 1, 1);
  } else {
    node_cavityCover_6.position.set(-0.055, -0.057, -0.0005);
    node_cavityCover_6.rotation.set(0.0, 0.0, 0.0);
    node_cavityCover_6.scale.set(1.0, 1.0, 1.0);
  }
  node_cavityCover_6.userData.sculptComponent = {"id": "cavityCover", "name": "Control cavity cover", "level": "meso", "role": "panel", "importance": 0.7, "confidence": 0.9, "primitive": "extrude", "topologyClass": "surface-relief", "topologyRationale": "Black rounded-teardrop cover, recessed into the body back with a visible seam.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "profile2D": {"points": [[-0.0425, -0.0675], [0.0425, -0.0675], [0.0425, 0.0675], [-0.0425, 0.0675]], "depth": 0.002}}, "parent": "body", "attachment": null, "dimensions": {"width": 0.085, "height": 0.135, "depth": 0.002, "units": "relative", "confidence": 0.9}, "transform": {"position": [-0.055, -0.057, -0.0005], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}}, "material": "blackPlastic", "materialLayers": ["blackPlastic"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "recessSeam", "kind": "seam", "description": "Cover sits in a routed recess; seam reads as a dark line.", "method": "inset geometry + AO", "confidence": 0.85}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["back"], "details": [], "fidelityTier": "blockout", "materialId": "blackPlastic", "colorMaterialRecipe": {"dominantAlbedo": "rgba(20, 20, 20, 1.0)", "secondaryAlbedo": "rgba(36, 36, 36, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.9, "evidenceRefs": ["back"], "notes": "Pickup covers, cavity cover, switch tip. Semi-matte, NOT gloss."}};
  node_cavityCover_6.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}};
  (nodes["body"] ?? root).add(node_cavityCover_6);
  nodes["cavityCover"] = node_cavityCover_6;
  const mesh_cavityCover_6Geometry = endpoint_cavityCover_6
    ? new THREE.CylinderGeometry(endpoint_cavityCover_6.endRadius, endpoint_cavityCover_6.baseRadius, endpoint_cavityCover_6.length, 32, 12)
    : buildExtrudeGeometry({"points": [[-0.0425, -0.0675], [0.0425, -0.0675], [0.0425, 0.0675], [-0.0425, 0.0675]], "depth": 0.002});
  const mesh_cavityCover_6 = new THREE.Mesh(
    mesh_cavityCover_6Geometry,
    materialMap["blackPlastic"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_cavityCover_6.name = "Control cavity cover";
  if (endpoint_cavityCover_6) {
    mesh_cavityCover_6.position.copy(endpoint_cavityCover_6.midpoint);
    mesh_cavityCover_6.quaternion.copy(endpoint_cavityCover_6.quaternion);
  }
  mesh_cavityCover_6.castShadow = options.castShadow ?? true;
  mesh_cavityCover_6.receiveShadow = options.receiveShadow ?? true;
  mesh_cavityCover_6.userData.sculptComponent = {"id": "cavityCover", "name": "Control cavity cover", "level": "meso", "role": "panel", "importance": 0.7, "confidence": 0.9, "primitive": "extrude", "topologyClass": "surface-relief", "topologyRationale": "Black rounded-teardrop cover, recessed into the body back with a visible seam.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "profile2D": {"points": [[-0.0425, -0.0675], [0.0425, -0.0675], [0.0425, 0.0675], [-0.0425, 0.0675]], "depth": 0.002}}, "parent": "body", "attachment": null, "dimensions": {"width": 0.085, "height": 0.135, "depth": 0.002, "units": "relative", "confidence": 0.9}, "transform": {"position": [-0.055, -0.057, -0.0005], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}}, "material": "blackPlastic", "materialLayers": ["blackPlastic"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "recessSeam", "kind": "seam", "description": "Cover sits in a routed recess; seam reads as a dark line.", "method": "inset geometry + AO", "confidence": 0.85}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["back"], "details": [], "fidelityTier": "blockout", "materialId": "blackPlastic", "colorMaterialRecipe": {"dominantAlbedo": "rgba(20, 20, 20, 1.0)", "secondaryAlbedo": "rgba(36, 36, 36, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.9, "evidenceRefs": ["back"], "notes": "Pickup covers, cavity cover, switch tip. Semi-matte, NOT gloss."}};
  node_cavityCover_6.add(mesh_cavityCover_6);
  meshes["cavityCover"] = mesh_cavityCover_6;
  colliders["cavityCover"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_cavityCover_6);

  const attachment_headstockFace_7 = null;
  const endpoint_headstockFace_7 = makeAttachmentEndpoint(attachment_headstockFace_7);
  const node_headstockFace_7 = new THREE.Group();
  node_headstockFace_7.name = "Black headstock face__pivot";
  if (endpoint_headstockFace_7) {
    node_headstockFace_7.position.copy(endpoint_headstockFace_7.start);
    node_headstockFace_7.rotation.set(0, 0, 0);
    node_headstockFace_7.scale.set(1, 1, 1);
  } else {
    node_headstockFace_7.position.set(0.0, 0.0, 0.008);
    node_headstockFace_7.rotation.set(0.0, 0.0, 0.0);
    node_headstockFace_7.scale.set(1.0, 1.0, 1.0);
  }
  node_headstockFace_7.userData.sculptComponent = {"id": "headstockFace", "name": "Black headstock face", "level": "meso", "role": "panel", "importance": 0.85, "confidence": 0.92, "primitive": "extrude", "topologyClass": "surface-relief", "topologyRationale": "Gloss-black faceplate over the maple headstock, inset from the cream binding edge.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "profile2D": {"points": [[-0.035, -0.084], [0.035, -0.084], [0.035, 0.084], [-0.035, 0.084]], "depth": 0.001}}, "parent": "headstock", "attachment": null, "dimensions": {"width": 0.07, "height": 0.168, "depth": 0.001, "units": "relative", "confidence": 0.92}, "transform": {"position": [0, 0, 0.008], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackGloss"}}, "material": "blackGloss", "materialLayers": ["blackGloss"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "logo", "kind": "painted-linework", "description": "'Renegade' script + 'by HMI' + 'HMI SERIES' wordmark.", "method": "canvas-texture decal, albedo only", "confidence": 0.95}, {"id": "binding", "kind": "edge-treatment", "description": "Cream binding visible as a rim around the black face.", "method": "parent maple showing past inset face", "confidence": 0.9}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "blackGloss", "colorMaterialRecipe": {"dominantAlbedo": "rgba(12, 12, 12, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.92, "evidenceRefs": ["front", "three-quarter"], "notes": "Distinctly glossier than the pickup plastic; carries the painted logo."}};
  node_headstockFace_7.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackGloss"}};
  (nodes["headstock"] ?? root).add(node_headstockFace_7);
  nodes["headstockFace"] = node_headstockFace_7;
  const mesh_headstockFace_7Geometry = endpoint_headstockFace_7
    ? new THREE.CylinderGeometry(endpoint_headstockFace_7.endRadius, endpoint_headstockFace_7.baseRadius, endpoint_headstockFace_7.length, 32, 12)
    : buildExtrudeGeometry({"points": [[-0.035, -0.084], [0.035, -0.084], [0.035, 0.084], [-0.035, 0.084]], "depth": 0.001});
  const mesh_headstockFace_7 = new THREE.Mesh(
    mesh_headstockFace_7Geometry,
    materialMap["blackGloss"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_headstockFace_7.name = "Black headstock face";
  if (endpoint_headstockFace_7) {
    mesh_headstockFace_7.position.copy(endpoint_headstockFace_7.midpoint);
    mesh_headstockFace_7.quaternion.copy(endpoint_headstockFace_7.quaternion);
  }
  mesh_headstockFace_7.castShadow = options.castShadow ?? true;
  mesh_headstockFace_7.receiveShadow = options.receiveShadow ?? true;
  mesh_headstockFace_7.userData.sculptComponent = {"id": "headstockFace", "name": "Black headstock face", "level": "meso", "role": "panel", "importance": 0.85, "confidence": 0.92, "primitive": "extrude", "topologyClass": "surface-relief", "topologyRationale": "Gloss-black faceplate over the maple headstock, inset from the cream binding edge.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "profile2D": {"points": [[-0.035, -0.084], [0.035, -0.084], [0.035, 0.084], [-0.035, 0.084]], "depth": 0.001}}, "parent": "headstock", "attachment": null, "dimensions": {"width": 0.07, "height": 0.168, "depth": 0.001, "units": "relative", "confidence": 0.92}, "transform": {"position": [0, 0, 0.008], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackGloss"}}, "material": "blackGloss", "materialLayers": ["blackGloss"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "logo", "kind": "painted-linework", "description": "'Renegade' script + 'by HMI' + 'HMI SERIES' wordmark.", "method": "canvas-texture decal, albedo only", "confidence": 0.95}, {"id": "binding", "kind": "edge-treatment", "description": "Cream binding visible as a rim around the black face.", "method": "parent maple showing past inset face", "confidence": 0.9}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "blackGloss", "colorMaterialRecipe": {"dominantAlbedo": "rgba(12, 12, 12, 1.0)", "secondaryAlbedo": "rgba(26, 26, 26, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.92, "evidenceRefs": ["front", "three-quarter"], "notes": "Distinctly glossier than the pickup plastic; carries the painted logo."}};
  node_headstockFace_7.add(mesh_headstockFace_7);
  meshes["headstockFace"] = mesh_headstockFace_7;
  colliders["headstockFace"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_headstockFace_7);

  const attachment_nut_8 = null;
  const endpoint_nut_8 = makeAttachmentEndpoint(attachment_nut_8);
  const node_nut_8 = new THREE.Group();
  node_nut_8.name = "Nut__pivot";
  if (endpoint_nut_8) {
    node_nut_8.position.copy(endpoint_nut_8.start);
    node_nut_8.rotation.set(0, 0, 0);
    node_nut_8.scale.set(1, 1, 1);
  } else {
    node_nut_8.position.set(0.0, 0.304, 0.013);
    node_nut_8.rotation.set(0.0, 0.0, 0.0);
    node_nut_8.scale.set(0.055, 0.005, 0.014);
  }
  node_nut_8.userData.sculptComponent = {"id": "nut", "name": "Nut", "level": "meso", "role": "hardware", "importance": 0.5, "confidence": 0.8, "primitive": "box", "topologyClass": "surface-relief", "topologyRationale": "Thin nut at the fretboard/headstock junction.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 0.055, "height": 0.005, "depth": 0.014, "units": "relative", "confidence": 0.8}, "transform": {"position": [0, 0.304, 0.013], "rotation": [0, 0, 0], "scale": [0.055, 0.005, 0.014]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "creamBinding"}}, "material": "creamBinding", "materialLayers": ["creamBinding"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back"], "details": [], "fidelityTier": "blockout", "materialId": "creamBinding", "colorMaterialRecipe": {"dominantAlbedo": "rgba(230, 220, 192, 1.0)", "secondaryAlbedo": "rgba(242, 234, 212, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.8, "evidenceRefs": ["front", "back"], "notes": "Fretboard edges, headstock rim, nut."}};
  node_nut_8.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "creamBinding"}};
  (nodes["root"] ?? root).add(node_nut_8);
  nodes["nut"] = node_nut_8;
  const mesh_nut_8Geometry = endpoint_nut_8
    ? new THREE.CylinderGeometry(endpoint_nut_8.endRadius, endpoint_nut_8.baseRadius, endpoint_nut_8.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_nut_8 = new THREE.Mesh(
    mesh_nut_8Geometry,
    materialMap["creamBinding"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_nut_8.name = "Nut";
  if (endpoint_nut_8) {
    mesh_nut_8.position.copy(endpoint_nut_8.midpoint);
    mesh_nut_8.quaternion.copy(endpoint_nut_8.quaternion);
  }
  mesh_nut_8.castShadow = options.castShadow ?? true;
  mesh_nut_8.receiveShadow = options.receiveShadow ?? true;
  mesh_nut_8.userData.sculptComponent = {"id": "nut", "name": "Nut", "level": "meso", "role": "hardware", "importance": 0.5, "confidence": 0.8, "primitive": "box", "topologyClass": "surface-relief", "topologyRationale": "Thin nut at the fretboard/headstock junction.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 0.055, "height": 0.005, "depth": 0.014, "units": "relative", "confidence": 0.8}, "transform": {"position": [0, 0.304, 0.013], "rotation": [0, 0, 0], "scale": [0.055, 0.005, 0.014]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "creamBinding"}}, "material": "creamBinding", "materialLayers": ["creamBinding"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "back"], "details": [], "fidelityTier": "blockout", "materialId": "creamBinding", "colorMaterialRecipe": {"dominantAlbedo": "rgba(230, 220, 192, 1.0)", "secondaryAlbedo": "rgba(242, 234, 212, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.8, "evidenceRefs": ["front", "back"], "notes": "Fretboard edges, headstock rim, nut."}};
  node_nut_8.add(mesh_nut_8);
  meshes["nut"] = mesh_nut_8;
  colliders["nut"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_nut_8);

  const attachment_pickupNeck_9 = null;
  const endpoint_pickupNeck_9 = makeAttachmentEndpoint(attachment_pickupNeck_9);
  const node_pickupNeck_9 = new THREE.Group();
  node_pickupNeck_9.name = "Neck humbucker__pivot";
  if (endpoint_pickupNeck_9) {
    node_pickupNeck_9.position.copy(endpoint_pickupNeck_9.start);
    node_pickupNeck_9.rotation.set(0, 0, 0);
    node_pickupNeck_9.scale.set(1, 1, 1);
  } else {
    node_pickupNeck_9.position.set(0.0, 0.128, 0.0485);
    node_pickupNeck_9.rotation.set(0.0, 0.0, 0.0);
    node_pickupNeck_9.scale.set(0.07, 0.03, 0.01);
  }
  node_pickupNeck_9.userData.sculptComponent = {"id": "pickupNeck", "name": "Neck humbucker", "level": "meso", "role": "hardware", "importance": 0.9, "confidence": 0.9, "primitive": "box", "topologyClass": "surface-relief", "topologyRationale": "Black humbucker: two bobbins with a centre split line and four corner mounting screws.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.07, "height": 0.03, "depth": 0.01, "units": "relative", "confidence": 0.9}, "transform": {"position": [0, 0.128, 0.0485], "rotation": [0, 0, 0], "scale": [0.07, 0.03, 0.01]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}}, "material": "blackPlastic", "materialLayers": ["blackPlastic"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "splitLine", "kind": "seam", "description": "Centre seam between the two bobbins.", "method": "inset groove", "confidence": 0.88}, {"id": "cornerScrews", "kind": "fastener", "description": "Four chrome mounting screws at the corners.", "method": "instanced screw micro-part", "confidence": 0.88}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "blackPlastic", "colorMaterialRecipe": {"dominantAlbedo": "rgba(20, 20, 20, 1.0)", "secondaryAlbedo": "rgba(36, 36, 36, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.9, "evidenceRefs": ["front", "three-quarter"], "notes": "Pickup covers, cavity cover, switch tip. Semi-matte, NOT gloss."}};
  node_pickupNeck_9.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}};
  (nodes["body"] ?? root).add(node_pickupNeck_9);
  nodes["pickupNeck"] = node_pickupNeck_9;
  const mesh_pickupNeck_9Geometry = endpoint_pickupNeck_9
    ? new THREE.CylinderGeometry(endpoint_pickupNeck_9.endRadius, endpoint_pickupNeck_9.baseRadius, endpoint_pickupNeck_9.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_pickupNeck_9 = new THREE.Mesh(
    mesh_pickupNeck_9Geometry,
    materialMap["blackPlastic"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_pickupNeck_9.name = "Neck humbucker";
  if (endpoint_pickupNeck_9) {
    mesh_pickupNeck_9.position.copy(endpoint_pickupNeck_9.midpoint);
    mesh_pickupNeck_9.quaternion.copy(endpoint_pickupNeck_9.quaternion);
  }
  mesh_pickupNeck_9.castShadow = options.castShadow ?? true;
  mesh_pickupNeck_9.receiveShadow = options.receiveShadow ?? true;
  mesh_pickupNeck_9.userData.sculptComponent = {"id": "pickupNeck", "name": "Neck humbucker", "level": "meso", "role": "hardware", "importance": 0.9, "confidence": 0.9, "primitive": "box", "topologyClass": "surface-relief", "topologyRationale": "Black humbucker: two bobbins with a centre split line and four corner mounting screws.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.07, "height": 0.03, "depth": 0.01, "units": "relative", "confidence": 0.9}, "transform": {"position": [0, 0.128, 0.0485], "rotation": [0, 0, 0], "scale": [0.07, 0.03, 0.01]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}}, "material": "blackPlastic", "materialLayers": ["blackPlastic"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "splitLine", "kind": "seam", "description": "Centre seam between the two bobbins.", "method": "inset groove", "confidence": 0.88}, {"id": "cornerScrews", "kind": "fastener", "description": "Four chrome mounting screws at the corners.", "method": "instanced screw micro-part", "confidence": 0.88}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "blackPlastic", "colorMaterialRecipe": {"dominantAlbedo": "rgba(20, 20, 20, 1.0)", "secondaryAlbedo": "rgba(36, 36, 36, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.9, "evidenceRefs": ["front", "three-quarter"], "notes": "Pickup covers, cavity cover, switch tip. Semi-matte, NOT gloss."}};
  node_pickupNeck_9.add(mesh_pickupNeck_9);
  meshes["pickupNeck"] = mesh_pickupNeck_9;
  colliders["pickupNeck"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_pickupNeck_9);

  const attachment_pickupBridge_10 = null;
  const endpoint_pickupBridge_10 = makeAttachmentEndpoint(attachment_pickupBridge_10);
  const node_pickupBridge_10 = new THREE.Group();
  node_pickupBridge_10.name = "Bridge humbucker__pivot";
  if (endpoint_pickupBridge_10) {
    node_pickupBridge_10.position.copy(endpoint_pickupBridge_10.start);
    node_pickupBridge_10.rotation.set(0, 0, 0);
    node_pickupBridge_10.scale.set(1, 1, 1);
  } else {
    node_pickupBridge_10.position.set(0.0, 0.048, 0.0485);
    node_pickupBridge_10.rotation.set(0.0, 0.0, 0.0);
    node_pickupBridge_10.scale.set(0.07, 0.03, 0.01);
  }
  node_pickupBridge_10.userData.sculptComponent = {"id": "pickupBridge", "name": "Bridge humbucker", "level": "meso", "role": "hardware", "importance": 0.9, "confidence": 0.9, "primitive": "box", "topologyClass": "surface-relief", "topologyRationale": "Second black humbucker, angled slightly, nearer the bridge.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.07, "height": 0.03, "depth": 0.01, "units": "relative", "confidence": 0.9}, "transform": {"position": [0, 0.048, 0.0485], "rotation": [0, 0, 0], "scale": [0.07, 0.03, 0.01]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}}, "material": "blackPlastic", "materialLayers": ["blackPlastic"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "splitLine", "kind": "seam", "description": "Centre seam between the two bobbins.", "method": "inset groove", "confidence": 0.88}, {"id": "cornerScrews", "kind": "fastener", "description": "Four chrome mounting screws at the corners.", "method": "instanced screw micro-part", "confidence": 0.88}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "blackPlastic", "colorMaterialRecipe": {"dominantAlbedo": "rgba(20, 20, 20, 1.0)", "secondaryAlbedo": "rgba(36, 36, 36, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.9, "evidenceRefs": ["front", "three-quarter"], "notes": "Pickup covers, cavity cover, switch tip. Semi-matte, NOT gloss."}};
  node_pickupBridge_10.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}};
  (nodes["body"] ?? root).add(node_pickupBridge_10);
  nodes["pickupBridge"] = node_pickupBridge_10;
  const mesh_pickupBridge_10Geometry = endpoint_pickupBridge_10
    ? new THREE.CylinderGeometry(endpoint_pickupBridge_10.endRadius, endpoint_pickupBridge_10.baseRadius, endpoint_pickupBridge_10.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_pickupBridge_10 = new THREE.Mesh(
    mesh_pickupBridge_10Geometry,
    materialMap["blackPlastic"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_pickupBridge_10.name = "Bridge humbucker";
  if (endpoint_pickupBridge_10) {
    mesh_pickupBridge_10.position.copy(endpoint_pickupBridge_10.midpoint);
    mesh_pickupBridge_10.quaternion.copy(endpoint_pickupBridge_10.quaternion);
  }
  mesh_pickupBridge_10.castShadow = options.castShadow ?? true;
  mesh_pickupBridge_10.receiveShadow = options.receiveShadow ?? true;
  mesh_pickupBridge_10.userData.sculptComponent = {"id": "pickupBridge", "name": "Bridge humbucker", "level": "meso", "role": "hardware", "importance": 0.9, "confidence": 0.9, "primitive": "box", "topologyClass": "surface-relief", "topologyRationale": "Second black humbucker, angled slightly, nearer the bridge.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.07, "height": 0.03, "depth": 0.01, "units": "relative", "confidence": 0.9}, "transform": {"position": [0, 0.048, 0.0485], "rotation": [0, 0, 0], "scale": [0.07, 0.03, 0.01]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}}, "material": "blackPlastic", "materialLayers": ["blackPlastic"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "splitLine", "kind": "seam", "description": "Centre seam between the two bobbins.", "method": "inset groove", "confidence": 0.88}, {"id": "cornerScrews", "kind": "fastener", "description": "Four chrome mounting screws at the corners.", "method": "instanced screw micro-part", "confidence": 0.88}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "blackPlastic", "colorMaterialRecipe": {"dominantAlbedo": "rgba(20, 20, 20, 1.0)", "secondaryAlbedo": "rgba(36, 36, 36, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.9, "evidenceRefs": ["front", "three-quarter"], "notes": "Pickup covers, cavity cover, switch tip. Semi-matte, NOT gloss."}};
  node_pickupBridge_10.add(mesh_pickupBridge_10);
  meshes["pickupBridge"] = mesh_pickupBridge_10;
  colliders["pickupBridge"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_pickupBridge_10);

  const attachment_bridgeUnit_11 = null;
  const endpoint_bridgeUnit_11 = makeAttachmentEndpoint(attachment_bridgeUnit_11);
  const node_bridgeUnit_11 = new THREE.Group();
  node_bridgeUnit_11.name = "Tune-o-matic bridge__pivot";
  if (endpoint_bridgeUnit_11) {
    node_bridgeUnit_11.position.copy(endpoint_bridgeUnit_11.start);
    node_bridgeUnit_11.rotation.set(0, 0, 0);
    node_bridgeUnit_11.scale.set(1, 1, 1);
  } else {
    node_bridgeUnit_11.position.set(0.0, -0.017, 0.0505);
    node_bridgeUnit_11.rotation.set(0.0, 0.0, 0.0);
    node_bridgeUnit_11.scale.set(0.072, 0.014, 0.014);
  }
  node_bridgeUnit_11.userData.sculptComponent = {"id": "bridgeUnit", "name": "Tune-o-matic bridge", "level": "meso", "role": "hardware", "importance": 0.9, "confidence": 0.72, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Chrome base carrying six individual brass/gold-toned saddles on height posts. Two-tone metal is evidence-backed; individual saddle geometry is APPROXIMATED.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.072, "height": 0.014, "depth": 0.014, "units": "relative", "confidence": 0.72}, "transform": {"position": [0, -0.017, 0.0505], "rotation": [0, 0, 0], "scale": [0.072, 0.014, 0.014]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "heightPosts", "kind": "fastener", "description": "Two chrome height-adjustment posts.", "method": "cylinder pair", "confidence": 0.75}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.72, "evidenceRefs": ["front", "three-quarter"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_bridgeUnit_11.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}};
  (nodes["body"] ?? root).add(node_bridgeUnit_11);
  nodes["bridgeUnit"] = node_bridgeUnit_11;
  const mesh_bridgeUnit_11Geometry = endpoint_bridgeUnit_11
    ? new THREE.CylinderGeometry(endpoint_bridgeUnit_11.endRadius, endpoint_bridgeUnit_11.baseRadius, endpoint_bridgeUnit_11.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_bridgeUnit_11 = new THREE.Mesh(
    mesh_bridgeUnit_11Geometry,
    materialMap["chrome"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_bridgeUnit_11.name = "Tune-o-matic bridge";
  if (endpoint_bridgeUnit_11) {
    mesh_bridgeUnit_11.position.copy(endpoint_bridgeUnit_11.midpoint);
    mesh_bridgeUnit_11.quaternion.copy(endpoint_bridgeUnit_11.quaternion);
  }
  mesh_bridgeUnit_11.castShadow = options.castShadow ?? true;
  mesh_bridgeUnit_11.receiveShadow = options.receiveShadow ?? true;
  mesh_bridgeUnit_11.userData.sculptComponent = {"id": "bridgeUnit", "name": "Tune-o-matic bridge", "level": "meso", "role": "hardware", "importance": 0.9, "confidence": 0.72, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Chrome base carrying six individual brass/gold-toned saddles on height posts. Two-tone metal is evidence-backed; individual saddle geometry is APPROXIMATED.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.072, "height": 0.014, "depth": 0.014, "units": "relative", "confidence": 0.72}, "transform": {"position": [0, -0.017, 0.0505], "rotation": [0, 0, 0], "scale": [0.072, 0.014, 0.014]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "heightPosts", "kind": "fastener", "description": "Two chrome height-adjustment posts.", "method": "cylinder pair", "confidence": 0.75}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.72, "evidenceRefs": ["front", "three-quarter"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_bridgeUnit_11.add(mesh_bridgeUnit_11);
  meshes["bridgeUnit"] = mesh_bridgeUnit_11;
  colliders["bridgeUnit"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_bridgeUnit_11);

  const attachment_knobVolume_12 = null;
  const endpoint_knobVolume_12 = makeAttachmentEndpoint(attachment_knobVolume_12);
  const node_knobVolume_12 = new THREE.Group();
  node_knobVolume_12.name = "Volume knob__pivot";
  if (endpoint_knobVolume_12) {
    node_knobVolume_12.position.copy(endpoint_knobVolume_12.start);
    node_knobVolume_12.rotation.set(0, 0, 0);
    node_knobVolume_12.scale.set(1, 1, 1);
  } else {
    node_knobVolume_12.position.set(0.075, 0.021, 0.0505);
    node_knobVolume_12.rotation.set(1.5708, 0.0, 0.0);
    node_knobVolume_12.scale.set(0.022, 0.014, 0.022);
  }
  node_knobVolume_12.userData.sculptComponent = {"id": "knobVolume", "name": "Volume knob", "level": "meso", "role": "hardware", "importance": 0.7, "confidence": 0.94, "primitive": "cylinder", "topologyClass": "surface-relief", "topologyRationale": "Chrome dome knob, lower bout treble side.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.022, "height": 0.014, "depth": 0.022, "units": "relative", "confidence": 0.94}, "transform": {"position": [0.075, 0.021, 0.0505], "rotation": [1.5708, 0, 0], "scale": [0.022, 0.014, 0.022]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.94, "evidenceRefs": ["front", "three-quarter"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_knobVolume_12.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}};
  (nodes["body"] ?? root).add(node_knobVolume_12);
  nodes["knobVolume"] = node_knobVolume_12;
  const mesh_knobVolume_12Geometry = endpoint_knobVolume_12
    ? new THREE.CylinderGeometry(endpoint_knobVolume_12.endRadius, endpoint_knobVolume_12.baseRadius, endpoint_knobVolume_12.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_knobVolume_12 = new THREE.Mesh(
    mesh_knobVolume_12Geometry,
    materialMap["chrome"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_knobVolume_12.name = "Volume knob";
  if (endpoint_knobVolume_12) {
    mesh_knobVolume_12.position.copy(endpoint_knobVolume_12.midpoint);
    mesh_knobVolume_12.quaternion.copy(endpoint_knobVolume_12.quaternion);
  }
  mesh_knobVolume_12.castShadow = options.castShadow ?? true;
  mesh_knobVolume_12.receiveShadow = options.receiveShadow ?? true;
  mesh_knobVolume_12.userData.sculptComponent = {"id": "knobVolume", "name": "Volume knob", "level": "meso", "role": "hardware", "importance": 0.7, "confidence": 0.94, "primitive": "cylinder", "topologyClass": "surface-relief", "topologyRationale": "Chrome dome knob, lower bout treble side.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.022, "height": 0.014, "depth": 0.022, "units": "relative", "confidence": 0.94}, "transform": {"position": [0.075, 0.021, 0.0505], "rotation": [1.5708, 0, 0], "scale": [0.022, 0.014, 0.022]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.94, "evidenceRefs": ["front", "three-quarter"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_knobVolume_12.add(mesh_knobVolume_12);
  meshes["knobVolume"] = mesh_knobVolume_12;
  colliders["knobVolume"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_knobVolume_12);

  const attachment_knobTone_13 = null;
  const endpoint_knobTone_13 = makeAttachmentEndpoint(attachment_knobTone_13);
  const node_knobTone_13 = new THREE.Group();
  node_knobTone_13.name = "Tone knob__pivot";
  if (endpoint_knobTone_13) {
    node_knobTone_13.position.copy(endpoint_knobTone_13.start);
    node_knobTone_13.rotation.set(0, 0, 0);
    node_knobTone_13.scale.set(1, 1, 1);
  } else {
    node_knobTone_13.position.set(0.088, -0.052, 0.0505);
    node_knobTone_13.rotation.set(1.5708, 0.0, 0.0);
    node_knobTone_13.scale.set(0.022, 0.014, 0.022);
  }
  node_knobTone_13.userData.sculptComponent = {"id": "knobTone", "name": "Tone knob", "level": "meso", "role": "hardware", "importance": 0.7, "confidence": 0.94, "primitive": "cylinder", "topologyClass": "surface-relief", "topologyRationale": "Second chrome dome knob, below and outboard of the first.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.022, "height": 0.014, "depth": 0.022, "units": "relative", "confidence": 0.94}, "transform": {"position": [0.088, -0.052, 0.0505], "rotation": [1.5708, 0, 0], "scale": [0.022, 0.014, 0.022]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.94, "evidenceRefs": ["front", "three-quarter"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_knobTone_13.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}};
  (nodes["body"] ?? root).add(node_knobTone_13);
  nodes["knobTone"] = node_knobTone_13;
  const mesh_knobTone_13Geometry = endpoint_knobTone_13
    ? new THREE.CylinderGeometry(endpoint_knobTone_13.endRadius, endpoint_knobTone_13.baseRadius, endpoint_knobTone_13.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_knobTone_13 = new THREE.Mesh(
    mesh_knobTone_13Geometry,
    materialMap["chrome"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_knobTone_13.name = "Tone knob";
  if (endpoint_knobTone_13) {
    mesh_knobTone_13.position.copy(endpoint_knobTone_13.midpoint);
    mesh_knobTone_13.quaternion.copy(endpoint_knobTone_13.quaternion);
  }
  mesh_knobTone_13.castShadow = options.castShadow ?? true;
  mesh_knobTone_13.receiveShadow = options.receiveShadow ?? true;
  mesh_knobTone_13.userData.sculptComponent = {"id": "knobTone", "name": "Tone knob", "level": "meso", "role": "hardware", "importance": 0.7, "confidence": 0.94, "primitive": "cylinder", "topologyClass": "surface-relief", "topologyRationale": "Second chrome dome knob, below and outboard of the first.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.022, "height": 0.014, "depth": 0.022, "units": "relative", "confidence": 0.94}, "transform": {"position": [0.088, -0.052, 0.0505], "rotation": [1.5708, 0, 0], "scale": [0.022, 0.014, 0.022]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.94, "evidenceRefs": ["front", "three-quarter"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_knobTone_13.add(mesh_knobTone_13);
  meshes["knobTone"] = mesh_knobTone_13;
  colliders["knobTone"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_knobTone_13);

  const attachment_toggleSwitch_14 = null;
  const endpoint_toggleSwitch_14 = makeAttachmentEndpoint(attachment_toggleSwitch_14);
  const node_toggleSwitch_14 = new THREE.Group();
  node_toggleSwitch_14.name = "3-way toggle__pivot";
  if (endpoint_toggleSwitch_14) {
    node_toggleSwitch_14.position.copy(endpoint_toggleSwitch_14.start);
    node_toggleSwitch_14.rotation.set(0, 0, 0);
    node_toggleSwitch_14.scale.set(1, 1, 1);
  } else {
    node_toggleSwitch_14.position.set(0.083, -0.017, 0.0525);
    node_toggleSwitch_14.rotation.set(0.0, 0.0, 0.0);
    node_toggleSwitch_14.scale.set(0.008, 0.03, 0.008);
  }
  node_toggleSwitch_14.userData.sculptComponent = {"id": "toggleSwitch", "name": "3-way toggle", "level": "meso", "role": "hardware", "importance": 0.6, "confidence": 0.91, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Angled toggle with a black tip, set between the two knobs.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.008, "height": 0.03, "depth": 0.008, "units": "relative", "confidence": 0.91}, "transform": {"position": [0.083, -0.017, 0.0525], "rotation": [0, 0, 0], "scale": [0.008, 0.03, 0.008]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}}, "material": "blackPlastic", "materialLayers": ["blackPlastic"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "blackTip", "kind": "material-zone", "description": "Black plastic tip on a chrome shaft.", "method": "two-material split along the lever", "confidence": 0.9}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "blackPlastic", "colorMaterialRecipe": {"dominantAlbedo": "rgba(20, 20, 20, 1.0)", "secondaryAlbedo": "rgba(36, 36, 36, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.91, "evidenceRefs": ["front", "three-quarter"], "notes": "Pickup covers, cavity cover, switch tip. Semi-matte, NOT gloss."}};
  node_toggleSwitch_14.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}};
  (nodes["body"] ?? root).add(node_toggleSwitch_14);
  nodes["toggleSwitch"] = node_toggleSwitch_14;
  const mesh_toggleSwitch_14Geometry = endpoint_toggleSwitch_14
    ? new THREE.CylinderGeometry(endpoint_toggleSwitch_14.endRadius, endpoint_toggleSwitch_14.baseRadius, endpoint_toggleSwitch_14.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_toggleSwitch_14 = new THREE.Mesh(
    mesh_toggleSwitch_14Geometry,
    materialMap["blackPlastic"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_toggleSwitch_14.name = "3-way toggle";
  if (endpoint_toggleSwitch_14) {
    mesh_toggleSwitch_14.position.copy(endpoint_toggleSwitch_14.midpoint);
    mesh_toggleSwitch_14.quaternion.copy(endpoint_toggleSwitch_14.quaternion);
  }
  mesh_toggleSwitch_14.castShadow = options.castShadow ?? true;
  mesh_toggleSwitch_14.receiveShadow = options.receiveShadow ?? true;
  mesh_toggleSwitch_14.userData.sculptComponent = {"id": "toggleSwitch", "name": "3-way toggle", "level": "meso", "role": "hardware", "importance": 0.6, "confidence": 0.91, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Angled toggle with a black tip, set between the two knobs.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.008, "height": 0.03, "depth": 0.008, "units": "relative", "confidence": 0.91}, "transform": {"position": [0.083, -0.017, 0.0525], "rotation": [0, 0, 0], "scale": [0.008, 0.03, 0.008]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "blackPlastic"}}, "material": "blackPlastic", "materialLayers": ["blackPlastic"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "blackTip", "kind": "material-zone", "description": "Black plastic tip on a chrome shaft.", "method": "two-material split along the lever", "confidence": 0.9}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "blackPlastic", "colorMaterialRecipe": {"dominantAlbedo": "rgba(20, 20, 20, 1.0)", "secondaryAlbedo": "rgba(36, 36, 36, 1.0)", "materialClass": "plastic", "materialClassConfidence": 0.91, "evidenceRefs": ["front", "three-quarter"], "notes": "Pickup covers, cavity cover, switch tip. Semi-matte, NOT gloss."}};
  node_toggleSwitch_14.add(mesh_toggleSwitch_14);
  meshes["toggleSwitch"] = mesh_toggleSwitch_14;
  colliders["toggleSwitch"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_toggleSwitch_14);

  const attachment_strapButtonHorn_15 = null;
  const endpoint_strapButtonHorn_15 = makeAttachmentEndpoint(attachment_strapButtonHorn_15);
  const node_strapButtonHorn_15 = new THREE.Group();
  node_strapButtonHorn_15.name = "Strap button (bass horn)__pivot";
  if (endpoint_strapButtonHorn_15) {
    node_strapButtonHorn_15.position.copy(endpoint_strapButtonHorn_15.start);
    node_strapButtonHorn_15.rotation.set(0, 0, 0);
    node_strapButtonHorn_15.scale.set(1, 1, 1);
  } else {
    node_strapButtonHorn_15.position.set(-0.132, 0.183, 0.0225);
    node_strapButtonHorn_15.rotation.set(1.5708, 0.0, 0.0);
    node_strapButtonHorn_15.scale.set(0.013, 0.01, 0.013);
  }
  node_strapButtonHorn_15.userData.sculptComponent = {"id": "strapButtonHorn", "name": "Strap button (bass horn)", "level": "meso", "role": "hardware", "importance": 0.4, "confidence": 0.85, "primitive": "cylinder", "topologyClass": "surface-relief", "topologyRationale": "Chrome strap button at the upper bass horn tip.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.013, "height": 0.01, "depth": 0.013, "units": "relative", "confidence": 0.85}, "transform": {"position": [-0.132, 0.183, 0.0225], "rotation": [1.5708, 0, 0], "scale": [0.013, 0.01, 0.013]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.85, "evidenceRefs": ["front", "three-quarter"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_strapButtonHorn_15.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}};
  (nodes["body"] ?? root).add(node_strapButtonHorn_15);
  nodes["strapButtonHorn"] = node_strapButtonHorn_15;
  const mesh_strapButtonHorn_15Geometry = endpoint_strapButtonHorn_15
    ? new THREE.CylinderGeometry(endpoint_strapButtonHorn_15.endRadius, endpoint_strapButtonHorn_15.baseRadius, endpoint_strapButtonHorn_15.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_strapButtonHorn_15 = new THREE.Mesh(
    mesh_strapButtonHorn_15Geometry,
    materialMap["chrome"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_strapButtonHorn_15.name = "Strap button (bass horn)";
  if (endpoint_strapButtonHorn_15) {
    mesh_strapButtonHorn_15.position.copy(endpoint_strapButtonHorn_15.midpoint);
    mesh_strapButtonHorn_15.quaternion.copy(endpoint_strapButtonHorn_15.quaternion);
  }
  mesh_strapButtonHorn_15.castShadow = options.castShadow ?? true;
  mesh_strapButtonHorn_15.receiveShadow = options.receiveShadow ?? true;
  mesh_strapButtonHorn_15.userData.sculptComponent = {"id": "strapButtonHorn", "name": "Strap button (bass horn)", "level": "meso", "role": "hardware", "importance": 0.4, "confidence": 0.85, "primitive": "cylinder", "topologyClass": "surface-relief", "topologyRationale": "Chrome strap button at the upper bass horn tip.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.013, "height": 0.01, "depth": 0.013, "units": "relative", "confidence": 0.85}, "transform": {"position": [-0.132, 0.183, 0.0225], "rotation": [1.5708, 0, 0], "scale": [0.013, 0.01, 0.013]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.85, "evidenceRefs": ["front", "three-quarter"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_strapButtonHorn_15.add(mesh_strapButtonHorn_15);
  meshes["strapButtonHorn"] = mesh_strapButtonHorn_15;
  colliders["strapButtonHorn"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_strapButtonHorn_15);

  const attachment_strapButtonTail_16 = null;
  const endpoint_strapButtonTail_16 = makeAttachmentEndpoint(attachment_strapButtonTail_16);
  const node_strapButtonTail_16 = new THREE.Group();
  node_strapButtonTail_16.name = "Strap button (tail)__pivot";
  if (endpoint_strapButtonTail_16) {
    node_strapButtonTail_16.position.copy(endpoint_strapButtonTail_16.start);
    node_strapButtonTail_16.rotation.set(0, 0, 0);
    node_strapButtonTail_16.scale.set(1, 1, 1);
  } else {
    node_strapButtonTail_16.position.set(0.0, -0.217, 0.0225);
    node_strapButtonTail_16.rotation.set(1.5708, 0.0, 0.0);
    node_strapButtonTail_16.scale.set(0.013, 0.01, 0.013);
  }
  node_strapButtonTail_16.userData.sculptComponent = {"id": "strapButtonTail", "name": "Strap button (tail)", "level": "meso", "role": "hardware", "importance": 0.4, "confidence": 0.85, "primitive": "cylinder", "topologyClass": "surface-relief", "topologyRationale": "Chrome strap button at the body tail.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.013, "height": 0.01, "depth": 0.013, "units": "relative", "confidence": 0.85}, "transform": {"position": [0, -0.217, 0.0225], "rotation": [1.5708, 0, 0], "scale": [0.013, 0.01, 0.013]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["back"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.85, "evidenceRefs": ["back"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_strapButtonTail_16.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}};
  (nodes["body"] ?? root).add(node_strapButtonTail_16);
  nodes["strapButtonTail"] = node_strapButtonTail_16;
  const mesh_strapButtonTail_16Geometry = endpoint_strapButtonTail_16
    ? new THREE.CylinderGeometry(endpoint_strapButtonTail_16.endRadius, endpoint_strapButtonTail_16.baseRadius, endpoint_strapButtonTail_16.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_strapButtonTail_16 = new THREE.Mesh(
    mesh_strapButtonTail_16Geometry,
    materialMap["chrome"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_strapButtonTail_16.name = "Strap button (tail)";
  if (endpoint_strapButtonTail_16) {
    mesh_strapButtonTail_16.position.copy(endpoint_strapButtonTail_16.midpoint);
    mesh_strapButtonTail_16.quaternion.copy(endpoint_strapButtonTail_16.quaternion);
  }
  mesh_strapButtonTail_16.castShadow = options.castShadow ?? true;
  mesh_strapButtonTail_16.receiveShadow = options.receiveShadow ?? true;
  mesh_strapButtonTail_16.userData.sculptComponent = {"id": "strapButtonTail", "name": "Strap button (tail)", "level": "meso", "role": "hardware", "importance": 0.4, "confidence": 0.85, "primitive": "cylinder", "topologyClass": "surface-relief", "topologyRationale": "Chrome strap button at the body tail.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.013, "height": 0.01, "depth": 0.013, "units": "relative", "confidence": 0.85}, "transform": {"position": [0, -0.217, 0.0225], "rotation": [1.5708, 0, 0], "scale": [0.013, 0.01, 0.013]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["back"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.85, "evidenceRefs": ["back"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_strapButtonTail_16.add(mesh_strapButtonTail_16);
  meshes["strapButtonTail"] = mesh_strapButtonTail_16;
  colliders["strapButtonTail"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_strapButtonTail_16);

  const attachment_outputJack_17 = null;
  const endpoint_outputJack_17 = makeAttachmentEndpoint(attachment_outputJack_17);
  const node_outputJack_17 = new THREE.Group();
  node_outputJack_17.name = "Output jack__pivot";
  if (endpoint_outputJack_17) {
    node_outputJack_17.position.copy(endpoint_outputJack_17.start);
    node_outputJack_17.rotation.set(0, 0, 0);
    node_outputJack_17.scale.set(1, 1, 1);
  } else {
    node_outputJack_17.position.set(0.125, -0.117, 0.0225);
    node_outputJack_17.rotation.set(1.5708, 0.0, 0.0);
    node_outputJack_17.scale.set(0.016, 0.012, 0.016);
  }
  node_outputJack_17.userData.sculptComponent = {"id": "outputJack", "name": "Output jack", "level": "meso", "role": "hardware", "importance": 0.3, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "surface-relief", "topologyRationale": "Jack on the lower treble edge. Position partially INFERRED.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.016, "height": 0.012, "depth": 0.016, "units": "relative", "confidence": 0.6}, "transform": {"position": [0.125, -0.117, 0.0225], "rotation": [1.5708, 0, 0], "scale": [0.016, 0.012, 0.016]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.6, "evidenceRefs": ["front", "three-quarter"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_outputJack_17.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}};
  (nodes["body"] ?? root).add(node_outputJack_17);
  nodes["outputJack"] = node_outputJack_17;
  const mesh_outputJack_17Geometry = endpoint_outputJack_17
    ? new THREE.CylinderGeometry(endpoint_outputJack_17.endRadius, endpoint_outputJack_17.baseRadius, endpoint_outputJack_17.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_outputJack_17 = new THREE.Mesh(
    mesh_outputJack_17Geometry,
    materialMap["chrome"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_outputJack_17.name = "Output jack";
  if (endpoint_outputJack_17) {
    mesh_outputJack_17.position.copy(endpoint_outputJack_17.midpoint);
    mesh_outputJack_17.quaternion.copy(endpoint_outputJack_17.quaternion);
  }
  mesh_outputJack_17.castShadow = options.castShadow ?? true;
  mesh_outputJack_17.receiveShadow = options.receiveShadow ?? true;
  mesh_outputJack_17.userData.sculptComponent = {"id": "outputJack", "name": "Output jack", "level": "meso", "role": "hardware", "importance": 0.3, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "surface-relief", "topologyRationale": "Jack on the lower treble edge. Position partially INFERRED.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "body", "attachment": null, "dimensions": {"width": 0.016, "height": 0.012, "depth": 0.016, "units": "relative", "confidence": 0.6}, "transform": {"position": [0.125, -0.117, 0.0225], "rotation": [1.5708, 0, 0], "scale": [0.016, 0.012, 0.016]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "chrome"}}, "material": "chrome", "materialLayers": ["chrome"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["front", "three-quarter"], "details": [], "fidelityTier": "blockout", "materialId": "chrome", "colorMaterialRecipe": {"dominantAlbedo": "rgba(216, 219, 222, 1.0)", "secondaryAlbedo": "rgba(255, 255, 255, 1.0)", "materialClass": "metal", "materialClassConfidence": 0.6, "evidenceRefs": ["front", "three-quarter"], "notes": "Hardware: tuners, bridge base, knobs, neck plate, strap buttons, ferrules."}};
  node_outputJack_17.add(mesh_outputJack_17);
  meshes["outputJack"] = mesh_outputJack_17;
  colliders["outputJack"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_outputJack_17);

  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups } satisfies ProceduralModelRuntime;
  root.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  root.userData.actionReadiness = {
    note: 'Use root.userData.sculptRuntime.nodes for transforms, sockets for attachments, colliders for physics proxies, and destructionGroups for breakable sets.',
  };
  return root;
}

export function createRenegadeByHMISuperstratElectricGuitarLookDevLights(
  mode: 'neutral' | 'grazing' | 'reference' = 'neutral',
): THREE.Group {
  const lights = new THREE.Group();
  lights.name = "Renegade by HMI Superstrat Electric Guitar look-dev lights";
  const hemi = new THREE.HemisphereLight(
    mode === 'reference' ? 0xfff0d6 : 0xf2f4ff,
    0x363b42,
    mode === 'grazing' ? 0.28 : mode === 'reference' ? 0.72 : 0.85,
  );
  lights.add(hemi);
  const key = new THREE.DirectionalLight(
    mode === 'reference' ? 0xffcf8a : 0xfff4e8,
    mode === 'grazing' ? 4.2 : mode === 'reference' ? 2.6 : 2.15,
  );
  if (mode === 'grazing') key.position.set(7.5, 1.1, 4.0);
  else if (mode === 'reference') key.position.set(-4.5, 7.5, 5.0);
  else key.position.set(-4.0, 6.0, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 7;
  key.shadow.blurSamples = 24;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.6;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.updateProjectionMatrix();
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xa8c4ff, mode === 'grazing' ? 0.12 : 0.42);
  fill.position.set(4.0, 3.0, 3.5);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xfff1c4, mode === 'grazing' ? 0.28 : 0.85);
  rim.position.set(0.5, 4.5, -6.0);
  lights.add(rim);
  lights.userData.reviewMode = mode;
  lights.userData.lightingFromPhoto = [{"id": "key", "type": "directional", "direction": [-0.35, 0.78, 0.52], "color": "#FFF6E8", "intensity": 2.6, "softness": 0.35, "confidence": 0.75, "notes": "Reference is a softbox product shot: key high and slightly camera-left, warm-neutral."}, {"id": "fill", "type": "directional", "direction": [0.62, 0.18, 0.46], "color": "#DCE6F2", "intensity": 0.9, "softness": 0.7, "confidence": 0.72, "notes": "Cool low-intensity fill opening the right side; keeps the gunmetal from going black."}, {"id": "rim", "type": "directional", "direction": [0.15, -0.35, -0.92], "color": "#FFFFFF", "intensity": 1.4, "softness": 0.2, "confidence": 0.7, "notes": "Back rim separating the body edge bevel from the white background."}, {"id": "environment", "type": "environment", "preset": "studio-softbox-neutral", "intensity": 0.85, "color": "#F2F2F2", "confidence": 0.8, "notes": "Broad even environment - REQUIRED for the metallic flake and chrome to read; flake needs something to reflect or it collapses to flat paint."}, {"id": "ambient", "type": "ambient", "color": "#B8BCC4", "intensity": 0.25, "confidence": 0.7}, {"id": "render-intent", "type": "render-settings", "exposure": 1.0, "toneMapping": "ACESFilmic", "background": "#FFFFFF", "confidence": 0.8, "notes": "Exposure 1.0 with ACES filmic tone mapping to match the reference's white-background product-shot response. Contact shadow (ground shadow) under the body, softness 0.4, opacity 0.35; ambient occlusion in the neck pocket, cavity seam and under all hardware."}];
  lights.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  return lights;
}

// PBR materials (clearcoat/iridescence/transmission/anisotropy) need an environment
// map to visually behave as intended — call this once per renderer and assign the
// result to scene.environment before rendering. No external HDR asset required.
export function createRenegadeByHMISuperstratElectricGuitarEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

// Plan 1.3 §3.2 — auto-framing by bounding box. The Divine Eye can only compare a
// render to the reference if the object is FRAMED consistently (an object framed
// differently scores as wrong even when its shape is right). This positions the camera
// deterministically from the object's bounding box so it fills the frame at a stable
// margin, and sets near/far to the object scale. Call after adding the model to the
// scene, and again on resize (after updating camera.aspect).
export function frameRenegadeByHMISuperstratElectricGuitarCamera(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  options: { margin?: number; azimuthDeg?: number; elevationDeg?: number } = {},
): void {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const margin = options.margin ?? 1.15;
  const maxDim = Math.max(size.x, size.y, size.z) * margin;
  const fov = (camera.fov * Math.PI) / 180;
  // distance so the largest object dimension fits vertically in the frame
  const distance = (maxDim / 2) / Math.tan(fov / 2);
  const az = ((options.azimuthDeg ?? 0) * Math.PI) / 180;
  const el = ((options.elevationDeg ?? 0) * Math.PI) / 180;
  const dir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  );
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.near = Math.max(0.01, distance - maxDim);
  camera.far = distance + maxDim * 2;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

// Plan 1.3 §3.2c — PRESENTATION composer (DOF + bloom). CRITICAL (R-POSTFX): this is
// for the showcase/hero render ONLY. The Divine Eye's EVALUATION render MUST use a
// plain renderer with NO composer — bloom blows highlights and DOF blurs edges, which
// would corrupt the deterministic IoU/DCD/edge/blowout signals. Enable dof/bloom ONLY
// when the reference photo actually exhibits them (detect_reference_effects.py authorizes).
export function createRenegadeByHMISuperstratElectricGuitarPresentationComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: { dof?: boolean; bloom?: boolean; bloomStrength?: number; dofFocus?: number; dofAperture?: number } = {},
): EffectComposer {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (options.dof) {
    composer.addPass(new BokehPass(scene, camera, {
      focus: options.dofFocus ?? 10.0,
      aperture: options.dofAperture ?? 0.0002,
      maxblur: 0.01,
    }));
  }
  if (options.bloom) {
    const size = new THREE.Vector2();
    renderer.getSize(size);
    composer.addPass(new UnrealBloomPass(size, options.bloomStrength ?? 0.4, 0.4, 0.85));
  }
  return composer;
}

export function configureRenegadeByHMISuperstratElectricGuitarRenderer(renderer: THREE.WebGLRenderer): void {
  // Load-bearing for view-dependent finishes (anodized / Doppler): without ACES + sRGB
  // the environment reflection reads flat/washed instead of a believable metal response.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export function createRenegadeByHMISuperstratElectricGuitarInspectControls(
  camera: THREE.Camera,
  domElement: HTMLElement,
): OrbitControls {
  // View-dependent finishes only read correctly once the user orbits — their color
  // comes from the environment reflection, not albedo, so free rotation matters here.
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.0;
  controls.maxDistance = 8.0;
  controls.autoRotate = false;
  return controls;
}
