import * as THREE from 'three';

// Procedural low-poly characters. Every rig exposes named pivots in
// group.userData.rig so animateHumanoid()/animateBeast() can drive them.

function lambert(color) { return new THREE.MeshLambertMaterial({ color }); }

function shadowed(mesh) { mesh.castShadow = true; return mesh; }

export const CLASS_STYLES = {
  warrior: { tunic: 0x8e2f2a, trim: 0xc9a14a, weapon: 'sword' },
  scout:   { tunic: 0x3e6e35, trim: 0x9a7a4a, weapon: 'bow' },
  mage:    { tunic: 0x2f4a8e, trim: 0x8ad9ff, weapon: 'staff' },
  priest:  { tunic: 0xc9b06a, trim: 0xfff0c0, weapon: 'staff' },
  npc:     { tunic: 0x6e5a3e, trim: 0xa8855a, weapon: 'none' },
  bandit:  { tunic: 0x4a3038, trim: 0x8e2f2a, weapon: 'sword' },
  banditking: { tunic: 0x2a1f2e, trim: 0xc9921e, weapon: 'sword' },
  giant:   { tunic: 0x6e7480, trim: 0x3e444e, weapon: 'none' },
  paleking: { tunic: 0xc8c8d8, trim: 0xc9921e, weapon: 'sword' },
  thrall:  { tunic: 0x8a9090, trim: 0x5a6060, weapon: 'sword' },
  revenant: { tunic: 0x5e7a66, trim: 0x2e4a38, weapon: 'sword' },
  gravelord: { tunic: 0xc8bca0, trim: 0x4a4038, weapon: 'staff' },
  undying: { tunic: 0x3a2a4a, trim: 0xc9921e, weapon: 'sword' },
  boneguard: { tunic: 0xb0a890, trim: 0x6e6050, weapon: 'sword' },
  // ---- the Ashen Highlands ----
  kaska:   { tunic: 0x6e2a12, trim: 0xff7a30, weapon: 'staff' },  // Emberwarden gate NPC (warm/ember)
  golem:   { tunic: 0x161018, trim: 0x4a3a18, weapon: 'none' },   // Obsidian Golem (humanoid rig, scaled)
  wraith:  { tunic: 0x3a1818, trim: 0xff5020, weapon: 'staff' },  // Cinder Wraith (ranged caster)
  // ---- the Frostveil & the Starfall Sanctum ----
  rimebound:  { tunic: 0x2b4a6e, trim: 0x7fd4ff, weapon: 'none',  skin: 0xdfe9f5 },  // Rimebound Sentinel (frost-rimed)
  frostjarl:  { tunic: 0x3c4a63, trim: 0x9fe8ff, weapon: 'sword', skin: 0xbfdcf0 },  // Hrimnir the Avalanche-Jarl
  custodian:  { tunic: 0x232a4a, trim: 0xffd87a, weapon: 'staff', skin: 0xcfe8ff },  // Astral Custodian
  vaultwarden:{ tunic: 0x2c3460, trim: 0xffd87a, weapon: 'staff', skin: 0xffd87a },  // Seraphel the Vault Warden
  hollowstar: { tunic: 0x0d0a1c, trim: 0xffd87a, weapon: 'none',  skin: 0x14182e },  // Noctyra the Hollow Star
  odda:       { tunic: 0x5a6a4a, trim: 0xc9a14a, weapon: 'none' },   // Surveyor Odda: field greens, brass
  fenwick:    { tunic: 0x4a3e6e, trim: 0xe8d9a0, weapon: 'staff' },  // Archivist Fenwick: violet, parchment
  // ---- the Verdant Hollow ----
  bloomwarden:{ tunic: 0x2f5a2a, trim: 0xff5ea8, weapon: 'none', skin: 0x6e8a4a },  // the Hollow grew through a person
  greta:      { tunic: 0x3a5a2e, trim: 0xff5ea8, weapon: 'none' },                   // Greta Thornby, botanist-in-exile
  // ---- The Last Hour (the Horologium) ----
  cogwraith:  { tunic: 0x14161f, trim: 0x8a6a2a, weapon: 'staff', skin: 0x6a6a72 },  // basalt revenant, brass-veined
  khronaxis:  { tunic: 0x1a1d2e, trim: 0x8a6a2a, weapon: 'staff', skin: 0x4a4a5a },  // the kept hour, brass-haloed
  tamsin:     { tunic: 0x2e3a4a, trim: 0x8a6a2a, weapon: 'none' },                   // time-broken survivor (questgiver NPC)
};

