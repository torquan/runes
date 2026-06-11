import * as THREE from 'three';
import { fbm, heightAt, WORLD_SIZE } from './noise.js';
import { SHOP } from './player.js';

const $ = (id) => document.getElementById(id);

const projV = new THREE.Vector3();

function worldToScreen(game, pos, yOffset = 0) {
  projV.set(pos.x, pos.y + yOffset, pos.z);
  projV.project(game.camera);
  if (projV.z > 1) return null; // behind camera
  const rect = game.renderer.domElement.getBoundingClientRect();
  return {
    x: (projV.x * 0.5 + 0.5) * rect.width,
    y: (-projV.y * 0.5 + 0.5) * rect.height,
  };
}

export function createUi() {
  const overlay = $('overlay');
  const plates = new Map(); // entity -> element
  const fcts = []; // floating combat text
  const slots = []; // action bar slot refs
  let logCount = 0;

  // pre-render the minimap terrain once
  const mapImg = document.createElement('canvas');
  const MAP_RES = 200;
  mapImg.width = mapImg.height = MAP_RES;
  {
    const mctx = mapImg.getContext('2d');
    const img = mctx.createImageData(MAP_RES, MAP_RES);
    for (let py = 0; py < MAP_RES; py++) {
      for (let px = 0; px < MAP_RES; px++) {
        const wx = (px / MAP_RES - 0.5) * WORLD_SIZE;
        const wz = (py / MAP_RES - 0.5) * WORLD_SIZE;
        const h = heightAt(wx, wz);
        const tint = fbm(wx * 0.05 + 3.3, wz * 0.05 + 8.8, 3);
        let r = 90 - tint * 25, g = 140 - tint * 30, b = 60;
        if (h > 9) { const k = Math.min(1, (h - 9) / 7); r += (120 - r) * k; g += (118 - g) * k; b += (108 - b) * k; }
        if (h < -1) { r = 60; g = 100; b = 150; }
        const forest = fbm(wx * 0.03 + 51, wz * 0.03 + 17, 3);
        if (forest > 0.52 && h <= 9) { r *= 0.72; g *= 0.85; b *= 0.72; }
        const i = (py * MAP_RES + px) * 4;
        img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
      }
    }
    mctx.putImageData(img, 0, 0);
  }

  const ui = {
    // ---------- combat log ----------
    log(msg, cls = '') {
      const el = $('combat-log');
      const p = document.createElement('p');
      p.textContent = msg;
      if (cls) p.className = cls;
      el.appendChild(p);
      if (++logCount > 40) el.removeChild(el.firstChild);
      el.scrollTop = el.scrollHeight;
    },

    // ---------- floating combat text ----------
    floatText(pos, text, cls = '') {
      if (fcts.length > 30) return;
      const el = document.createElement('div');
      el.className = `fct ${cls}`;
      el.textContent = text;
      overlay.appendChild(el);
      const entry = { el, pos: pos.clone(), offset: (Math.random() - 0.5) * 40 };
      fcts.push(entry);
      el.addEventListener('animationend', () => {
        el.remove();
        const i = fcts.indexOf(entry);
        if (i >= 0) fcts.splice(i, 1);
      });
    },

    // ---------- action bar ----------
    buildActionBar(game, onCast) {
      const bar = $('action-bar');
      bar.innerHTML = '';
      slots.length = 0;
      game.player.allSkills().forEach((skill, i) => {
        const slot = document.createElement('div');
        slot.className = 'skill-slot';
        slot.innerHTML = `
          <span class="s-key">${i + 1}</span>
          <span class="s-icon" style="color:${skill.color}">${skill.icon}</span>
          <span class="s-cd"></span>
          <span class="s-tip"><b>${skill.name}</b>${skill.desc}<br><i>${skill.mana ? skill.mana + ' mana · ' : ''}${skill.cd ? skill.cd + 's cooldown' : 'no cooldown'}${skill.cast ? ' · ' + skill.cast + 's cast' : ''}</i></span>`;
        slot.addEventListener('mousedown', (e) => { e.stopPropagation(); onCast(i); });
        bar.appendChild(slot);
        slots.push({ el: slot, cdEl: slot.querySelector('.s-cd'), skill });
      });
    },

    pulseSlot(i) {
      const s = slots[i];
      if (!s) return;
      s.el.classList.add('pressed');
      setTimeout(() => s.el.classList.remove('pressed'), 120);
    },

    // ---------- per-frame refresh ----------
    update(game) {
      const p = game.player;

      // player frame
      $('player-hp-fill').style.width = `${(p.hp / p.maxHp) * 100}%`;
      $('player-mp-fill').style.width = `${(p.mp / p.maxMp) * 100}%`;
      $('player-hp-text').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
      $('player-mp-text').textContent = `${Math.ceil(p.mp)} / ${p.maxMp}`;
      $('player-level').textContent = p.level;

      // xp + gold + runes + potions
      const need = p.level * 120;
      $('xp-fill').style.width = `${(p.xp / need) * 100}%`;
      $('xp-text').textContent = `${p.xp} / ${need} XP`;
      $('gold-text').textContent = p.gold;
      $('rune-count').textContent = p.runes;
      $('potion-count').textContent = p.potionCd > 0 ? Math.ceil(p.potionCd) : p.potions;
      $('potion-pouch').classList.toggle('on-cd', p.potionCd > 0);
      $('zone-name').textContent = game.zone === 'crypt' ? 'The Sunken Crypt' : 'Howling Plains';

      // target frame
      const t = p.target;
      if (t && t.alive) {
        $('target-frame').classList.remove('hidden');
        $('target-hp-fill').style.width = `${(t.hp / t.maxHp) * 100}%`;
        $('target-hp-text').textContent = `${Math.ceil(t.hp)} / ${t.maxHp}`;
      } else {
        $('target-frame').classList.add('hidden');
      }

      // cooldowns
      for (const s of slots) {
        const cd = p.cooldowns[s.skill.id] || 0;
        const remaining = Math.max(cd, p.gcd);
        const full = cd > 0 ? s.skill.cd : 1.0;
        if (remaining > 0.02) {
          const frac = remaining / full;
          const deg = Math.min(1, frac) * 360;
          s.cdEl.style.background = `conic-gradient(rgba(8,5,2,.78) ${deg}deg, transparent ${deg}deg)`;
          s.cdEl.textContent = cd > 1.5 ? Math.ceil(cd) : '';
        } else {
          s.cdEl.style.background = 'none';
          s.cdEl.textContent = '';
        }
        s.el.classList.toggle('oom', p.mp < s.skill.mana);
      }

      this.updatePlates(game);
      this.updateFcts(game);
      this.drawMinimap(game);
    },

    // ---------- nameplates ----------
    removePlate(entity) {
      const el = plates.get(entity);
      if (el) { el.remove(); plates.delete(entity); }
    },

    plateFor(entity, cls) {
      let el = plates.get(entity);
      if (!el) {
        el = document.createElement('div');
        el.className = `nameplate ${cls}`;
        el.innerHTML = `<span class="np-bang"></span><div class="np-name"></div><div class="np-hp"><i></i></div>`;
        overlay.appendChild(el);
        plates.set(entity, el);
      }
      return el;
    },

    updatePlates(game) {
      const pPos = game.player.group.position;

      for (const e of game.enemies) {
        const el = this.plateFor(e, e.elite ? 'hostile elite' : 'hostile');
        const dist = e.group.position.distanceTo(pPos);
        const show = e.alive && dist < 55;
        let pt = null;
        if (show) pt = worldToScreen(game, e.group.position, e.group.userData.height * e.group.scale.y + 0.7);
        if (!pt) { el.style.display = 'none'; continue; }
        el.style.display = '';
        el.style.left = `${pt.x}px`;
        el.style.top = `${pt.y}px`;
        el.querySelector('.np-name').textContent = `${e.name}  ·  ${e.level}`;
        el.querySelector('.np-hp i').style.width = `${(e.hp / e.maxHp) * 100}%`;
        el.querySelector('.np-bang').textContent = '';
      }

      // npc plate with quest marker
      const npc = game.npc;
      const el = this.plateFor(npc, 'friendly');
      const pt = worldToScreen(game, npc.group.position, 2.4);
      if (!pt) { el.style.display = 'none'; }
      else {
        el.style.display = '';
        el.style.left = `${pt.x}px`;
        el.style.top = `${pt.y}px`;
        el.querySelector('.np-name').textContent = npc.name;
        el.querySelector('.np-hp').style.display = 'none';
        el.querySelector('.np-bang').textContent = game.quests.marker();
      }
    },

    updateFcts(game) {
      for (const f of fcts) {
        const pt = worldToScreen(game, f.pos, 2.2);
        if (!pt) { f.el.style.display = 'none'; continue; }
        f.el.style.display = '';
        f.el.style.left = `${pt.x + f.offset}px`;
        f.el.style.top = `${pt.y}px`;
      }
    },

    // ---------- target frame ----------
    refreshTarget(game) {
      const t = game.player.target;
      if (!t) return;
      $('target-name').textContent = t.name;
      const tag = $('target-level-tag');
      tag.textContent = t.elite ? `Lv ${t.level} ELITE` : `Lv ${t.level}`;
      tag.classList.toggle('elite', t.elite);
    },

    // ---------- cast bar ----------
    showCastBar(name) {
      $('cast-label').textContent = name;
      $('cast-fill').style.width = '0%';
      $('cast-bar').classList.remove('hidden');
    },
    updateCastBar(frac) { $('cast-fill').style.width = `${Math.min(1, frac) * 100}%`; },
    hideCastBar() { $('cast-bar').classList.add('hidden'); },

    // ---------- quest tracker ----------
    refreshQuestTracker(quests) {
      const wrap = $('quest-entries');
      wrap.innerHTML = '';
      const visible = quests.quests.filter((q) => q.status === 'active' || q.status === 'complete');
      const b = quests.bounty;
      if (b.status === 'active' || b.status === 'complete') visible.push({ ...b, targetKind: 'any' });
      if (!visible.length) {
        const allDone = quests.quests.every((q) => q.status === 'done');
        wrap.innerHTML = `<div class="quest-hint">${allDone ? 'Barnaby has a standing bounty for you.' : 'Speak with Pioneer Barnaby at the camp.'}</div>`;
        return;
      }
      for (const q of visible) {
        const div = document.createElement('div');
        div.className = `quest-entry${q.status === 'complete' ? ' complete' : ''}`;
        div.innerHTML = `<div class="q-name">${q.name}</div>
          <div class="q-obj${q.progress >= q.count ? ' done' : ''}">${targetLabel(q.targetKind)}: ${Math.min(q.progress, q.count)}/${q.count}</div>`;
        wrap.appendChild(div);
      }
    },

    // ---------- identity (portrait + name, changes on dual-class) ----------
    refreshIdentity(game) {
      const p = game.player;
      $('player-name').textContent = p.name;
      $('player-class-icon').textContent = p.secondary
        ? `${p.cls.icon}${p.secondary.icon}`
        : p.cls.icon;
    },

    // ---------- dual-class choice ----------
    showSecondaryChoice(game) {
      const screen = $('secondary-screen');
      const wrap = $('secondary-cards');
      wrap.innerHTML = '';
      for (const [id, cls] of Object.entries(game.classes)) {
        if (id === game.player.classId) continue;
        const card = document.createElement('button');
        card.className = 'class-card';
        card.dataset.class = id;
        card.innerHTML = `
          <span class="card-icon">${cls.icon}</span>
          <span class="card-name">${cls.name}</span>
          <span class="card-blurb">${cls.skills.map((s) => s.name).join(' · ')}</span>`;
        card.addEventListener('click', () => {
          screen.classList.add('hidden');
          game.player.chooseSecondary(game, id);
        });
        wrap.appendChild(card);
      }
      screen.classList.remove('hidden');
    },

    // ---------- dialog ----------
    showDialog({ text, objectives, rewards, buttons }) {
      $('dialog-text').textContent = text;
      $('dialog-objectives').innerHTML = (objectives || []).map((o) => `<div>${o}</div>`).join('');
      $('dialog-rewards').textContent = rewards || '';
      const wrap = document.querySelector('.dialog-buttons');
      wrap.innerHTML = '';
      for (const b of buttons) {
        const btn = document.createElement('button');
        btn.className = `btn-ornate${b.primary ? '' : ' btn-dim'}`;
        btn.textContent = b.label;
        btn.addEventListener('click', b.action);
        wrap.appendChild(btn);
      }
      $('quest-dialog').classList.remove('hidden');
    },
    hideDialog() { $('quest-dialog').classList.add('hidden'); },
    dialogOpen() { return !$('quest-dialog').classList.contains('hidden'); },

    // ---------- shop ----------
    showShop(game) {
      const p = game.player;
      const wrap = $('shop-items');
      wrap.innerHTML = '';
      $('shop-gold-amount').textContent = p.gold;
      for (const item of SHOP) {
        const price = item.price(p);
        const soldOut = item.soldOut && item.soldOut(p);
        const row = document.createElement('div');
        row.className = 'shop-row';
        row.innerHTML = `
          <span class="shop-icon">${item.icon}</span>
          <span class="shop-info">
            <b>${item.name}</b>
            <small>${item.desc}</small>
            <em>${item.owned(p)}</em>
          </span>`;
        const btn = document.createElement('button');
        btn.className = 'btn-ornate shop-buy';
        if (soldOut) {
          btn.textContent = 'Owned';
          btn.disabled = true;
        } else {
          btn.textContent = `${price} g`;
          btn.disabled = p.gold < price;
          btn.addEventListener('click', () => {
            if (p.gold < price) return;
            p.gold -= price;
            item.buy(p);
            game.audio.loot();
            this.log(`Purchased: ${item.name} (−${price} gold).`, 'log-loot');
            game.save?.();
            this.showShop(game); // re-render with new prices
          });
        }
        row.appendChild(btn);
        wrap.appendChild(row);
      }
      $('shop-panel').classList.remove('hidden');
    },
    hideShop() { $('shop-panel').classList.add('hidden'); },
    shopOpen() { return !$('shop-panel').classList.contains('hidden'); },

    // ---------- boss mechanic warning ----------
    mechWarning(kind) {
      const el = $('mech-warning');
      el.textContent = kind === 'jump' ? 'JUMP!' : 'MOVE!';
      el.className = '';
      void el.offsetHeight; // restart the animation
      el.className = `mech-${kind}`;
    },

    // ---------- prompts & splashes ----------
    setInteractPrompt(visible, label) {
      $('interact-prompt').classList.toggle('hidden', !visible);
      if (visible && label) $('interact-label').textContent = label;
    },
    showDeathScreen() { $('death-screen').classList.remove('hidden'); },
    hideDeathScreen() { $('death-screen').classList.add('hidden'); },

    levelUpSplash(level) {
      const splash = $('levelup-splash');
      $('levelup-num').textContent = level;
      splash.classList.remove('hidden');
      // restart css animations
      splash.querySelectorAll('.levelup-ring, .levelup-text').forEach((el) => {
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = '';
      });
      clearTimeout(splash._timer);
      splash._timer = setTimeout(() => splash.classList.add('hidden'), 2500);
    },

    // ---------- minimap ----------
    drawMinimap(game) {
      const cv = $('minimap');
      const ctx = cv.getContext('2d');
      const S = cv.width; // 280 (2x for retina, CSS 140)
      const VIEW = 130; // world units across the map
      const p = game.player.group.position;

      ctx.clearRect(0, 0, S, S);
      ctx.save();
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
      ctx.clip();

      // underground, the map shows only darkness and what hunts nearby
      if (game.zone === 'crypt') {
        ctx.fillStyle = '#0c0a10';
        ctx.fillRect(0, 0, S, S);
      }

      const pxPerWorld = MAP_RES / WORLD_SIZE;
      const sw = VIEW * pxPerWorld;
      const sx = (p.x + WORLD_SIZE / 2) * pxPerWorld - sw / 2;
      const sy = (p.z + WORLD_SIZE / 2) * pxPerWorld - sw / 2;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mapImg, sx, sy, sw, sw, 0, 0, S, S);

      const dot = (wx, wz, color, r) => {
        const dx = ((wx - p.x) / VIEW) * S + S / 2;
        const dy = ((wz - p.z) / VIEW) * S + S / 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
      };

      for (const e of game.enemies) {
        if (!e.alive) continue;
        dot(e.group.position.x, e.group.position.z, e.elite ? '#ffd76e' : '#ff5a3c', e.elite ? 7 : 4);
      }
      dot(game.npc.group.position.x, game.npc.group.position.z, '#ffe9b0', 5);

      // player arrow oriented to facing
      ctx.save();
      ctx.translate(S / 2, S / 2);
      ctx.rotate(-game.player.group.rotation.y);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(6, 7);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.restore();
      ctx.restore();
    },
  };

  return ui;
}

function targetLabel(kind) {
  return {
    boar: 'Young Boars slain', wolf: 'Forest Wolves slain', boss: 'Bodo the Ravager slain',
    bandit: 'Grimblade Bandits slain', banditking: 'Rurik the Red slain',
    korgrim: 'Korgrim toppled', vexnar: 'Vexnar grounded', morgrath: 'The Pale King unkinged',
    ossus: 'Gravelord Ossus destroyed', vargoth: 'Vargoth the Undying ended',
    any: 'Beasts or bandits slain',
  }[kind] || kind;
}
