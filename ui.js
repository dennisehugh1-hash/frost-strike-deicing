function stats() {
  let cracked = 0, near = 0, nearN = 0;
  for (const seg of S.iceSegs) {
    cracked += 1 - seg.remain;
    if (seg.s >= 0.38 && seg.s <= 0.62) { near += 1 - seg.remain; nearN++; }
  }
  const live = S.phase === "firing" || S.phase === "done";
  return {
    iPeak: peakCurrentKA(S.voltage),
    fPeak: peakForceKN(S.voltage, S.gap),
    disp: displacementCm(S.voltage, S.gap),
    near: live ? (nearN ? near / nearN : 0) : nearFieldRemoval(S.voltage, S.gap, S.ice),
  };
}
function svgEl(name, attrs, text) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  if (text) n.textContent = text;
  return n;
}
function pathFrom(arr, t, y0, y1, maxAbs) {
  const m = Math.max(maxAbs, 1e-6);
  let d = "";
  for (let i = 0; i < t.length; i++) {
    const x = 8 + (t[i] / 12) * 624;
    const y = y0 + (y1 - y0) * (0.5 - arr[i] / (2 * m));
    d += (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
  }
  return d;
}
function drawWave() {
  const tr = S.traces, svg = document.getElementById("wave");
  const iMax = Math.max(...tr.i.map(Math.abs));
  const fMax = Math.max(...tr.f.map(Math.abs));
  const cursor = S.phase === "firing" || S.phase === "done" ? S.tShot : -1;
  const cx = 8 + clamp(cursor / 12, 0, 1) * 624;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.appendChild(svgEl("path", { d: pathFrom(tr.i, tr.t, 8, 52, iMax), fill: "none", stroke: "#6ec8e0", "stroke-width": "1.6" }));
  svg.appendChild(svgEl("path", { d: pathFrom(tr.f, tr.t, 58, 102, fMax), fill: "none", stroke: "#c8a070", "stroke-width": "1.6" }));
  if (cursor >= 0) svg.appendChild(svgEl("line", { x1: String(cx), x2: String(cx), y1: "4", y2: "106", stroke: "#e8f1f6", "stroke-opacity": "0.35" }));
  svg.appendChild(svgEl("text", { x: "12", y: "14", fill: "#8aa3b4", "font-size": "10", "font-family": "IBM Plex Sans" }, "电流 kA"));
  svg.appendChild(svgEl("text", { x: "12", y: "70", fill: "#8aa3b4", "font-size": "10", "font-family": "IBM Plex Sans" }, "冲击力 kN"));
}
function syncUi() {
  const st = stats();
  const phaseLabel = {
    idle: "开始充电", charging: "充电 " + (S.charge * 100).toFixed(0) + "%",
    armed: "触发冲击", firing: "冲击中…", done: "再次除冰",
  }[S.phase];
  document.getElementById("fireBtn").textContent = phaseLabel;
  document.getElementById("fireBtn").disabled = S.phase === "firing";
  document.getElementById("autoBtn").textContent = S.auto ? "暂停自动" : "自动演示";
  const tel = document.getElementById("tel");
  tel.replaceChildren();
  [
    ["峰值电流", st.iPeak.toFixed(2) + " kA"],
    ["峰值冲击力", st.fPeak.toFixed(1) + " kN"],
    ["敲击点位移", st.disp.toFixed(2) + " cm"],
    ["近点破裂", Math.round(st.near * 100) + " %"],
  ].forEach(([k, v]) => {
    const box = document.createElement("div");
    const lab = document.createElement("span"); lab.textContent = k;
    const val = document.createElement("strong"); val.textContent = v;
    box.append(lab, val); tel.append(box);
  });
  drawWave();
}
function setSeg(id, items, value, onPick) {
  const el = document.getElementById(id);
  el.replaceChildren();
  items.forEach(([v, label]) => {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.v = v; b.textContent = label;
    if (String(value) === String(v)) b.className = "on";
    el.append(b);
  });
  el.onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    onPick(b.dataset.v);
    [...el.children].forEach((c) => c.classList.toggle("on", c === b));
  };
}
function setView(view) {
  if (view !== "field" && view !== "coil") view = "field";
  S.view = view;
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
}
document.getElementById("tabs").onclick = (e) => {
  const b = e.target.closest("button"); if (b) setView(b.dataset.view);
};
setSeg("voltSeg", [["500", "500 V"], ["1000", "1000 V"], ["1500", "1500 V"]], S.voltage, (v) => {
  S.voltage = Number(v); S.traces = makeTraces(S.voltage, S.gap); syncUi();
});
setSeg("gapSeg", [["4", "4 mm"], ["8", "8 mm"], ["12", "12 mm"]], S.gap, (v) => {
  S.gap = Number(v); S.traces = makeTraces(S.voltage, S.gap); syncUi();
});
setSeg("iceSeg", Object.entries(ICE).map(([id, m]) => [id, m.label]), S.ice, (v) => {
  S.ice = v; if (S.phase === "idle" || S.phase === "done") reset(S.auto);
});
document.getElementById("fireBtn").onclick = () => {
  if (S.phase === "armed" || S.phase === "charging") fire();
  else startCharge();
};
document.getElementById("resetBtn").onclick = () => reset(false);
document.getElementById("autoBtn").onclick = () => { S.auto = !S.auto; syncUi(); };
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (S.phase === "armed" || S.phase === "charging") fire();
    else if (S.phase === "idle" || S.phase === "done") startCharge();
  }
  if (e.key === "r" || e.key === "R") reset(false);
});
let audioCtx = null;
function thud() {
  try {
    audioCtx = audioCtx || new AudioContext();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(90, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.18);
    g.gain.setValueAtTime(0.12, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.24);
  } catch (_) {}
}
freshSnow(); reset(true);
let last = performance.now(), uiAcc = 0;
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  step(dt);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (S.view === "coil") drawCoil(w, h);
  else drawField(w, h);
  uiAcc += dt;
  if (uiAcc > 0.08) { uiAcc = 0; syncUi(); }
  requestAnimationFrame(loop);
}
resize();
requestAnimationFrame(loop);
