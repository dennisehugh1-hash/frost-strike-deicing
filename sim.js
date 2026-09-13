const ICE_N = 56, SNOW_N = 64;
const S = {
  voltage: 1500, gap: 4, ice: "glaze", auto: true, view: "field",
  phase: "idle", charge: 0, tShot: 0, tPhase: 0, shake: 0, flash: 0,
  armature: 0, grow: 0, iceSegs: [], shards: [], snow: [], traces: null,
};
function freshIce() {
  const thick0 = { glaze: 1, hardRime: 0.85, softRime: 1.15 }[S.ice];
  S.iceSegs = [];
  for (let i = 0; i < ICE_N; i++) {
    const s = i / (ICE_N - 1);
    const lump = 0.75 + Math.sin(s * 17.2) * 0.18 + Math.sin(s * 41) * 0.08;
    S.iceSegs.push({ s, remain: 1, thick: thick0 * lump });
  }
}
function freshSnow() {
  S.snow = Array.from({ length: SNOW_N }, () => ({
    x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.6,
    vy: 0.04 + Math.random() * 0.08, vx: (Math.random() - 0.5) * 0.03,
    o: 0.25 + Math.random() * 0.5,
  }));
}
function reset(keepAuto = true) {
  if (!keepAuto) S.auto = false;
  S.phase = "idle"; S.charge = 0; S.tShot = 0; S.tPhase = 0;
  S.shake = 0; S.flash = 0; S.armature = 0; S.grow = 0; S.shards = [];
  freshIce();
  S.traces = makeTraces(S.voltage, S.gap);
  if (typeof syncUi === "function") syncUi();
}
function startCharge() {
  if (S.phase !== "idle" && S.phase !== "done") return;
  if (S.phase === "done") { S.shards = []; freshIce(); S.grow = 1; }
  S.phase = "charging"; S.tPhase = 0; S.charge = 0;
}
function fire() {
  if (S.phase !== "armed" && S.phase !== "charging") return;
  if (S.phase === "charging") S.charge = 1;
  S.phase = "firing"; S.tPhase = 0; S.tShot = 0; S.flash = 1; S.shake = 1;
  if (typeof thud === "function") thud();
}
function cableY(s) { return 4 * s * (1 - s); }
function waveAt(s) {
  if (S.phase !== "firing" && S.phase !== "done") return 0;
  const dist = Math.abs(s - 0.5), local = S.tShot - dist * 22;
  if (local < 0) return 0;
  const amp = displacementCm(S.voltage, S.gap) * 0.14;
  return amp * Math.exp(-local / 14) * Math.sin(local * 0.55) * (1 - dist * 0.7);
}
function crackIce(dt) {
  const need = ICE[S.ice].toughness * 5.55;
  const d = displacementCm(S.voltage, S.gap);
  for (const seg of S.iceSegs) {
    if (seg.remain <= 0.02) continue;
    const dist = Math.abs(seg.s - 0.5);
    if (S.tShot < dist * 22 + 1.2) continue;
    const local = d * Math.exp(-((dist / 0.2) ** 2));
    const cracked = clamp(1 - Math.exp(-1.85 * Math.pow(local / need, 1.35)), 0, 0.97);
    const remainTarget = 1 - cracked;
    if (seg.remain > remainTarget + 0.04) {
      const drop = Math.min(seg.remain - remainTarget, dt * 2.8);
      seg.remain -= drop;
      if (Math.random() < drop * 6 && S.shards.length < 140) {
        S.shards.push({
          x: seg.s + (Math.random() - 0.5) * 0.02, y: 0.01,
          vx: (Math.random() - 0.5) * 0.18, vy: 0.12 + Math.random() * 0.28,
          rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 6,
          w: 0.008 + Math.random() * 0.018, h: 0.012 + Math.random() * 0.022, life: 1,
        });
      }
    }
  }
}
function step(dt) {
  dt = Math.min(dt, 0.1);
  S.tPhase += dt;
  for (const f of S.snow) {
    f.y += f.vy * dt; f.x += f.vx * dt;
    if (f.y > 1.08) { f.y = -0.04; f.x = Math.random(); }
    if (f.x < -0.05) f.x += 1.1;
    if (f.x > 1.05) f.x -= 1.1;
  }
  if (S.grow < 1 && (S.phase === "idle" || S.phase === "charging" || S.phase === "armed"))
    S.grow = Math.min(1, S.grow + dt / 1.6);
  if (S.phase === "charging") {
    S.charge = Math.min(1, S.tPhase / 2.15);
    if (S.charge >= 1) { S.phase = "armed"; S.tPhase = 0; }
  } else if (S.phase === "armed") {
    if (S.auto && S.tPhase > 0.45) fire();
  } else if (S.phase === "idle") {
    if (S.auto && S.tPhase > 1.7 && S.grow > 0.85) startCharge();
  } else if (S.phase === "firing") {
    S.tShot += dt * 1000;
    S.armature = Math.sin((S.tShot / 18) * Math.PI) * Math.exp(-S.tShot / 9) * displacementCm(S.voltage, S.gap);
    S.flash = Math.max(0, S.flash - dt * 2.4);
    S.shake = Math.max(0, S.shake - dt * 3.2);
    crackIce(dt);
    if (S.tShot > 70) { S.phase = "done"; S.tPhase = 0; S.flash = 0; }
  } else if (S.phase === "done") {
    S.shake *= Math.max(0, 1 - dt * 6);
    S.armature *= Math.max(0, 1 - dt * 4);
    if (S.auto && S.tPhase > 3.4) reset(true);
  }
  for (const s of S.shards) {
    s.vy += 0.9 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
    if (s.y > 0.86) { s.y = 0.86; s.vy *= -0.18; s.vx *= 0.72; }
    s.life -= dt * 0.1;
  }
}
