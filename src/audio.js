// Tiny WebAudio synth — no asset files, just oscillators and noise bursts.

let ctx = null;
let master = null;

export function initAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(ctx.destination);
}

function env(node, t0, attack, decay, peak = 1) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + attack + decay);
  node.connect(g);
  g.connect(master);
  return g;
}

function tone(freq, type, attack, decay, peak = 1, detune = 0, delay = 0) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  env(o, t0, attack, decay, peak);
  o.start(t0);
  o.stop(t0 + attack + decay + 0.05);
}

function noiseBurst(decay, filterFreq, peak = 1, delay = 0) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.ceil(ctx.sampleRate * (decay + 0.05));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = filterFreq;
  src.connect(f);
  env(f, t0, 0.005, decay, peak);
  src.start(t0);
}

export const sfx = {
  hit()       { noiseBurst(0.09, 2200, 0.9); tone(160, 'square', 0.004, 0.07, 0.35); },
  crit()      { noiseBurst(0.14, 3200, 1.1); tone(110, 'square', 0.004, 0.12, 0.5); tone(220, 'sawtooth', 0.004, 0.1, 0.3); },
  hurt()      { tone(95, 'sawtooth', 0.006, 0.12, 0.45); },
  cast()      { tone(520, 'sine', 0.02, 0.18, 0.3); tone(780, 'sine', 0.02, 0.22, 0.2, 0, 0.04); },
  bolt()      { noiseBurst(0.18, 900, 0.7); tone(330, 'sawtooth', 0.005, 0.15, 0.3); },
  heal()      { [392, 523, 659].forEach((f, i) => tone(f, 'sine', 0.02, 0.3, 0.25, 0, i * 0.07)); },
  kill()      { tone(70, 'triangle', 0.01, 0.35, 0.6); noiseBurst(0.2, 600, 0.5); },
  levelup()   { [523, 659, 784, 1047].forEach((f, i) => tone(f, 'triangle', 0.01, 0.45, 0.4, 0, i * 0.11)); },
  quest()     { [659, 880].forEach((f, i) => tone(f, 'sine', 0.01, 0.4, 0.35, 0, i * 0.12)); },
  loot()      { tone(988, 'sine', 0.005, 0.18, 0.3); tone(1319, 'sine', 0.005, 0.25, 0.25, 0, 0.06); },
  rune()      { [220, 440, 880].forEach((f, i) => tone(f, 'sine', 0.02, 0.5, 0.3, 5, i * 0.05)); },
  select()    { tone(440, 'triangle', 0.01, 0.2, 0.35); tone(660, 'triangle', 0.01, 0.3, 0.3, 0, 0.08); },
  death()     { [330, 262, 196, 131].forEach((f, i) => tone(f, 'triangle', 0.02, 0.5, 0.4, 0, i * 0.22)); },
  arrow()     { noiseBurst(0.12, 4000, 0.5); },
  // boss mechanic warnings: rising = get airborne, falling klaxon = get out
  warnJump()  { tone(440, 'square', 0.01, 0.14, 0.4); tone(660, 'square', 0.01, 0.22, 0.4, 0, 0.13); },
  warnMove()  { tone(370, 'sawtooth', 0.01, 0.14, 0.45); tone(247, 'sawtooth', 0.01, 0.22, 0.45, 0, 0.13); },
  // sanctuary: rising two-tone sine — the inverse contour of warnMove, an
  // invitation (get IN) not a klaxon (get out)
  warnIn()    { tone(294, 'sine', 0.01, 0.14, 0.45); tone(440, 'sine', 0.01, 0.22, 0.45, 0, 0.13); },
};
