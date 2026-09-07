import type { Agent } from "../Agent";
import type { World } from "../World";

export class Movement {
  public agent: Agent;
  public vx: number = 0;
  public vy: number = 0;
  public ivx: number = 0;
  public ivy: number = 0;
  public baseSpeed: number = 3.2;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  public getSpeed(): number {
    let speed = this.baseSpeed;
    const speedMult = this.agent.getStatusModificator("speedMult") ?? 1.0;
    return speed * speedMult;
  }

  public moveInDirection(angle: number, speedRatio: number = 1.0): void {
    const spd = this.getSpeed() * speedRatio;
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
  }

  public moveTowards(
    targetX: number,
    targetY: number,
    speedRatio: number = 1.0,
  ): void {
    const dx = targetX - this.agent.x;
    const dy = targetY - this.agent.y;
    const angle = Math.atan2(dy, dx);
    this.agent.facingAngle = angle;
    this.moveInDirection(angle, speedRatio);
  }

  public applyImpulse(angle: number, power: number) {
    this.ivx += Math.cos(angle) * power;
    this.ivy += Math.sin(angle) * power;
  }

  public stop() {
    this.vx = 0;
    this.vy = 0;
  }

  public update(dt: number, world: World) {
    const svx = this.vx + this.ivx;
    const svy = this.vy + this.ivy;
    if (svx === 0 && svy === 0) return;

    const radius = this.agent.radius || 0.35;
    let nextX = this.agent.x + svx * dt;
    let nextY = this.agent.y + svy * dt;

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
    const friction = 0.8;
    this.vx *= friction;
    this.vy *= friction;
    this.ivx *= friction;
    this.ivy *= friction;
    if (Math.abs(this.vx) < 0.01) this.vx = 0;
    if (Math.abs(this.vy) < 0.01) this.vy = 0;
    if (Math.abs(this.ivx) < 0.01) this.ivx = 0;
    if (Math.abs(this.ivy) < 0.01) this.ivy = 0;
  }
}
