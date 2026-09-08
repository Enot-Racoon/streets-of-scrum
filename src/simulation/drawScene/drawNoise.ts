import type { World } from "../World";

export function drawNoise(
  ctx: CanvasRenderingContext2D,
  world: World,
  zoom: number,
) {
  const now = Date.now();
  for (const noise of world.noiseEvents) {
    const age = (now - noise.timestamp) / 1000;
    if (age < 1.2) {
      const radius = age * (noise.radius * 0.9) * zoom;
      const alpha = Math.max(0, 1.0 - age / 1.2) * 0.4;
      ctx.strokeStyle =
        noise.noiseType === "gunshot"
          ? `rgba(239, 68, 68, ${alpha})`
          : `rgba(234, 179, 8, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(noise.x * zoom, noise.y * zoom, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