export function buildHumanoid(style) {
  const s = CLASS_STYLES[style] || CLASS_STYLES.npc;
  const g = new THREE.Group();

  const skin = lambert(s.skin ?? 0xdba87a);
  const tunic = lambert(s.tunic);
  const trim = lambert(s.trim);
  const dark = lambert(0x3a2c1a);

  // torso
  const torso = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.36), tunic));
  torso.position.y = 1.06;
  g.add(torso);
  const belt = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.12, 0.4), trim));
  belt.position.y = 0.74;
  g.add(belt);

  // head
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.48;
  const head = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.34), skin));
  head.position.y = 0.2;
  const hair = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.38), dark));
  hair.position.y = 0.38;
  headPivot.add(head, hair);
  g.add(headPivot);

  // limbs: pivot at shoulder/hip, mesh hangs below
  function limb(w, len, mat, x, y) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, len, w), mat));
    m.position.y = -len / 2;
    pivot.add(m);
    g.add(pivot);
    return pivot;
  }
  const armL = limb(0.16, 0.62, tunic, -0.39, 1.36);
  const armR = limb(0.16, 0.62, tunic, 0.39, 1.36);
  const legL = limb(0.2, 0.7, dark, -0.17, 0.7);
  const legR = limb(0.2, 0.7, dark, 0.17, 0.7);

  // weapon attached to right hand
  let weapon = null;
  if (s.weapon === 'sword') {
    weapon = new THREE.Group();
    const blade = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.16), lambert(0xc9ccd4)));
    blade.position.y = -0.55;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.08), trim);
    guard.position.y = -0.12;
    weapon.add(blade, guard);
    weapon.position.y = -0.6;
    weapon.rotation.x = Math.PI; // blade points down at rest
    armR.add(weapon);
  } else if (s.weapon === 'staff') {
    weapon = new THREE.Group();
    const shaft = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 5), lambert(0x5a4426)));
    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.12, 0),
      new THREE.MeshBasicMaterial({ color: s.trim })
    );
    orb.position.y = 0.78;
    weapon.add(shaft, orb);
    weapon.position.y = -0.62;
    armR.add(weapon);
  } else if (s.weapon === 'bow') {
    weapon = new THREE.Group();
    const arc = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 5, 12, Math.PI), lambert(0x5a4426)));
    arc.rotation.z = -Math.PI / 2;
    weapon.add(arc);
    weapon.position.y = -0.6;
    armL.add(weapon); // bow in left hand
  }

  g.userData.rig = { armL, armR, legL, legR, headPivot, torso };
  g.userData.height = 1.9;
  return g;
}

export function buildBoar(elite = false, palette) {
  const g = new THREE.Group();
  const gold = palette === 'gold';
  const verdant = palette === 'verdant';
  const hide = lambert(verdant ? 0x4a6e3a : gold ? 0xc9a14a : elite ? 0x4a2c20 : 0x6e4a32);
  const dark = lambert(verdant ? 0x2e4a24 : gold ? 0x8a6a2a : 0x3a2418);

  const body = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.62, 0.58), hide));
  body.position.y = 0.55;
  const mane = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.6), dark));
  mane.position.set(0.1, 0.9, 0);
  g.add(body, mane);

  const headPivot = new THREE.Group();
  headPivot.position.set(0.55, 0.6, 0);
  const head = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.42), hide));
  head.position.x = 0.2;
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.22), dark);
  snout.position.set(0.5, -0.06, 0);
  const tuskMat = lambert(verdant ? 0xff5ea8 : gold ? 0xfff0c0 : 0xe8dcc0);
  const tuskL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 4), tuskMat);
  tuskL.position.set(0.42, -0.1, 0.14);
  tuskL.rotation.z = 0.6;
  const tuskR = tuskL.clone();
  tuskR.position.z = -0.14;
  headPivot.add(head, snout, tuskL, tuskR);
  g.add(headPivot);

  function leg(x, z) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.42, z);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.46, 0.14), dark);
    m.position.y = -0.2;
    pivot.add(m);
    g.add(pivot);
    return pivot;
  }
  const legs = [leg(0.34, 0.2), leg(0.34, -0.2), leg(-0.34, 0.2), leg(-0.34, -0.2)];

  g.userData.rig = { legs, headPivot };
  g.userData.height = 1.0;
  if (elite) g.scale.setScalar(2.1);
  return g;
}

