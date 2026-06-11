# Runes of Taborea

A single-player, browser-based homage to *Runes of Magic*, built with three.js.
Everything is procedural — no model, texture, or audio assets.

## Run it

```sh
npm install
npm run dev    # → http://localhost:5173
```

## How to play

| Input | Action |
| --- | --- |
| `WASD` | Move |
| Drag mouse | Orbit camera · wheel zooms |
| Click / `Tab` | Target an enemy |
| `1`–`4` | Skills (per class) |
| `F` | Talk to Pioneer Barnaby |
| `Space` | Jump (some things must be jumped over…) |
| `Q` | Drink a Pioneer's Draught |
| `R` | Consume a glowing rune (+1 weapon damage, permanent) |
| `Esc` | Close shop/dialog / clear target |

## What's in the box

- **Four classes** — Warrior, Scout, Mage, Priest — each with a basic strike, a
  heavy nuke (Fireball has a real cast time, interrupted by moving), an AoE,
  and a utility skill. Global cooldown, per-skill cooldowns, mana costs.
- **The Howling Plains** — procedural valley with forests, rocks, dirt paths,
  a pioneer camp with a flickering campfire, and a painted-sky shader.
- **Enemies with AI** — passive Young Boars, aggressive Forest Wolves that
  pull on proximity and leash back home, and an elite boss, **Bodo the
  Ravager**, at the end of the eastern path.
- **A three-quest chain** from Pioneer Barnaby (boars → wolves → Bodo) with
  `!`/`?` markers, a quest tracker, and turn-in rewards.
- **Progression** — XP, levels, gold, rune drops, floating combat text, crits,
  combat log, minimap, death/respawn, and a level-up fanfare.
- **Dual-class at level 10** — as is the old custom of Taborea: choose a second
  class, gain its four skills (keys 5–8) and a blended stat boost.
- **The Grimblade questline** — level-8 bandits hold a camp on the northwest
  ridge, ruled by the elite **Rurik the Red** (level 12).
- **Pioneer's Bounty** — once the story is done, an endlessly repeatable
  bounty: any ten kills for XP, gold, and a rune coin-flip.
- **The Trials** — three endgame bosses with telegraphed mechanics at the
  valley's edges: **Korgrim the Mountain** (jump his shockwave), **Vexnar the
  Ash Dragon** (run from her breath mark), and **Morgrath, the Pale King**
  (he raises thralls as you wound him). Long fights, long respawns, big loot.
- **Barnaby's Wares** — a gold sink: potions, escalating-price permanent
  training (+damage, +health, +crit), and Swift Boots.
- **The Sunken Crypt** — the level 41–55 capstone dungeon beneath the hills northwest of
  camp: revenant packs that punish careless pulls, **Gravelord Ossus**, and
  **Vargoth the Undying** — slam, curse, and summons all at once. The walls
  are solid, the dark is honest, and the dead hit very, very hard.
- **Talents** — from level 10, one point per level across three branches —
  **Onslaught** (offense), **Bulwark** (defense), and **Pathfinder** (utility).
  Fifteen points in a branch unlocks its capstone active: Execute (a killing
  blow under 30% health), Stoneform (50% damage reduction), or Dash (an
  8-metre blink to dodge anything).
- **The Ashen Highlands** — the level 55–75 post-cap arc beyond the mountain
  pass: Cinder Wraiths (ranged casters), Ash Hounds (fast pack hunters),
  Obsidian Golems (armored sentries), the elite **Emberlord Vssaric**, and the
  world boss **Pyraxis, the Cinder Wyrm** — slam, breath, and clinging fire
  patches that linger and shrink the arena. The level 55+ gear tier and its
  legendaries drop here, alongside Emberwarden Kaska's quest chain and bounty.
- **Save & continue** — progress persists in localStorage; the title screen
  offers to continue your hero. Picking a class card forges a new hero
  (and erases the old save).
- WebAudio synth SFX, procedurally animated low-poly characters.

### Restoring a hero from before the save system

If you played a version without saves, open the browser console and run
`__veteran('warrior')` (or `'scout'`, `'mage'`, `'priest'`) — you'll be
restored to level 10 with the first chapter complete, ready to choose your
second class.
