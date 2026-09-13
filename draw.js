const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resize).observe(canvas);
function drawTower(x, top, ground, h) {
  ctx.fillStyle = "#2a3a48";
  ctx.beginPath();
  ctx.moveTo(x - 10, ground); ctx.lineTo(x - 4, top - 8); ctx.lineTo(x + 4, top - 8); ctx.lineTo(x + 10, ground);
  ctx.fill();
  ctx.strokeStyle = "#3d5162"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 14, top); ctx.lineTo(x + 14, top); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 11, top + h * 0.12); ctx.lineTo(x + 11, top + h * 0.12); ctx.stroke();
}
function drawField(w, h) {
  const shake = S.shake * 4;
  ctx.save();
  ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#8aa3b8"); sky.addColorStop(0.42, "#c2d0dc");
  sky.addColorStop(0.7, "#dce4eb"); sky.addColorStop(1, "#eef2f5");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.16, h * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#9aafc0";
  ctx.beginPath(); ctx.moveTo(0, h * 0.72); ctx.quadraticCurveTo(w * 0.25, h * 0.58, w * 0.5, h * 0.7);
  ctx.quadraticCurveTo(w * 0.75, h * 0.8, w, h * 0.64); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  ctx.fillStyle = "#c9d6e0";
  ctx.beginPath(); ctx.moveTo(0, h * 0.84); ctx.quadraticCurveTo(w * 0.4, h * 0.8, w, h * 0.86);
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
  const x0 = w * 0.08, x1 = w * 0.92, top = h * 0.26, sag = h * 0.12, ground = h * 0.84;
  drawTower(x0, top, ground, h); drawTower(x1, top, ground, h);
  const cableX = (s) => x0 + (x1 - x0) * s;
  const cy = (s) => top + sag * cableY(s) + waveAt(s) * h * 0.028;
  for (const f of S.snow) {
    ctx.fillStyle = "rgba(255,255,255," + f.o + ")";
    ctx.beginPath(); ctx.arc(f.x * w, f.y * h, f.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < ICE_N; i++) {
    const seg = S.iceSegs[i], x = cableX(seg.s), y = cy(seg.s);
    const th = 5 + seg.thick * 7 * S.grow * seg.remain;
    if (i === 0) ctx.moveTo(x, y - th); else ctx.lineTo(x, y - th);
  }
  for (let i = ICE_N - 1; i >= 0; i--) {
    const seg = S.iceSegs[i];
    ctx.lineTo(cableX(seg.s), cy(seg.s) + 4 + seg.thick * 5 * S.grow * seg.remain);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(230,242,250,0.88)"; ctx.fill();
  ctx.strokeStyle = "#4a5c68"; ctx.lineWidth = 3.4; ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const s = i / 40, x = cableX(s), y = cy(s);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  const dx = cableX(0.5), dy = cy(0.5);
  ctx.fillStyle = "#1c2b36";
  ctx.fillRect(dx - 16, dy + 8, 32, 46);
  ctx.strokeStyle = "#c8a070"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(dx - 7, dy + 28, 8, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(dx + 7, dy + 28 + S.armature * 0.7, 8, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#6ec8e0";
  ctx.fillRect(dx - 2, dy + 4, 4, 10);
  for (const s of S.shards) {
    ctx.save();
    ctx.translate(cableX(s.x), cy(0.5) + s.y * h);
    ctx.rotate(s.rot);
    ctx.globalAlpha = clamp(s.life, 0, 1);
    ctx.fillStyle = "#eef6fb";
    ctx.fillRect(-s.w * w, -s.h * h, s.w * w * 2, s.h * h * 2);
    ctx.restore();
  }
  if (S.flash > 0.02) {
    ctx.fillStyle = "rgba(190,230,245," + (S.flash * 0.28) + ")";
    ctx.fillRect(-10, -10, w + 20, h + 20);
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = "rgba(110,200,224," + (S.flash * (0.45 - i * 0.1)) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dx, dy + h * 0.09, (1 - S.flash) * (40 + i * 28) + 12, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "rgba(8,19,28,0.55)";
  ctx.fillRect(12, 12, 168, 46);
  ctx.fillStyle = "#e8f1f6"; ctx.font = "12px IBM Plex Sans, sans-serif";
  const hud = S.phase === "charging" ? ("电容充电 " + (S.charge * 100).toFixed(0) + "%")
    : S.phase === "armed" ? "待触发"
    : S.phase === "firing" ? "应力波传播"
    : S.phase === "done" ? "脱冰完成" : "覆冰累积";
  ctx.fillText(hud, 22, 32);
  ctx.fillStyle = "#8aa3b4"; ctx.fillText("敲击点 · 档距中点", 22, 48);
  ctx.restore();
}
function drawCoil(w, h) {
  ctx.fillStyle = "#0b141c"; ctx.fillRect(0, 0, w, h);
  const cx = w * 0.5, cy = h * 0.48;
  ctx.strokeStyle = "rgba(110,200,224,0.15)"; ctx.lineWidth = 1;
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath(); ctx.ellipse(cx, cy, 40 + i * 28, 16 + i * 10, 0, 0, Math.PI * 2); ctx.stroke();
  }
  const kick = S.armature * 3;
  const coil = (ox, oy, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse(cx + ox, cy + oy + i * 5, 52 - i * 1.2, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  };
  coil(-6, -18, "#c8a070");
  coil(8, 10 + kick, "#6ec8e0");
  ctx.fillStyle = "#e8f1f6"; ctx.font = "13px IBM Plex Sans, sans-serif";
  ctx.fillText("驱动线圈 20 匣 · 对角同向", 24, 32);
  ctx.fillStyle = "#8aa3b4";
  ctx.fillText("气隙 " + S.gap + " mm · 电枢位移 " + displacementCm(S.voltage, S.gap).toFixed(2) + " cm", 24, 52);
  ctx.fillText("4000 uF  ·  内径 20 mm / 外径 60 mm", 24, h - 24);
}
