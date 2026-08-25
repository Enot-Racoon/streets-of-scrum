import type { Agent } from "../Agent";

export class Movement {
  public agent: Agent;
  public vx: number = 0;
  public vy: number = 0;
  public baseSpeed: number = 3.2;

  constructor(agent: any) {
    this.agent = agent;
  }

  public getSpeed(): number {
    let speed = this.baseSpeed;
    const speedMult = this.agent.statusEffects.getStatMod("speedMult") ?? 1.0;
    return speed * speedMult;
  }

  public moveInDirection(angle: number, dt: number, speedRatio: number = 1.0) {
    const spd = this.getSpeed() * speedRatio;
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
  }

  public moveTowards(
    targetX: number,
    targetY: number,
    dt: number,
    speedRatio: number = 1.0,
  ) {
    const dx = targetX - this.agent.x;
    const dy = targetY - this.agent.y;
    const angle = Math.atan2(dy, dx);
    this.agent.facingAngle = angle;
    this.moveInDirection(angle, dt, speedRatio);
  }

  public stop() {
    this.vx = 0;
    this.vy = 0;
  }

  public update(dt: number, world: any) {
    if (this.vx === 0 && this.vy === 0) return;

    const radius = this.agent.radius || 0.35;
    let nextX = this.agent.x + this.vx * dt;
    let nextY = this.agent.y + this.vy * dt;

    // Slide on X axis
    if (
      world.canMoveToCircle(
        nextX,
        this.agent.y,
        radius,
        this.agent.canOpenDoors,
      )
    ) {
      this.agent.x = nextX;
    } else {
      this.vx = 0;
    }

    // Slide on Y axis
    if (
      world.canMoveToCircle(
        this.agent.x,
        nextY,
        radius,
        this.agent.canOpenDoors,
      )
    ) {
      this.agent.y = nextY;
    } else {
      this.vy = 0;
    }

    // Friction
    this.vx *= 0.8;
    this.vy *= 0.8;
    if (Math.abs(this.vx) < 0.01) this.vx = 0;
    if (Math.abs(this.vy) < 0.01) this.vy = 0;
  }
}
