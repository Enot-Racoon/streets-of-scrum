import { sounds } from "../sound";
import { getTraitDef } from "../traits";
import type { Agent } from "../Agent";
import type { World } from "../World";
import type { ItemDef } from "../types";

export class Combat {
  public agent: Agent;
  public attackCooldownTimer: number = 0;
  public isSwinging: boolean = false;
  public swiningHand: "left" | "right" = "right";
  public swingProgress: number = 0;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  public canAttack(): boolean {
    return this.attackCooldownTimer <= 0 && !this.agent.isDead;
  }

  public attack(targetX?: number, targetY?: number): boolean {
    if (!this.canAttack()) return false;

    const weapon = this.agent.inventory.getEquippedWeaponDef();
    const cooldown = 1.0 / (weapon.attackSpeed || 1.5);
    this.attackCooldownTimer = cooldown;

    const world = this.agent.world;
    if (!world) return false;

    // Aim calculation
    let aimAngle = this.agent.facingAngle;
    if (targetX !== undefined && targetY !== undefined) {
      aimAngle = Math.atan2(targetY - this.agent.y, targetX - this.agent.x);
      this.agent.facingAngle = aimAngle;
    }

    if (weapon.type === "gun") {
      this.fireGun(weapon, aimAngle, world);
    } else {
      this.swingMelee(weapon, aimAngle, world);
    }

    return true;
  }

  private fireGun(weapon: ItemDef, aimAngle: number, world: World) {
    // Sound & Noise event
    if (weapon.soundName === "shotgun") {
      sounds.playShotgun();
    } else {
      sounds.playGunshot();
    }

    world.emitNoise({
      x: this.agent.x,
      y: this.agent.y,
      radius: 12,
      volume: 0.9,
      sourceAgentId: this.agent.id,
      noiseType: "gunshot",
    });

    const bulletCount = weapon.bulletCount || 1;
    const baseDamage = weapon.damage || 15;
    const bulletSpeed = weapon.bulletSpeed || 18;
    const spread = weapon.spread || 0.05;

    let finalDamage =
      baseDamage *
      (this.agent.statusEffects.getStatMod("bulletDamageMult") || 1.0);

    for (let i = 0; i < bulletCount; i++) {
      const angleOffset = (Math.random() - 0.5) * spread * 2;
      const fireAngle = aimAngle + angleOffset;
      const vx = Math.cos(fireAngle) * bulletSpeed;
      const vy = Math.sin(fireAngle) * bulletSpeed;

      world.spawnProjectile({
        x: this.agent.x + Math.cos(aimAngle) * 0.4,
        y: this.agent.y + Math.sin(aimAngle) * 0.4,
        vx,
        vy,
        damage: finalDamage,
        sourceAgentId: this.agent.id,
        lifetime: (weapon.range || 10) / bulletSpeed,
        rangeLeft: weapon.range || 10,
        radius: 0.12,
        color: "#fbbf24",
      });
    }

    // Muzzle flash particles
    world.spawnParticles({
      x: this.agent.x + Math.cos(aimAngle) * 0.45,
      y: this.agent.y + Math.sin(aimAngle) * 0.45,
      count: 5,
      type: "spark",
      color: "#f59e0b",
    });
  }

  private isEquipedFists() {
    const weapon = this.agent.inventory.getEquippedWeaponDef();
    return weapon.id === "fists";
  }

  private startSwinging() {
    this.isSwinging = true;
    this.swingProgress = 0;
    if (this.isEquipedFists()) {
      this.swiningHand = Math.random() > 0.5 ? "left" : "right";
    }
  }

  private stopSwinging() {
    this.isSwinging = false;
    this.swingProgress = 0;
    this.swiningHand = "right";
  }

  private swingMelee(weapon: ItemDef, aimAngle: number, world: World) {
    sounds.playPunch();
    this.startSwinging();

    world.emitNoise({
      x: this.agent.x,
      y: this.agent.y,
      radius: 4,
      volume: 0.3,
      sourceAgentId: this.agent.id,
      noiseType: "smash",
    });

    const range = weapon.range || 1.2;
    const baseDamage = weapon.damage || 10;
    let finalDamage =
      baseDamage *
      (this.agent.statusEffects.getStatMod("meleeDamageMult") || 1.0);

    // Apply trait hooks on deal damage
    for (const traitName of this.agent.statusEffects.traitNames) {
      const def = getTraitDef(traitName);
      if (def && def.onDealDamage) {
        finalDamage = def.onDealDamage(this.agent, finalDamage, null);
      }
    }

    const hitArc = Math.PI * 0.5;
    const attackX = this.agent.x + Math.cos(aimAngle) * (range * 0.6);
    const attackY = this.agent.y + Math.sin(aimAngle) * (range * 0.6);

    // Check hit against other agents
    for (const other of world.agents) {
      if (other.id === this.agent.id || other.isDead) continue;

      const dist = Math.hypot(other.x - this.agent.x, other.y - this.agent.y);
      if (dist <= range + (other.radius || 0.35)) {
        const angleToTarget = Math.atan2(
          other.y - this.agent.y,
          other.x - this.agent.x,
        );
        let angleDiff = Math.abs(aimAngle - angleToTarget);
        while (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        if (angleDiff <= hitArc) {
          // Hit! Knockback and damage
          const kbPower = this.agent.hasTrait("Strength") ? 6.0 : 3.0;
          other.movement.vx += Math.cos(aimAngle) * kbPower;
          other.movement.vy += Math.sin(aimAngle) * kbPower;

          other.takeDamage(finalDamage, this.agent);

          world.spawnParticles({
            x: other.x,
            y: other.y,
            count: 6,
            type: "blood",
            color: "#ef4444",
          });
        }
      }
    }

    // Check hit against destructible world objects (doors, crates, barrels)
    const targetTileX = Math.floor(attackX);
    const targetTileY = Math.floor(attackY);
    world.damageTile(targetTileX, targetTileY, finalDamage, this.agent);
  }

  public update(dt: number) {
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt;
    }
    if (this.isSwinging) {
      this.swingProgress += dt * 8;
      if (this.swingProgress >= 1) {
        this.stopSwinging();
      }
    }
  }
}
