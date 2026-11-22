// main.js — VAULTBREAK game loop: states, thief, tools, alarm, win/lose,
// deterministic ?shot= stages for screenshots and a ?selftest= autopilot.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const params = new URLSearchParams(window.location.search);
const SHOT = params.get('shot');
const SELFTEST = params.get('selftest');

const game = {
  state: 'menu',
  levelIndex: 0,
  level: LEVELS[0],
  world: null,
  guards: [],
  cameras: [],
  thief: { x: 0, y: 0, angle: 0, sneaking: false, moving: false, moveTarget: null },
  alarm: 0,
  lootValue: 0,
  score: 0,
  time: 0,
  lastTimeBonus: 0,
  tools: { coins: TUNE.coinsStart, smoke: TUNE.smokeStart },
  smokes: [],
  coinsThrown: [],
  frozen: false,
  autopilot: false,
  autoStep: 0,
  autoWait: 0,
  selftestDone: false,
  selftestStarted: Date.now(),
};

function startLevel(index) {
  game.levelIndex = index;
  game.level = levelFor(index);
  game.world = buildWorld(game.level);
  game.world.smokes = game.smokes;
  game.guards = game.level.guards.map((d) => createGuard(d));
  game.cameras = game.level.cameras.map((d) => createCamera(d));
  game.thief.x = game.world.spawn.x;
  game.thief.y = game.world.spawn.y;
  game.thief.angle = 0;
  game.thief.moveTarget = null;
  game.alarm = 0;
  game.time = 0;
  game.tools = { coins: TUNE.coinsStart, smoke: TUNE.smokeStart };
  game.smokes = [];
  game.world.smokes = game.smokes;
  game.coinsThrown = [];
  game.autoStep = 0;
  game.autoGating = true;
  game.autoStuck = null;
  game.autoSidestep = null;
  game.state = 'playing';
}

function newGame() {
  game.lootValue = 0;
  game.score = 0;
  startLevel(0);
}

function grabLoot(loot) {
  loot.taken = true;
  game.lootValue += loot.value;
  game.score += loot.value;
  playPickup();
}

function tryGrab() {
  let best = null;
  let bestD = TUNE.lootGrabRadius;
  for (const loot of game.world.loots) {
    if (loot.taken) continue;
    const d = Math.hypot(game.thief.x - loot.x, game.thief.y - loot.y);
    if (d < bestD) {
      best = loot;
      bestD = d;
    }
  }
  if (best) grabLoot(best);
}

function tossCoin() {
  if (game.tools.coins <= 0) return;
  game.tools.coins--;
  const tx = game.thief.x + Math.cos(game.thief.angle) * 130;
  const ty = game.thief.y + Math.sin(game.thief.angle) * 130;
  game.coinsThrown.push({ x: tx, y: ty, ttl: 8 });
  playToss();
  for (const g of game.guards) {
    if (Math.hypot(g.x - tx, g.y - ty) < 280) {
      g.state = 'suspicious';
      g.suspicion = 0.65;
      g.lastSeen = { x: tx, y: ty };
    }
  }
}

function dropSmoke() {
  if (game.tools.smoke <= 0) return;
  game.tools.smoke--;
  game.smokes.push({ x: game.thief.x, y: game.thief.y, r: TUNE.smokeRadius, ttl: TUNE.smokeSeconds });
  playSmoke();
}

