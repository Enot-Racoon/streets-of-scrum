import type { World } from "../World";

export function drawDeadAgents(
  ctx: CanvasRenderingContext2D,
  world: World,
  zoom: number,
) {
  for (const agent of world.agents) {
    if (agent.isDead) {
      const ax = agent.x * zoom;
      const ay = agent.y * zoom;

      // Blood pool
      ctx.fillStyle = "rgba(185, 28, 28, 0.75)";
      ctx.beginPath();
      ctx.arc(ax, ay, zoom * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.arc(ax, ay, zoom * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `${zoom * 0.35}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("💀", ax, ay);
    }
  }
}
