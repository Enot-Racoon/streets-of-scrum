import { ITEM_REGISTRY } from "../Items";
import type { World } from "../World";

export function drawDroppedItems(
  ctx: CanvasRenderingContext2D,
  world: World,
  zoom: number,
) {
  for (const item of world.droppedItems) {
    const def = ITEM_REGISTRY[item.defId];
    const ix = item.x * zoom;
    const iy = item.y * zoom;

    ctx.fillStyle = "rgba(234, 179, 8, 0.25)";
    ctx.beginPath();
    ctx.arc(ix, iy, zoom * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${zoom * 0.4}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def ? def.icon : "📦", ix, iy);
  }
}
