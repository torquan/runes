// achievements.js — the pure-data + evaluation layer for Achievements / Bestiary
// / Titles. Cosmetic only: every reward is a title string (or null). No power.
//
// This module owns three exports the rest of the game reads:
//   ACHIEVEMENTS  — the spec array (EXPANSION.md §D.4, verbatim).
//   BESTIARY      — the sole name/flavor source for the UI (ENEMY_TYPES is NOT
//                   exported from entities.js, so the kind→name/flavor map lives
//                   here; names MUST match entities.js .name fields).
//   TITLE_NONE    — the sentinel the char-sheet title picker uses for "no title".
//
// checkAchievements(game) is idempotent + crash-safe: it only ever awards
// unearned achievements, every secrets/inventory/talents read is optional, and
// it self-defends the player fields so it can be called before the integrator's
// default-fill has run (every frame/second, on level-up, on kill, etc.).

// ---------------------------------------------------------------------------
// ACHIEVEMENTS — EXACTLY the 18 from EXPANSION.md §D.4 (17 unique + completionist).
// ids/names/desc/reward strings are verbatim. criteria are defensive ports of
// the §D.4 predicates (optional chaining + `|| 0` so they return false, never
// throw, when iteration-E fields are absent on this branch).
// ---------------------------------------------------------------------------
export const ACHIEVEMENTS = [
  {
    id: 'first_blood',
    name: 'First Blood',
    desc: 'Slay your first boar.',
    criteria: g => (g.player.counters?.boar || 0) >= 1,
    reward: null,
  },
  {
    id: 'the_pestilence',
    name: 'The Pestilence of Boars',
    desc: 'Slay 500 boars.',
    criteria: g => (g.player.counters?.boar || 0) >= 500,
    reward: 'title: Boarbane',
  },
  {
    id: 'crypt_clear',
    name: 'King-Killer',
    desc: 'Slay Vargoth the Undying.',
    criteria: g => g.slain.has('vargoth'),
    reward: 'title: the Undying-Ender',
  },
  {
    id: 'wyrmsbane',
    name: 'Wyrmsbane',
    desc: 'Slay Pyraxis, the Cinder Wyrm.',
    criteria: g => g.slain.has('pyraxis'),
    reward: 'title: Wyrmsbane',
  },
  {
    id: 'hollow_star',
    name: 'Held the Door',
    desc: 'Slay Noctyra, the Hollow Star.',
    criteria: g => g.slain.has('noctyra'),
    reward: 'title: Doorkeeper',
  },
  {
    id: 'hoardfinder',
    name: 'The Hoardfinder',
    desc: "Find the Badger's Larder.",
    criteria: g => !!g.player.secrets?.pocket?.larderLooted,
    reward: 'title: the Hoardfinder',
  },
  {
    id: 'cartographer',
    name: 'X Marks Nothing',
    desc: 'Dig up all five treasure maps.',
    criteria: g =>
      Object.values(g.player.secrets?.maps || {}).filter(v => v === 'dug').length >= 5,
    reward: 'title: the Cartographer',
  },
  {
    id: 'bitten',
    name: 'It Had Teeth',
    desc: 'Be ambushed by a Mimic.',
    criteria: g => (g.player.counters?.mimic || 0) >= 1,
    reward: null,
  },
  {
    id: 'exterminator',
    name: 'Furniture Exterminator',
    desc: 'Slay 10 Mimics.',
    criteria: g => (g.player.counters?.mimic || 0) >= 10,
    reward: 'title: the Furniture-Slayer',
  },
  {
    id: 'settled',
    name: 'Paid In Full',
    desc: 'Settle accounts with Grim, the Tax Collector.',
    criteria: g => g.slain.has('grim'),
    reward: 'title: the Settled',
  },
  {
    id: 'madge_six',
    name: 'Madge-Approved',
    desc: "Answer all six of Madge's riddles.",
    criteria: g => (g.player.secrets?.riddles || 0) >= 6,
    reward: 'title: Madge-Approved',
  },
  {
    id: 'angler',
    name: 'A Thousand Regrets',
    desc: 'Land the Carp of a Thousand Regrets.',
    criteria: g =>
      g.player.inventory?.some(i => i?.id === 'carp_of_regrets') ||
      g.player.equipped?.weapon?.id === 'carp_of_regrets',
    reward: 'title: the Angler',
  },
  {
    id: 'gilded',
    name: 'Where Bodo Got Them',
    desc: 'Slay Thunderbristle.',
    criteria: g => g.slain.has('thunderbristle'),
    reward: 'title: the Gilded',
  },
  {
    id: 'gardener',
    name: 'On the Fertility of Catastrophe',
    desc: 'Slay Vorthal, the First Root.',
    criteria: g => g.slain.has('vorthal'),
    reward: 'title: the Gardener',
  },
  {
    id: 'timekeeper',
    name: 'The Hour Is Yours',
    desc: 'Slay Khronaxis and keep the last hour.',
    criteria: g => g.slain.has('khronaxis'),
    reward: 'title: the Timekeeper',
  },
  {
    id: 'fully_invested',
    name: 'Fully Invested',
    desc: 'Reach the level cap (120).',
    criteria: g => g.player.level >= 120,
    reward: 'title: the Ascended',
  },
  {
    id: 'oathsworn',
    name: 'Oathsworn',
    desc: 'Swear a Mastery Oath.',
    criteria: g => !!g.player.talents?.mastery,
    reward: 'title: the Sworn',
  },
  {
    id: 'completionist',
    name: 'There Was Always More',
    desc: 'Earn every other achievement.',
    criteria: g =>
      ACHIEVEMENTS.filter(a => a.id !== 'completionist').every(
        a => g.player.achievements?.[a.id]
      ),
    reward: 'title: the Finished',
  },
];

