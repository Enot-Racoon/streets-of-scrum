import { Goal } from "./Goal";
import type { GoalStatus } from "../types";
import type { Agent } from "../Agent";

/**
 * GoalIdle: Agent stands still, occasionally looks around, waits for timer
 */
export class GoalIdle extends Goal {
  private duration: number;
  private timer: number = 0;

  constructor(agent: Agent, duration: number = 2.0) {
    super("GoalIdle", agent, 1);
    this.duration = duration;
  }

  public activate(): void {
    this.status = "Active";
    this.timer = 0;
    this.agent.stop();
    this.debugInfo = `Бездельничает ${this.duration.toFixed(1)}с`;
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;
    this.timer += dt;
    if (this.timer >= this.duration) {
      this.status = "Completed";
      return "Completed";
    }
    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
  }
}
