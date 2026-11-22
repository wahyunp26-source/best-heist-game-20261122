# VAULTBREAK — The Midnight Heist

[![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/wahyunp26-source/best-heist-game-20261122/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/wahyunp26-source/best-heist-game-20261122/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

A top-down stealth heist game for the make.fun bounty **best-heist-game-20261122-0559**.
You are Rook, the quietest thief in the city. Cross three guarded rooms, lift the
Meridian Diamond (plus safes and cash bags), and slip out the exit before the alarm
hits 100%.

## How to play

Serve `game/` with any static server and open `game/index.html` in desktop Chrome.

- **WASD / arrows** — move (click anywhere to walk there)
- **Shift** — sneak (slower, much harder to spot)
- **E** — grab loot (or click the loot when close)
- **C** — toss a coin to distract nearby guards
- **Q** — smoke bomb (blocks guard and camera vision)

Guards patrol, get suspicious, chase, search, and return. Cameras sweep their
cones. The alarm rises while you are seen and falls while you stay hidden.
Grab the vault loot, then reach the glowing EXIT.

## Structure

- `game/src/config.js` — levels, tuning, autopilot routes
- `game/src/world.js` — map parsing, collision, line-of-sight
- `game/src/guard.js` — guard AI (patrol → suspicious → alert → search → return)
- `game/src/camera.js` — sweeping security cameras
- `game/src/audio.js` — synthesized WebAudio sounds (no audio files)
- `game/src/input.js` — keyboard + mouse input
- `game/src/render.js` — all canvas drawing (room, cones, loot, HUD)
- `game/src/main.js` — game loop, states, tools, alarm, win/lose, screenshots

All art is drawn in code and all sound is synthesized — no external assets,
no network requests at runtime. Pure static files.
