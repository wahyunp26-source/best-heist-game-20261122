// config.js — VAULTBREAK level data, tuning constants and autopilot routes.
// Every level is hand-authored here: map legend
//   # wall   . floor   C crate (solid, blocks sight)   D desk (solid, blocks sight)
//   R carpet (shadow: harder to spot)   P player start   G guard spawn
//   K camera   V vault (main loot)   S safe (bonus loot)   M money bag (bonus)
//   E exit door
const TILE = 32;
const MAP_COLS = 30;
const MAP_ROWS = 18;
const VIEW_W = MAP_COLS * TILE;
const HUD_H = 64;
const VIEW_H = HUD_H + MAP_ROWS * TILE;

const TUNE = {
  thiefSpeed: 165,
  sneakSpeed: 92,
  thiefRadius: 11,
  guardSpeed: 78,
  guardChaseSpeed: 132,
  guardRange: 195,
  guardHalfAngle: 0.61,
  cameraRange: 215,
  cameraHalfAngle: 0.5,
  alarmRiseGuard: 16,
  alarmRiseCamera: 30,
  alarmDecay: 5,
  suspicionDecay: 0.55,
  catchRadius: 20,
  lootGrabRadius: 36,
  smokeRadius: 78,
  smokeSeconds: 6,
  coinsStart: 3,
  smokeStart: 2,
};

const LEVELS = [
  {
    name: 'The Gallery',
    sub: 'Museum of Meridian — lift the Meridian Diamond',
    parSeconds: 150,
    vaultValue: 5000,
    safeValue: 1500,
    bagValue: 300,
    map: [
      '##############################',
      '#P....#......C......#....V...#',
      '#.....#.............#........#',
      '#..C..#..C......C...#...C....#',
      '#.....#.............#........#',
      '#.....D......C......D........#',
      '#............................#',
      '#..C......C......C......C....#',
      '#............................#',
      '#..G......C......C.......G...#',
      '#............................#',
      '#.....#......C......#........#',
      '#..C..#.............#...C....#',
      '#.....#..C......C...#........#',
      '#.....#.............#....K...#',
      '#............................#',
      '#E.......................C...#',
      '##############################',
    ],
    guards: [
      { path: [[3, 9], [26, 9]], speed: 72 },
      { path: [[26, 9], [3, 9]], speed: 72 },
    ],
    cameras: [
      { tx: 25, ty: 14, angle: 200, sweep: 55, speed: 0.55 },
    ],
    autopilot: [[5, 1], [5, 6], [21, 6], [25, 6], [25, 3], [25, 1], [25, 6], [21, 6], [14, 6], [14, 10], [7, 10], [7, 14], [7, 16], [1, 16]],
  },
  {
    name: 'The Bank Vault',
    sub: 'First Meridian Bank — crack the vault, mind the cameras',
    parSeconds: 180,
    vaultValue: 6000,
    safeValue: 1800,
    bagValue: 400,
    map: [
      '##############################',
      '#P........#..C......#....S...#',
      '#....C....#..........#.......#',
      '#.........#.....C....#...C...#',
      '#..D......D..........D.......#',
      '#............................#',
      '#..C......C......C......C....#',
      '#............................#',
      '#..G......C......C.......G...#',
      '#............................#',
      '#.....#......C......#.....K..#',
      '#..C..#.............#........#',
      '#.....#..C......C...#....C...#',
      '#............................#',
      '#..C......C......C......C....#',
      '#............................#',
      '#E..............V...........G#',
      '##############################',
    ],
    guards: [
      { path: [[3, 8], [26, 8]], speed: 80 },
      { path: [[26, 8], [3, 8]], speed: 80 },
      { path: [[28, 16], [28, 3]], speed: 66 },
    ],
    cameras: [
      { tx: 27, ty: 10, angle: 180, sweep: 70, speed: 0.7 },
      { tx: 4, ty: 16, angle: 0, sweep: 50, speed: 0.5 },
    ],
    autopilot: [[2, 1], [2, 5], [21, 5], [25, 5], [26, 5], [26, 1], [25, 1], [26, 1], [26, 5], [21, 5], [18, 5], [18, 16], [16, 16], [2, 16], [1, 16]],
  },
  {
    name: 'The Penthouse',
    sub: 'Kessler Tower penthouse — the Meridian Crown, triple guard',
    parSeconds: 210,
    vaultValue: 8000,
    safeValue: 2200,
    bagValue: 500,
    map: [
      '##############################',
      '#P....#....C....#.....S......#',
      '#.....#.........#............#',
      '#..C..#..C......#..C.....C...#',
      '#.....#.........#............#',
      '#..D..D....C....D......D.....#',
      '#............................#',
      '#..C......C......C......C....#',
      '#............................#',
      '#..G.....C......C......G.....#',
      '#............................#',
      '#.....#......C......#....K...#',
      '#..C..#.............#........#',
      '#.....#..C......C...#..C.....#',
      '#............................#',
      '#..C......C......C......C....#',
      '#E.............V............G#',
      '##############################',
    ],
    guards: [
      { path: [[3, 9], [26, 9]], speed: 88 },
      { path: [[26, 9], [3, 9]], speed: 88 },
      { path: [[28, 17], [28, 2]], speed: 74 },
      { path: [[14, 5], [14, 16]], speed: 70 },
    ],
    cameras: [
      { tx: 27, ty: 11, angle: 180, sweep: 80, speed: 0.8 },
      { tx: 2, ty: 11, angle: 0, sweep: 60, speed: 0.6 },
      { tx: 15, ty: 1, angle: 90, sweep: 50, speed: 0.65 },
    ],
    autopilot: [[2, 1], [2, 6], [21, 6], [21, 1], [25, 1], [21, 1], [21, 6], [18, 6], [18, 16], [15, 16], [2, 16], [1, 16]],
  },
];

function levelFor(index) {
  return LEVELS[index % LEVELS.length];
}