// ---------------------------------------------------------------------------
// checkAchievements(game) — evaluate every criterion; award the unearned ones
// that are now true. Idempotent (skips already-earned), crash-safe (every
// criterion is defensive). Returns the count newly unlocked (>= 0).
// ---------------------------------------------------------------------------
export function checkAchievements(game) {
  const p = game.player;
  if (!p) return 0;
  // defensive self-init: never NPE even if called before integrator default-fill.
  p.counters ??= {};
  p.achievements ??= {};
  p.titles ??= [];
  p.title ??= null;

  let unlocked = 0;
  for (const a of ACHIEVEMENTS) {
    if (p.achievements[a.id]) continue;
    let earned = false;
    try {
      earned = !!a.criteria(game);
    } catch {
      earned = false; // a missing iteration-E field must never crash the loop
    }
    if (!earned) continue;

    p.achievements[a.id] = true;
    if (a.reward && a.reward.startsWith('title: ')) {
      const t = a.reward.slice('title: '.length);
      if (!p.titles.includes(t)) p.titles.push(t);
    }
    game.audio?.levelup?.();
    game.ui?.log?.(
      'Achievement: ' + a.name + ' — ' + (a.reward ? a.reward : 'unlocked'),
      'log-quest'
    );
    game.ui?.nudgeAchieveBadge?.(game);
    unlocked++;
  }

  if (unlocked) game.save?.();
  return unlocked;
}

