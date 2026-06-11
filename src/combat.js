import * as THREE from 'three';
import { heightAt, HIGHLANDS } from './noise.js';
import { aggroEnemy, killEnemy } from './entities.js';
import { rollDrops, rarityColor } from './items.js';
import { gcdValue, healRecvMult } from './talents.js';

// ---------- particle bursts ----------
export function createFx(scene) {
  const bursts = [];
  return {
    burst(pos, color, count = 14) {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const vels = [];
      for (let i = 0; i < count; i++) {
        positions[i * 3] = pos.x;
        positions[i * 3 + 1] = pos.y + 1;
        positions[i * 3 + 2] = pos.z;
        vels.push(new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          Math.random() * 5 + 1.5,
          (Math.random() - 0.5) * 5
        ));
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({ color, size: 0.16, transparent: true, opacity: 1 });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      bursts.push({ points, vels, life: 0.75, geo, mat });
    },
    update(dt) {
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.life -= dt;
        const p = b.geo.attributes.position.array;
        for (let j = 0; j < b.vels.length; j++) {
          b.vels[j].y -= 9 * dt;
          p[j * 3] += b.vels[j].x * dt;
          p[j * 3 + 1] += b.vels[j].y * dt;
          p[j * 3 + 2] += b.vels[j].z * dt;
        }
        b.geo.attributes.position.needsUpdate = true;
        b.mat.opacity = Math.max(0, b.life / 0.75);
        if (b.life <= 0) {
          scene.remove(b.points);
          b.geo.dispose();
          b.mat.dispose();
          bursts.splice(i, 1);
        }
      }
    },
  };
}

// ---------- combat core ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const projectiles = [];
let pendingMelee = null; // { t, enemy, dmg, crit }

// big bodies have edges: range checks measure to the model's bulk, not its center
function reachOf(enemy) {
  return (enemy.group.scale.x || 1) * 0.8;
}

export function clickTarget(game, clientX, clientY) {
  const rect = game.renderer.domElement.getBoundingClientRect();
  ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, game.camera);

  const alive = game.enemies.filter((e) => e.alive);
  const groups = alive.map((e) => e.group);
  const hits = raycaster.intersectObjects(groups, true);
  if (hits.length) {
    let obj = hits[0].object;
    while (obj.parent && !groups.includes(obj)) obj = obj.parent;
    const enemy = alive[groups.indexOf(obj)];
    if (enemy) { setTarget(game, enemy); return true; }
  }
  // clicking an NPC opens its dialog when close enough
  for (const n of game.npcs) {
    const hits = raycaster.intersectObject(n.group, true);
    if (hits.length && game.player.group.position.distanceTo(n.group.position) < 6) {
      (n === game.npc ? game.quests : game.highlandQuests).openDialog(game);
      return true;
    }
  }
  return false;
}

export function tabTarget(game) {
  const p = game.player.group.position;
  const candidates = game.enemies
    .filter((e) => e.alive && e.group.position.distanceTo(p) < 32)
    .sort((a, b) => a.group.position.distanceTo(p) - b.group.position.distanceTo(p));
  if (!candidates.length) return;
  const idx = candidates.indexOf(game.player.target);
  setTarget(game, candidates[(idx + 1) % candidates.length]);
}

function setTarget(game, enemy) {
  game.player.target = enemy;
  game.ui.refreshTarget(game);
}

// ---------- damage ----------
function applyDamage(game, enemy, dmg, crit, skillName) {
  if (!enemy.alive) return;
  // flat armor: a throughput tax (e.g. golems), never a wall (min 1). Applied
  // after the crit roll so the shown number matches HP lost; projectiles & AoE
  // inherit it for free since they all funnel through here.
  const armor = enemy.type.armor || 0;
  if (armor) dmg = Math.max(1, dmg - armor);
  enemy.hp -= dmg;
  game.player.combatTimer = 5;
  aggroEnemy(enemy);
  game.ui.floatText(enemy.group.position, String(dmg), crit ? 'crit' : '');
  game.ui.log(
    `Your ${skillName} ${crit ? 'CRITS' : 'hits'} ${enemy.name} for ${dmg}.`,
    'log-dmg'
  );
  crit ? game.audio.crit() : game.audio.hit();
  game.fx.burst(enemy.group.position, crit ? 0xffd76e : 0xff6644, crit ? 18 : 9);

  if (enemy.hp <= 0) {
    enemy.hp = 0;
    onKill(game, enemy);
  }
}

