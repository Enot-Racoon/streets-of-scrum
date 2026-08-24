import { Pathfinding, Point } from '../pathfinding';

export class PathfindingAI {
  public agent: any;
  public path: Point[] = [];
  public currentWaypointIndex: number = 0;
  public targetPos: Point | null = null;
  public hasPath: boolean = false;
  private repathCooldown: number = 0;
  private stuckTimer: number = 0;
  private lastPos: Point = { x: 0, y: 0 };

  constructor(agent: any) {
    this.agent = agent;
    this.lastPos = { x: agent.x, y: agent.y };
  }

  public setDestination(targetX: number, targetY: number): boolean {
    this.targetPos = { x: targetX, y: targetY };
    this.recalculatePath();
    return this.hasPath;
  }

  public recalculatePath(): void {
    if (!this.targetPos || !this.agent.world) return;

    this.path = Pathfinding.findPath(
      this.agent.x,
      this.agent.y,
      this.targetPos.x,
      this.targetPos.y,
      this.agent.world.grid,
      this.agent.canOpenDoors
    );

    this.currentWaypointIndex = 0;
    this.hasPath = this.path.length > 0;
  }

  public update(dt: number): boolean {
    if (!this.hasPath || this.path.length === 0) {
      return true; // nothing to path
    }

    const currentWP = this.path[this.currentWaypointIndex];
    if (!currentWP) {
      this.hasPath = false;
      return true;
    }

    const dist = Math.hypot(this.agent.x - currentWP.x, this.agent.y - currentWP.y);

    // If near current waypoint, advance to next
    if (dist < 0.35) {
      this.currentWaypointIndex++;
      if (this.currentWaypointIndex >= this.path.length) {
        this.hasPath = false;
        this.agent.movement.stop();
        return true; // reached destination!
      }
    }

    // Move towards current waypoint
    const activeWP = this.path[this.currentWaypointIndex];
    if (activeWP) {
      this.agent.movement.moveTowards(activeWP.x, activeWP.y, dt);

      // Check if path is blocked by closed door and interact to open
      const tileX = Math.floor(activeWP.x);
      const tileY = Math.floor(activeWP.y);
      const tile = this.agent.world.getTile(tileX, tileY);
      if (tile && tile.type === 'Door' && !tile.isOpen) {
        this.agent.interactAt(tileX, tileY);
      }
    }

    // Stuck detection
    const movedDist = Math.hypot(this.agent.x - this.lastPos.x, this.agent.y - this.lastPos.y);
    if (movedDist < 0.05 * dt) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 0.8) {
        this.stuckTimer = 0;
        this.recalculatePath();
      }
    } else {
      this.stuckTimer = 0;
    }
    this.lastPos = { x: this.agent.x, y: this.agent.y };

    return false;
  }

  public clear(): void {
    this.path = [];
    this.currentWaypointIndex = 0;
    this.targetPos = null;
    this.hasPath = false;
  }
}
