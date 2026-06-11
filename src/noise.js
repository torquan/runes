// Deterministic 2D value noise. One source of truth for terrain height so the
// mesh, entity ground-clamping, and the minimap always agree.

function hash(ix, iz) {
  let h = ix * 374761393 + iz * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return ((h >>> 0) % 10000) / 10000;
}

function smooth(t) { return t * t * (3 - 2 * t); }

function valueNoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = smooth(x - ix), fz = smooth(z - iz);
  const a = hash(ix, iz), b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

export function fbm(x, z, octaves = 4) {
  let v = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    v += valueNoise(x * freq, z * freq) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return v / max; // 0..1
}

export const WORLD_SIZE = 320;

// The Sunken Crypt lives in a pocket far outside the valley; the shared height
// function returns its flat floor there so every system works inside unchanged.
export const CRYPT = { x1: 250, x2: 360, z1: -60, z2: 60, floor: 30 };

// Terrain height: rolling meadow, flattened around the pioneer camp at origin,
// rising toward the rim so the world reads as a mountain-ringed valley.
export function heightAt(x, z) {
  if (x > CRYPT.x1 && x < CRYPT.x2 && z > CRYPT.z1 && z < CRYPT.z2) return CRYPT.floor;
  const d = Math.hypot(x, z);
  let h = fbm(x * 0.018 + 31.7, z * 0.018 + 12.3, 4) * 11 - 4.5;
  h += fbm(x * 0.06 + 7.1, z * 0.06 + 91.4, 3) * 1.6;
  // valley rim
  const rim = Math.max(0, d - WORLD_SIZE * 0.36) * 0.22;
  h += rim * rim * 0.18;
  // flatten the camp
  const campFlat = Math.min(1, d / 26);
  h = h * smooth(campFlat) + 0.4 * (1 - smooth(campFlat));
  return h;
}