export function buildWolf(palette) {
  const g = new THREE.Group();
  const frost = palette === 'frost';
  const verdant = palette === 'verdant';
  const sand = palette === 'sand';   // desiccated dust-hound of the Horologium
  const fur = lambert(verdant ? 0x4a6e3a : frost ? 0xdfe9f5 : sand ? 0xc2a878 : 0x5e6470);
  const dark = lambert(verdant ? 0x2e4a24 : frost ? 0x9fb6c8 : sand ? 0x8a7048 : 0x3a3e48);

  const body = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.42), fur));
  body.position.y = 0.62;
  g.add(body);

  const headPivot = new THREE.Group();
  headPivot.position.set(0.6, 0.78, 0);
  const head = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.34, 0.34), fur));
  head.position.x = 0.15;
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.2), dark);
  muzzle.position.set(0.42, -0.04, 0);
  const earGeo = new THREE.ConeGeometry(0.07, 0.18, 4);
  const earL = new THREE.Mesh(earGeo, dark);
  earL.position.set(0.05, 0.25, 0.1);
  const earR = earL.clone();
  earR.position.z = -0.1;
  headPivot.add(head, muzzle, earL, earR);
  if (frost || verdant || sand) {
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.05);
    const eyeMat = new THREE.MeshBasicMaterial({ color: frost ? 0x9fe8ff : sand ? 0xffb84a : 0xff5ea8 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.3, 0.04, 0.12);
    const eyeR = eyeL.clone();
    eyeR.position.z = -0.12;
    headPivot.add(eyeL, eyeR);
  }
  g.add(headPivot);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.12), dark);
  tail.position.set(-0.65, 0.72, 0);
  tail.rotation.z = 0.45;
  g.add(tail);

  function leg(x, z) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.5, z);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.12), dark);
    m.position.y = -0.24;
    pivot.add(m);
    g.add(pivot);
    return pivot;
  }
  const legs = [leg(0.4, 0.16), leg(0.4, -0.16), leg(-0.4, 0.16), leg(-0.4, -0.16)];

  g.userData.rig = { legs, headPivot };
  g.userData.height = 1.1;
  return g;
}

// Sporeling — a walking glowcap-mushroom-person (ranged caster). Faces +X like
// the other beasts (built on the beast rig contract: rig.legs[4] + headPivot, so
// the non-humanoid dispatch handles facing and it could fall back to animateBeast).
export function buildSporeling() {
  const g = new THREE.Group();
  const flesh = lambert(0x6e8a4a);
  const dark = lambert(0x4a5e2e);

  const body = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), flesh));
  body.position.y = 0.5;
  g.add(body);

  // domed glowcap head on a forward (+X) pivot, with glowing under-gills
  const headPivot = new THREE.Group();
  headPivot.position.set(0.4, 0.7, 0);
  const cap = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), lambert(0xff5ea8)));
  cap.scale.y = 0.5;       // flatten into a dome
  cap.position.y = 0.18;
  const gills = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.06, 8),
    new THREE.MeshBasicMaterial({ color: 0xff8ed0 }),
  );
  gills.position.y = 0.05;
  headPivot.add(cap, gills);
  g.add(headPivot);

  function leg(x, z) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.34, z);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), dark);
    m.position.y = -0.16;
    pivot.add(m);
    g.add(pivot);
    return pivot;
  }
  const legs = [leg(0.22, 0.16), leg(0.22, -0.16), leg(-0.22, 0.16), leg(-0.22, -0.16)];

  g.userData.rig = { legs, headPivot };
  g.userData.height = 1.4;
  return g;
}