function onKill(game, enemy) {
  killEnemy(enemy, game);
  game.audio.kill();
  game.ui.log(`${enemy.name} dies.`, 'log-sys');
  if (game.player.target === enemy) game.player.target = null;

  // elites pay full XP once; repeat farm kills pay 20% (gold/loot unaffected)
  let xp = enemy.type.xp;
  if (enemy.elite) {
    if (game.slain.has(enemy.kind)) {
      xp = Math.round(xp * 0.2);
      game.ui.log(`${enemy.name} yields little new experience.`, 'log-sys');
    } else {
      game.slain.add(enemy.kind);
    }
  }
  game.player.gainXp(game, xp);
  const [gMin, gMax] = enemy.type.gold;
  game.player.gainGold(game, Math.round(gMin + Math.random() * (gMax - gMin)));

  const runeChance = enemy.elite ? 1 : 0.22;
  if (Math.random() < runeChance) {
    const n = enemy.elite ? 3 : 1;
    game.player.runes += n;
    game.audio.loot();
    game.ui.log(`A glowing rune tumbles from the corpse! (+${n})`, 'log-loot');
    game.fx.burst(enemy.group.position, 0x8ad9ff, 16);
  }

  // gear drops — rarity-colored log line + floating loot text + a burst
  const drops = rollDrops(enemy);
  for (const item of drops) {
    game.player.addItem(game, item);
    game.audio.loot();
    game.ui.log(`${enemy.name} drops ${item.name}!`, 'log-loot-' + item.rarity);
    game.ui.floatText(enemy.group.position, item.name, 'loot-' + item.rarity);
    game.fx.burst(enemy.group.position, parseInt(rarityColor(item.rarity).slice(1), 16), 16);
  }
  if (drops.length) game.save?.();

  // both chains see every kill; each ignores kinds it doesn't track and each
  // bounty only counts its own zone's creatures (gated in quests.js).
  game.quests.onKill(game, enemy);
  game.highlandQuests.onKill(game, enemy);
}

function rollDamage(player, mult) {
  const base = player.baseDamage() * mult;
  const variance = 0.9 + Math.random() * 0.2;
  const crit = Math.random() < player.critChance();
  return { dmg: Math.max(1, Math.round(base * variance * (crit ? 1.8 : 1))), crit };
}

// ---------- projectiles ----------
function fireProjectile(game, enemy, color, dmg, crit, skillName, selfHealPct = 0) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 6, 6),
    new THREE.MeshBasicMaterial({ color })
  );
  mesh.position.copy(game.player.group.position);
  mesh.position.y += 1.4;
  game.scene.add(mesh);
  game.audio.bolt();
  projectiles.push({ mesh, enemy, dmg, crit, skillName, selfHealPct, speed: 26 });
}

const v1 = new THREE.Vector3();

// ---------- skills ----------
export function castSkill(game, index) {
  const p = game.player;
  if (!p.alive || p.casting) return;
  const skill = p.barSkills()[index];
  if (!skill) return;

  if (p.gcd > 0 || (p.cooldowns[skill.id] || 0) > 0) return;
  if (p.mp < skill.mana) {
    game.ui.log('Not enough mana.', 'log-sys');
    return;
  }

  const needsTarget = skill.kind === 'damage' || skill.kind === 'execute'
    || (skill.kind === 'aoe' && skill.aoeCenter === 'target');
  if (needsTarget) {
    const t = p.target;
    if (!t || !t.alive) { game.ui.log('You need a target.', 'log-sys'); return; }
    if (p.group.position.distanceTo(t.group.position) > skill.range + reachOf(t)) {
      game.ui.log('Target is out of range.', 'log-sys');
      return;
    }
    // face the target
    v1.subVectors(t.group.position, p.group.position);
    p.group.rotation.y = Math.atan2(v1.x, v1.z);
  }

  if (skill.cast > 0) {
    p.casting = { skill, t: 0, dur: skill.cast };
    game.ui.showCastBar(skill.name);
    game.audio.cast();
  } else {
    resolveSkill(game, skill);
  }
}

