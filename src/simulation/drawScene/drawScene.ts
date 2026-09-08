import type { Camera } from "../Camera";
import type { World } from "../World";
import { drawDeadAgents } from "./drawDeadAgents";
import { drawDroppedItems } from "./drawDroppedItems";
import { drawLivingAgents } from "./drawLivingAgents";
import { drawNoise } from "./drawNoise";
import { drawParticles } from "./drawParticles";
import { drawProjectiles } from "./drawProjectiles";
import { drawTiles } from "./drawTiles";

export function drawScene(
  ctx: CanvasRenderingContext2D,
  world: World,
  camera: Camera,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);

  const zoom = camera.zoom;
  const offsetX = width / 2 - camera.x * zoom;
  const offsetY = height / 2 - camera.y * zoom;

  // Dark grid background
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(offsetX, offsetY);

  drawTiles(ctx, world, zoom);
  drawNoise(ctx, world, zoom);
  drawDroppedItems(ctx, world, zoom);
  drawDeadAgents(ctx, world, zoom);
  drawLivingAgents(ctx, world, zoom);
  drawProjectiles(ctx, world, zoom);
  drawParticles(ctx, world, zoom);

  ctx.restore();
}
