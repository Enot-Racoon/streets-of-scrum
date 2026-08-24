import { Tile } from './types';

export interface Point {
  x: number;
  y: number;
}

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

export class Pathfinding {
  /**
   * Fast A* Search on a 2D tile grid
   */
  public static findPath(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    grid: Tile[][],
    canOpenDoors: boolean = true
  ): Point[] {
    const width = grid.length;
    if (width === 0) return [];
    const height = grid[0].length;

    const sx = Math.floor(startX);
    const sy = Math.floor(startY);
    const tx = Math.floor(targetX);
    const ty = Math.floor(targetY);

    if (sx < 0 || sx >= width || sy < 0 || sy >= height) return [];
    if (tx < 0 || tx >= width || ty < 0 || ty >= height) return [];

    // Target not walkable check (unless it's an interactable object/door)
    const targetTile = grid[tx][ty];
    if (!targetTile.walkable && !(canOpenDoors && targetTile.type === 'Door')) {
      // Find closest walkable adjacent tile
      const neighbors = this.getNeighbors(tx, ty, width, height);
      let bestAdj: Point | null = null;
      let minD = Infinity;
      for (const n of neighbors) {
        if (grid[n.x][n.y].walkable) {
          const d = Math.hypot(n.x - sx, n.y - sy);
          if (d < minD) {
            minD = d;
            bestAdj = n;
          }
        }
      }
      if (!bestAdj) return [];
      return this.findPath(sx, sy, bestAdj.x, bestAdj.y, grid, canOpenDoors);
    }

    if (sx === tx && sy === ty) return [{ x: targetX, y: targetY }];

    const openList: Node[] = [];
    const closedSet = new Uint8Array(width * height);
    const nodeMap = new Map<number, Node>();

    const startNode: Node = {
      x: sx,
      y: sy,
      g: 0,
      h: this.heuristic(sx, sy, tx, ty),
      f: this.heuristic(sx, sy, tx, ty),
      parent: null
    };

    openList.push(startNode);
    nodeMap.set(sy * width + sx, startNode);

    let iterations = 0;
    const MAX_ITERATIONS = 1200; // prevents lag spikes

    while (openList.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;

      // Find lowest f score
      let lowestIdx = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[lowestIdx].f) {
          lowestIdx = i;
        }
      }

      const current = openList.splice(lowestIdx, 1)[0];
      const curIdx = current.y * width + current.x;
      closedSet[curIdx] = 1;

      // Reached destination
      if (current.x === tx && current.y === ty) {
        const path: Point[] = [];
        let curr: Node | null = current;
        while (curr) {
          path.push({ x: curr.x + 0.5, y: curr.y + 0.5 });
          curr = curr.parent;
        }
        path.reverse();
        // Replace last waypoint with precise target position
        if (path.length > 0) {
          path[path.length - 1] = { x: targetX, y: targetY };
        }
        return path;
      }

      const neighbors = this.getNeighbors(current.x, current.y, width, height);

      for (const n of neighbors) {
        const nIdx = n.y * width + n.x;
        if (closedSet[nIdx]) continue;

        const tile = grid[n.x][n.y];
        const isWalkable = tile.walkable || (canOpenDoors && tile.type === 'Door');
        if (!isWalkable) continue;

        // Diagonal corner cutting check
        const isDiagonal = n.x !== current.x && n.y !== current.y;
        if (isDiagonal) {
          const t1 = grid[current.x][n.y];
          const t2 = grid[n.x][current.y];
          if (!t1.walkable || !t2.walkable) continue;
        }

        const moveCost = isDiagonal ? 1.414 : 1.0;
        const gScore = current.g + moveCost;

        let neighborNode = nodeMap.get(nIdx);

        if (!neighborNode) {
          const h = this.heuristic(n.x, n.y, tx, ty);
          neighborNode = {
            x: n.x,
            y: n.y,
            g: gScore,
            h: h,
            f: gScore + h,
            parent: current
          };
          nodeMap.set(nIdx, neighborNode);
          openList.push(neighborNode);
        } else if (gScore < neighborNode.g) {
          neighborNode.g = gScore;
          neighborNode.f = gScore + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }

    return []; // No path found
  }

  private static heuristic(x1: number, y1: number, x2: number, y2: number): number {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return Math.sqrt(dx * dx + dy * dy);
  }

  private static getNeighbors(x: number, y: number, width: number, height: number): Point[] {
    const res: Point[] = [];
    const dirs = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      // Diagonals
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: -1, y: -1 }
    ];

    for (const d of dirs) {
      const nx = x + d.x;
      const ny = y + d.y;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        res.push({ x: nx, y: ny });
      }
    }
    return res;
  }

  /**
   * Fast Line of Sight (LOS) raycast
   */
  public static hasLineOfSight(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    grid: Tile[][],
    checkTransparency: boolean = true
  ): boolean {
    const width = grid.length;
    if (width === 0) return false;
    const height = grid[0].length;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return true;

    const steps = Math.ceil(distance * 2.5);
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let i = 1; i < steps; i++) {
      const cx = Math.floor(x1 + stepX * i);
      const cy = Math.floor(y1 + stepY * i);

      if (cx < 0 || cx >= width || cy < 0 || cy >= height) return false;

      const tile = grid[cx][cy];
      if (checkTransparency) {
        if (!tile.transparent) return false;
      } else {
        if (!tile.walkable && tile.type !== 'Door') return false;
      }
    }

    return true;
  }
}
