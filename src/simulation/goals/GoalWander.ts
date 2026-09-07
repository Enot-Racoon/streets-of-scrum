import { Goal } from "./Goal";
import type { GoalStatus } from "../types";
import type { Agent } from "../Agent";

/**
 * GoalWander: Agent picks random points within a radius and walks around
 */
export class GoalWander extends Goal {
  private radius: number;
  private waitTimer: number = 0;
  private isMoving: boolean = false;

  constructor(agent: Agent, radius: number = 5) {
    super("GoalWander", agent, 2);
    this.radius = radius;
  }

  public activate(): void {
    this.status = "Active";
    this.pickNextDestination();
  }

  private pickNextDestination() {
    const world = this.agent.world;
    if (!world) return;

    for (let attempt = 0; attempt < 8; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 1.5 + Math.random() * this.radius;
      const targetX = this.agent.x + Math.cos(angle) * dist;
      const targetY = this.agent.y + Math.sin(angle) * dist;

      const tx = Math.floor(targetX);
      const ty = Math.floor(targetY);

      if (world.isWalkable(tx, ty)) {
        this.agent.setDestination(targetX, targetY);
        this.isMoving = true;
        this.debugInfo = `Блуждает до (${tx}, ${ty})`;
        return;
      }
    }
    // Fallback: stay idle briefly
    this.isMoving = false;
    this.waitTimer = 1.0;
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    if (this.isMoving) {
      const reached = this.agent.updatePathfindingAI(dt);
      if (reached || !this.agent) {
        this.isMoving = false;
        this.waitTimer = 1.0 + Math.random() * 2.0;
        this.agent.stop();
      }
    } else {
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) {
        this.pickNextDestination();
      }
    }

    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.stop();
  }
}