function updateThief(dt) {
  const thief = game.thief;
  const vec = moveVector(input);
  thief.sneaking = keyDown(input, 'Shift');
  let mx = vec.x;
  let my = vec.y;
  if (mx === 0 && my === 0 && thief.moveTarget) {
    const dx = thief.moveTarget.x - thief.x;
    const dy = thief.moveTarget.y - thief.y;
    const d = Math.hypot(dx, dy);
    if (d < 10) {
      thief.moveTarget = null;
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  thief.moving = mx !== 0 || my !== 0;
  if (thief.moving) {
    if (mx !== 0 || my !== 0) thief.angle = Math.atan2(my, mx);
    const speed = thief.sneaking ? TUNE.sneakSpeed : TUNE.thiefSpeed;
    const moved = moveCircle(game.world, thief.x, thief.y, mx * speed * dt, my * speed * dt, TUNE.thiefRadius);
    thief.x = moved.x;
    thief.y = moved.y;
  }
  if (keyPressed(input, 'e', 'E')) tryGrab();
  if (keyPressed(input, 'c', 'C')) tossCoin();
  if (keyPressed(input, 'q', 'Q')) dropSmoke();
  if (input.clicked) {
    const cx = input.clickX;
    const cy = input.clickY;
    let grabbed = false;
    for (const loot of game.world.loots) {
      if (!loot.taken && Math.hypot(cx - loot.x, cy - loot.y) < 40) {
        if (Math.hypot(thief.x - loot.x, thief.y - loot.y) < TUNE.lootGrabRadius) {
          grabLoot(loot);
          grabbed = true;
        }
      }
    }
    if (!grabbed && cy > HUD_H) thief.moveTarget = { x: cx, y: cy };
  }
  for (const loot of game.world.loots) {
    if (!loot.taken && Math.hypot(thief.x - loot.x, thief.y - loot.y) < 18) grabLoot(loot);
  }
}

function updateAlarm(dt, time) {
  let rising = 0;
  let anyAlert = false;
  for (const g of game.guards) {
    if (g.state === 'alert') {
      rising += TUNE.alarmRiseGuard;
      anyAlert = true;
    } else if (g.suspicion > 0.55) {
      rising += 3;
    }
  }
  for (const cam of game.cameras) {
    if (cam.seeing) rising += TUNE.alarmRiseCamera;
  }
  if (rising > 0) {
    game.alarm = Math.min(100, game.alarm + rising * dt);
  } else {
    game.alarm = Math.max(0, game.alarm - TUNE.alarmDecay * dt);
  }
  setAlarmHum(game.alarm);
  if (game.alarm >= 100) return 'caught';
  for (const g of game.guards) {
    if (g.caughtThief) return 'caught';
  }
  return null;
}

function updatePlaying(dt, time) {
  game.time += dt;
  if (game.autopilot) autopilotStep(dt);
  else updateThief(dt);
  for (const g of game.guards) {
    updateGuard(game.world, g, game.thief, dt, () => playSpotted());
  }
  for (const cam of game.cameras) updateCamera(game.world, cam, game.thief, dt, time);
  for (const s of game.smokes) s.ttl -= dt;
  game.smokes = game.smokes.filter((s) => s.ttl > 0);
  game.world.smokes = game.smokes;
  for (const c of game.coinsThrown) c.ttl -= dt;
  game.coinsThrown = game.coinsThrown.filter((c) => c.ttl > 0);
  const fate = updateAlarm(dt, time);
  if (fate === 'caught') {
    game.state = 'caught';
    playCaught();
    setAlarmHum(0);
    finishSelftest('LOSE caught alarm=' + Math.round(game.alarm));
    return;
  }
  if (vaultTaken(game.world)) {
    const exit = game.world.exit;
    if (Math.hypot(game.thief.x - exit.x, game.thief.y - exit.y) < 26) {
      levelCleared();
    }
  }
}

function levelCleared() {
  const bonus = Math.max(0, Math.round((game.level.parSeconds - game.time) * 10));
  game.lastTimeBonus = bonus;
  game.score += bonus;
  playWin();
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.state = 'win';
    finishSelftest('WIN score=' + game.score + ' loot=$' + game.lootValue);
  } else {
    game.state = 'levelDone';
  }
}

function guardThreatens(world, guard, thief) {
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 280) return false;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, guard.angle)) > 1.05) return false;
  return lineOfSightClear(world, guard.x, guard.y, thief.x, thief.y);
}

function cameraThreatens(world, cam, thief) {
  const dx = thief.x - cam.x;
  const dy = thief.y - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 240) return false;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, cam.angle)) > 0.75) return false;
  return lineOfSightClear(world, cam.x, cam.y, thief.x, thief.y);
}

