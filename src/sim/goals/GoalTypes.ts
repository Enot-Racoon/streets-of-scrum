import { Goal } from "./Goal";
import { GoalStatus, NoiseEvent } from "../types";

/**
 * GoalIdle: Agent stands still, occasionally looks around, waits for timer
 */
export class GoalIdle extends Goal {
  private duration: number;
  private timer: number = 0;

  constructor(agent: any, duration: number = 2.0) {
    super("GoalIdle", agent, 1);
    this.duration = duration;
  }

  public activate(): void {
    this.status = "Active";
    this.timer = 0;
    this.agent.movement.stop();
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

/**
 * GoalWander: Agent picks random points within a radius and walks around
 */
export class GoalWander extends Goal {
  private radius: number;
  private waitTimer: number = 0;
  private isMoving: boolean = false;

  constructor(agent: any, radius: number = 5) {
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
        this.agent.pathfindingAI.setDestination(targetX, targetY);
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
      const reached = this.agent.pathfindingAI.update(dt);
      if (reached || !this.agent.pathfindingAI.hasPath) {
        this.isMoving = false;
        this.waitTimer = 1.0 + Math.random() * 2.0;
        this.agent.movement.stop();
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
    this.agent.movement.stop();
  }
}

/**
 * GoalPatrol: Cycles between assigned patrol coordinates
 */
export class GoalPatrol extends Goal {
  private waypoints: { x: number; y: number }[];
  private currentIdx: number = 0;
  private waitTimer: number = 0;

  constructor(agent: any, waypoints: { x: number; y: number }[]) {
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
    this.agent.pathfindingAI.setDestination(wp.x, wp.y);
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

    const reached = this.agent.pathfindingAI.update(dt);
    if (reached) {
      this.waitTimer = 1.5; // Pause at waypoint
      this.agent.movement.stop();
    }

    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.movement.stop();
  }
}

/**
 * GoalMoveTo: Direct pathfinding to a specific target point
 */
export class GoalMoveTo extends Goal {
  private targetX: number;
  private targetY: number;
  private tolerance: number;

  constructor(
    agent: any,
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
    this.agent.pathfindingAI.setDestination(this.targetX, this.targetY);
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
      this.agent.movement.stop();
      return "Completed";
    }

    const reached = this.agent.pathfindingAI.update(dt);
    if (reached) {
      this.status = "Completed";
      this.agent.movement.stop();
      return "Completed";
    }

    if (!this.agent.pathfindingAI.hasPath && dist > this.tolerance) {
      this.status = "Failed";
      return "Failed";
    }

    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.movement.stop();
  }
}

/**
 * GoalBattle: Tactical combat AI against target agent
 */
export class GoalBattle extends Goal {
  public target: any;
  private repathTimer: number = 0;
  private strafeDir: number = 1;
  private strafeTimer: number = 0;

  constructor(agent: any, target: any) {
    super("GoalBattle", agent, 10);
    this.target = target;
  }

  public activate(): void {
    this.status = "Active";
    this.repathTimer = 0;
    this.debugInfo = `Сражается с ${this.target.name || "target"}`;
    this.agent.say("Ты выбрал не ту драку", true);
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    if (!this.target || this.target.isDead || !this.target.world) {
      this.agent.say("Цель уничтожена!");
      this.status = "Completed";
      return "Completed";
    }

    const dist = Math.hypot(
      this.agent.x - this.target.x,
      this.agent.y - this.target.y,
    );
    const hasLOS = this.agent.world.hasLineOfSight(
      this.agent.x,
      this.agent.y,
      this.target.x,
      this.target.y,
    );

    // Aim towards target
    const aimAngle = Math.atan2(
      this.target.y - this.agent.y,
      this.target.x - this.agent.x,
    );
    this.agent.facingAngle = aimAngle;

    const currentWeapon = this.agent.inventory.getEquippedWeaponDef();
    const isGun = currentWeapon.type === "gun";
    const idealRange = isGun ? Math.min(6, currentWeapon.range || 6) : 1.0;

    // Movement logic
    if (dist > idealRange || !hasLOS) {
      // Pursue
      this.repathTimer -= dt;
      if (this.repathTimer <= 0) {
        this.agent.pathfindingAI.setDestination(this.target.x, this.target.y);
        this.repathTimer = 0.4;
      }
      this.agent.pathfindingAI.update(dt);
    } else {
      // In combat range: strafe or back up slightly if too close with a gun
      this.strafeTimer -= dt;
      if (this.strafeTimer <= 0) {
        this.strafeDir = Math.random() > 0.5 ? 1 : -1;
        this.strafeTimer = 0.8 + Math.random() * 0.8;
      }

      if (isGun && dist < 2.5) {
        // Back up
        const backAngle = aimAngle + Math.PI;
        this.agent.movement.moveInDirection(backAngle, dt, 0.6);
      } else if (dist > 1.2 && isGun) {
        // Circle strafe
        const strafeAngle = aimAngle + (Math.PI / 2) * this.strafeDir;
        this.agent.movement.moveInDirection(strafeAngle, dt, 0.7);
      } else {
        this.agent.movement.stop();
      }
    }

    // Attack if in range and has line of sight
    if (hasLOS && dist <= (currentWeapon.range || 1.5) + 0.3) {
      this.agent.combat.attack(this.target.x, this.target.y);
    }

    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.movement.stop();
  }
}

/**
 * GoalFlee: Runs away in the opposite direction of the threat
 */
export class GoalFlee extends Goal {
  public threat: any;
  private duration: number;
  private timer: number = 0;
  private repathTimer: number = 0;

  constructor(agent: any, threat: any, duration: number = 5.0) {
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
          this.agent.pathfindingAI.setDestination(targetX, targetY);
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

    this.agent.pathfindingAI.update(dt);
    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.movement.stop();
  }
}

/**
 * GoalInvestigate: Moves to check out suspicious location or crime scene
 */
export class GoalInvestigate extends Goal {
  private targetX: number;
  private targetY: number;
  private waitTimer: number = 0;
  private reached: boolean = false;

  constructor(agent: any, targetX: number, targetY: number) {
    super("GoalInvestigate", agent, 6);
    this.targetX = targetX;
    this.targetY = targetY;
  }

  public activate(): void {
    this.status = "Active";
    this.reached = false;
    this.agent.pathfindingAI.setDestination(this.targetX, this.targetY);
    this.debugInfo = `Исследует (${this.targetX.toFixed(0)}, ${this.targetY.toFixed(0)})`;
    this.agent.say("Что за звук?");
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    if (!this.reached) {
      const arrived = this.agent.pathfindingAI.update(dt);
      const dist = Math.hypot(
        this.agent.x - this.targetX,
        this.agent.y - this.targetY,
      );
      if (arrived || dist <= 1.2) {
        this.reached = true;
        this.waitTimer = 2.5; // Look around for 2.5 seconds
        this.agent.movement.stop();
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
    this.agent.movement.stop();
  }
}

/**
 * GoalNoiseReact: Rapid reaction to gunshots, screams, explosions
 */
export class GoalNoiseReact extends Goal {
  public noise: NoiseEvent;
  private timer: number = 0;

  constructor(agent: any, noise: NoiseEvent) {
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
    this.agent.movement.stop();
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
        if (!this.agent.isDead && !this.agent.brain.isSuspended) {
          if (shouldInvestigate) {
            this.agent.brain.pushGoal(new GoalInvestigate(this.agent, nx, ny));
          } else if (shouldFlee) {
            this.agent.brain.pushGoal(
              new GoalFlee(this.agent, { x: nx, y: ny }),
            );
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

/**
 * GoalTattle: Runs to report crime to nearby Cops or Security Bots
 */
export class GoalTattle extends Goal {
  private crimeSource: any;
  private copTarget: any = null;

  constructor(agent: any, crimeSource: any) {
    super("GoalTattle", agent, 8);
    this.crimeSource = crimeSource;
  }

  public activate(): void {
    this.status = "Active";
    this.findNearestCop();
    if (this.copTarget) {
      this.agent.pathfindingAI.setDestination(
        this.copTarget.x,
        this.copTarget.y,
      );
      this.agent.say("Полиция! Помогите! Тут преступник!", true);
      this.debugInfo = `Жалуется ${this.copTarget.name}`;
    } else {
      this.status = "Failed";
    }
  }

  private findNearestCop() {
    const world = this.agent.world;
    if (!world) return;

    let closestCop: any = null;
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
        this.copTarget.relationships.setRelType(this.crimeSource.id, "Hostile");
        this.copTarget.relationships.modifyHate(this.crimeSource.id, 80);
        this.copTarget.brain.pushGoal(
          new GoalBattle(this.copTarget, this.crimeSource),
        );
      }
      this.agent.say("Спасибо, Офицер!");
      this.status = "Completed";
      return "Completed";
    }

    this.agent.pathfindingAI.setDestination(this.copTarget.x, this.copTarget.y);
    this.agent.pathfindingAI.update(dt);
    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.movement.stop();
  }
}

/**
 * GoalInteract: Approaches an interactable tile (ATM, Crate, Door) and interacts
 */
export class GoalInteract extends Goal {
  private tileX: number;
  private tileY: number;

  constructor(agent: any, tileX: number, tileY: number) {
    super("GoalInteract", agent, 5);
    this.tileX = tileX;
    this.tileY = tileY;
  }

  public activate(): void {
    this.status = "Active";
    this.agent.pathfindingAI.setDestination(this.tileX + 0.5, this.tileY + 0.5);
    this.debugInfo = `Взаимодействие с объектом в (${this.tileX}, ${this.tileY})`;
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    const dist = Math.hypot(
      this.agent.x - (this.tileX + 0.5),
      this.agent.y - (this.tileY + 0.5),
    );
    if (dist <= 1.4) {
      this.agent.interactAt(this.tileX, this.tileY);
      this.status = "Completed";
      return "Completed";
    }

    this.agent.pathfindingAI.update(dt);
    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.movement.stop();
  }
}
