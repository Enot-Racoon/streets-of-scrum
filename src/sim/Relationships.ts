import type { RelType, RelationshipState } from "./types";
import type { Agent } from "./Agent";
import type { World } from "./World";

export class Relationships {
  public agent: Agent;
  public map: Map<string, RelationshipState> = new Map();

  constructor(agent: Agent) {
    this.agent = agent;
  }

  public getRel(targetId: string): RelationshipState | null {
    return this.map.get(targetId) ?? null;
  }

  private createRel(targetAgent: Agent | string) {
    const targetId =
      typeof targetAgent === "string" ? targetAgent : targetAgent.id;

    const initialType: RelType = this.determineInitialRel(targetAgent);
    const rel = {
      targetAgentId: targetId,
      relType: initialType,
      initialRelType: initialType,
      hate: initialType === "Hostile" ? 80 : 0,
      strikes: 0,
      hasLOS: false,
      distance: 999,
      annoyedCountdown: 0,
    };
    this.map.set(targetId, rel);
    return rel;
  }

  public getOrCreate(targetAgent: Agent | string): RelationshipState {
    const targetId =
      typeof targetAgent === "string" ? targetAgent : targetAgent.id;

    return this.getRel(targetId) ?? this.createRel(targetAgent);
  }

  private determineInitialRel(target: Agent | string): RelType {
    if (!target || typeof target === "string") return "Neutral";

    // Faction based initial relationships
    const myJob = this.agent.job;
    const targetJob = target.job;

    // Same faction
    if (myJob === targetJob && myJob !== "Citizen") {
      return "Friendly";
    }

    // Gang rivalry: Crepe vs Blahd
    if (
      (myJob === "Gangster_Crepe" && targetJob === "Gangster_Blahd") ||
      (myJob === "Gangster_Blahd" && targetJob === "Gangster_Crepe")
    ) {
      return "Hostile";
    }

    // Cops vs Criminals / Thieves / Assassins
    if (
      (myJob === "Cop" || myJob === "Supercop") &&
      (targetJob === "Thief" ||
        targetJob === "Assassin" ||
        targetJob === "Zombie")
    ) {
      return "Hostile";
    }

    // Zombie attacks everyone
    if (myJob === "Zombie" || targetJob === "Zombie") {
      return myJob === targetJob ? "Friendly" : "Hostile";
    }

    // Gorilla vs Scientists
    if (
      (myJob === "Gorilla" && targetJob === "Scientist") ||
      (myJob === "Scientist" && targetJob === "Gorilla")
    ) {
      return "Hostile";
    }

    return "Neutral";
  }

  public getRelType(targetId: string): RelType {
    const rel = this.map.get(targetId);
    return rel ? rel.relType : "Neutral";
  }

  public setRelType(targetId: string, relType: RelType): this {
    const rel = this.getOrCreate(targetId);
    rel.relType = relType;
    if (relType === "Hostile") {
      rel.hate = Math.max(rel.hate, 75);
    } else if (relType === "Friendly" || relType === "Loyal") {
      rel.hate = 0;
    }
    return this;
  }

  public modifyHate(targetId: string, delta: number): void {
    const rel = this.getOrCreate(targetId);

    // Apply trait modifier
    let modDelta = delta;
    if (this.agent.hasTrait("Paranoid") && delta > 0) {
      modDelta *= 2.0;
    }
    if (this.agent.hasTrait("Aggressive") && delta > 0) {
      modDelta *= 1.5;
    }

    rel.hate = Math.max(0, Math.min(100, rel.hate + modDelta));
    rel.annoyedCountdown = 10.0; // Reset cool-off timer

    // Hate thresholds
    if (rel.hate >= 60 && rel.relType !== "Hostile") {
      rel.relType = "Hostile";
      this.agent.say("I will destroy you!", true);
    } else if (rel.hate >= 25 && rel.relType === "Neutral") {
      rel.relType = "Annoyed";
      this.agent.say("Hey, watch it!");
    }
  }

  public addStrike(targetId: string, reason: string = "trespass"): void {
    const rel = this.getOrCreate(targetId);
    rel.strikes++;
    this.modifyHate(targetId, 25);
    if (rel.strikes === 1) {
      this.agent.say("Step back or there will be trouble!");
    } else if (rel.strikes >= 3) {
      this.setRelType(targetId, "Hostile");
    }
  }

  public update(dt: number, world: World): void {
    for (const [targetId, rel] of this.map.entries()) {
      const target = world.getAgentById(targetId);
      if (!target || target.isDead) {
        rel.hasLOS = false;
        continue;
      }

      // Distance & Line of sight
      rel.distance = Math.hypot(
        target.x - this.agent.x,
        target.y - this.agent.y,
      );
      const visionRange = this.agent.getVisionRange();
      const withinRange = rel.distance <= visionRange;

      if (withinRange) {
        rel.hasLOS = world.hasLineOfSight(
          this.agent.x,
          this.agent.y,
          target.x,
          target.y,
        );
        if (rel.hasLOS) {
          rel.lastSawPos = { x: target.x, y: target.y };
          rel.lastSawTime = Date.now();
        }
      } else {
        rel.hasLOS = false;
      }

      // Cool off hate over time if target is out of sight
      if (!rel.hasLOS && rel.annoyedCountdown > 0) {
        rel.annoyedCountdown -= dt;
        if (rel.annoyedCountdown <= 0 && rel.relType === "Annoyed") {
          rel.hate = Math.max(0, rel.hate - 10);
          if (rel.hate < 20) {
            rel.relType = "Neutral";
          }
        }
      }
    }
  }

  public getAll(liveOnly?: boolean): RelationshipState[] {
    if (liveOnly) {
      return Array.from(this.map.values()).filter((rel) => {
        const target = this.agent.world.getAgentById(rel.targetAgentId);
        return target && !target.isDead;
      });
    }
    return Array.from(this.map.values());
  }
}
