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

export const WORLD_SIZE = 420;   // was 320 — extends the map east into the Ashen Highlands

// The Sunken Crypt lives in a pocket far outside the valley; the shared height
// function returns its flat floor there so every system works inside unchanged.
export const CRYPT = { x1: 250, x2: 360, z1: -60, z2: 60, floor: 30 };

// The Frostveil: the crypt's western mirror — an OUTDOOR pocket (own noise
// profile, own ground mesh in frostveil.js; the world terrain mesh ends at ±210).
export const FROSTVEIL = { x1: -360, x2: -250, z1: -60, z2: 60 };

// The Starfall Sanctum: the dungeon pocket north of everything, flat floor.
export const SANCTUM = { x1: -60, x2: 60, z1: 250, z2: 360, floor: 40 };

// Per-zone playable bounds (player clamp + Dash clamp read these — one truth).
// 'highlands' shares the continuous overworld box.
export const ZONE_BOUNDS = {
  world:     { x1: -150, x2: 205, z1: -150, z2: 150 },   // x2 = HIGHLANDS.EAST_EDGE
  highlands: { x1: -150, x2: 205, z1: -150, z2: 150 },
  crypt:     { x1: 252, x2: 358, z1: -58, z2: 58 },
  frostveil: { x1: -358, x2: -252, z1: -58, z2: 58 },
  sanctum:   { x1: -58, x2: 58, z1: 252, z2: 358 },
};

// The Ashen Highlands: the eastern shelf of the same continuous map. NOT a
// pocket — the height field blends from meadow into ash-cracked plateau across
// a border band so players walk across the seam. Gate/pass sits at GATE_X.
export const HIGHLANDS = {
  GATE_X: 150,        // mountain-pass line (world geometry); enemies kept east of 172
  BLEND_LO: 132,      // biome starts ramping in here
  BLEND_HI: 178,      // fully Highlands terrain past here
  EAST_EDGE: 205,     // far playable edge (inside the 210 half-extent of WORLD_SIZE 420)
  ZONE_ENTER: 158,    // crossing east of this -> zone 'highlands'
  ZONE_EXIT: 152,     // crossing west of this -> zone 'world'  (hysteresis: 6u band)
};

export function inHighlands(x) { return x > HIGHLANDS.GATE_X; }

// Terrain height: rolling meadow, flattened around the pioneer camp at origin,
// rising toward the rim so the world reads as a mountain-ringed valley. East of
// the pass it blends smoothly into the Ashen Highlands plateau (no cliff/seam).
export function heightAt(x, z) {
  if (x > CRYPT.x1 && x < CRYPT.x2 && z > CRYPT.z1 && z < CRYPT.z2) return CRYPT.floor;
  if (x > SANCTUM.x1 && x < SANCTUM.x2 && z > SANCTUM.z1 && z < SANCTUM.z2) return SANCTUM.floor;

  // the Frostveil: a glacial crater-vale — rolling snowfield, one flat frozen
  // tarn (the Sanctum's roof), steep moraine walls at every pocket edge
  if (x > FROSTVEIL.x1 && x < FROSTVEIL.x2 && z > FROSTVEIL.z1 && z < FROSTVEIL.z2) {
    let h = 8                                                  // vale shelf base
      + fbm(x * 0.03 + 501.2, z * 0.03 + 77.7, 4) * 7          // rolling snowfield
      + fbm(x * 0.09 + 11.1, z * 0.09 + 330.5, 3) * 1.8;       // wind-crusted drifts
    const dT = Math.hypot(x + 305, z - 8);                     // frozen tarn bowl
    if (dT < 24) h = 8.4 + (h - 8.4) * smooth(dT / 24);        // flat ice -> field
    const dE = Math.min(x - FROSTVEIL.x1, FROSTVEIL.x2 - x, z - FROSTVEIL.z1, FROSTVEIL.z2 - z);
    if (dE < 12) h += (12 - dE) * (12 - dE) * 0.35;            // moraine walls, up to +50
    return h;
  }

  const d = Math.hypot(x, z);
  let h = fbm(x * 0.018 + 31.7, z * 0.018 + 12.3, 4) * 11 - 4.5;
  h += fbm(x * 0.06 + 7.1, z * 0.06 + 91.4, 3) * 1.6;

  // valley rim — PIN to the ORIGINAL radius so widening WORLD_SIZE doesn't move it,
  // and so the rim does NOT wall off the eastern Highlands.
  const RIM_R = 115.2;                       // = old WORLD_SIZE(320) * 0.36
  const rimAmt = Math.max(0, d - RIM_R) * 0.22;
  let rim = rimAmt * rimAmt * 0.18;

  // ---- Ashen Highlands biome blend (east of the pass) ----
  const H = HIGHLANDS;
  if (x > H.BLEND_LO) {
    const t = smooth(Math.min(1, (x - H.BLEND_LO) / (H.BLEND_HI - H.BLEND_LO)));
    // a raised, cracked basalt plateau: higher base, rougher ridges, a few mesas
    const plateau = 6.5
      + fbm(x * 0.035 + 200.5, z * 0.035 + 77.2, 4) * 9.0     // broad ridges
      + fbm(x * 0.11 + 13.0, z * 0.11 + 41.0, 3) * 2.4;       // fine cracks
    // mountain-pass walls: tall ridges north & south of the corridor, LOCALIZED
    // to the gate at GATE_X (corridor is z in [-12,12]). The wall must NOT apply
    // across the whole eastern shelf or it buries plateau spawns on z² spikes —
    // so gate it by an x-window that peaks at GATE_X and decays to 0 east of the
    // pass, leaving open ash ground where the encounters sit.
    const wallZ = Math.max(0, Math.abs(z) - 12) * 0.10;
    const dxGate = (x - H.GATE_X) / 22;                 // ±22u half-width window
    const gateWin = Math.exp(-dxGate * dxGate);         // 1 at GATE_X → ~0 by x≈190
    const passWall = wallZ * wallZ * 1.2 * gateWin;
    h = h * (1 - t) + (plateau + passWall) * t;
    rim *= (1 - t);                            // fade the valley rim out across the blend band
  } else {
    // flatten the camp (unchanged, west side only)
    const campFlat = Math.min(1, d / 26);
    h = h * smooth(campFlat) + 0.4 * (1 - smooth(campFlat));
  }
  h += rim;
  return h;
}
