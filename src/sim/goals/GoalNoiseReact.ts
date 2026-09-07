import { Goal } from "./Goal";
import { GoalFlee } from "./GoalFlee";
import { GoalInvestigate } from "./GoalInvestigate";
import type { Agent } from "../Agent";
import type { GoalStatus, NoiseEvent } from "../types";

/**
 * GoalNoiseReact: Rapid reaction to gunshots, screams, explosions
 */
export class GoalNoiseReact extends Goal {
  public noise: NoiseEvent;
  private timer: number = 0;

  constructor(agent: Agent, noise: NoiseEvent) {
    super("GoalNoiseReact", agent, 7);
    this.noise = noise;
  }

  public activate(): void {
    this.status = "Active";
    this.timer = 0;
    // Turn facing towards noise source
    this.agent.facingAngle = Math.atan2(
      this.noise.y - this.agent.y,
      this.noise.x - this.agent.x,
    );
    this.agent.stop();
    this.debugInfo = `Реагирует на ${this.noise.noiseType}`;
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    this.timer += dt;
    if (this.timer >= 0.4) {
      const nx = this.noise.x;
      const ny = this.noise.y;
      const shouldInvestigate =
        this.agent.hasTrait("Cop") ||
        this.agent.hasTrait("Aggressive") ||
        this.agent.job === "Cop" ||
        this.agent.job === "Soldier";
      const shouldFlee = this.agent.hasTrait("Coward");

      this.status = "Completed";

      // Push follow-up goal next frame cleanly
      setTimeout(() => {
        if (!this.agent.isDead && !this.agent.isSuspended) {
          if (shouldInvestigate) {
            this.agent.pushGoal(new GoalInvestigate(this.agent, nx, ny));
          } else if (shouldFlee) {
            this.agent.pushGoal(new GoalFlee(this.agent, { x: nx, y: ny }));
          }
        }
      }, 0);

      return "Completed";
    }

    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
  }
}
