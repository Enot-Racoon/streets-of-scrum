import { Goal } from "./Goal";
import type { GoalStatus } from "../types";
import type { Agent } from "../Agent";
import { WeaponEvaluator } from "../WeaponEvaluator";

/**
 * GoalBattle: Tactical combat AI against target agent
 */
export class GoalBattle extends Goal {
  public target: Agent;
  private repathTimer: number = 0;
  private strafeDir: number = 1;
  private strafeTimer: number = 0;
  private weaponCheckTimer: number = 0;

  constructor(agent: Agent, target: Agent) {
    super("GoalBattle", agent, 10);
    this.target = target;
  }

  public activate(): void {
    this.status = "Active";
    this.repathTimer = 0;
    this.debugInfo = `Сражается с ${this.target.name || "target"}`;
    this.agent.say("Ты зря начал драку", true);
  }

  private chooseBestWeapon(distance: number): void {
    const result = WeaponEvaluator.findBestWeapon(this.agent.items, distance);

    // No usable weapon.
    // Leave the inventory as it is.
    // Agent will use fists as fallback.
    if (!result) {
      return;
    }

    if (result.index !== this.agent.equippedIndex) {
      this.agent.equipIndex(result.index);
    }
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    if (!this.target || this.target.isDead || !this.target.world) {
      this.agent.say("Цель уничтожена!");
      this.status = "Completed";
      return "Completed";
    }

    if (!this.agent.world) return "Failed";

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

    this.weaponCheckTimer -= dt;
    if (this.weaponCheckTimer <= 0) {
      this.chooseBestWeapon(dist);
      this.weaponCheckTimer = 0.5;
    }

    // Aim towards target
    const aimAngle = Math.atan2(
      this.target.y - this.agent.y,
      this.target.x - this.agent.x,
    );
    this.agent.facingAngle = aimAngle;

    const currentWeapon = this.agent.getEquippedWeapon();
    const isGun = ["gun", "explosive"].includes(currentWeapon.type);
    const idealRange = isGun ? Math.min(6, currentWeapon.range || 6) : 1.0;

    // Movement logic
    if (dist > idealRange || !hasLOS) {
      // Pursue
      this.repathTimer -= dt;
      if (this.repathTimer <= 0) {
        this.agent.setDestination(this.target.x, this.target.y);
        this.repathTimer = 0.4;
      }
      this.agent.updatePathfindingAI(dt);
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
        this.agent.moveInDirection(backAngle, 0.6);
      } else if (dist > 1.2 && isGun) {
        // Circle strafe
        const strafeAngle = aimAngle + (Math.PI / 2) * this.strafeDir;
        this.agent.moveInDirection(strafeAngle, 0.7);
      } else {
        this.agent.stop();
      }
    }

    // Attack if in range and has line of sight
    if (hasLOS && dist <= (currentWeapon.range || 1.5) + 0.3) {
      this.agent.attack(this.target.x, this.target.y);
    }

    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.stop();
  }
}