// ---------------------------------------------------------------------------
// BESTIARY — the ordered render list for the Bestiary tab. Covers EVERY
// spawnable enemy.kind in entities.js on this branch. `name` MUST equal the
// ENEMY_TYPES .name for that kind (so the bestiary matches nameplates). `flavor`
// is the dev-authored first-kill line (wry, warm, slightly mythic). `zone` is
// the grouping label. Ordering = display order.
// ---------------------------------------------------------------------------
export const BESTIARY = [
  // ---- Howling Plains (chapter 1 + trials) ----
  { kind: 'boar', name: 'Young Boar', zone: 'Howling Plains',
    flavor: 'Tusked, tactless, and tragically numerous — the first thing most heroes ever kill, and the last thing anyone remembers fondly.' },
  { kind: 'wolf', name: 'Forest Wolf', zone: 'Howling Plains',
    flavor: 'It hunts in a pack of one and still expects you to be afraid. Often, you are.' },
  { kind: 'boss', name: 'Bodo the Ravager', zone: 'Howling Plains',
    flavor: 'A boar grown vast on grievance and good eating. Bodo did not become a legend so much as refuse to stop being one.' },
  { kind: 'bandit', name: 'Grimblade Bandit', zone: 'Howling Plains',
    flavor: 'Took up robbery because honest work asks too many questions. Asks none of you, save where the gold is.' },
  { kind: 'banditking', name: 'Rurik the Red', zone: 'Howling Plains',
    flavor: 'Crowned himself king of a camp of forty and a hill nobody wanted. The crown, at least, was real gold.' },
  { kind: 'korgrim', name: 'Korgrim the Mountain', zone: 'Howling Plains',
    flavor: 'The first true trial. They say he sat down once and the cartographers had to redraw the range.' },
  { kind: 'vexnar', name: 'Vexnar the Ash Dragon', zone: 'Howling Plains',
    flavor: 'A dragon young enough to be reckless and old enough to be very good at it. The ash he leaves is mostly other adventurers.' },
  { kind: 'morgrath', name: 'Morgrath, the Pale King', zone: 'Howling Plains',
    flavor: 'Ruled the dead so long he forgot the living were optional. Kill him twice if the first lesson does not take.' },

  // ---- The Sunken Crypt ----
  { kind: 'thrall', name: 'Risen Thrall', zone: 'The Sunken Crypt',
    flavor: 'Was someone, once, with a name and a debt. Now it is only the debt, walking.' },
  { kind: 'revenant', name: 'Crypt Revenant', zone: 'The Sunken Crypt',
    flavor: 'Death was the easy part. Coming back is what ruined it — for everyone in the room.' },
  { kind: 'boneguard', name: 'Boneguard', zone: 'The Sunken Crypt',
    flavor: 'Sworn to guard the king until the bones gave out. The bones, spitefully, did not.' },
  { kind: 'ossus', name: 'Gravelord Ossus', zone: 'The Sunken Crypt',
    flavor: 'A warlord who buried his enemies, then his friends, then — running short of others — himself. He kept the title.' },
  { kind: 'vargoth', name: 'Vargoth the Undying', zone: 'The Sunken Crypt',
    flavor: 'He earned the name fairly, dying so often the word stopped applying. The crypt is his now, and his welcome.' },

  // ---- Ashen Highlands ----
  { kind: 'cinderwraith', name: 'Cinder Wraith', zone: 'Ashen Highlands',
    flavor: 'The smoke of a thing that burned with a grudge. It throws what little heat it has left, and means it.' },
  { kind: 'ashhound', name: 'Ash Hound', zone: 'Ashen Highlands',
    flavor: 'Faithful to the fire that made it. It will run you down with the joyless speed of a thing that no longer needs to breathe.' },
  { kind: 'obsidiangolem', name: 'Obsidian Golem', zone: 'Ashen Highlands',
    flavor: 'Cooled lava taught to resent you. Slow to start, slower to stop, and very hard on the knuckles.' },
  { kind: 'emberlord', name: 'Emberlord Vssaric', zone: 'Ashen Highlands',
    flavor: 'A lieutenant of the deep fire, throwing tantrums in flame. Vain enough to announce every one of them first.' },
  { kind: 'pyraxis', name: 'Pyraxis, the Cinder Wyrm', zone: 'Ashen Highlands',
    flavor: 'The wyrm that made the Highlands ash. To stand before it is to feel the air decide, briefly, against you.' },

  // ---- Frostveil ----
  { kind: 'hoarfrostserpent', name: 'Hoarfrost Serpent', zone: 'Frostveil',
    flavor: 'Spits cold from a distance because the cold prefers it that way. So, frankly, would you.' },
  { kind: 'frostfangstalker', name: 'Frostfang Stalker', zone: 'Frostveil',
    flavor: 'It has been following you since the gate. It would like you to know it was patient.' },
  { kind: 'rimeboundsentinel', name: 'Rimebound Sentinel', zone: 'Frostveil',
    flavor: 'Frozen at its post a thousand winters ago and never relieved. It will not be the one to break protocol.' },
  { kind: 'hrimnir', name: 'Hrimnir, the Avalanche-Jarl', zone: 'Frostveil',
    flavor: 'He rules the vale the way a mountain rules: by coming down on whatever is beneath it.' },

  // ---- Starfall Sanctum ----
  { kind: 'custodian', name: 'Astral Custodian', zone: 'Starfall Sanctum',
    flavor: 'It keeps the vault tidy and the intruders fewer. It does not consider these separate tasks.' },
  { kind: 'seraphel', name: 'Seraphel, the Vault Warden', zone: 'Starfall Sanctum',
    flavor: 'Beautiful, patient, and entirely certain you have come to take what is not yours. She is, of course, correct.' },
  { kind: 'noctyra', name: 'Noctyra, the Hollow Star', zone: 'Starfall Sanctum',
    flavor: 'A star that burned out and kept the door anyway. Behind it is everything; that is precisely the problem.' },

  // ---- Verdant Hollow ----
  { kind: 'sporecaller', name: 'Sporecaller', zone: 'Verdant Hollow',
    flavor: 'It does not fight so much as garden you, from a distance, with terrible patience.' },
  { kind: 'hollowstalker', name: 'Hollowstalker', zone: 'Verdant Hollow',
    flavor: 'Grown from the hollow places where the forest forgot itself. It remembers you just fine.' },
  { kind: 'swarmling', name: 'Mycelial Swarmling', zone: 'Verdant Hollow',
    flavor: 'One is nothing. The trouble is that there is never, ever, one.' },
  { kind: 'bloomwarden', name: 'Bloomwarden', zone: 'Verdant Hollow',
    flavor: 'Tends the bloom the way a knight tends a creed: lethally, and without much sense of humor about it.' },
  { kind: 'spireshade', name: 'Spireshade, the Mother-Bloom', zone: 'Verdant Hollow',
    flavor: 'Every spore in the Hollow is, in some small way, her opinion of you. The opinion is poor.' },
  { kind: 'vorthal', name: 'Vorthal, the First Root', zone: 'Verdant Hollow',
    flavor: 'The root that grew before there was soil to hold it. Cut it and the whole Hollow flinches.' },

  // ---- The Last Hour ----
  { kind: 'cogwraith', name: 'Cogwraith', zone: 'The Last Hour',
    flavor: 'A ghost wound into the works, turning because stopping was never one of its functions.' },
  { kind: 'sandflayer', name: 'Sandflayer', zone: 'The Last Hour',
    flavor: 'Made of the hour-glass and the hour it ground away. It would like the time back. All of it.' },
  { kind: 'quaranth', name: 'Quaranth, the Unwound', zone: 'The Last Hour',
    flavor: 'A guardian whose spring finally let go. Now it moves in every direction time forgot to.' },
  { kind: 'echo', name: 'Echo of the First Minute', zone: 'The Last Hour',
    flavor: 'The very first minute, repeating itself, furious that no one ever let it become the second.' },
  { kind: 'khronaxis', name: 'Khronaxis, the Hour That Was Kept', zone: 'The Last Hour',
    flavor: 'The last hour, hoarded against the end of everything. Take it, and the end will simply have to wait.' },

  // ---- Secrets ----
  { kind: 'thunderbristle', name: 'Thunderbristle, Sire of All Boars', zone: 'Secrets',
    flavor: 'The boar from which all boars descend, gilded in stolen lightning. This — at last — is where Bodo got them.' },
];

// ---------------------------------------------------------------------------
// TITLE_NONE — sentinel for the char-sheet title picker's "wear no title" option
// (maps to player.title = null in the UI).
// ---------------------------------------------------------------------------
export const TITLE_NONE = 'none';
