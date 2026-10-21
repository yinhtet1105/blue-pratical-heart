const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d");
let W, H, DPR;
let particles = [];
let lastTime = 0;
let elapsed = 0;
const TOTAL = 1800;
const TAU = Math.PI * 2;
const palette = [
  "#ffffff", "#d7f5ff", "#75caff",
  "#258bff", "#0860ff", "#00eaff"
];
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  createParticles();
}
function heartPoint(t) {
  return {
    x: 16 * Math.pow(Math.sin(t), 3),
    y:
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
  };
}
function createParticles() {
  particles = [];
  for (let i = 0; i < TOTAL; i++) {
    const t = Math.random() * TAU;
    const edge = heartPoint(t);
    const fill = Math.sqrt(Math.random());
    const tx = edge.x * fill;
    const ty = edge.y * fill;
    particles.push({
      tx,
      ty,
      size: 0.45 + Math.random() * 1.45,
      color: palette[Math.floor(Math.random() * palette.length)],
      phase: Math.random() * TAU,
      speed: 0.7 + Math.random() * 2.5,
      drift: 0.2 + Math.random() * 1.5,
      x: tx * 0.05,
      y: -17,
      bx: (Math.random() - 0.5) * 55,
      by: (Math.random() - 0.5) * 45
    });
  }
}
function smooth(a, b, t) {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}
function drawDot(x, y, r, color, glow, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
}
function drawPlatform(cx, y, s, t) {
  const pulse = 1 + Math.sin(t * 3) * 0.055;
  const rx = s * 10 * pulse;
  const ry = s * 1.55 * pulse;
  const g = ctx.createRadialGradient(
    cx, y, 1,
    cx, y, rx * 1.55
  );
  g.addColorStop(0, "rgba(0,255,255,0.8)");
  g.addColorStop(0.35, "rgba(0,125,255,0.35)");
  g.addColorStop(1, "rgba(0,40,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, y, rx * 1.55, ry * 3.3, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.strokeStyle = "#00dfff";
  ctx.lineWidth = 1.8;
  ctx.shadowColor = "#008dff";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.ellipse(cx, y, rx, ry, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
function drawBeam(cx, top, bottom, t) {
  const g = ctx.createLinearGradient(cx, bottom, cx, top);
  g.addColorStop(0, "rgba(0,255,255,0.9)");
  g.addColorStop(0.35, "rgba(0,150,255,0.4)");
  g.addColorStop(1, "rgba(0,100,255,0)");
  ctx.save();
  ctx.strokeStyle = g;
  ctx.lineWidth = 2.2;
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#00eaff";
  ctx.beginPath();
  ctx.moveTo(cx, bottom);
  ctx.lineTo(cx + Math.sin(t * 4) * 2, top);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 30; i++) {
    const p = (i / 30 + t * 0.45) % 1;
    const y = bottom - p * (bottom - top);
    const spread = (1 - p) * 5 + 0.5;
    const x = cx + (Math.random() - 0.5) * spread;
    drawDot(
      x, y,
      0.5 + Math.random() * 1.3,
      "#8dfaff", 8, 0.75
    );
  }
}
function animate(now) {

  requestAnimationFrame(animate);

  if (!lastTime) lastTime = now;

  const dt = Math.min((now - lastTime) / 1000, 0.04);

  lastTime = now;

  elapsed += dt;

  ctx.clearRect(0, 0, W, H);

  const t = elapsed % 8.5;

  const cx = W / 2;

  const cy = H * 0.39;

  const scale = Math.min(W / 37, H / 43) * 0.86;

  const baseY = cy + scale * 17;

  const pulse = 1 + Math.sin(t * 2.5) * 0.025;

  // Gather and explosion phases

  const gathering = 1 - smooth(0, 2, t);

  const burst = smooth(4.3, 4.8, t) *

                (1 - smooth(5.35, 6.5, t));

  ctx.fillStyle = "#000";

  ctx.fillRect(0, 0, W, H);

  drawPlatform(cx, baseY, scale, t);

  // Energy beam from the platform

  drawBeam(cx, cy + scale * 3, baseY, t);

  ctx.save();

  ctx.globalCompositeOperation = "lighter";

  for (const p of particles) {

    // Correct heart coordinates:

    // x uses p.tx; screen y uses MINUS p.ty

    const heartX = p.tx * scale * pulse;

    const heartY = -p.ty * scale * pulse;

    // Start from the platform, not from a vertical line

    const startX = p.tx * scale * 0.06;

    const startY = scale * 16;

    // Scatter particles outwards from the heart

    const length = Math.hypot(p.tx, p.ty) || 1;

    const nx = p.tx / length;

    const ny = -p.ty / length;

    const scatter = burst * (12 + 24 * Math.abs(

      Math.sin(p.phase)

    ));

    const burstX = heartX + nx * scatter;

    const burstY = heartY + ny * scatter;

    let x, y;

    if (t < 2) {

      const a = smooth(0, 2, t);

      x = startX + (heartX - startX) * a;

      y = startY + (heartY - startY) * a;

    } else if (t < 4.3) {

      x = heartX;

      y = heartY;

    } else if (t < 5.8) {

      const a = smooth(4.3, 5.8, t);

      x = heartX + (burstX - heartX) * a;

      y = heartY + (burstY - heartY) * a;

    } else {

      const a = smooth(5.8, 7.8, t);

      x = burstX * (1 - a) + heartX * a;

      y = burstY * (1 - a) + heartY * a;

    }

    // Twinkling and gentle motion

    const twinkle = 0.3 + 0.7 * Math.abs(

      Math.sin(t * p.speed + p.phase)

    );

    const driftX = Math.sin(t * 1.5 + p.phase) * p.drift;

    const driftY = Math.cos(t * 1.2 + p.phase) * p.drift;

    drawDot(

      cx + x + driftX,

      cy + y + driftY,

      p.size * (1 + burst * 0.3),

      p.color,

      5 + p.size * 4,

      twinkle

    );

    // Bright streaks during explosion

    if (burst > 0.3 && Math.random() > 0.95) {

      ctx.globalAlpha = burst * 0.8;

      ctx.strokeStyle = "#55cfff";

      ctx.lineWidth = 0.7;

      ctx.beginPath();

      ctx.moveTo(cx + x, cy + y);

      ctx.lineTo(

        cx + x + nx * scale * burst,

        cy + y + ny * scale * burst

      );

      ctx.stroke();

    }

  }

  // Extra outward sparks

  if (burst > 0.01) {

    for (let i = 0; i < 70; i++) {

      const a = i * 2.39996;

      const r = scale * 18 * burst * (0.3 + (i % 7) / 7);

      drawDot(

        cx + Math.cos(a) * r,

        cy + Math.sin(a) * r,

        0.8,

        "#55cfff",

        8,

        burst * 0.7

      );

    }

  }

  ctx.restore();

}
window.addEventListener("resize", resize);
resize();
requestAnimationFrame(animate);