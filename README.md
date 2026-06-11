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
| Both mouse buttons | Run forward while steering with the mouse |
| Click / `Tab` | Target an enemy |
| `1`–`4` | Skills (per class) |
| `F` | Talk to Pioneer Barnaby |
| `Space` | Jump (some things must be jumped over…) |
| `Q` | Drink a Pioneer's Draught |
| `R` | Consume a glowing rune (+1 weapon damage, permanent) |
| `I` | Open the bag (equip gear; sell tab when trading with Barnaby) |
| `C` (or click your portrait) | Character sheet |
| `T` | Talents |
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
- **Talents — the Deep Paths** — from level 10, one point per level across
  three branches, each thirty ranks deep: **Onslaught** (offense), **Bulwark**
  (defense), and **Pathfinder** (utility). Fifteen ranks unlock a branch's
  capstone active (Execute / Stoneform / Dash). At ranks 11 and 21 each branch
  forks into a **choice node** — pick one of two permanent passives, the other
  is forsaken until you respec. And at twenty-five ranks you may swear a
  **Mastery Oath** — Reaver, Mountain, or Horizon — *one, ever*: a great
  passive plus an upgraded capstone (Reaper's Verdict, Worldstone Bulwark,
  Skystep). Ninety ranks exist; even a capped hero cannot walk them all.
  Barnaby's Tome of Unlearning still unwinds everything — but breaking an
  oath costs a 5,000-gold Oathbreaker's Toll.
- **The Ashen Highlands** — the level 55–75 post-cap arc beyond the mountain
  pass: Cinder Wraiths (ranged casters), Ash Hounds (fast pack hunters),
  Obsidian Golems (armored sentries), the elite **Emberlord Vssaric**, and the
  world boss **Pyraxis, the Cinder Wyrm** — slam, breath, and clinging fire
  patches that linger and shrink the arena. The level 55+ gear tier and its
  legendaries drop here, alongside Emberwarden Kaska's quest chain and bounty.
- **The Frostveil** — the level 82–92 crater-vale beyond the western rim,
  frozen the night a star fell with the Wyrm: polar night under a living
  aurora, snowfall, a frozen tarn. Hoarfrost Serpents (a new undulating rig)
  spit winter, Frostfang Stalkers hunt in whites, Rimebound Sentinels shrug
  off steel — and **Hrimnir, the Avalanche-Jarl** brings the glacier down on
  your head. Surveyor Odda would like it all mapped, please.
- **The Starfall Sanctum** — the level 96–105 capstone dungeon beneath the
  tarn ice: a drowned astral observatory of constellation pillars and a
  turning golden orrery. Astral Custodians patrol it, **Seraphel, the Vault
  Warden** holds the inner gate — and at the bottom waits **Noctyra, the
  Hollow Star** (level 105), who teaches the game's final lesson: when she
  drinks the light, the only safe ground in creation is *inside* her shadow —
  **GET IN**. Archivist Fenwick is writing it all down from behind a rock.
- **Relics** — a fourth gear slot that only drops past the western arch; the
  expansion's gear chase, capped by **The Last Seal** off Noctyra herself.
- **A mount and other vanities** — Barnaby now sells the Saddle of the
  Howling Plains (a great golden boar, +60% speed out of combat) and the
  Phial of Starlight (you glitter; it does nothing; it's wonderful).
- **Secrets** — the meadow keeps a terrible golden rumor, a hermit on the rim
  asks riddles, a pond rewards patience, a wall in the crypt does not echo
  like the others… and the old words (↑↑↓↓←→←→BA) still mean something.
- **Save & continue** — progress persists in localStorage; the title screen
  offers to continue your hero. Picking a class card forges a new hero
  (and erases the old save). Old saves migrate forward — the talent rework
  refunds every point once, with apologies from the Goddess.
- WebAudio synth SFX, procedurally animated low-poly characters.

### Restoring a hero from before the save system

If you played a version without saves, open the browser console and run
`__veteran('warrior')` (or `'scout'`, `'mage'`, `'priest'`) — you'll be
restored to level 10 with the first chapter complete, ready to choose your
second class.
