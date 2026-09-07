import { Goal } from "./Goal";
import type { GoalStatus } from "../types";
import type { Agent } from "../Agent";

/**
 * GoalFlee: Runs away in the opposite direction of the threat
 */
export class GoalFlee extends Goal {
  public threat: any;
  private duration: number;
  private timer: number = 0;
  private repathTimer: number = 0;

  constructor(agent: Agent, threat: any, duration: number = 5.0) {
    super("GoalFlee", agent, 12);
    this.threat = threat;
    this.duration = duration;
  }

  public activate(): void {
    this.status = "Active";
    this.timer = 0;
    this.repathTimer = 0;
    this.debugInfo = `Fleeing from ${this.threat ? this.threat.name : "danger"}!`;
    this.agent.say("Помогите! Спасите меня!", true);
    this.findEscapeRoute();
  }

  private findEscapeRoute() {
    const world = this.agent.world;
    if (!world || !this.threat) return;

    const awayAngle = Math.atan2(
      this.agent.y - this.threat.y,
      this.agent.x - this.threat.x,
    );
    for (let offset = 0; offset <= Math.PI; offset += Math.PI / 4) {
      for (const sign of [1, -1]) {
        const testAngle = awayAngle + offset * sign;
        const targetX = this.agent.x + Math.cos(testAngle) * 7;
        const targetY = this.agent.y + Math.sin(testAngle) * 7;

        const tx = Math.floor(targetX);
        const ty = Math.floor(targetY);

        if (world.isWalkable(tx, ty)) {
          this.agent.setDestination(targetX, targetY);
          return;
        }
      }
    }
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    this.timer += dt;
    if (this.timer >= this.duration) {
      this.status = "Completed";
      return "Completed";
    }

    this.repathTimer -= dt;
    if (this.repathTimer <= 0) {
      this.findEscapeRoute();
      this.repathTimer = 1.0;
    }

    this.agent.updatePathfindingAI(dt);
    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.stop();
  }
}
