import { Goal } from "./Goal";
import type { GoalStatus } from "../types";
import type { Agent } from "../Agent";

/**
 * GoalPatrol: Cycles between assigned patrol coordinates
 */
export class GoalPatrol extends Goal {
  private waypoints: { x: number; y: number }[];
  private currentIdx: number = 0;
  private waitTimer: number = 0;

  constructor(agent: Agent, waypoints: { x: number; y: number }[]) {
    super("GoalPatrol", agent, 3);
    this.waypoints = waypoints;
  }

  public activate(): void {
    this.status = "Active";
    this.currentIdx = 0;
    this.moveToCurrentWaypoint();
  }

  private moveToCurrentWaypoint() {
    if (this.waypoints.length === 0) {
      this.status = "Completed";
      return;
    }
    const wp = this.waypoints[this.currentIdx];
    this.agent.setDestination(wp.x, wp.y);
    this.debugInfo = `Патрулирует до тчк #${this.currentIdx + 1} (${wp.x.toFixed(0)}, ${wp.y.toFixed(0)})`;
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    if (this.waitTimer > 0) {
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) {
        this.currentIdx = (this.currentIdx + 1) % this.waypoints.length;
        this.moveToCurrentWaypoint();
      }
      return "Active";
    }

    const reached = this.agent.updatePathfindingAI(dt);
    if (reached) {
      this.waitTimer = 1.5; // Pause at waypoint
      this.agent.stop();
    }

    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.stop();
  }
}
