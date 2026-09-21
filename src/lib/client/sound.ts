"use client";

/**
 * All game sound effects are synthesized at runtime via the Web Audio API rather than
 * shipped as audio files - a handful of short oscillator/noise bursts is plenty for move
 * clicks, hits, and start/end stingers, and it avoids bundling any binary assets.
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

// Most browsers require a user gesture before audio can play. Unlocking on the very first
// pointerdown/keydown anywhere on the page means the context is already running well
// before any game event tries to make a sound.
if (typeof window !== "undefined") {
  const unlock = () => getContext();
  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });
}

function tone(
  audioCtx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType,
  peakGain: number,
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function noiseBurst(audioCtx: AudioContext, startTime: number, duration: number, peakGain: number) {
  const length = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(peakGain, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  source.connect(gain).connect(audioCtx.destination);
  source.start(startTime);
}

export function playMoveSound() {
  const audioCtx = getContext();
  if (!audioCtx) return;
  tone(audioCtx, 320, audioCtx.currentTime, 0.09, "triangle", 0.12);
}

export function playAttackSound() {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  noiseBurst(audioCtx, t, 0.12, 0.22);
  tone(audioCtx, 130, t, 0.2, "square", 0.18);
}

export function playGameStartSound() {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [440, 554, 659].forEach((freq, i) => tone(audioCtx, freq, t + i * 0.1, 0.18, "triangle", 0.15));
}

export function playWinSound() {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [523, 659, 784, 1047].forEach((freq, i) => tone(audioCtx, freq, t + i * 0.11, 0.22, "triangle", 0.16));
}

export function playLoseSound() {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [392, 329, 261].forEach((freq, i) => tone(audioCtx, freq, t + i * 0.16, 0.3, "sawtooth", 0.14));
}

export function playTieSound() {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [349, 349].forEach((freq, i) => tone(audioCtx, freq, t + i * 0.22, 0.2, "sine", 0.14));
}
