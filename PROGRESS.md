# Expansion build log

Working log for the post-Noctyra major expansion. One entry per iteration;
each iteration ends in a green `vite build` and a commit.

## Plan of record

| # | Iteration | Status |
| --- | --- | --- |
| 1 | Design pass → `EXPANSION.md` spec ("The Hollow Hour", 106–120) | ✅ done |
| 2 | **A** — The Verdant Hollow zone (106–118): mobs, Greta's chain, Vorthal | pending |
| 3 | **B** — The Last Hour dungeon (116–120): 4 NEW mechanic kinds, cap → 120 | pending |
| 4 | **C** — Crafting/gathering + item sets + new class skills | pending |
| 5 | **D** — Achievements/Bestiary panel (K) + titles | pending |
| 6 | **E** — Hidden layer: the Larder, treasure maps, mimics, Grim, riddles | pending |
| 7 | Balance audit, smoke test, docs (README/PLAN) | pending |

Orchestration: one multi-agent workflow per iteration (Opus subagents),
parallel authors on disjoint new files → single integrator for hub files
(`main.js`, `entities.js`, `ui.js`, `player.js`) → build + adversarial review
→ fix loop → commit.

## Log

### Iteration 1 — design pass (2026-06-12) ✅

- Ran `expansion-design` workflow: 5 parallel codebase readers (1 lost to an
  API overload; designers compensated by reading source directly) →
  4 parallel content designers → 1 synthesizer. ~750k subagent tokens.
- Output: `EXPANSION.md` (1745 lines) — **The Hollow Hour**, levels 106–120:
  - **A** The Verdant Hollow (south pocket x −60..60, z −360..−250, own
    ground mesh): bioluminescent grotto-vale, 6 mob families incl. a new
    sporeling rig, elite Spireshade L116, world boss Vorthal L118,
    Greta Thornby's 8-step chain + bounty, ilvl 106–120 tier + 4 uniques.
  - **B** The Last Hour (Horologium pocket x 250..360, z 200..320, floor
    y 60): 4 brand-new mechanic kinds (`beam` sweep / `soak` shared-burden /
    `tether` snap-by-distance / `shatterfloor` tiles), bosses Quaranth L116,
    Echo L118, Khronaxis L120 (the game's only enrage timer; raises cap
    to 120 via `LEVEL_CAP`), Tamsin Verge's chain, relic BiS "The Last Hour".
  - **C** Crafting/gathering (`gathering.js`, Smith Halla, panel on B),
    4 item sets via `totalEquippedStats`, 1 new control skill per class at 55
    (bosses `ccImmune` → 0.5s stagger; interrupts still work).
  - **D** Bestiary/Achievements panel on K (~17 achievements), cosmetic
    titles on the character sheet.
  - **E** Hidden layer: the Larder secret pocket (x 150..170, z −360..−340,
    knock puzzle, off all maps until found), 5 treasure maps with prose
    clues + dig cast, Mimic ambush elite, Grim the Tax Collector L119
    (Sanctum ritual), 3 new Madge riddles.
  - ONE save bump v4 → v5 collecting every new field; geography verified
    against `noise.js` (heightAt checks x AND z, no pocket overlaps).
- Committed with this log entry.
