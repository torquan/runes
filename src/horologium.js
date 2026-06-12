import * as THREE from 'three';
import { HOROLOGIUM } from './noise.js';

// The Horologium — "The Last Hour": a clockwork tomb buried at the bottom of the
// Verdant Hollow's spiral, where Time itself was kept so the world wouldn't end.
// Crypt/Sanctum plan rotated to run south->north over z 202..318.
//
// COORDINATE RESOLUTION (READ THIS — highest-risk coordination point):
//   The pocket box is x250..360, z200..320 (noise.js HOROLOGIUM). Like CRYPT
//   (which sits in the SAME x250..360 band and centers its geometry on x≈305),
//   this dungeon is built CENTERED ON x≈305, NOT x=0. The shared CONTRACT's
//   x=0 boss-room centers and x=0 portal dests are WRONG for this pocket and are
//   SUPERSEDED here. The correct, authoritative coords (engine HOROLOGIUM_SITES
//   and the entry-portal dest MUST match these):
//       arrival / exit portal : (305, 210)
//       Quaranth (Pendulum Hall) : (305, 245)
//       Echo (Stilled Vault)     : (305, 278)
//       Khronaxis (Heart)        : (305, 303)
//   The centerline (door lane) is x = 305 ± 2  →  world x ∈ [303, 307].
//   ZONE_BOUNDS.horologium = { x1:252, x2:358, z1:202, z2:318 } is correct for
//   this scheme (the pocket box, inset 2u), since the rooms span x ≈ 289..321.

const F = HOROLOGIUM.floor;       // 60
const WALL_H = 5;
const CX = (HOROLOGIUM.x1 + HOROLOGIUM.x2) / 2;   // 305 — the centerline

// wall segments as thin AABBs in WORLD coords: [x1, z1, x2, z2] (thickness ~1).
// Built around the centerline x=305. Doors are GAPS in the x∈[303,307] lane
// (±2 from center) so the player walks the centerline through every room.
// Layout runs south (z202) -> north (z318), 7 rooms:
//   1 Entry Antechamber (arrival)      x 294..316, z 204..222
//   2 Corridor A                       x 302..308, z 222..234
//   3 Pendulum Hall (Quaranth @305,245) x 291..319, z 234..258  (WIDE arena)
//   4 Corridor B                       x 302..308, z 258..270
//   5 Stilled Vault (Echo @305,278)    x 292..318, z 270..290
//   6 Final Corridor (the sand stops)  x 302..308, z 290..296
//   7 Heart of the Hourglass           x 289..321, z 296..318  (LARGEST — shatterfloor)
//      (Khronaxis @305,303)
const WALLS = [
  // -- Room 1: Entry Antechamber  x 294..316, z 204..222
  [294, 204, 295, 222], [315, 204, 316, 222],            // side walls
  [294, 204, 316, 205],                                  // south (back) wall
  [294, 221, 303, 222], [307, 221, 316, 222],            // north wall w/ door gap

  // -- Room 2: Corridor A  x 302..308, z 222..234
  [301, 222, 302, 234], [308, 222, 309, 234],

  // -- Room 3: Pendulum Hall (Quaranth arena, center 305,245)  x 291..319, z 234..258
  [291, 234, 292, 258], [318, 234, 319, 258],            // side walls
  [291, 234, 303, 235], [307, 234, 319, 235],            // south wall w/ door gap
  [291, 257, 303, 258], [307, 257, 319, 258],            // north wall w/ door gap

  // -- Room 4: Corridor B  x 302..308, z 258..270
  [301, 258, 302, 270], [308, 258, 309, 270],

  // -- Room 5: Stilled Vault (Echo arena, center 305,278)  x 292..318, z 270..290
  [292, 270, 293, 290], [317, 270, 318, 290],            // side walls
  [292, 270, 303, 271], [307, 270, 318, 271],            // south wall w/ door gap
  [292, 289, 303, 290], [307, 289, 318, 290],            // north wall w/ door gap

  // -- Room 6: Final Corridor  x 302..308, z 290..296
  [301, 290, 302, 296], [308, 290, 309, 296],

  // -- Room 7: Heart of the Hourglass (Khronaxis arena, center 305,303)  x 289..321, z 296..318
  [289, 296, 290, 318], [320, 296, 321, 318],            // side walls
  [289, 296, 303, 297], [307, 296, 321, 297],            // south wall w/ door gap
  [289, 317, 321, 318],                                  // north (back) wall — sealed
];