// Hoarfrost Serpent — a hooded cobra. Faces +X like the other beasts; body
// segments trail away along -X so animateSerpent can undulate them laterally.
export function buildSerpent() {
  const g = new THREE.Group();
  const scales = lambert(0x7fd4ff);
  const belly = lambert(0xdfe9f5);
  const hoodInner = lambert(0x2b4a6e);

  // body: 4 tapering box segments behind the head along -X, each in its own
  // pivot Group so rotation/offset animation works like the other rigs.
  const segDims = [
    [0.9, 0.5, 0.55],
    [0.78, 0.43, 0.49],
    [0.64, 0.37, 0.42],
    [0.5, 0.3, 0.35],
  ];
  const segments = [];
  let sx = -0.45, sy = 0.5;
  segDims.forEach(([w, h, d], i) => {
    const pivot = new THREE.Group();
    pivot.position.set(sx, sy, 0);
    const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), i % 2 ? belly : scales));
    pivot.add(m);
    g.add(pivot);
    segments.push(pivot);
    sx -= 0.8;          // each segment -0.8x from the last
    sy -= 0.08;         // slight y-droop down the body
  });
  // lying tail cone past the last segment
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 5), scales);
  tail.position.set(sx, sy + 0.04, 0);
  tail.rotation.z = -Math.PI / 2;   // lying on its side, pointing -X
  g.add(tail);

  // head: wedge box at +X with fangs and eyes
  const headPivot = new THREE.Group();
  headPivot.position.set(0.55, 0.62, 0);
  const head = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.6), scales));
  head.position.x = 0.2;
  const fangGeo = new THREE.ConeGeometry(0.05, 0.2, 4);
  const fangMat = lambert(0xffffff);
  const fangL = new THREE.Mesh(fangGeo, fangMat);
  fangL.position.set(0.42, -0.22, 0.12);
  fangL.rotation.x = Math.PI;       // point down under the snout
  const fangR = fangL.clone();
  fangR.position.z = -0.12;
  const eyeGeo = new THREE.SphereGeometry(0.07, 8, 6);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x9fe8ff });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(0.3, 0.1, 0.18);
  const eyeR = eyeL.clone();
  eyeR.position.z = -0.18;
  headPivot.add(head, fangL, fangR, eyeL, eyeR);

  // hood: flattened fan box behind the head, tilted up ~35 degrees
  const hood = new THREE.Group();
  hood.position.set(-0.15, 0.05, 0);
  hood.rotation.z = 35 * Math.PI / 180;
  const hoodFan = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.7), hoodInner));
  hood.add(hoodFan);
  headPivot.add(hood);
  g.add(headPivot);

  g.userData.rig = { segments, headPivot, hood };
  g.userData.height = 1.0;
  return g;
}

