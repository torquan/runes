import * as THREE from 'three';
import { fbm, heightAt, WORLD_SIZE, HIGHLANDS } from './noise.js';
import { SHOP, xpForLevel } from './player.js';
import { RARITY, rarityColor, statSummary, totalEquippedStats, ALL_SLOTS,
         RECIPES, SETS, MATERIALS, canCraft, craft, equippedSetCounts } from './items.js';
import { BRANCHES, ranks, CAPSTONE_THRESHOLD, BRANCH_CAP, MASTERY_THRESHOLD,
         MASTERIES, CHOICE_NODES, choiceNodeFor, choiceOf, capstoneFor,
         spentTotal, TOTAL_RANKS } from './talents.js';

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
  const MAP_RES = 260;   // bumped with WORLD_SIZE 420 to keep comparable minimap detail
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
        // the Ashen Highlands read as dark ash/ember in the east
        if (wx > HIGHLANDS.BLEND_HI) {
          const t = Math.min(1, (wx - HIGHLANDS.BLEND_HI) / 30);
          r = r * (1 - t) + 120 * t;   // dark red-brown
          g = g * (1 - t) + 40 * t;
          b = b * (1 - t) + 30 * t;
        }
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
      const primaryColor = game.player.cls.skills[0].color;   // class tint for capstones
      const list = game.player.barSkills();
      const capStart = game.player.allSkills().length;
      list.forEach((skill, i) => {
        const isCap = i >= capStart;
        const color = isCap ? primaryColor : skill.color;
        const keyLabel = i < 9 ? String(i + 1) : i === 9 ? '0' : i === 10 ? '-' : '=';  // keys 1-9,0,-,=
        const slot = document.createElement('div');
        slot.className = 'skill-slot' + (isCap ? ' capstone' : '');
        slot.innerHTML = `
          <span class="s-key">${keyLabel}</span>
          <span class="s-icon" style="color:${color}">${skill.icon}</span>
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
      const need = xpForLevel(p.level);
      $('xp-fill').style.width = `${(p.xp / need) * 100}%`;
      $('xp-text').textContent = `${p.xp} / ${need} XP`;
      $('gold-text').textContent = p.gold;
      $('rune-count').textContent = p.runes;
      $('potion-count').textContent = p.potionCd > 0 ? Math.ceil(p.potionCd) : p.potions;
      $('potion-pouch').classList.toggle('on-cd', p.potionCd > 0);
      $('zone-name').textContent = {
        crypt: 'The Sunken Crypt',
        highlands: 'The Ashen Highlands',
        frostveil: 'The Frostveil',
        sanctum: 'The Starfall Sanctum',
        hollow: 'The Verdant Hollow',
        horologium: 'The Last Hour',
      }[game.zone] || 'Howling Plains';

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

      // npc plates with quest markers (each npc carries its chain, if any)
      for (const n of game.npcs) {
        const el = this.plateFor(n, 'friendly');
        const pt = worldToScreen(game, n.group.position, 2.4);
        if (!pt) { el.style.display = 'none'; continue; }
        el.style.display = '';
        el.style.left = `${pt.x}px`;
        el.style.top = `${pt.y}px`;
        el.querySelector('.np-name').textContent = n.name;
        el.querySelector('.np-hp').style.display = 'none';
        el.querySelector('.np-bang').textContent = n.chain ? n.chain.marker() : '';
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
    // Renders active/complete quests + bounties from BOTH chains. Called with
    // any chain object (`this`); it reads all chains off the global game so a
    // highland update never blanks Barnaby's tracked quests, and vice versa.
    refreshQuestTracker() {
      const game = window.__game;
      const chains = [game.quests, game.highlandQuests, game.frostveilQuests, game.sanctumQuests, game.hollowQuests, game.horologiumQuests].filter(Boolean);
      const wrap = $('quest-entries');
      wrap.innerHTML = '';
      const visible = [];
      for (const ch of chains) {
        for (const q of ch.quests) {
          if (q.status === 'active' || q.status === 'complete') visible.push(q);
        }
        const b = ch.bounty;
        if (b.status === 'active' || b.status === 'complete') visible.push({ ...b, targetKind: 'any' });
      }
      if (!visible.length) {
        const allDone = game.quests.quests.every((q) => q.status === 'done');
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
      // equipped-gear summary on the char-frame hover (native title, like the pouches)
      const t = totalEquippedStats(p.equipped);
      $('player-frame').title = `${p.name}\nEquipped: ${statSummary(t) || 'nothing'}\nClick to open the character sheet (C)`;
      if (this.charOpen()) this.renderCharSheet(game);   // keep open sheet live on gear swaps
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
    showDialog({ title, text, objectives, rewards, buttons }) {
      $('dialog-npc-name').textContent = title || 'Pioneer Barnaby';
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
          btn.textContent = item.id === 'respec' ? 'Nothing to unlearn' : 'Owned';
          btn.disabled = true;
        } else {
          btn.textContent = `${price} g`;
          btn.disabled = p.gold < price || price <= 0;
          btn.addEventListener('click', () => {
            if (p.gold < price || price <= 0) return;
            p.gold -= price;
            if (item.id === 'respec') {
              p.respecTalents(game);                 // resets talents, rebuilds bar
            } else {
              item.buy(p);
            }
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

    // ---------- inventory / gear ----------
    // always opens on Equipment unless explicitly asked for sell (Barnaby's
    // Sell Loot button) — a sticky sell tab once cost someone their gear
    showInventory(game, tab = 'bag') {
      this._invTab = tab;
      this.renderInventory(game);
      $('inventory-panel').classList.remove('hidden');
    },
    hideInventory() { $('inventory-panel').classList.add('hidden'); },
    inventoryOpen() { return !$('inventory-panel').classList.contains('hidden'); },
    toggleInventory(game) { this.inventoryOpen() ? this.hideInventory() : this.showInventory(game); },

    renderInventory(game) {
      const p = game.player;
      const selling = this._invTab === 'sell';
      // hide any lingering tooltip (cells get recreated on equip/sell)
      const oldTip = $('inv-tooltip'); if (oldTip) oldTip.style.display = 'none';
      // tabs active state (btn-dim must swap too, or the active tab looks dead)
      $('inv-tab-bag').classList.toggle('active', !selling);
      $('inv-tab-bag').classList.toggle('btn-dim', selling);
      $('inv-tab-sell').classList.toggle('active', selling);
      $('inv-tab-sell').classList.toggle('btn-dim', !selling);
      const hint = $('inv-mode-hint');
      hint.textContent = selling
        ? 'SELLING — click an item to sell it to Barnaby'
        : 'Click a bag item to equip it · click equipped gear to unequip';
      hint.classList.toggle('selling', selling);

      // equipped row
      for (const slot of ALL_SLOTS) {
        const cell = document.querySelector(`.equip-slot[data-slot="${slot}"] .eq-cell`);
        const it = p.equipped[slot];
        cell.innerHTML = it ? this._itemCellHTML(it) : '';
        cell.className = 'eq-cell' + (it ? ` r-${it.rarity}` : '');
        cell.onclick = it ? () => { p.unequip(game, slot); this.renderInventory(game); } : null;
        if (it) this._attachTip(cell, it, p);
        else { cell.onmouseenter = null; cell.onmouseleave = null; }
      }

      // stat summary line
      const t = totalEquippedStats(p.equipped);
      $('inv-stats-summary').innerHTML = `Equipped: ${statSummary(t) || 'nothing'}`;

      // 24-slot grid
      const grid = $('inv-grid');
      grid.classList.toggle('selling', selling);
      grid.innerHTML = '';
      for (let i = 0; i < 24; i++) {
        const it = p.inventory[i];
        const cell = document.createElement('div');
        cell.className = 'inv-cell' + (it ? ` r-${it.rarity}` : '');
        if (it) {
          // in sell mode every item wears its price — no ambiguity about the click
          cell.innerHTML = this._itemCellHTML(it)
            + (selling ? `<span class="inv-price">${it.value}g</span>` : '');
          this._attachTip(cell, it, p);
          cell.onclick = selling
            ? () => { p.sellItem(game, it); this.renderInventory(game); this.update(game); }
            : it.kind === 'elixir'
              ? () => { p.drinkElixir(game, it); this.renderInventory(game); }
              : it.kind === 'material'
                ? null   // materials don't equip or do anything on click
                : () => { p.equip(game, it); this.renderInventory(game); };
        }
        grid.appendChild(cell);
      }
    },

    _itemCellHTML(it) {
      // materials/elixirs carry their own emoji + a stack count instead of a slot glyph
      if (it.kind === 'material' || it.kind === 'elixir') {
        return `<span class="inv-icon">${it.icon}</span>${it.qty > 1 ? `<span class="inv-qty">${it.qty}</span>` : ''}`;
      }
      const icon = { weapon: '⚔', armor: '⛨', trinket: '✦', relic: '◆' }[it.slot];
      return `<span class="inv-icon" style="color:${rarityColor(it.rarity)}">${icon}</span>`;
    },

    // JS-injected stat-compare tooltip (CSS-only can't compare vs equipped)
    _attachTip(cell, item, player) {
      cell.onmouseenter = () => {
        const tip = $('inv-tooltip') || (() => {
          const d = document.createElement('div');
          d.id = 'inv-tooltip';
          d.className = 'inv-tooltip';
          document.getElementById('overlay').appendChild(d);
          return d;
        })();
        const equipped = player.equipped[item.slot];
        tip.innerHTML = this._tipHTML(item, equipped, player);
        tip.style.display = 'block';
        const r = cell.getBoundingClientRect();
        tip.style.left = `${r.right + 8}px`;
        tip.style.top = `${r.top}px`;
      };
      cell.onmouseleave = () => { const tip = $('inv-tooltip'); if (tip) tip.style.display = 'none'; };
    },

    // all strings here are developer-authored (item.name/flavor from items.js) — HTML-safe
    _tipHTML(item, equipped, player) {
      const color = rarityColor(item.rarity);
      const kindLabel = item.kind === 'material' ? 'Material'
        : item.kind === 'elixir' ? 'Elixir'
        : `${RARITY[item.rarity].label} ${item.slot}${item.unique ? ' · Unique' : ''}${item.reforged ? ' · Reforged' : ''}`;
      let body = `<div class="tip-name" style="color:${color}">${item.name}</div>`;
      body += `<div class="tip-sub">${kindLabel}</div>`;
      // stat lines with compare deltas vs currently equipped in that slot —
      // include axes only the equipped item has, so losses aren't hidden
      const axes = ['dmg', 'hp', 'crit', 'speed', 'healPower'];
      for (const ax of axes) {
        const v = item.stats[ax] || 0;
        const e = equipped ? (equipped.stats[ax] || 0) : 0;
        if (!v && !e) continue;
        const d = v - e;
        const fmt = (n) => (ax === 'crit' || ax === 'speed' || ax === 'healPower') ? `${(n * 100).toFixed(1)}%` : `${Math.round(n)}`;
        const cls = d > 0 ? 'stat-up' : d < 0 ? 'stat-down' : '';
        body += v
          ? `<div class="tip-stat">+${fmt(v)} ${ax}${equipped && d !== 0 ? ` <span class="${cls}">(${d > 0 ? '+' : ''}${fmt(d)})</span>` : ''}</div>`
          : `<div class="tip-stat"><span class="stat-down">−${fmt(e)} ${ax}</span></div>`;
      }
      // set-piece block: list all 4 piece names (green if owned/equipped) + bonus
      // lines + the active (n/4) count off the player's equipped set tally
      if (item.setId && SETS[item.setId]) {
        const s = SETS[item.setId];
        const have = new Set();
        if (player) {
          for (const slot of ALL_SLOTS) {
            const eq = player.equipped[slot];
            if (eq && eq.setId === item.setId) have.add(slot);
          }
          for (const it of player.inventory) if (it.setId === item.setId) have.add(it.slot);
        }
        const count = player ? (equippedSetCounts(player.equipped)[item.setId] || 0) : 0;
        body += `<div class="tip-set"><b>${s.name} (${count}/4)</b>`;
        for (const slot of ALL_SLOTS) {
          const owned = have.has(slot);
          body += `<div class="tip-set-piece${owned ? ' owned' : ''}">${s.pieces[slot].name}</div>`;
        }
        body += `<div class="tip-set-bonus${count >= 2 ? ' on' : ''}">(2) ${statSummary(s.bonus2)}</div>`;
        body += `<div class="tip-set-bonus${count >= 4 ? ' on' : ''}">(4) ${statSummary(s.bonus4)}</div>`;
        body += `</div>`;
      }
      if (item.flavor) body += `<div class="tip-flavor">${item.flavor}</div>`;
      if (item.value) body += `<div class="tip-value">Sells for ${item.value} g</div>`;
      return body;
    },

    // ---------- character sheet (opens from the player frame / C) ----------
    showCharSheet(game) { this.renderCharSheet(game); $('char-panel').classList.remove('hidden'); },
    hideCharSheet() { $('char-panel').classList.add('hidden'); },
    charOpen() { return !$('char-panel').classList.contains('hidden'); },
    toggleCharSheet(game) { this.charOpen() ? this.hideCharSheet() : this.showCharSheet(game); },

    // ---------- crafting bench (Smith Halla; opens from F near her / B) ----------
    showCraft(game) { this.renderCraft(game); $('craft-panel').classList.remove('hidden'); },
    hideCraft() { $('craft-panel').classList.add('hidden'); this._craftPick = null; },
    craftOpen() { return !$('craft-panel').classList.contains('hidden'); },
    toggleCraft(game) { this.craftOpen() ? this.hideCraft() : this.showCraft(game); },

    // recipe list + owned-material strip. All strings here are developer-authored
    // (recipe/material/slot names from items.js) — HTML-safe per the innerHTML policy.
    renderCraft(game) {
      const p = game.player;
      const owned = (matId) => p.inventory.find((i) => i.matId === matId)?.qty || 0;

      // owned-material strip
      const mats = $('craft-mats');
      mats.innerHTML = Object.keys(MATERIALS).map((k) => {
        const q = owned(k);
        return `<span class="craft-have${q ? '' : ' zero'}" title="${MATERIALS[k].name}">
          <span class="ch-icon">${MATERIALS[k].icon}</span><span class="ch-qty">${q}</span></span>`;
      }).join('');

      // recipe rows
      const rows = $('craft-rows');
      rows.innerHTML = '';
      // expanded picker state: { recipeId, mode:'slot'|'item' } drives an inline picker
      const pick = this._craftPick;

      // bag elixirs get a "Drink" affordance up top of their recipe rows; collect once
      const bagElixirs = p.inventory.filter((i) => i.kind === 'elixir');

      for (const recipe of RECIPES) {
        const can = canCraft(p, recipe);
        const costHtml = Object.keys(recipe.cost).map((m) => {
          const have = owned(m), need = recipe.cost[m];
          return `<span class="craft-mat${have < need ? ' short' : ''}">${MATERIALS[m].icon} ${have}/${need}</span>`;
        }).join('');
        const goldHtml = `<span class="craft-gold${p.gold < recipe.gold ? ' short' : ''}">${recipe.gold} g</span>`;

        const row = document.createElement('div');
        row.className = 'craft-row';
        row.innerHTML = `
          <span class="craft-icon">${recipe.icon}</span>
          <span class="craft-info">
            <b>${recipe.name}</b>
            <span class="craft-desc">${recipe.desc}</span>
            <span class="craft-cost">${costHtml}${goldHtml}</span>
          </span>`;
        const btn = document.createElement('button');
        btn.className = 'btn-ornate craft-btn';
        btn.textContent = 'Craft';
        btn.disabled = !can;
        btn.addEventListener('click', () => {
          if (recipe.kind === 'gear' && recipe.gen.slot === 'PICK') {
            this._craftPick = { recipeId: recipe.id, mode: 'slot' };
            this.renderCraft(game);
          } else if (recipe.kind === 'upgrade') {
            this._craftPick = { recipeId: recipe.id, mode: 'item' };
            this.renderCraft(game);
          } else {
            craft(game, recipe, {});
            this._craftPick = null;
            this.renderCraft(game);
            if (this.inventoryOpen()) this.renderInventory(game);
          }
        });
        row.appendChild(btn);
        rows.appendChild(row);

        // inline picker, expanded under the active recipe
        if (pick && pick.recipeId === recipe.id) {
          const picker = document.createElement('div');
          picker.className = 'craft-picker';
          if (pick.mode === 'slot') {
            for (const slot of ALL_SLOTS) {
              const sb = document.createElement('button');
              sb.className = 'btn-ornate btn-mini';
              sb.textContent = slot[0].toUpperCase() + slot.slice(1);
              sb.addEventListener('click', () => {
                craft(game, recipe, { slot });
                this._craftPick = null;
                this.renderCraft(game);
                if (this.inventoryOpen()) this.renderInventory(game);
              });
              picker.appendChild(sb);
            }
          } else if (pick.mode === 'item') {
            const eligible = [...p.inventory, ...ALL_SLOTS.map((s) => p.equipped[s])]
              .filter((it) => it && it.unique && !it.reforged);
            if (!eligible.length) {
              picker.innerHTML = '<span class="craft-desc">No un-reforged uniques to re-temper.</span>';
            } else {
              for (const it of eligible) {
                const ib = document.createElement('button');
                ib.className = 'btn-ornate btn-mini';
                ib.textContent = it.name;
                ib.style.color = rarityColor(it.rarity);
                ib.addEventListener('click', () => {
                  this.showDialog({
                    title: 'Smith Halla',
                    text: "Re-temper this? The metal remembers being whole. It'll hold more of you. Once, mind — twice and it shatters.",
                    buttons: [
                      { label: 'Re-temper it', primary: true, action: () => {
                        this.hideDialog();
                        craft(game, recipe, { item: it });
                        this._craftPick = null;
                        this.showCraft(game);
                        if (this.inventoryOpen()) this.renderInventory(game);
                      } },
                      { label: 'Not yet', action: () => { this.hideDialog(); this.showCraft(game); } },
                    ],
                  });
                });
                picker.appendChild(ib);
              }
            }
          }
          rows.appendChild(picker);
        }
      }

      // drink-from-bag affordance: any elixirs already brewed
      if (bagElixirs.length) {
        const head = document.createElement('div');
        head.className = 'char-section';
        head.textContent = 'Your Elixirs';
        rows.appendChild(head);
        for (const it of bagElixirs) {
          const row = document.createElement('div');
          row.className = 'craft-row';
          row.innerHTML = `
            <span class="craft-icon">${it.icon}</span>
            <span class="craft-info"><b>${it.name}${it.qty > 1 ? ` ×${it.qty}` : ''}</b>
              <span class="craft-desc">${it.flavor || ''}</span></span>`;
          const db = document.createElement('button');
          db.className = 'btn-ornate craft-btn';
          db.textContent = 'Drink';
          db.addEventListener('click', () => {
            game.player.drinkElixir(game, it);
            this.renderCraft(game);
            if (this.inventoryOpen()) this.renderInventory(game);
          });
          row.appendChild(db);
          rows.appendChild(row);
        }
      }
    },

    // all strings here are developer-authored (class/item/branch names) — HTML-safe
    renderCharSheet(game) {
      const p = game.player;
      $('char-icon').textContent = p.secondary ? `${p.cls.icon}${p.secondary.icon}` : p.cls.icon;
      $('char-name').textContent = p.name;
      $('char-sub').textContent = `Level ${p.level} · ${p.xp} / ${xpForLevel(p.level)} XP`;

      const pct = (v) => `${Math.round(v * 100)}%`;
      // breakdown note: only the non-zero sources, e.g. "+12 gear · +3 runes"
      const note = (parts) => parts.filter(([v]) => v).map(([v, l]) => `+${v} ${l}`).join(' · ');
      const row = (label, value, n = '') =>
        `<div class="char-row"><span>${label}</span><span>${n ? `<small>${n}</small> ` : ''}<b>${value}</b></span></div>`;

      const gearDmg = Math.round(p.gearStat('dmg'));
      const gearHp = Math.round(p.gearStat('hp'));

      let html = `<div class="char-section">Attributes</div>`;
      html += row('Health', p.maxHp, note([[gearHp, 'gear'], [p.trainHp * 80, 'training']]));
      html += row('Mana', p.maxMp);
      html += row('Damage', p.baseDamage(), note([[gearDmg, 'gear'], [p.runeBonus, 'runes'], [p.trainDmg * 5, 'training']]));
      html += row('Crit Chance', pct(p.critChance()));
      html += row('Move Speed', pct(p.speed / 6.5), p.boots ? 'swift boots' : '');
      html += row('Healing Power', `+${pct(p.gearStat('healPower'))}`);

      html += `<div class="char-section">Talents</div>`;
      for (const branch of BRANCHES) html += row(branch.name, `${ranks(p.talents, branch.id)} / ${BRANCH_CAP}`);
      const chosen = [];
      for (const cn of CHOICE_NODES) {
        const v = choiceOf(p.talents, cn.branch, cn.atRank);
        if (v) chosen.push(cn.options.find((o) => o.id === v).name);
      }
      if (chosen.length) html += row('Passives', chosen.join(' · '));
      html += row('Oath', p.talents.mastery
        ? MASTERIES[p.talents.mastery].name
        : '<span class="char-empty">unsworn</span>');
      html += row('Unspent points', p.talentPoints());

      html += `<div class="char-section">Equipment</div>`;
      for (const slot of ALL_SLOTS) {
        const it = p.equipped[slot];
        html += row(slot[0].toUpperCase() + slot.slice(1),
          it ? `<span style="color:${rarityColor(it.rarity)}">${it.name}</span>` : '<span class="char-empty">— empty —</span>');
      }
      const t = totalEquippedStats(p.equipped);
      html += `<div class="char-gear-sum">${statSummary(t) || 'No gear equipped'}</div>`;

      // Set Bonuses — active bonus summary per equipped set (2pc, +4pc merged at ≥4)
      const counts = equippedSetCounts(p.equipped);
      const activeSets = Object.keys(counts).filter((sid) => counts[sid] >= 2 && SETS[sid]);
      if (activeSets.length) {
        html += `<div class="char-section">Set Bonuses</div>`;
        for (const sid of activeSets) {
          const s = SETS[sid];
          // merge bonus2 + bonus4 (summing shared axes) when 4+ pieces are worn
          let active = { ...s.bonus2 };
          if (counts[sid] >= 4) for (const ax in s.bonus4) active[ax] = (active[ax] || 0) + s.bonus4[ax];
          html += row(s.name, `${counts[sid]}/4`, statSummary(active));
        }
      }

      // Phial of Starlight toggle (cosmetic; purchase state in p.glow)
      if (p.glow) {
        html += `<div class="char-section">Vanity</div>`;
        html += row('Starlight trail', `<button class="btn-ornate btn-mini" id="glow-toggle">${p.glowOff ? 'Off' : 'On'}</button>`);
      }

      $('char-rows').innerHTML = html;
      const gt = $('glow-toggle');
      if (gt) gt.addEventListener('click', () => { p.glowOff = !p.glowOff; this.renderCharSheet(game); });
    },

    // ---------- talents ----------
    showTalents(game) { this.renderTalents(game); $('talent-panel').classList.remove('hidden'); },
    hideTalents() { $('talent-panel').classList.add('hidden'); },
    talentOpen() { return !$('talent-panel').classList.contains('hidden'); },
    toggleTalents(game) { this.talentOpen() ? this.hideTalents() : this.showTalents(game); },

    refreshTalentBadge(game) {
      const p = game.player;
      const n = p.talentPoints();
      const badge = $('talent-badge');
      badge.classList.toggle('hidden', p.level < 10);   // hidden until L10
      $('talent-count').textContent = n;
      // glow only while a LEGAL spend exists (surplus past 90 ranks banks quietly)
      badge.classList.toggle('has-points', n > 0 && spentTotal(p.talents) < TOTAL_RANKS);
      if (this.talentOpen()) this.renderTalents(game);  // keep open panel live
      if (this.charOpen()) this.renderCharSheet(game);  // sheet too (level/talent changes)
    },
    nudgeTalentBadge() {
      const badge = $('talent-badge');
      badge.classList.remove('nudge'); void badge.offsetHeight; badge.classList.add('nudge');
    },

    // all strings here are developer-authored (talents.js data) — HTML-safe
    renderTalents(game) {
      const p = game.player;
      const t = p.talents;
      $('talent-points-num').textContent = p.talentPoints();
      const cols = $('talent-cols');
      cols.innerHTML = '';
      for (const branch of BRANCHES) {
        const n = ranks(t, branch.id);
        const col = document.createElement('div');
        col.className = 'talent-col';
        let html = `<h3 style="color:${branch.color}">${branch.name}</h3>
          <div class="talent-flavor">${branch.flavor}</div>
          <div class="talent-rankbar"><i style="width:${(n / BRANCH_CAP) * 100}%; background:${branch.color}"></i><span>${n} / ${BRANCH_CAP}</span></div>`;

        // interleave stat tiers and choice nodes in rank order
        const rows = branch.tiers.map((tier) => ({ at: tier.from, tier }));
        for (const at of [11, 21]) {
          const cn = choiceNodeFor(branch.id, at);
          if (cn) rows.push({ at, choice: cn });
        }
        rows.sort((a, b) => a.at - b.at);

        for (const row of rows) {
          if (row.tier) {
            const tier = row.tier;
            const reached = n >= tier.from;
            const span = tier.to > tier.from ? `ranks ${tier.from}–${tier.to}` : `rank ${tier.from}`;
            html += `<div class="talent-tier${reached ? '' : ' dim'}"><span class="t-label">${tier.label}</span> — ${reached ? tier.value(t) : `${tier.per} (${span})`}</div>`;
          } else {
            const cn = row.choice;
            const picked = choiceOf(t, branch.id, cn.atRank);
            if (picked) {
              for (const o of cn.options) {
                html += o.id === picked
                  ? `<div class="talent-choice picked">${o.icon} <b>${o.name}</b> ✓<small>${o.desc}</small></div>`
                  : `<div class="talent-choice forsaken">${o.icon} ${o.name}<small>— the path not taken —</small></div>`;
              }
            } else if (n !== cn.atRank - 1) {
              html += `<div class="talent-choice locked">◇ <b>${cn.label}</b> — a choice at rank ${cn.atRank}<small>${cn.options.map((o) => o.name).join('  or  ')}</small></div>`;
            }
            // n === atRank−1 unpicked: the picker buttons render below instead
          }
        }
        if (branch.gcdNote) html += `<div class="talent-gcd">${branch.gcdNote(t)}</div>`;

        // capstone box — oath-aware (upgrades in place when sworn)
        const cap = capstoneFor(t, branch.id);
        const capUnlocked = n >= CAPSTONE_THRESHOLD;
        const sworn = t.mastery === branch.id;
        html += `<div class="talent-cap ${capUnlocked ? 'unlocked' : 'locked'}">
          ${sworn ? MASTERIES[branch.id].icon + ' ' : ''}${cap.icon} ${cap.name}${capUnlocked ? '' : ` (unlocks at ${CAPSTONE_THRESHOLD})`}<br>
          <small>${cap.desc}</small></div>`;
        col.innerHTML = html;

        // spend button — replaced by the two pick buttons at a choice node
        const pendingChoice = (n === 10 || n === 20) && !choiceOf(t, branch.id, n + 1)
          ? choiceNodeFor(branch.id, n + 1) : null;
        if (pendingChoice && p.talentPoints() > 0) {
          const head = document.createElement('div');
          head.className = 'talent-choice-head';
          head.textContent = `${pendingChoice.label} — choose one:`;
          col.appendChild(head);
          for (const o of pendingChoice.options) {
            const btn = document.createElement('button');
            btn.className = 'btn-ornate talent-pick';
            btn.innerHTML = `${o.icon} ${o.name}<small>${o.desc}</small>`;
            btn.addEventListener('click', () => { p.chooseTalent(game, branch.id, o.id); this.renderTalents(game); });
            col.appendChild(btn);
          }
        } else {
          const btn = document.createElement('button');
          btn.className = 'btn-ornate talent-spend';
          const full = n >= BRANCH_CAP;
          btn.textContent = full ? 'Path fully walked'
            : pendingChoice ? `A choice awaits (${n}/${BRANCH_CAP})`
            : `Spend (${n}/${BRANCH_CAP})`;
          btn.disabled = full || p.talentPoints() <= 0;
          btn.addEventListener('click', () => {
            if (p.spendTalent(game, branch.id) === 'choice') return; // picker renders on refresh
            this.renderTalents(game);
          });
          col.appendChild(btn);
        }

        // the Mastery Oath box — four states
        const m = MASTERIES[branch.id];
        const mDiv = document.createElement('div');
        if (t.mastery === branch.id) {
          mDiv.className = 'talent-mastery sworn';
          mDiv.innerHTML = `${m.icon} <b>${m.name}</b><small>${m.passive}</small>`;
        } else if (t.mastery) {
          mDiv.className = 'talent-mastery elsewhere';
          mDiv.innerHTML = `${m.icon} ${m.name}<small>You are sworn to ${MASTERIES[t.mastery].name.replace('Oath of the ', 'the ')}.</small>`;
        } else if (n >= MASTERY_THRESHOLD) {
          mDiv.className = 'talent-mastery eligible';
          mDiv.innerHTML = `${m.icon} <b>${m.name}</b><small>${m.passive}</small>`;
          const swear = document.createElement('button');
          swear.className = 'btn-ornate talent-swear';
          swear.textContent = 'Swear the Oath';
          swear.addEventListener('click', () => {
            this.hideTalents();
            this.showDialog({
              title: 'The Oath',
              text: m.confirm,
              buttons: [
                { label: 'Swear it', primary: true, action: () => { this.hideDialog(); p.swearMastery(game, branch.id); this.showTalents(game); } },
                { label: 'Not yet', action: () => { this.hideDialog(); this.showTalents(game); } },
              ],
            });
          });
          mDiv.appendChild(swear);
        } else {
          mDiv.className = 'talent-mastery locked';
          mDiv.innerHTML = `${m.icon} ${m.name}<small>Walk ${MASTERY_THRESHOLD} ranks to swear this Oath.</small>`;
        }
        col.appendChild(mDiv);
        cols.appendChild(col);
      }
    },

    // ---------- boss mechanic warning ----------
    mechWarning(kind) {
      const el = $('mech-warning');
      el.textContent = { jump: 'JUMP!', move: 'MOVE!', in: 'GET IN!', dodge: 'DODGE!', flee: 'RUN!', enrage: 'ENRAGE!' }[kind] || 'MOVE!';
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

      // pocket zones sit outside the baked map image — solid zone tints
      const pocketFill = { crypt: '#0c0a10', frostveil: '#16202e', sanctum: '#0a0816', hollow: '#0e1c10', horologium: '#0c0e16' }[game.zone];
      if (pocketFill) {
        ctx.fillStyle = pocketFill;
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
      for (const n of game.npcs) dot(n.group.position.x, n.group.position.z, '#ffe9b0', 5);

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
    cinderwraith: 'Cinder Wraiths snuffed', ashhound: 'Ash Hounds put down',
    obsidiangolem: 'Obsidian Golems shattered', emberlord: 'Emberlord Vssaric ended',
    pyraxis: 'Pyraxis the Cinder Wyrm slain',
    hoarfrostserpent: 'Hoarfrost Serpents stilled', frostfangstalker: 'Frostfang Stalkers put down',
    rimeboundsentinel: 'Rimebound Sentinels shattered', hrimnir: 'The Avalanche-Jarl buried',
    custodian: 'Astral Custodians retired', seraphel: 'Seraphel decommissioned',
    noctyra: 'The Hollow Star concluded', thunderbristle: 'Thunderbristle felled',
    sporecaller: 'Sporecallers silenced', hollowstalker: 'Hollowstalkers grounded',
    bloomwarden: 'Bloomwardens laid to rest', swarmling: 'Mycelial Swarmlings culled',
    spireshade: 'Spireshade the Mother-Bloom slain', vorthal: 'Vorthal the First Root uprooted',
    cogwraith: 'Cogwraiths returned', sandflayer: 'Sandflayers stilled',
    quaranth: 'Quaranth, the Unwound stopped', echo: 'Echo of the First Minute silenced',
    khronaxis: 'Khronaxis felled — the hour is yours',
    any: 'Creatures slain',
  }[kind] || kind;
}
