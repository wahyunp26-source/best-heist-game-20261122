// input.js — keyboard (WASD/arrows, Shift sneak, E grab, C coin, Q smoke)
// and mouse (click to move, click loot to grab).
function createInput(canvas) {
  const input = {
    keys: {},
    clickX: null,
    clickY: null,
    clicked: false,
    pressed: {},
  };
  const rectOf = () => canvas.getBoundingClientRect();
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (!input.keys[e.key]) input.pressed[e.key] = true;
    input.keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    input.keys[e.key] = false;
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = rectOf();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    input.clickX = (e.clientX - r.left) * scaleX;
    input.clickY = (e.clientY - r.top) * scaleY;
    input.clicked = true;
  });
  return input;
}

function keyDown(input, ...names) {
  return names.some((n) => input.keys[n]);
}

function keyPressed(input, ...names) {
  return names.some((n) => input.pressed[n]);
}

function endFrameInput(input) {
  input.pressed = {};
  input.clicked = false;
}

function moveVector(input) {
  let x = 0;
  let y = 0;
  if (keyDown(input, 'a', 'A', 'ArrowLeft')) x -= 1;
  if (keyDown(input, 'd', 'D', 'ArrowRight')) x += 1;
  if (keyDown(input, 'w', 'W', 'ArrowUp')) y -= 1;
  if (keyDown(input, 's', 'S', 'ArrowDown')) y += 1;
  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}