function autopilotStep(dt) {
  const thief = game.thief;
  const guards = game.guards;
  const maxSusp = Math.max(0, ...guards.map((g) => g.suspicion));
  const anyAlert = guards.some((g) => g.state === 'alert');
  const nearestGuard = Math.min(Infinity, ...guards.map((g) => Math.hypot(g.x - thief.x, g.y - thief.y)));
  const threatened = guards.some((g) => guardThreatens(game.world, g, thief)) ||
    game.cameras.some((c) => cameraThreatens(game.world, c, thief));
  const route = game.level.autopilot;
  if (game.autoStep >= route.length) {
    thief.moving = false;
    return;
  }
  // Danger: a guard is chasing, or a cone is on us up close — run for the waypoint.
  // Starting a leg with a cone sweeping over us from far off: hold until it passes.
  // Hot alarm but unseen: hold still and let it decay.
  let speed = TUNE.sneakSpeed;
  thief.sneaking = true;
  if (anyAlert || maxSusp > 0.6 || (threatened && nearestGuard < 200)) {
    speed = TUNE.thiefSpeed;
    thief.sneaking = false;
    if (threatened && nearestGuard < 200 && game.tools.smoke > 0 && !thiefInSmoke(game.world, thief)) {
      dropSmoke();
    }
  } else if (game.autoGating && threatened) {
    game.autoGateTime = (game.autoGateTime || 0) + dt;
    if (game.autoGateTime < 10) {
      thief.moving = false;
      return;
    }
  } else if (game.alarm > 60 && maxSusp < 0.3) {
    thief.moving = false;
    return;
  }
  game.autoGating = false;
  // Stuck detection: if barely moved in the last second, step back toward
  // the leg's centreline (the axis the waypoint lies on) to un-wedge.
  if (!game.autoStuck) game.autoStuck = { x: thief.x, y: thief.y, t: 0 };
  game.autoStuck.t += dt;
  if (game.autoStuck.t > 1) {
    const moved = Math.hypot(thief.x - game.autoStuck.x, thief.y - game.autoStuck.y);
    if (moved < 5 && !game.autoSidestep) {
      const target = tileCenter(route[game.autoStep][0], route[game.autoStep][1]);
      const dx = target.x - thief.x;
      const dy = target.y - thief.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        game.autoSidestep = { x: 0, y: Math.sign(dy) || 1, ttl: 0.5 };
      } else {
        game.autoSidestep = { x: Math.sign(dx) || 1, y: 0, ttl: 0.5 };
      }
    }
    game.autoStuck = { x: thief.x, y: thief.y, t: 0 };
  }
  let mx = 0;
  let my = 0;
  if (game.autoSidestep) {
    game.autoSidestep.ttl -= dt;
    mx = game.autoSidestep.x;
    my = game.autoSidestep.y;
    if (game.autoSidestep.ttl <= 0) game.autoSidestep = null;
  } else {
    const target = tileCenter(route[game.autoStep][0], route[game.autoStep][1]);
    const dx = target.x - thief.x;
    const dy = target.y - thief.y;
    const d = Math.hypot(dx, dy);
    if (d < 12) {
      // Snap exactly onto the waypoint: every leg then starts on a tile
      // centre, so the thief never drifts into a crate corner mid-leg.
      thief.x = target.x;
      thief.y = target.y;
      game.autoStep++;
      game.autoGating = true;
      return;
    }
    // Legs are axis-aligned by construction: move on one axis only so the
    // thief stays on the centreline instead of cutting corners diagonally.
    if (Math.abs(dx) > Math.abs(dy)) {
      mx = Math.sign(dx);
      my = 0;
    } else {
      mx = 0;
      my = Math.sign(dy);
    }
  }
  thief.angle = Math.atan2(my, mx);
  thief.moving = true;
  const moved = moveCircle(game.world, thief.x, thief.y, mx * speed * dt, my * speed * dt, TUNE.thiefRadius);
  if (Math.hypot(moved.x - thief.x, moved.y - thief.y) > 0.5) game.autoGateTime = 0;
  thief.x = moved.x;
  thief.y = moved.y;
  for (const loot of game.world.loots) {
    if (!loot.taken && Math.hypot(thief.x - loot.x, thief.y - loot.y) < TUNE.lootGrabRadius) grabLoot(loot);
  }
}

function finishSelftest(result) {
  if (!SELFTEST || game.selftestDone) return;
  game.selftestDone = true;
  const el = document.getElementById('selftest-result');
  const ok = SELFTEST === 'win' ? result.startsWith('WIN') : result.startsWith('LOSE');
  const text = 'SELFTEST ' + (ok ? 'PASS' : 'FAIL') + ' ' + SELFTEST + ' ' + result + ' level=' + (game.levelIndex + 1);
  if (el) el.textContent = text;
  document.title = text;
}

