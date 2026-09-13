const ICE = {
  glaze: { label: "雨淞", density: 910, toughness: 1, adhesion: 1 },
  hardRime: { label: "硬雾淞", density: 750, toughness: 0.72, adhesion: 0.78 },
  softRime: { label: "软雾淞", density: 450, toughness: 0.38, adhesion: 0.4 },
};
const SHOT = {
  500: { iPeak: 2.214, fPeak: 4.647, tI: 0.508, tF: 2.227 },
  1000: { iPeak: 4.373, fPeak: 16.11, tI: 0.423, tF: 2.148 },
  1500: { iPeak: 5.963, fPeak: 35.98, tI: 0.437, tF: 2.148 },
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const gapScale = (gap) => Math.pow(4 / gap, 0.55);
const displacementCm = (v, gap) => ({ 500: 2.35, 1000: 4.4, 1500: 6.9 }[v] * gapScale(gap));
const peakForceKN = (v, gap) => SHOT[v].fPeak * gapScale(gap);
const peakCurrentKA = (v) => SHOT[v].iPeak;
function nearFieldRemoval(v, gap, ice) {
  const d = displacementCm(v, gap);
  const need = { glaze: 5.55, hardRime: 4.05, softRime: 2.15 }[ice];
  const raw = 1 - Math.exp(-1.85 * Math.pow(d / need, 1.35));
  return clamp(raw, 0.04, 0.97);
}
function makeTraces(v, gap) {
  const n = 260, tMax = 12, t = [], volt = [], i = [], f = [];
  const shot = SHOT[v], fPeak = shot.fPeak * gapScale(gap);
  const wd = Math.PI / (2 * (shot.tI / 1000)), alpha = 780;
  for (let k = 0; k < n; k++) {
    const ms = (k / (n - 1)) * tMax, sec = ms / 1000;
    const env = Math.exp(-alpha * sec);
    t.push(ms);
    volt.push(v * env * Math.cos(wd * sec));
    i.push(shot.iPeak * env * Math.sin(wd * sec));
    const pulse = Math.exp(-(((ms - shot.tF) / 0.38) ** 2));
    const reverse = -0.11 * Math.exp(-(((ms - shot.tF - 0.95) / 0.28) ** 2));
    f.push(fPeak * (pulse + reverse));
  }
  return { t, v: volt, i, f, iPeak: shot.iPeak, fPeak };
}
function sampleTrace(values, t, ms) {
  if (ms <= t[0]) return values[0];
  if (ms >= t[t.length - 1]) return values[values.length - 1];
  const dt = t[1] - t[0], idx = ms / dt, lo = Math.floor(idx);
  const hi = Math.min(lo + 1, values.length - 1), a = idx - lo;
  return values[lo] * (1 - a) + values[hi] * a;
}