function resolveSkill(game, skill) {
  const p = game.player;
  p.mp -= skill.mana;
  if (skill.cd > 0) p.cooldowns[skill.id] = skill.cd;
  p.gcd = gcdValue(p.talents);
  p.anim.attackT = 0;
  game.ui.pulseSlot(p.barSkills().indexOf(skill));

  if (skill.kind === 'heal') {
    const amount = Math.round(p.maxHp * skill.healPct * (1 + p.gearStat('healPower')) * healRecvMult(p.talents));
    p.hp = Math.min(p.maxHp, p.hp + amount);
    game.ui.floatText(p.group.position, `+${amount}`, 'heal');
    game.ui.log(`${skill.name} restores ${amount} health.`, 'log-heal');
    game.audio.heal();
    game.fx.burst(p.group.position, 0x9dff8a, 14);
    return;
  }

  if (skill.kind === 'mana') {
    const amount = Math.round(p.maxMp * skill.manaPct);
    p.mp = Math.min(p.maxMp, p.mp + amount);
    game.ui.floatText(p.group.position, `+${amount} MP`, 'heal');
    game.ui.log(`${skill.name} restores ${amount} mana.`, 'log-heal');
    game.audio.rune();
    game.fx.burst(p.group.position, 0xb08aff, 14);
    return;
  }

  if (skill.kind === 'execute') {
    const t = p.target;
    if (!t || !t.alive) return;
    if (t.hp / t.maxHp > skill.hpThreshold) {
      game.ui.log(`${t.name} is too healthy to execute (needs <30% HP).`, 'log-sys');
      // refund: undo the cost/cd we just paid so it doesn't waste the button
      p.mp += skill.mana;
      p.cooldowns[skill.id] = 0;
      p.gcd = 0;
      return;
    }
    const { dmg, crit } = rollDamage(p, skill.mult);
    if (p.cls.ranged || skill.range > 5) fireProjectile(game, t, skill.color, dmg, crit, skill.name);
    else applyDamage(game, t, dmg, crit, skill.name);
    return;
  }

  if (skill.kind === 'stoneform') {
    p.stoneformT = skill.duration;
    game.ui.floatText(p.group.position, 'Stoneform!', 'heal');
    game.ui.log('You harden into living stone — 50% damage reduction for 6s.', 'log-heal');
    game.audio.rune();
    game.fx.burst(p.group.position, 0x9ad0ff, 26);
    return;
  }

  if (skill.kind === 'dash') {
    const g = p.group;
    const yaw = g.rotation.y;                       // humanoid faces +Z: forward = (sin yaw, cos yaw)
    let nx = g.position.x + Math.sin(yaw) * skill.distance;
    let nz = g.position.z + Math.cos(yaw) * skill.distance;
    // respect zone bounds (mirror updatePlayer's clamps)
    if (game.zone === 'crypt') { nx = THREE.MathUtils.clamp(nx, 252, 358); nz = THREE.MathUtils.clamp(nz, -58, 58); }
    else { nx = THREE.MathUtils.clamp(nx, -150, HIGHLANDS.EAST_EDGE); nz = THREE.MathUtils.clamp(nz, -150, 150); }
    g.position.x = nx; g.position.z = nz;
    g.position.y = Math.max(g.position.y, heightAt(nx, nz));   // land on ground at destination
    p.onGround = true; p.vy = 0;
    game.ui.floatText(g.position, 'Dash!', 'heal');
    game.audio.bolt();
    game.fx.burst(g.position, 0x8aff9d, 22);
    return;
  }

  if (skill.kind === 'damage') {
    const t = p.target;
    if (!t || !t.alive) return;
    const { dmg, crit } = rollDamage(p, skill.mult);
    if (p.cls.ranged || skill.range > 5) {
      fireProjectile(game, t, skill.color, dmg, crit, skill.name, skill.selfHealPct || 0);
    } else {
      applyDamage(game, t, dmg, crit, skill.name);
      if (skill.selfHealPct) selfHeal(game, Math.round(dmg * skill.selfHealPct));
    }
    return;
  }

  if (skill.kind === 'aoe') {
    const center = skill.aoeCenter === 'self'
      ? p.group.position
      : p.target.group.position;
    game.fx.burst(center, new THREE.Color(skill.color).getHex(), 26);
    game.audio.bolt();
    let hits = 0;
    for (const e of game.enemies) {
      if (!e.alive) continue;
      if (e.group.position.distanceTo(center) <= skill.aoeRadius + reachOf(e)) {
        const { dmg, crit } = rollDamage(p, skill.mult);
        applyDamage(game, e, dmg, crit, skill.name);
        hits++;
      }
    }
    if (!hits) game.ui.log(`${skill.name} strikes only air.`, 'log-sys');
  }
}