function stageShot(kind) {
  if (kind === 'cover') {
    startLevel(0);
    const t = game.thief;
    const c = tileCenter(13, 9);
    t.x = c.x;
    t.y = c.y;
    t.angle = -0.4;
    game.guards[0].x = tileCenter(8, 9).x;
    game.guards[0].y = tileCenter(8, 9).y;
    game.guards[0].angle = 0.3;
    game.guards[0].suspicion = 0.35;
    game.guards[1].x = tileCenter(22, 9).x;
    game.guards[1].y = tileCenter(22, 9).y;
    game.guards[1].angle = Math.PI - 0.3;
    game.guards[1].suspicion = 0.2;
    game.cameras[0].angle = 3.6;
    game.alarm = 34;
    game.lootValue = 0;
    game.score = 1200;
    game.time = 47;
  } else if (kind === 'play') {
    startLevel(0);
    const t = game.thief;
    const c = tileCenter(24, 3);
    t.x = c.x;
    t.y = c.y;
    t.angle = Math.PI / 2;
    game.guards[0].state = 'suspicious';
    game.guards[0].suspicion = 0.7;
    game.guards[0].lastSeen = { x: t.x, y: t.y };
    game.guards[0].x = tileCenter(18, 9).x;
    game.guards[0].y = tileCenter(18, 9).y;
    game.guards[0].angle = -0.9;
    game.guards[1].x = tileCenter(10, 9).x;
    game.guards[1].y = tileCenter(10, 9).y;
    game.guards[1].angle = 0.2;
    game.alarm = 22;
    game.score = 800;
    game.time = 61;
  } else if (kind === 'alert') {
    startLevel(1);
    const t = game.thief;
    const c = tileCenter(14, 8);
    t.x = c.x;
    t.y = c.y;
    t.angle = 2.6;
    game.guards[0].state = 'alert';
    game.guards[0].suspicion = 1;
    game.guards[0].x = tileCenter(11, 8).x;
    game.guards[0].y = tileCenter(11, 8).y;
    game.guards[0].angle = 0;
    game.guards[1].x = tileCenter(24, 8).x;
    game.guards[1].y = tileCenter(24, 8).y;
    game.guards[1].angle = Math.PI;
    game.cameras[0].seeing = true;
    game.cameras[0].angle = 3.1;
    game.alarm = 78;
    game.lootValue = 1800;
    game.score = 5400;
    game.time = 96;
  } else if (kind === 'win') {
    startLevel(2);
    game.state = 'win';
    game.lootValue = 19000;
    game.score = 21450;
    game.time = 188;
  }
  game.frozen = true;
}

let last = performance.now();
let elapsed = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  elapsed += dt;
  if (!game.frozen) {
    if (game.state === 'menu') {
      if (keyPressed(input, 'Enter') || input.clicked) {
        initAudio();
        playClick();
        newGame();
      }
    } else if (game.state === 'playing') {
      updatePlaying(dt, elapsed);
    } else if (game.state === 'caught') {
      if (keyPressed(input, 'r', 'R')) {
        startLevel(game.levelIndex);
      } else if (keyPressed(input, 'Enter')) {
        game.state = 'menu';
      }
    } else if (game.state === 'levelDone') {
      if (keyPressed(input, 'Enter')) {
        startLevel(game.levelIndex + 1);
      }
      if (game.autopilot) {
        game.autoWait += dt;
        if (game.autoWait > 0.8) {
          game.autoWait = 0;
          startLevel(game.levelIndex + 1);
        }
      }
    } else if (game.state === 'win') {
      if (keyPressed(input, 'r', 'R')) newGame();
    }
    if (SELFTEST === 'lose' && game.state === 'playing' && !game.selftestDone) {
      if (game.time > 25) finishSelftest('FAIL lose-timeout alarm=' + Math.round(game.alarm));
    }
    if (SELFTEST && game.state === 'playing' && game.time > 420) {
      finishSelftest('FAIL timeout level=' + (game.levelIndex + 1));
    }
  }
  drawGame(ctx, game, elapsed);
  endFrameInput(input);
  requestAnimationFrame(frame);
}

if (SELFTEST === 'win') {
  game.autopilot = true;
  newGame();
} else if (SELFTEST === 'lose') {
  newGame();
  const g = game.guards[0];
  game.thief.x = g.x + Math.cos(g.angle) * 70;
  game.thief.y = g.y + Math.sin(g.angle) * 70;
  game.thief.sneaking = false;
} else if (SHOT) {
  stageShot(SHOT);
}

window.__vaultbreak = { game };
requestAnimationFrame(frame);
