// camera.js — wall-mounted security cameras with sweeping vision cones.
function createCamera(def) {
  const pos = tileCenter(def.tx, def.ty);
  return {
    x: pos.x,
    y: pos.y,
    baseAngle: (def.angle * Math.PI) / 180,
    sweep: (def.sweep * Math.PI) / 180,
    speed: def.speed || 0.6,
    phase: Math.random() * Math.PI * 2,
    angle: (def.angle * Math.PI) / 180,
    seeing: false,
    alarmFlash: 0,
  };
}

function updateCamera(world, cam, thief, dt, time) {
  cam.angle = cam.baseAngle + Math.sin(time * cam.speed + cam.phase) * cam.sweep;
  const dx = thief.x - cam.x;
  const dy = thief.y - cam.y;
  const dist = Math.hypot(dx, dy);
  let seeing = false;
  if (dist < TUNE.cameraRange) {
    const ang = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(ang, cam.angle)) <= TUNE.cameraHalfAngle) {
      if (lineOfSightClear(world, cam.x, cam.y, thief.x, thief.y) && !thiefInSmoke(world, thief)) {
        seeing = true;
      }
    }
  }
  cam.seeing = seeing;
  if (seeing && cam.alarmFlash <= 0) cam.alarmFlash = 0.4;
  if (cam.alarmFlash > 0) cam.alarmFlash -= dt;
  return seeing;
}
