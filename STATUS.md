# STATUS — VAULTBREAK: The Midnight Heist (best-heist-game-20261122-0559)

## Entry

- Repo: https://github.com/wahyunp26-source/best-heist-game-20261122
- Code commit: `821bb0d` ("Best heist game — VAULTBREAK: The Midnight Heist")
- This file's commit: see `git log` (STATUS.md committed after the code commit)
- Branch: `master`, pushed to origin. Repo PUBLIC, created 2026-11-22T06:06:34Z
  (after the 05:59:00Z open). About set: description names make.fun + this
  bounty, homepage https://make.fun/bounty/best-heist-game-20261122-0559,
  topics makefun, ai-agents, bounties.
- Account: @yuerta. Payout wallet: wQUy3YoX5DoUSaAsXycrZT21NTih6BRwE6N4ossmy9S.
- NOT SUBMITTED (per brief — subjective entry, Wahyu decides after the preview).

## Game

VAULTBREAK — top-down stealth heist, 3 levels (The Gallery, The Bank Vault,
The Penthouse). Thief "Rook" crosses guarded rooms, grabs the Meridian Diamond
(+ wall safes / cash bags), reaches the EXIT before the alarm hits 100%.
Guards: patrol → suspicious → alert chase → search → return, with vision cones.
Cameras sweep cones. Alarm rises when seen, decays when hidden. Tools: coin
toss (distract, x3), smoke bomb (blocks vision, x2), sneak (Shift). Keyboard
WASD/arrows + E/C/Q, click-to-move. Synthesized WebAudio sounds, all art drawn
in code. Pure static files, no network at runtime.

## Files (18, 370,123 bytes)

- `main.ts` — Node 22 stdlib only; copies game/ + screenshots/ to output,
  writes dossier.json via buildDossier from vendor/makefun-game.ts.
- `vendor/makefun-game.ts` — kit copy, byte-identical (sha256 dc671875…).
- `game/index.html` + `game/src/` (8 files, one job each): config, world,
  guard, camera, audio, input, render, main.
- `screenshots/` — 4 real browser renders (Playwright Chromium headless).
- `LICENSE` — MIT, first line `SPDX-License-Identifier: MIT`.
- `README.md` — badges in the slug form (rank + reward).
- `.makefun/owner.json` — exactly
  `{"wallet":"wQUy3YoX5DoUSaAsXycrZT21NTih6BRwE6N4ossmy9S"}`.

## Screenshots (all JPEG, 1280x653, each < 256 KiB)

- `1-cover.jpg` (67,266 B) — room + thief + 2 guards with vision cones +
  camera cone + Meridian Diamond loot + alarm meter 34% in one frame.
- `2-play.jpg` (66,795 B) — thief at the vault, guard suspicious ("?").
- `3-alert.jpg` (70,725 B) — guard alert ("!") chasing, camera SPOTTED!,
  alarm 78%, red vignette, Level 2.
- `4-win.jpg` (57,112 B) — "THE MIDNIGHT HEIST — DONE!" win screen,
  loot $19,000, score 21,450.

## Playtests (real headless-Chromium runs, CDP-driven)

- Keyboard: menu → Enter starts; D/S move the thief (verified positions).
- LOSE self-test: PASS — thief placed in a guard's cone; guard spots,
  alerts, catches by touch in <1s game time.
- WIN self-test: PASS — autopilot completes all 3 levels: score 27,701,
  loot $23,000, final state `win`.
- Bugs found and fixed during playtest: (1) guard in `search` never went
  `alert` when suspicion hit 1.0 standing next to the thief — fixed with a
  global spotted→alert transition; (2) autopilot wedged on crate corners —
  fixed with tile-centre snapping + axis-only legs + re-centring sidestep;
  (3) autopilot waited forever in guard cones — fixed with cone-aware
  gating + run/smoke flee behaviour.
- Note: `/opt/meta-chromium/chrome` would not start in this VM ("Hatch
  WebGL domain policy is required for browser startup"); all browser work
  used the Playwright Chromium at ~/.cache/ms-playwright/chromium-1255.

## main.ts / dossier

- `MAKEFUN_OUTPUT_DIR=/tmp/heist-out node main.ts` — exit 0; output holds
  game/, screenshots/, dossier.json (399,720 B).
- Rebuilding the dossier from the output dir with buildDossier gives
  byte-identical bytes (dossier_matches holds locally).
- Two consecutive runs produce identical output trees (`diff -r` clean).

## makefun check (dev kit, worktree, no transcripts)

`node cli/makefun.mjs check --kit . --repo <entry> --worktree`:
- PASS: competition_open, snapshot, license_osi, entrypoint (4 passed)
- FAIL: transcripts_present (expected — no transcripts; parent bundles the
  session at submit time; every other transcript check skips on that)
- At submission (checked after push): repo_public, repo_owner, commit_in_repo
  now satisfiable (public repo, owner.json committed, commit pushed);
  repo_created_after_open satisfiable (created 06:06:34Z > 05:59:00Z open);
  duplicate_snapshot is the site's check at submit.
- "not ready: fix transcripts_present, then check again" — the only open
  item, owned by the parent at submit time.

## Self-evaluation — can this credibly reach top 10?

YES, credibly. The cover shows every required element in one readable frame
(room, thief, guards + cones, camera + cone, loot, alarm meter); the game is
a complete, genuinely playable 3-level stealth game (verified win + loss
paths, not a staged mock); the source is split into 8 single-job files with
descriptive names. Weak spots, honestly: the floor is dark and a little
sparse in the middle of the room, and the thief/guard figures are small
circles — at 768x480 the scene still reads, but a busier, more colourful
floor would pop more against other entries. The $50 prize splits 10 ways
($12/$8/$6/$5/$4/$3x5), so top 10 is a realistic bar for a complete,
good-looking entry in a 12-hour bounty. No rebuild needed; this version is
worth showing to Wahyu.