function selfHeal(game, amount) {
  const p = game.player;
  const healed = Math.round(amount * healRecvMult(p.talents));   // Bulwark Mending applies to lifesteal too
  p.hp = Math.min(p.maxHp, p.hp + healed);
  game.ui.floatText(p.group.position, `+${healed}`, 'heal');
}

// ---------- per-frame ----------
export function updateCombat(game, dt) {
  const p = game.player;

  // casting progress
  if (p.casting) {
    p.casting.t += dt;
    game.ui.updateCastBar(p.casting.t / p.casting.dur);
    if (p.casting.t >= p.casting.dur) {
      const skill = p.casting.skill;
      p.casting = null;
      game.ui.hideCastBar();
      resolveSkill(game, skill);
    }
  }

  // auto-attack
  const t = p.target;
  if (p.alive && t && t.alive && !p.casting && p.attackCd <= 0) {
    const dist = p.group.position.distanceTo(t.group.position);
    if (dist <= p.cls.autoRange + reachOf(t)) {
      p.attackCd = 1.7;
      p.anim.attackT = 0;
      v1.subVectors(t.group.position, p.group.position);
      p.group.rotation.y = Math.atan2(v1.x, v1.z);
      const { dmg, crit } = rollDamage(p, 1.0);
      if (p.cls.ranged) {
        fireProjectile(game, t, '#ffe9b0', dmg, crit, 'auto attack');
        game.audio.arrow();
      } else {
        pendingMelee = { t: 0.22, enemy: t, dmg, crit };
      }
    }
  }

  // melee impact lands mid-swing
  if (pendingMelee) {
    pendingMelee.t -= dt;
    if (pendingMelee.t <= 0) {
      const m = pendingMelee;
      pendingMelee = null;
      if (m.enemy.alive && p.alive &&
          p.group.position.distanceTo(m.enemy.group.position) < p.cls.autoRange + reachOf(m.enemy) + 1.5) {
        applyDamage(game, m.enemy, m.dmg, m.crit, 'attack');
      }
    }
  }

  // projectiles home toward their mark
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const pr = projectiles[i];
    v1.copy(pr.enemy.group.position);
    v1.y += pr.enemy.group.userData.height ? pr.enemy.group.userData.height * 0.5 : 0.8;
    const d = pr.mesh.position.distanceTo(v1);
    if (d < 0.6 || !pr.enemy.alive) {
      if (pr.enemy.alive) {
        applyDamage(game, pr.enemy, pr.dmg, pr.crit, pr.skillName);
        if (pr.selfHealPct) selfHeal(game, Math.round(pr.dmg * pr.selfHealPct));
      }
      game.scene.remove(pr.mesh);
      pr.mesh.geometry.dispose();
      pr.mesh.material.dispose();
      projectiles.splice(i, 1);
      continue;
    }
    v1.sub(pr.mesh.position).normalize().multiplyScalar(pr.speed * dt);
    pr.mesh.position.add(v1);
  }
}

export function useRune(game) {
  const p = game.player;
  if (p.runes <= 0) {
    game.ui.log('Your rune pouch is empty.', 'log-sys');
    return;
  }
  p.runes--;
  p.runeBonus++;
  game.audio.rune();
  game.fx.burst(p.group.position, 0x8ad9ff, 22);
  game.ui.floatText(p.group.position, 'Weapon empowered!', 'heal');
  game.ui.log(`The rune dissolves into your weapon. (+1 damage, total +${p.runeBonus})`, 'log-loot');
  game.save?.();
}
