import type { World } from "../World";
import type { Tile, TileType } from "../types";

type DrawTileFn = (
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  zoom: number,
  tile: Tile,
) => void;

let c = 0;

const DrawTile = {
  Floor(ctx, tx, ty, zoom, tile) {
    ctx.fillStyle = (tile.x + tile.y) % 2 === 0 ? "#1e293b" : "#334155";
    ctx.fillRect(tx, ty, zoom, zoom);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    ctx.strokeRect(tx, ty, zoom, zoom);
  },

  Wall(ctx, tx, ty, zoom) {
    ctx.fillStyle = "#475569";
    ctx.fillRect(tx, ty, zoom, zoom);
    // 3D wall top bevel
    ctx.fillStyle = "#64748b";
    ctx.fillRect(tx + 2, ty + 2, zoom - 4, zoom - 6);
    ctx.strokeStyle = "#1e293b";
    ctx.strokeRect(tx, ty, zoom, zoom);
  },

  Door(ctx, tx, ty, zoom, tile) {
    if (tile.isOpen) {
      ctx.fillStyle = "#854d0e";
      ctx.fillRect(tx, ty, 6, zoom);
    } else {
      ctx.fillStyle = "#b45309";
      ctx.fillRect(tx + 2, ty + 2, zoom - 4, zoom - 4);
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(tx + zoom / 2, ty + zoom / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  Glass(ctx, tx, ty, zoom, tile) {
    ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
    ctx.fillRect(tx + 3, ty + 3, zoom - 6, zoom - 6);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(tx + 3, ty + 3, zoom - 6, zoom - 6);
  },

  Crate(ctx, tx, ty, zoom, tile) {
    ctx.fillStyle = "#92400e";
    ctx.fillRect(tx + 4, ty + 4, zoom - 8, zoom - 8);
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 2;
    ctx.strokeRect(tx + 4, ty + 4, zoom - 8, zoom - 8);
    // X pattern
    ctx.beginPath();
    ctx.moveTo(tx + 4, ty + 4);
    ctx.lineTo(tx + zoom - 4, ty + zoom - 4);
    ctx.moveTo(tx + zoom - 4, ty + 4);
    ctx.lineTo(tx + 4, ty + zoom - 4);
    ctx.stroke();
  },

  Barrel(ctx, tx, ty, zoom, tile) {
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(tx + zoom / 2, ty + zoom / 2, zoom * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    ctx.font = `bold ${zoom * 0.35}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡", tx + zoom / 2, ty + zoom / 2);
  },

  ATM(ctx, tx, ty, zoom, tile) {
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(tx + 4, ty + 4, zoom - 8, zoom - 8);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(tx + 6, ty + 6, zoom - 12, zoom * 0.3);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${zoom * 0.3}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", tx + zoom / 2, ty + zoom * 0.7);
  },

  Vent(ctx, tx, ty, zoom, tile) {
    ctx.fillStyle = "#64748b";
    ctx.fillRect(tx + 4, ty + 4, zoom - 8, zoom - 8);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.strokeRect(tx + 4, ty + 4, zoom - 8, zoom - 8);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;

    for (let i = 1; i <= 3; i++) {
      const offset = (zoom / 4) * i;

      ctx.beginPath();
      ctx.moveTo(tx + offset, ty + 6);
      ctx.lineTo(tx + offset, ty + zoom - 6);
      ctx.stroke();
    }
  },

  FireHazard(ctx, tx, ty, zoom, tile) {
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(tx + 3, ty + 3, zoom - 6, zoom - 6);

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.strokeRect(tx + 3, ty + 3, zoom - 6, zoom - 6);

    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(tx + zoom / 2, ty + zoom * 0.18);
    ctx.lineTo(tx + zoom * 0.72, ty + zoom * 0.55);
    ctx.lineTo(tx + zoom * 0.62, ty + zoom * 0.52);
    ctx.lineTo(tx + zoom * 0.68, ty + zoom * 0.82);
    ctx.lineTo(tx + zoom * 0.5, ty + zoom * 0.68);
    ctx.lineTo(tx + zoom * 0.34, ty + zoom * 0.82);
    ctx.lineTo(tx + zoom * 0.38, ty + zoom * 0.52);
    ctx.lineTo(tx + zoom * 0.28, ty + zoom * 0.55);
    ctx.closePath();
    ctx.fill();
  },

  Water(ctx, tx, ty, zoom, tile) {
    const t = Math.sin(Date.now() * 0.0008) * zoom * 0.03;

    ctx.fillStyle = "#0369a1";
    ctx.fillRect(tx, ty, zoom, zoom);

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;

    const waveHeight = zoom * 0.18;

    for (let i = 0; i < 2; i++) {
      const y = ty + zoom * (0.35 + i * 0.3);

      ctx.beginPath();
      ctx.moveTo(tx + zoom * 0.12, y - t);

      ctx.quadraticCurveTo(
        tx + zoom * 0.25,
        y - waveHeight + t,
        tx + zoom * 0.38,
        y - t,
      );

      ctx.quadraticCurveTo(
        tx + zoom * 0.5,
        y + waveHeight - t,
        tx + zoom * 0.62,
        y + t,
      );

      ctx.quadraticCurveTo(
        tx + zoom * 0.75,
        y - waveHeight + t,
        tx + zoom * 0.88,
        y - t,
      );

      ctx.stroke();
    }
  },
} as const satisfies Record<TileType, DrawTileFn>;

export function drawTiles(
  ctx: CanvasRenderingContext2D,
  world: World,
  zoom: number,
) {
  for (let x = 0; x < world.width; x++) {
    for (let y = 0; y < world.height; y++) {
      const tile = world.grid[x][y];
      const tx = x * zoom;
      const ty = y * zoom;

      DrawTile.Floor(ctx, tx, ty, zoom, tile);
      DrawTile[tile.type]?.(ctx, tx, ty, zoom, tile);
    }
  }
}
