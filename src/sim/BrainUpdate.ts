import { GoalBattle, GoalFlee, GoalNoiseReact } from "./goals/GoalTypes";
import type { NoiseEvent } from "./types";
import type { Agent } from "./Agent";
import type { World } from "./World";

export class BrainUpdate {
  public agent: Agent;
  private thinkInterval: number = 0.25; // evaluate 4 times a second
  private thinkTimer: number = 0;

  constructor(agent: Agent) {
    this.agent = agent;
    this.thinkTimer = Math.random() * this.thinkInterval; // jitter
  }

  public update(dt: number, world: World): void {
    if (this.agent.isDead || this.agent.brain.isSuspended) return;

    this.thinkTimer -= dt;
    if (this.thinkTimer <= 0) {
      this.thinkTimer = this.thinkInterval;
      this.evaluateBrain(world);
    }
  }

  private evaluateBrain(world: World): void {
    const currentGoal = this.agent.brain.getTopGoal();
    const isBattling = currentGoal && currentGoal.name === "GoalBattle";
    const isFleeing = currentGoal && currentGoal.name === "GoalFlee";

    // 1. Scan for Hostile threats in Line of Sight
    let mostThreateningAgent: Agent | null = null;
    let closestHostileDist = Infinity;

    for (const other of world.agents) {
      if (other.id === this.agent.id || other.isDead) continue;

      const rel = this.agent.relationships.getOrCreate(other);
      if (rel.hasLOS && rel.relType === "Hostile") {
        if (rel.distance < closestHostileDist) {
          closestHostileDist = rel.distance;
          mostThreateningAgent = other;
        }
      }
    }

    if (mostThreateningAgent) {
      // Threat detected!
      const isCoward =
        this.agent.hasTrait("Coward") || this.agent.hasTrait("Pacifist");
      const isLowHealth = this.agent.health / this.agent.maxHealth < 0.25;

      if (isCoward || (isLowHealth && !this.agent.hasTrait("Aggressive"))) {
        if (!isFleeing) {
          this.agent.brain.pushGoal(
            new GoalFlee(this.agent, mostThreateningAgent, 6.0),
          );
        }
      } else {
        if (
          !isBattling ||
          (currentGoal as GoalBattle).target.id !== mostThreateningAgent.id
        ) {
          this.agent.brain.pushGoal(
            new GoalBattle(this.agent, mostThreateningAgent),
          );
        }
      }
      return;
    }

    // 2. Check for nearby noise events
    const recentNoise: NoiseEvent | null = world.getRecentNoiseNear(
      this.agent.x,
      this.agent.y,
      this.agent.getHearingRadius(),
    );
    if (recentNoise) {
      const alreadyReacted = this.agent.brain.getMemory(
        `noise_${recentNoise.id}`,
      );
      if (!alreadyReacted && !isBattling && !isFleeing) {
        this.agent.brain.setMemory(`noise_${recentNoise.id}`, true, 5000);
        this.agent.brain.pushGoal(new GoalNoiseReact(this.agent, recentNoise));
        return;
      }
    }

    // 3. Fallback: if no active goals, init idle / wander
    if (this.agent.brain.goalStack.length === 0) {
      this.agent.initDefaultGoal();
    }
  }
}
