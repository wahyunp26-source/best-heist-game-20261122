// audio.js — all sound is synthesized with WebAudio; no audio files.
let audioCtx = null;
let alarmHum = null;

function initAudio() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {
    audioCtx = null;
  }
}

function playTone(freq, dur, type, vol, slideTo) {
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch (e) {
    // audio is decoration; never break the game
  }
}

function playPickup() {
  playTone(880, 0.12, 'sine', 0.14);
  setTimeout(() => playTone(1318, 0.18, 'sine', 0.14), 90);
}

function playCoin() {
  playTone(1567, 0.1, 'triangle', 0.1);
}

function playSmoke() {
  playTone(220, 0.4, 'sawtooth', 0.06, 90);
}

function playToss() {
  playTone(1200, 0.08, 'square', 0.06, 500);
}

function playSpotted() {
  playTone(220, 0.25, 'square', 0.16, 440);
  setTimeout(() => playTone(440, 0.25, 'square', 0.16, 220), 200);
}

function playCaught() {
  playTone(330, 0.5, 'sawtooth', 0.18, 55);
}

function playWin() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.22, 'triangle', 0.15), i * 130));
}

function playClick() {
  playTone(700, 0.06, 'sine', 0.08);
}

function setAlarmHum(level) {
  if (!audioCtx) return;
  try {
    if (level > 55 && !alarmHum) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 110;
      gain.gain.value = 0.02;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      alarmHum = { osc, gain };
    } else if (level <= 55 && alarmHum) {
      alarmHum.osc.stop();
      alarmHum = null;
    }
    if (alarmHum) alarmHum.gain.gain.value = 0.015 + (level / 100) * 0.03;
  } catch (e) {
    alarmHum = null;
  }
}
