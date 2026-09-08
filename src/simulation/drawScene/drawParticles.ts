import type { World } from "../World";

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  world: World,
  zoom: number,
) {
  for (const pt of world.particles) {
    const alpha = pt.life / pt.maxLife;
    ctx.fillStyle = pt.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(pt.x * zoom, pt.y * zoom, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}