export function buildHorologium(scene) {
  const group = new THREE.Group();

  const basalt = new THREE.MeshLambertMaterial({ color: 0x14161f });   // black basalt walls
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x0e0f16 });  // near-black floor
  const brass = new THREE.MeshLambertMaterial({ color: 0x8a6a2a });    // brass inlay/decor
  const darkBrass = new THREE.MeshLambertMaterial({ color: 0x5a4620 });

  // floor — runs the length of the hall (south->north), centered on the pocket
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(CX, F, (HOROLOGIUM.z1 + HOROLOGIUM.z2) / 2);   // (305, 60, 260)
  floor.receiveShadow = true;
  group.add(floor);

  // walls (+ a brass inlay quad on a few of the longer ones for the veined look)
  const wallBoxes = [];
  WALLS.forEach(([x1, z1, x2, z2], idx) => {
    const w = x2 - x1, d = z2 - z1;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, d), basalt);
    mesh.position.set((x1 + x2) / 2, F + WALL_H / 2, (z1 + z2) / 2);
    mesh.castShadow = true;
    group.add(mesh);
    wallBoxes.push({ x1, z1, x2, z2 });
    // brass inlay vein on long side walls (the dim brass veining)
    if (Math.max(w, d) > 8) {
      const horiz = w > d;
      const inlay = new THREE.Mesh(
        new THREE.BoxGeometry(horiz ? w * 0.9 : 0.12, 0.5, horiz ? 0.12 : d * 0.9),
        brass
      );
      const inset = horiz ? (z1 < CX ? 0.55 : -0.55) : ((x1 + x2) / 2 < CX ? 0.55 : -0.55);
      inlay.position.set(
        (x1 + x2) / 2 + (horiz ? 0 : inset),
        F + 2.4,
        (z1 + z2) / 2 + (horiz ? inset : 0)
      );
      group.add(inlay);
    }
  });

  // ---- 4 PointLights: brass-gold near the entry/gates, cold-blue in the deeps ----
  [[CX, 212, 0xffd87a], [CX, 245, 0x8a6a2a], [CX, 278, 0xcfe8ff], [CX, 305, 0xcfe8ff]]
    .forEach(([lx, lz, color]) => {
      const light = new THREE.PointLight(color, 30, 40, 1.6);
      light.position.set(lx, F + 4, lz);
      group.add(light);
    });

  // ---- turning gear-disc decor (CylinderGeometry rings; animated in update) ----
  // mounted flat on the walls / floor of corridors and arenas, slowly rotating.
  const gearMat = new THREE.MeshLambertMaterial({ color: 0x8a6a2a });
  const gearDarkMat = new THREE.MeshLambertMaterial({ color: 0x4a3a1c });
  const gears = [];
  const gearSpots = [
    { x: CX - 1.6, z: 228, r: 1.0, tilt: Math.PI / 2 },     // corridor A wall gear
    { x: CX + 1.6, z: 228, r: 0.8, tilt: Math.PI / 2 },
    { x: CX - 12, z: 246, r: 2.4, tilt: 0 },                // Pendulum Hall floor gears
    { x: CX + 12, z: 246, r: 2.0, tilt: 0 },
    { x: CX - 1.6, z: 264, r: 1.0, tilt: Math.PI / 2 },     // corridor B wall gear
    { x: CX + 1.6, z: 264, r: 0.8, tilt: Math.PI / 2 },
    { x: CX - 10, z: 278, r: 1.8, tilt: 0 },                // Stilled Vault gears
    { x: CX + 10, z: 278, r: 1.5, tilt: 0 },
    { x: CX - 13, z: 312, r: 2.6, tilt: 0 },                // Heart gears
    { x: CX + 13, z: 312, r: 2.2, tilt: 0 },
  ];
  for (const g of gearSpots) {
    const gear = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(g.r, g.r, 0.18, 18), gearDarkMat);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(g.r, 0.12, 6, 18), gearMat);
    rim.rotation.x = Math.PI / 2;
    // a few spokes
    for (let s = 0; s < 6; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(g.r * 1.6, 0.1, 0.14), gearMat);
      spoke.rotation.y = (s / 6) * Math.PI;
      gear.add(spoke);
    }
    gear.add(disc, rim);
    // lay flat on floor (tilt 0) or stand on the wall (tilt PI/2)
    if (g.tilt) gear.rotation.x = g.tilt;
    gear.position.set(g.x, g.tilt ? F + 1.6 : F + 0.12, g.z);
    group.add(gear);
    gears.push({ group: gear, speed: 0.12 + g.r * 0.04 * (g.x < CX ? 1 : -1) });
  }

  // ---- pendulum shards swinging from the dark (sine-swing in update) ----
  const pendMat = new THREE.MeshLambertMaterial({ color: 0x2a2c38, emissive: 0x1a140a });
  const pendulums = [];
  const pendSpots = [
    { x: CX - 7, z: 244 }, { x: CX + 7, z: 247 },        // Pendulum Hall (the namesake)
    { x: CX, z: 240 }, { x: CX, z: 252 },
    { x: CX - 6, z: 280 }, { x: CX + 6, z: 276 },        // Stilled Vault
  ];
  pendSpots.forEach((p, i) => {
    const pivot = new THREE.Group();
    pivot.position.set(p.x, F + WALL_H - 0.2, p.z);       // hung from the ceiling line
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 6), darkBrass);
    rod.position.y = -1.5;
    const bob = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.0, 6), pendMat);
    bob.rotation.x = Math.PI;                              // point down
    bob.position.y = -3.2;
    pivot.add(rod, bob);
    group.add(pivot);
    pendulums.push({ pivot, phase: i * 1.1, amp: 0.22 + (i % 3) * 0.06 });
  });

  // ---- cracked sundial decor in the entry room (a flat dial + a leaning gnomon) ----
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.2, 24), darkBrass);
  dial.position.set(CX - 6, F + 0.1, 212);
  const dialRim = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.1, 6, 24), gearMat);
  dialRim.rotation.x = Math.PI / 2;
  dialRim.position.set(CX - 6, F + 0.2, 212);
  const gnomon = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.8, 0.5), gearMat);
  gnomon.position.set(CX - 6, F + 0.9, 212);
  gnomon.rotation.z = 0.4;                                 // cracked, leaning
  group.add(dial, dialRim, gnomon);

  // ---- slow DOWNWARD "sand" Points field (inverted sanctum motes) ----
  const sandCount = 90;
  const sandGeo = new THREE.BufferGeometry();
  const sandPos = new Float32Array(sandCount * 3);
  const sandSeed = new Float32Array(sandCount);
  for (let i = 0; i < sandCount; i++) {
    sandPos[i * 3] = CX + (Math.sin(i * 12.9)) * 13;
    sandPos[i * 3 + 1] = F + 0.5 + (i / sandCount) * (WALL_H - 0.5);
    sandPos[i * 3 + 2] = HOROLOGIUM.z1 + 8 + (Math.abs(Math.sin(i * 5.7))) * 100;
    sandSeed[i] = i;
  }
  sandGeo.setAttribute('position', new THREE.BufferAttribute(sandPos, 3));
  const sand = new THREE.Points(sandGeo, new THREE.PointsMaterial({
    color: 0xd8c79a, size: 0.13, transparent: true, opacity: 0.7,
  }));
  group.add(sand);

  // ---- inside-the-entry signpost prop (post + angled board) — decor, NOT a portal ----
  const signMat = new THREE.MeshLambertMaterial({ color: 0x2a2c38 });
  {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.2, 6), signMat);
    post.position.set(CX, F + 1.1, 214);
    const board = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 0.15), signMat);
    board.position.set(CX, F + 2.0, 214);
    board.rotation.y = -0.4;
    post.castShadow = board.castShadow = true;
    group.add(post, board);
    // (label text is rendered by main.js via the signs F-prompt for the Hollow side;
    //  this is a flavor prop. The Verge-expedition line lives near here per §B.6.)
  }

  // ---- exit portal swirl (entry antechamber, near arrival x305,z210) ----
  const swirlMat = new THREE.MeshBasicMaterial({
    color: 0x6fffb0, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
  });
  const swirlOut = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), swirlMat);
  swirlOut.position.set(CX, F + 1.9, 210);
  group.add(swirlOut);

  scene.add(group);

  return {
    walls: wallBoxes,
    portals: [
      {
        x: CX, z: 210, label: 'Climb back to the Hollow',
        dest: { x: 2.5, z: -329, zone: 'hollow' },
        arriveMsg: 'Green light again. The Hollow kept growing while you were gone. It always does.',
      },
    ],
    update(elapsed) {
      // turn the gear-discs, each at its own lazy pace (sign = direction)
      for (const g of gears) g.group.rotation.z = elapsed * g.speed;

      // swing the pendulum shards (sine, framerate-independent)
      for (const p of pendulums) p.pivot.rotation.x = Math.sin(elapsed * 1.2 + p.phase) * p.amp;

      // exit swirl shimmer (the green pull of the Hollow above)
      swirlOut.material.opacity = 0.5 + Math.sin(elapsed * 2.2) * 0.18;
      swirlOut.rotation.z = elapsed * 0.8;

      // drift the sand DOWNWARD, wrapping back to the ceiling (inverted motes)
      const arr = sand.geometry.attributes.position.array;
      const span = WALL_H - 0.5;
      const base = F + 0.5;
      for (let i = 0; i < sandCount; i++) {
        const speed = 0.4 + (sandSeed[i] % 5) * 0.12;     // u/s, per-grain
        // count DOWN through the span, then wrap to the top
        arr[i * 3 + 1] = base + span - ((sandSeed[i] * 0.37 + elapsed * speed) % span);
      }
      sand.geometry.attributes.position.needsUpdate = true;
    },
  };
}
