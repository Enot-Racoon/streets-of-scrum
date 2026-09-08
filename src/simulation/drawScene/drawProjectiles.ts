import type { World } from "../World";

export function drawProjectiles(
  ctx: CanvasRenderingContext2D,
  world: World,
  zoom: number,
) {
  for (const p of world.projectiles) {
    const r = p.radius || 0.12;
    ctx.fillStyle = p.color || "#fbbf24";
    ctx.beginPath();
    ctx.arc(p.x * zoom, p.y * zoom, r * zoom, 0, Math.PI * 2);
    ctx.fill();

    if (p.isExplosive) return;

    // Tracer
    ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x * zoom, p.y * zoom);
    ctx.lineTo((p.x - p.vx * 0.03) * zoom, (p.y - p.vy * 0.03) * zoom);
    ctx.stroke();
  }
}
