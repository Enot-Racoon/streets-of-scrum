import { Goal } from "./Goal";
import type { GoalStatus } from "../types";
import type { Agent } from "../Agent";

/**
 * GoalInvestigate: Moves to check out suspicious location or crime scene
 */
export class GoalInvestigate extends Goal {
  private targetX: number;
  private targetY: number;
  private waitTimer: number = 0;
  private reached: boolean = false;

  constructor(agent: Agent, targetX: number, targetY: number) {
    super("GoalInvestigate", agent, 6);
    this.targetX = targetX;
    this.targetY = targetY;
  }

  public activate(): void {
    this.status = "Active";
    this.reached = false;
    this.agent.setDestination(this.targetX, this.targetY);
    this.debugInfo = `Исследует (${this.targetX.toFixed(0)}, ${this.targetY.toFixed(0)})`;
    this.agent.say("Что за звук?");
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    if (!this.reached) {
      const arrived = this.agent.updatePathfindingAI(dt);
      const dist = Math.hypot(
        this.agent.x - this.targetX,
        this.agent.y - this.targetY,
      );
      if (arrived || dist <= 1.2) {
        this.reached = true;
        this.waitTimer = 2.5; // Look around for 2.5 seconds
        this.agent.stop();
        this.debugInfo = "Осматривается...";
      }
    } else {
      this.waitTimer -= dt;
      // Turn around to look for suspects
      this.agent.facingAngle += dt * 3;
      if (this.waitTimer <= 0) {
        this.agent.say("Похоже, показалось.");
        this.status = "Completed";
        return "Completed";
      }
    }

    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.stop();
  }
}