export function buildDragon() {
  const g = new THREE.Group();
  const ash = lambert(0x5e4a48);
  const dark = lambert(0x3a2c2c);
  const ember = new THREE.MeshBasicMaterial({ color: 0xff7a30 });

  const body = shadowed(new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 1.5), ash));
  body.position.y = 1.5;
  const chest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.1), dark);
  chest.position.set(0.9, 1.3, 0);
  g.add(body, chest);

  const headPivot = new THREE.Group();
  headPivot.position.set(1.5, 2.0, 0);
  const neck = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.6), ash));
  neck.position.set(0.3, 0.15, 0);
  neck.rotation.z = 0.35;
  const head = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.6), dark));
  head.position.set(0.95, 0.45, 0);
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), ember);
  eyeL.position.set(1.1, 0.55, 0.31);
  const eyeR = eyeL.clone();
  eyeR.position.z = -0.31;
  const hornGeo = new THREE.ConeGeometry(0.09, 0.5, 4);
  const hornL = new THREE.Mesh(hornGeo, lambert(0xe8dcc0));
  hornL.position.set(0.7, 0.85, 0.18);
  hornL.rotation.z = -0.5;
  const hornR = hornL.clone();
  hornR.position.z = -0.18;
  headPivot.add(neck, head, eyeL, eyeR, hornL, hornR);
  g.add(headPivot);

  // wings flap from shoulder pivots
  const wings = [];
  [1, -1].forEach((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.2, 2.2, side * 0.5);
    const wing = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.6), dark));
    wing.position.z = side * 1.4;
    const tip = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 1.2), ash);
    tip.position.z = side * 2.6;
    pivot.add(wing, tip);
    pivot.userData.side = side;
    g.add(pivot);
    wings.push(pivot);
  });

  // tail segments
  let tx = -1.4, ty = 1.4, ts = 0.5;
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.9, ts, ts), i % 2 ? dark : ash);
    seg.position.set(tx, ty, 0);
    g.add(seg);
    tx -= 0.75; ty -= 0.12; ts *= 0.72;
  }

  function leg(x, z) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.0, z);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.0, 0.34), dark);
    m.position.y = -0.5;
    pivot.add(m);
    g.add(pivot);
    return pivot;
  }
  const legs = [leg(0.8, 0.55), leg(0.8, -0.55), leg(-0.8, 0.55), leg(-0.8, -0.55)];

  g.userData.rig = { legs, headPivot, wings };
  g.userData.height = 3.4;
  g.scale.setScalar(2.0);
  return g;
}

// ---- animation drivers ----
// state: { moving, speed, attackT (0..1 while attacking, else -1), dead }

export function animateHumanoid(group, state, elapsed) {
  const r = group.userData.rig;
  if (!r) return;
  if (state.dead) return;

  if (state.moving) {
    const ph = elapsed * 9 * (state.speed || 1);
    r.legL.rotation.x = Math.sin(ph) * 0.75;
    r.legR.rotation.x = Math.sin(ph + Math.PI) * 0.75;
    r.armL.rotation.x = Math.sin(ph + Math.PI) * 0.55;
    if (state.attackT < 0) r.armR.rotation.x = Math.sin(ph) * 0.55;
    group.position.y += Math.abs(Math.sin(ph)) * 0.05;
  } else {
    const idle = Math.sin(elapsed * 1.8) * 0.04;
    r.legL.rotation.x = 0;
    r.legR.rotation.x = 0;
    r.armL.rotation.x = idle;
    if (state.attackT < 0) r.armR.rotation.x = idle;
    r.torso.scale.y = 1 + idle * 0.4;
  }

  // attack swing: wind up then strike
  if (state.attackT >= 0) {
    const t = state.attackT;
    const swing = t < 0.35 ? -(t / 0.35) * 2.4 : -2.4 + ((t - 0.35) / 0.65) * 2.4;
    r.armR.rotation.x = swing;
  }
}

export function animateBeast(group, state, elapsed) {
  const r = group.userData.rig;
  if (!r || state.dead) return;

  if (r.wings) {
    const flap = Math.sin(elapsed * 3.2) * 0.3;
    r.wings.forEach((w) => (w.rotation.x = flap * w.userData.side));
  }

  if (state.moving) {
    const ph = elapsed * 11 * (state.speed || 1);
    r.legs[0].rotation.x = Math.sin(ph) * 0.7;
    r.legs[1].rotation.x = Math.sin(ph + Math.PI) * 0.7;
    r.legs[2].rotation.x = Math.sin(ph + Math.PI) * 0.7;
    r.legs[3].rotation.x = Math.sin(ph) * 0.7;
  } else {
    r.legs.forEach((l) => (l.rotation.x = 0));
    r.headPivot.rotation.x = Math.sin(elapsed * 1.3) * 0.08; // sniffing
  }

  if (state.attackT >= 0) {
    const t = state.attackT;
    r.headPivot.rotation.x = t < 0.4 ? (t / 0.4) * 0.5 : 0.5 - ((t - 0.4) / 0.6) * 1.1;
  }
}

