import { Goal } from "./Goal";
import { GoalBattle } from "./GoalBattle";
import type { GoalStatus } from "../types";
import type { Agent } from "../Agent";

/**
 * GoalTattle: Runs to report crime to nearby Cops or Security Bots
 */
export class GoalTattle extends Goal {
  private crimeSource: Agent;
  private copTarget: Agent | null = null;

  constructor(agent: Agent, crimeSource: Agent) {
    super("GoalTattle", agent, 8);
    this.crimeSource = crimeSource;
  }

  public activate(): void {
    this.status = "Active";
    this.findNearestCop();
    if (this.copTarget) {
      this.agent.setDestination(this.copTarget.x, this.copTarget.y);
      this.agent.say("Полиция! Помогите! Тут преступник!", true);
      this.debugInfo = `Жалуется ${this.copTarget.name}`;
    } else {
      this.status = "Failed";
    }
  }

  private findNearestCop() {
    const world = this.agent.world;
    if (!world) return;

    let closestCop: Agent | null = null;
    let minDist = Infinity;

    for (const other of world.agents) {
      if (
        other.id !== this.agent.id &&
        !other.isDead &&
        (other.job === "Cop" ||
          other.hasTrait("Cop") ||
          other.job === "Supercop")
      ) {
        const d = Math.hypot(other.x - this.agent.x, other.y - this.agent.y);
        if (d < minDist) {
          minDist = d;
          closestCop = other;
        }
      }
    }

    this.copTarget = closestCop;
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    if (!this.copTarget || this.copTarget.isDead) {
      this.status = "Failed";
      return "Failed";
    }

    const dist = Math.hypot(
      this.agent.x - this.copTarget.x,
      this.agent.y - this.copTarget.y,
    );
    if (dist <= 2.0) {
      // Inform the cop!
      this.copTarget.say("Руки вверх, преступник!", true);
      if (this.crimeSource && !this.crimeSource.isDead) {
        this.copTarget
          .setRelationship(this.crimeSource.id, "Hostile", 80)
          .pushGoal(new GoalBattle(this.copTarget, this.crimeSource));
      }
      this.agent.say("Спасибо, Офицер!");
      this.status = "Completed";
      return "Completed";
    }

    this.agent.setDestination(this.copTarget.x, this.copTarget.y);
    this.agent.updatePathfindingAI(dt);
    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.stop();
  }
}
