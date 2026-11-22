// guard.js — night-watch guard AI: patrol, suspicious, alert chase, search, return.
function createGuard(def) {
  const start = tileCenter(def.path[0][0], def.path[0][1]);
  return {
    x: start.x,
    y: start.y,
    path: def.path.map(([tx, ty]) => tileCenter(tx, ty)),
    waypoint: 1,
    speed: def.speed || TUNE.guardSpeed,
    angle: 0,
    state: 'patrol',
    suspicion: 0,
    lastSeen: null,
    searchTimer: 0,
    lostTimer: 0,
    pauseTimer: 0,
    flash: 0,
  };
}

function guardSeesThief(world, guard, thief, range, halfAngle) {
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, guard.angle)) > halfAngle) return 0;
  if (!lineOfSightClear(world, guard.x, guard.y, thief.x, thief.y)) return 0;
  if (thiefInSmoke(world, thief)) return 0;
  let rate = 1.25 - (dist / range) * 0.85;
  if (thief.sneaking) rate *= 0.45;
  if (thiefOnShadow(world, thief.x, thief.y)) rate *= 0.6;
  if (thief.moving) rate *= 1.15;
  return Math.max(0.12, rate);
}

function thiefInSmoke(world, thief) {
  if (!world.smokes) return false;
  for (const s of world.smokes) {
    if (Math.hypot(thief.x - s.x, thief.y - s.y) < s.r) return true;
  }
  return false;
}

function updateGuard(world, guard, thief, dt, onSpotted) {
  const seen = guardSeesThief(world, guard, thief, TUNE.guardRange, TUNE.guardHalfAngle);
  if (seen > 0) {
    guard.suspicion = Math.min(1, guard.suspicion + seen * dt);
    guard.lastSeen = { x: thief.x, y: thief.y };
    guard.lostTimer = 0;
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - TUNE.suspicionDecay * dt);
    if (guard.state === 'alert') guard.lostTimer += dt;
  }
  if (guard.flash > 0) guard.flash -= dt;

  // Spotted, whatever the guard was doing: go straight to the chase.
  if (guard.suspicion >= 1 && guard.state !== 'alert') {
    guard.state = 'alert';
    onSpotted('guard');
  }

  if (guard.state === 'patrol') {
    if (guard.suspicion >= 0.55) {
      guard.state = 'suspicious';
    } else {
      patrolStep(guard, dt);
    }
  } else if (guard.state === 'suspicious') {
    if (guard.suspicion <= 0.08) {
      guard.state = 'patrol';
    } else if (guard.lastSeen) {
      walkToward(world, guard, guard.lastSeen.x, guard.lastSeen.y, guard.speed * 0.9, dt);
      if (Math.hypot(guard.x - guard.lastSeen.x, guard.y - guard.lastSeen.y) < 14) {
        guard.state = 'search';
        guard.searchTimer = 2.2;
      }
    }
  } else if (guard.state === 'alert') {
    walkToward(world, guard, thief.x, thief.y, TUNE.guardChaseSpeed, dt);
    if (guard.lostTimer > 3.5) {
      guard.state = 'search';
      guard.searchTimer = 3;
    }
    if (Math.hypot(guard.x - thief.x, guard.y - thief.y) < TUNE.catchRadius + 8) {
      guard.caughtThief = true;
    }
  } else if (guard.state === 'search') {
    guard.searchTimer -= dt;
    guard.angle += dt * 1.8;
    if (guard.searchTimer <= 0) guard.state = 'return';
  } else if (guard.state === 'return') {
    const home = guard.path[0];
    walkToward(world, guard, home.x, home.y, guard.speed, dt);
    if (Math.hypot(guard.x - home.x, guard.y - home.y) < 12) {
      guard.state = 'patrol';
      guard.waypoint = 1;
    }
  }
  if (guard.state !== 'search') {
    const vx = guard.vx || 0;
    const vy = guard.vy || 0;
    if (Math.hypot(vx, vy) > 4) guard.angle = Math.atan2(vy, vx);
  }
}

function patrolStep(guard, dt) {
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    return;
  }
  const target = guard.path[guard.waypoint];
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) {
    guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    guard.pauseTimer = 0.6;
    return;
  }
  const step = Math.min(dist, guard.speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.vx = (dx / dist) * guard.speed;
  guard.vy = (dy / dist) * guard.speed;
}

function walkToward(world, guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;
  const step = Math.min(dist, speed * dt);
  const moved = moveCircle(world, guard.x, guard.y, (dx / dist) * step, (dy / dist) * step, 12);
  guard.vx = ((moved.x - guard.x) / Math.max(dt, 0.001));
  guard.vy = ((moved.y - guard.y) / Math.max(dt, 0.001));
  guard.x = moved.x;
  guard.y = moved.y;
}