export function animateSporeling(group, state, elapsed) {
  const r = group.userData.rig;
  if (!r || state.dead) return;   // rig assumed +X-facing (beast formula); guard corpse

  if (state.moving) {
    const ph = elapsed * 9 * (state.speed || 1);
    r.legs[0].rotation.x = Math.sin(ph) * 0.6;
    r.legs[1].rotation.x = Math.sin(ph + Math.PI) * 0.6;
    r.legs[2].rotation.x = Math.sin(ph + Math.PI) * 0.6;
    r.legs[3].rotation.x = Math.sin(ph) * 0.6;
    r.headPivot.rotation.z = Math.sin(ph) * 0.1;          // waddle body tilt
  } else {
    r.legs.forEach((l) => (l.rotation.x = 0));
    const breathe = 1 + Math.sin(elapsed * 1.5) * 0.06;   // cap "breathe"
    r.headPivot.scale.set(breathe, breathe, breathe);
    r.headPivot.rotation.z = 0;
    r.headPivot.rotation.x = Math.sin(elapsed * 1.3) * 0.06;  // gentle sniff
  }

  // attack: head rears back then puffs the spore-cloud forward (+X lunge + spike)
  if (state.attackT >= 0) {
    const t = state.attackT;
    const lunge = Math.sin(Math.min(t, 1) * Math.PI);     // 0 -> 1 -> 0
    r.headPivot.position.x = 0.4 + lunge * 0.3;
    const spike = 1 + lunge * 0.25;
    r.headPivot.scale.set(spike, spike, spike);
  } else if (!state.moving) {
    r.headPivot.position.x = 0.4;
  } else {
    r.headPivot.position.x = 0.4;
    r.headPivot.scale.set(1, 1, 1);
  }
}

export function animateSerpent(group, state, elapsed) {
  const r = group.userData.rig;
  if (!r || state.dead) return;  // shared fall-over in entities.js handles the corpse

  // idle/move: lateral sine undulation rippling down the body, each segment
  // phase-offset; amplitude and speed scale up while moving.
  const spd = state.speed || 1;
  const ph = elapsed * (state.moving ? 6 * spd : 2.2);
  const amp = state.moving ? 0.32 * spd : 0.14;
  r.segments.forEach((seg, i) => {
    seg.position.z = Math.sin(ph - i * 0.8) * amp;
    seg.rotation.y = Math.cos(ph - i * 0.8) * amp * 0.5;
  });

  // attack: head + hood lunge forward (+0.4 on x), hood flares wider then back.
  if (state.attackT >= 0) {
    const t = state.attackT;
    const lunge = Math.sin(Math.min(t, 1) * Math.PI);   // 0 -> 1 -> 0
    r.headPivot.position.x = 0.55 + lunge * 0.4;
    r.hood.scale.z = 1 + lunge * 0.3;                   // 1.0 -> 1.3 -> 1.0
  } else {
    r.headPivot.position.x = 0.55;
    r.hood.scale.z = 1;
  }
}

// Three slow gear-haloes wreathing Khronaxis' head — clones the sanctum orrery
// torus pattern as static attached decor. Brass wireframe rings at staggered
// radii/tilts, parented above the head (group-local; the rig scale carries them).
export function attachGearHaloes(group) {
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x8a6a2a, wireframe: true });
  const haloes = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9 - i * 0.22, 0.08, 6, 28), ringMat);
    ring.rotation.set(i * 0.7 + 0.4, i * 1.1, i * 0.4);
    haloes.add(ring);
  }
  haloes.position.y = 2.1;   // above the 1.9-tall humanoid head (group-local, pre-scale)
  group.add(haloes);
  return group;
}

export function applyDeathPose(group) {
  group.rotation.z = Math.PI / 2;
  group.position.y += 0.2;
}
