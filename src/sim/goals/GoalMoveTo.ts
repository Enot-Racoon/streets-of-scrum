import { Goal } from "./Goal";
import type { GoalStatus } from "../types";
import type { Agent } from "../Agent";

/**
 * GoalMoveTo: Direct pathfinding to a specific target point
 */
export class GoalMoveTo extends Goal {
  private targetX: number;
  private targetY: number;
  private tolerance: number;

  constructor(
    agent: Agent,
    targetX: number,
    targetY: number,
    tolerance: number = 0.5,
    priority: number = 4,
  ) {
    super("GoalMoveTo", agent, priority);
    this.targetX = targetX;
    this.targetY = targetY;
    this.tolerance = tolerance;
  }

  public activate(): void {
    this.status = "Active";
    this.agent.setDestination(this.targetX, this.targetY);
    this.debugInfo = `Идёт к (${this.targetX.toFixed(1)}, ${this.targetY.toFixed(1)})`;
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    const dist = Math.hypot(
      this.agent.x - this.targetX,
      this.agent.y - this.targetY,
    );
    if (dist <= this.tolerance) {
      this.status = "Completed";
      this.agent.stop();
      return "Completed";
    }

    const reached = this.agent.updatePathfindingAI(dt);
    if (reached) {
      this.status = "Completed";
      this.agent.stop();
      return "Completed";
    }

    if (!this.agent.hasPath && dist > this.tolerance) {
      this.status = "Failed";
      return "Failed";
    }

    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.stop();
  }
}
