// render.js — every pixel of VAULTBREAK is drawn in code on one canvas.
function drawVisionCone(ctx, x, y, angle, halfAngle, range, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createRadialGradient(x, y, 8, x, y, range);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTileFloor(ctx, world, time) {
  ctx.fillStyle = '#10182e';
  ctx.fillRect(0, HUD_H, VIEW_W, MAP_ROWS * TILE);
  for (let ty = 0; ty < MAP_ROWS; ty++) {
    for (let tx = 0; tx < MAP_COLS; tx++) {
      const ch = world.grid[ty][tx];
      const x = tx * TILE;
      const y = HUD_H + ty * TILE;
      if (ch === '#') {
        ctx.fillStyle = '#2a3352';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#3d4a73';
        ctx.fillRect(x, y, TILE, 4);
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(x, y + TILE - 2, TILE, 2);
      } else {
        const odd = (tx + ty) % 2 === 0;
        ctx.fillStyle = odd ? '#182242' : '#141b36';
        ctx.fillRect(x, y, TILE, TILE);
        if (ch === 'R') {
          ctx.fillStyle = '#3d1f2b';
          ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        }
        if (ch === '.' && (tx * 7 + ty * 13) % 29 === 0) {
          ctx.fillStyle = 'rgba(201,162,39,0.10)';
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (ch === 'C') {
        ctx.fillStyle = '#5a4630';
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = '#8a6d45';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 3);
        ctx.lineTo(x + TILE - 3, y + TILE - 3);
        ctx.stroke();
      }
      if (ch === 'D') {
        ctx.fillStyle = '#4a3226';
        ctx.fillRect(x + 2, y + 6, TILE - 4, TILE - 12);
        ctx.fillStyle = '#6b4a35';
        ctx.fillRect(x + 2, y + 6, TILE - 4, 5);
      }
    }
  }
}

function drawLoot(ctx, world, time) {
  for (const loot of world.loots) {
    if (loot.taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + loot.x);
    if (loot.kind === 'vault') {
      ctx.save();
      ctx.translate(loot.x, loot.y);
      ctx.fillStyle = 'rgba(201,162,39,0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 26 + pulse * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(-14, -10, 28, 20);
      ctx.fillStyle = '#f5d76e';
      ctx.fillRect(-14, -10, 28, 5);
      ctx.fillStyle = '#7de3ff';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(10, -4);
      ctx.lineTo(0, 8);
      ctx.lineTo(-10, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(4, -4);
      ctx.lineTo(0, 0);
      ctx.lineTo(-4, -4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      drawLabel(ctx, loot.x, loot.y - 34, 'MERIDIAN DIAMOND', '#f5d76e');
    } else if (loot.kind === 'safe') {
      ctx.fillStyle = '#3a3f4d';
      ctx.fillRect(loot.x - 11, loot.y - 11, 22, 22);
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.strokeRect(loot.x - 11, loot.y - 11, 22, 22);
      ctx.fillStyle = '#f5d76e';
      ctx.beginPath();
      ctx.arc(loot.x, loot.y, 5, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, loot.x, loot.y - 24, 'WALL SAFE', '#e8e8e8');
    } else {
      ctx.fillStyle = '#8a6d2f';
      ctx.beginPath();
      ctx.arc(loot.x, loot.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5d76e';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', loot.x, loot.y + 4);
    }
  }
  const exit = world.exit;
  const open = vaultTaken(world);
  ctx.save();
  ctx.translate(exit.x, exit.y);
  ctx.fillStyle = open ? '#1f7a3a' : '#24304a';
  ctx.fillRect(-14, -14, 28, 28);
  ctx.strokeStyle = open ? '#7dff9e' : '#5a6a8a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-14, -14, 28, 28);
  ctx.fillStyle = open ? '#b8ffcf' : '#8a97b5';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCK', 0, 4);
  ctx.restore();
  if (open) drawLabel(ctx, exit.x, exit.y - 26, 'GETAWAY — GO!', '#7dff9e');
}

function drawLabel(ctx, x, y, text, color) {
  ctx.save();
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  const w = ctx.measureText(text).width + 10;
  ctx.fillRect(x - w / 2, y - 9, w, 14);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y + 2);
  ctx.restore();
}

function drawCameras(ctx, cameras, time) {
  for (const cam of cameras) {
    drawVisionCone(ctx, cam.x, cam.y, cam.angle, TUNE.cameraHalfAngle, TUNE.cameraRange,
      cam.seeing ? '#ff3b30' : '#ffb340', cam.seeing ? 0.45 : 0.3);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cam.seeing ? '#ff3b30' : '#ffb340';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.rotate(cam.angle);
    ctx.fillStyle = cam.seeing ? '#ff3b30' : '#ffb340';
    ctx.fillRect(0, -4, 14, 8);
    ctx.beginPath();
    ctx.arc(14, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = cam.seeing && Math.sin(time * 12) > 0 ? '#ff0000' : '#ffd76e';
    ctx.fill();
    ctx.restore();
    drawLabel(ctx, cam.x, cam.y - 20, cam.seeing ? 'SPOTTED!' : 'CAMERA', cam.seeing ? '#ff6b60' : '#ffb340');
  }
}

function drawGuard(ctx, guard, time) {
  const coneColor = guard.state === 'alert' ? '#ff3b30' : guard.state === 'suspicious' || guard.state === 'search' ? '#ffb340' : '#ff5b4d';
  const coneAlpha = guard.state === 'alert' ? 0.5 : guard.state === 'patrol' ? 0.34 : 0.4;
  drawVisionCone(ctx, guard.x, guard.y, guard.angle, TUNE.guardHalfAngle, TUNE.guardRange, coneColor, coneAlpha);
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.rotate(guard.angle);
  ctx.fillStyle = '#1c2b4a';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a7bd6';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#dfe6ff';
  ctx.beginPath();
  ctx.arc(5, -4, 2.5, 0, Math.PI * 2);
  ctx.arc(5, 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c2b4a';
  ctx.fillRect(10, -3, 8, 6);
  ctx.restore();
  if (guard.suspicion > 0.05 || guard.state !== 'patrol') {
    const w = 30;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(guard.x - w / 2, guard.y - 26, w, 5);
    ctx.fillStyle = guard.state === 'alert' ? '#ff3b30' : '#ffb340';
    ctx.fillRect(guard.x - w / 2, guard.y - 26, w * guard.suspicion, 5);
  }
  const tag = guard.state === 'alert' ? '!' : guard.state === 'suspicious' || guard.state === 'search' ? '?' : '';
  if (tag) {
    ctx.save();
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = guard.state === 'alert' ? '#ff3b30' : '#ffb340';
    ctx.fillText(tag, guard.x, guard.y - 30);
    ctx.restore();
  }
}

function drawThief(ctx, thief, time) {
  ctx.save();
  ctx.translate(thief.x, thief.y);
  if (thief.sneaking) {
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = 'rgba(125,227,255,0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.rotate(thief.angle);
  ctx.fillStyle = '#101010';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7de3ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#7de3ff';
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(4, -5);
  ctx.lineTo(4, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f5d76e';
  ctx.beginPath();
  ctx.arc(6, -3, 1.8, 0, Math.PI * 2);
  ctx.arc(6, 3, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (thief.moveTarget) {
    ctx.save();
    ctx.strokeStyle = 'rgba(125,227,255,0.7)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(thief.moveTarget.x, thief.moveTarget.y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawSmokeAndCoins(ctx, game) {
  for (const s of game.smokes) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#9aa5bd';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(s.x - s.r * 0.4, s.y + s.r * 0.2, s.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const c of game.coinsThrown) {
    ctx.save();
    ctx.fillStyle = '#f5d76e';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6d2f';
    ctx.stroke();
    ctx.restore();
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, HUD_H - 3, VIEW_W, 3);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f5d76e';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('VAULTBREAK', 14, 26);
  ctx.fillStyle = '#8a97b5';
  ctx.font = '12px sans-serif';
  ctx.fillText('Level ' + (game.levelIndex + 1) + ' — ' + game.level.name, 14, 46);
  const ax = 330;
  ctx.fillStyle = '#e8e8e8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ALARM', ax, 20);
  ctx.fillStyle = '#1a2338';
  ctx.fillRect(ax, 26, 220, 18);
  const alarmColor = game.alarm > 70 ? '#ff3b30' : game.alarm > 35 ? '#ffb340' : '#2fbf5a';
  ctx.fillStyle = alarmColor;
  ctx.fillRect(ax, 26, 220 * Math.min(1, game.alarm / 100), 18);
  ctx.strokeStyle = '#5a6a8a';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 26, 220, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(Math.round(game.alarm) + '%', ax + 228, 40);
  ctx.fillStyle = '#e8e8e8';
  ctx.font = '12px sans-serif';
  ctx.fillText('LOOT  $' + game.lootValue.toLocaleString('en-US'), 600, 24);
  ctx.fillText('SCORE  ' + game.score.toLocaleString('en-US'), 600, 44);
  ctx.fillStyle = '#8a97b5';
  ctx.fillText('TIME  ' + fmtTime(game.time), 770, 24);
  ctx.fillText('COINS x' + game.tools.coins + '   SMOKE x' + game.tools.smoke, 770, 44);
  ctx.fillStyle = '#5a6a8a';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WASD move · Shift sneak · E grab · C coin · Q smoke · Click to move', 330, 60);
}

function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return m + ':' + String(s).padStart(2, '0');
}

function drawAlarmVignette(ctx, game) {
  if (game.alarm <= 40) return;
  const a = ((game.alarm - 40) / 60) * 0.35;
  const grad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.32, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75);
  grad.addColorStop(0, 'rgba(255,0,0,0)');
  grad.addColorStop(1, 'rgba(255,0,0,' + a.toFixed(2) + ')');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawBanner(ctx, title, lines, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(5,8,18,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 60);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#e8e8e8';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 10 + i * 28));
  ctx.restore();
}

function drawMenu(ctx, game) {
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5d76e';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText('VAULTBREAK', VIEW_W / 2, 170);
  ctx.fillStyle = '#7de3ff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('THE MIDNIGHT HEIST', VIEW_W / 2, 208);
  ctx.fillStyle = '#e8e8e8';
  ctx.font = '16px sans-serif';
  ctx.fillText('You are Rook, the quietest thief in the city. Cross the guarded room,', VIEW_W / 2, 280);
  ctx.fillText('lift the Meridian Diamond, and slip out the exit before the alarm hits 100%.', VIEW_W / 2, 306);
  ctx.fillStyle = '#ffb340';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('3 heists · guards with vision cones · sweeping cameras · coins & smoke', VIEW_W / 2, 352);
  ctx.fillStyle = '#8a97b5';
  ctx.font = '14px sans-serif';
  ctx.fillText('WASD / arrows — move      Shift — sneak      E — grab loot', VIEW_W / 2, 400);
  ctx.fillText('C — toss a coin to distract      Q — smoke bomb      Click — move there', VIEW_W / 2, 424);
  ctx.fillStyle = '#f5d76e';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Press ENTER or CLICK to start the first heist', VIEW_W / 2, 490);
  ctx.fillStyle = '#5a6a8a';
  ctx.font = '12px sans-serif';
  ctx.fillText('An original game — art, sound and levels drawn and synthesized in code.', VIEW_W / 2, 560);
  ctx.textAlign = 'left';
}

function drawGame(ctx, game, time) {
  if (!game.world) {
    drawMenu(ctx, game);
    return;
  }
  drawTileFloor(ctx, game.world, time);
  drawLoot(ctx, game.world, time);
  drawCameras(ctx, game.cameras, time);
  for (const g of game.guards) drawGuard(ctx, g, time);
  drawSmokeAndCoins(ctx, game);
  drawThief(ctx, game.thief, time);
  drawHud(ctx, game);
  drawAlarmVignette(ctx, game);
  if (game.state === 'menu') drawMenu(ctx, game);
  if (game.state === 'caught') {
    drawBanner(ctx, 'CAUGHT!', [
      'The alarm hit 100% — the night watch has you.',
      'Loot kept: $' + game.lootValue.toLocaleString('en-US') + '   ·   Score: ' + game.score,
      'Press R to retry this heist, or ENTER for the menu.',
    ], '#ff3b30');
  }
  if (game.state === 'levelDone') {
    drawBanner(ctx, 'CLEAN GETAWAY!', [
      game.level.name + ' cleared — loot $' + game.lootValue.toLocaleString('en-US'),
      'Time bonus: +' + game.lastTimeBonus + '   ·   Score: ' + game.score,
      'Press ENTER for the next heist.',
    ], '#7dff9e');
  }
  if (game.state === 'win') {
    drawBanner(ctx, 'THE MIDNIGHT HEIST — DONE!', [
      'All three heists complete. Rook vanishes into the night.',
      'Total loot: $' + game.lootValue.toLocaleString('en-US') + '   ·   Final score: ' + game.score,
      'Press R to run it all again.',
    ], '#f5d76e');
  }
}
