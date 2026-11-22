// world.js — map parsing, tile collision and line-of-sight geometry.
function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: HUD_H + ty * TILE + TILE / 2 };
}

function tileAt(world, px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor((py - HUD_H) / TILE);
  if (tx < 0 || ty < 0 || tx >= MAP_COLS || ty >= MAP_ROWS) return '#';
  return world.grid[ty][tx];
}

function isSolidTile(ch) {
  return ch === '#' || ch === 'C' || ch === 'D';
}

function blocksSightTile(ch) {
  return ch === '#' || ch === 'C' || ch === 'D';
}

function circleHitsSolid(world, x, y, r) {
  const steps = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  for (const a of steps) {
    if (isSolidTile(tileAt(world, x + Math.cos(a) * r, y + Math.sin(a) * r))) return true;
  }
  if (isSolidTile(tileAt(world, x, y))) return true;
  return false;
}

function moveCircle(world, x, y, dx, dy, r) {
  let nx = x + dx;
  if (!circleHitsSolid(world, nx, y, r)) x = nx;
  let ny = y + dy;
  if (!circleHitsSolid(world, x, ny, r)) y = ny;
  return { x, y };
}

// Sampled line-of-sight: walls, crates and desks block a gaze.
function lineOfSightClear(world, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 7));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSightTile(tileAt(world, x1 + dx * t, y1 + dy * t))) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function buildWorld(level) {
  const world = { grid: [], loots: [], exit: null, spawn: null, level };
  for (let ty = 0; ty < MAP_ROWS; ty++) {
    const row = level.map[ty];
    const gridRow = [];
    for (let tx = 0; tx < MAP_COLS; tx++) {
      const ch = row[tx];
      gridRow.push(ch);
      const c = tileCenter(tx, ty);
      if (ch === 'P') world.spawn = c;
      if (ch === 'E') world.exit = { x: c.x, y: c.y };
      if (ch === 'V') world.loots.push({ kind: 'vault', x: c.x, y: c.y, value: level.vaultValue, taken: false, label: 'MERIDIAN DIAMOND' });
      if (ch === 'S') world.loots.push({ kind: 'safe', x: c.x, y: c.y, value: level.safeValue, taken: false, label: 'WALL SAFE' });
      if (ch === 'M') world.loots.push({ kind: 'bag', x: c.x, y: c.y, value: level.bagValue, taken: false, label: 'CASH BAG' });
    }
    world.grid.push(gridRow);
  }
  return world;
}

function vaultTaken(world) {
  return world.loots.filter((l) => l.kind === 'vault').every((l) => l.taken);
}

function thiefOnShadow(world, x, y) {
  return tileAt(world, x, y) === 'R';
}
