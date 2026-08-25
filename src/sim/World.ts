import { Agent } from "./Agent";
import {
  Tile,
  TileType,
  NoiseEvent,
  Projectile,
  Particle,
  LogEntry,
  InvItem,
} from "./types";
import { Pathfinding } from "./pathfinding";
import { sounds } from "./sound";
import { ITEM_REGISTRY } from "./Items";

export interface DroppedItem {
  id: string;
  defId: string;
  count: number;
  x: number;
  y: number;
}

let noiseIdCounter = 1;
let projectileIdCounter = 1;
let logIdCounter = 1;
let droppedItemIdCounter = 1;

export class World {
  public width: number;
  public height: number;
  public grid: Tile[][];
  public agents: Agent[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public noiseEvents: NoiseEvent[] = [];
  public droppedItems: DroppedItem[] = [];
  public logs: LogEntry[] = [];
  public simSpeed: number = 1.0;
  public isPaused: boolean = false;
  public possessedAgent: Agent | null = null;
  public selectedAgent: Agent | null = null;

  constructor(width: number = 24, height: number = 20) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.initEmptyGrid();
  }

  public initEmptyGrid() {
    this.grid = [];
    for (let x = 0; x < this.width; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.height; y++) {
        const isBorder =
          x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
        this.grid[x][y] = {
          x,
          y,
          type: isBorder ? "Wall" : "Floor",
          walkable: !isBorder,
          transparent: !isBorder,
        };
      }
    }
  }

  public setTile(
    x: number,
    y: number,
    type: TileType,
    options?: Partial<Tile>,
  ) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

    let walkable = true;
    let transparent = true;
    let health = 100;

    if (type === "Wall") {
      walkable = false;
      transparent = false;
      health = 500;
    } else if (type === "Door") {
      walkable = options?.isOpen || false;
      transparent = options?.isOpen || false;
      health = 60;
    } else if (type === "Glass") {
      walkable = false;
      transparent = true;
      health = 25;
    } else if (type === "Crate") {
      walkable = false;
      transparent = true;
      health = 35;
    } else if (type === "Barrel") {
      walkable = false;
      transparent = true;
      health = 20;
    } else if (type === "ATM") {
      walkable = false;
      transparent = true;
      health = 200;
    }

    this.grid[x][y] = {
      x,
      y,
      type,
      walkable,
      transparent,
      health,
      maxHealth: health,
      isOpen: options?.isOpen,
      ...options,
    };
  }

  public getTile(x: number, y: number): Tile | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.grid[x][y];
  }

  public isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.walkable : false;
  }

  public canMoveToCircle(
    x: number,
    y: number,
    radius: number,
    canOpenDoors: boolean = true,
  ): boolean {
    const minX = Math.floor(x - radius);
    const maxX = Math.floor(x + radius);
    const minY = Math.floor(y - radius);
    const maxY = Math.floor(y + radius);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const tile = this.getTile(cx, cy);
        if (!tile) return false;

        const isDoor = tile.type === "Door";
        if (!tile.walkable && !(canOpenDoors && isDoor && tile.isOpen)) {
          // Circle vs AABB collision
          const closestX = Math.max(cx, Math.min(x, cx + 1));
          const closestY = Math.max(cy, Math.min(y, cy + 1));
          const distSq = (x - closestX) ** 2 + (y - closestY) ** 2;
          if (distSq < radius * radius) {
            return false;
          }
        }
      }
    }
    return true;
  }

  public hasLineOfSight(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): boolean {
    return Pathfinding.hasLineOfSight(x1, y1, x2, y2, this.grid, true);
  }

  public addAgent(agent: Agent) {
    agent.setWorld(this);
    this.agents.push(agent);
    if (!this.selectedAgent) {
      this.selectedAgent = agent;
    }
  }

  public removeAgent({ id }: Pick<Agent, "id">) {
    const idx = this.agents.findIndex((a) => a.id === id);
    if (idx !== -1) {
      if (this.possessedAgent?.id === id) {
        this.possessedAgent = null;
      }
      if (this.selectedAgent?.id === id) {
        this.selectedAgent = this.agents[0] || null;
      }
      this.agents.splice(idx, 1);
    }
  }

  public selectNextAgent() {
    if (!this.selectedAgent) return;
    const idx = this.agents.findIndex((a) => a.id === this.selectedAgent.id);
    if (idx !== -1) {
      this.selectedAgent = this.agents[(idx + 1) % this.agents.length];
    }
  }

  public possessNextAgent() {
    if (!this.possessedAgent) return;
    const idx = this.agents.findIndex((a) => a.id === this.possessedAgent.id);
    if (idx !== -1) {
      const nextAgent = this.agents[(idx + 1) % this.agents.length];
      if (nextAgent && nextAgent !== this.selectedAgent) {
        this.unpossessCurrent();
        this.possessAgent(nextAgent);
      }
    }
  }

  public getAgentById(id: string): Agent | null {
    return this.agents.find((a) => a.id === id) || null;
  }

  public possessAgent(agent: Agent) {
    if (this.possessedAgent) {
      this.possessedAgent.unpossess();
    }
    this.possessedAgent = agent;
    this.selectedAgent = agent;
    agent.possess();
  }

  public unpossessCurrent() {
    if (this.possessedAgent) {
      this.possessedAgent.unpossess();
      this.possessedAgent = null;
    }
  }

  public emitNoise(event: Omit<NoiseEvent, "id" | "timestamp">) {
    const noise: NoiseEvent = {
      ...event,
      id: `noise_${noiseIdCounter++}`,
      timestamp: Date.now(),
    };
    this.noiseEvents.push(noise);

    // Keep noise events bounded
    if (this.noiseEvents.length > 20) {
      this.noiseEvents.shift();
    }
  }

  public getRecentNoiseNear(
    x: number,
    y: number,
    radius: number,
  ): NoiseEvent | null {
    const now = Date.now();
    for (let i = this.noiseEvents.length - 1; i >= 0; i--) {
      const n = this.noiseEvents[i];
      if (now - n.timestamp < 1500) {
        const dist = Math.hypot(n.x - x, n.y - y);
        if (dist <= radius + n.radius) {
          return n;
        }
      }
    }
    return null;
  }

  public spawnProjectile(proj: Omit<Projectile, "id">) {
    this.projectiles.push({
      ...proj,
      id: `proj_${projectileIdCounter++}`,
    });
  }

  public spawnParticles(options: {
    x: number;
    y: number;
    count: number;
    type: Particle["type"];
    color: string;
  }) {
    for (let i = 0; i < options.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3.5;
      this.particles.push({
        x: options.x,
        y: options.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.4,
        maxLife: 0.7,
        color: options.color,
        size: 2 + Math.random() * 4,
        type: options.type,
      });
    }
  }

  public spawnDroppedItem(
    x: number,
    y: number,
    defId: string,
    count: number = 1,
  ) {
    this.droppedItems.push({
      id: `drop_${droppedItemIdCounter++}`,
      defId,
      count,
      x: x + (Math.random() - 0.5) * 0.5,
      y: y + (Math.random() - 0.5) * 0.5,
    });
  }

  public damageTile(
    tx: number,
    ty: number,
    damage: number,
    sourceAgent?: Agent,
  ) {
    const tile = this.getTile(tx, ty);
    if (!tile) return;

    if (tile.type === "Barrel") {
      // Clear tile before calling explode to prevent infinite recursive explosions
      this.setTile(tx, ty, "Floor");
      this.explode(tx + 0.5, ty + 0.5, 3.5, 75, sourceAgent);
      return;
    }

    if (tile.health !== undefined) {
      tile.health -= damage;
      this.spawnParticles({
        x: tx + 0.5,
        y: ty + 0.5,
        count: 4,
        type: "spark",
        color: "#94a3b8",
      });

      if (tile.health <= 0) {
        if (tile.type === "Crate") {
          // Drop random loot
          const drops = [
            "medkit",
            "beer",
            "pistol",
            "shotgun",
            "grenade",
            "knife",
          ];
          const randomItem = drops[Math.floor(Math.random() * drops.length)];
          this.spawnDroppedItem(tx + 0.5, ty + 0.5, randomItem, 1);
        }
        this.setTile(tx, ty, "Floor");
      }
    }
  }

  public explode(
    x: number,
    y: number,
    radius: number,
    damage: number,
    sourceAgent?: Agent,
  ) {
    sounds.playExplosion();
    this.emitNoise({
      x,
      y,
      radius: 16,
      volume: 1.0,
      sourceAgentId: sourceAgent?.id,
      noiseType: "explosion",
    });

    this.spawnParticles({
      x,
      y,
      count: 35,
      type: "fire",
      color: "#f97316",
    });

    // Damage all agents in radius
    for (const agent of this.agents) {
      if (agent.isDead) continue;
      const dist = Math.hypot(agent.x - x, agent.y - y);
      if (dist <= radius) {
        const falloff = 1 - dist / radius;
        const dealt = damage * falloff;
        // Knockback
        const kbAngle = Math.atan2(agent.y - y, agent.x - x);
        agent.movement.vx += Math.cos(kbAngle) * 8.0 * falloff;
        agent.movement.vy += Math.sin(kbAngle) * 8.0 * falloff;
        agent.takeDamage(dealt, sourceAgent);
      }
    }

    // Damage nearby tiles and ignite
    const minX = Math.floor(x - radius);
    const maxX = Math.ceil(x + radius);
    const minY = Math.floor(y - radius);
    const maxY = Math.ceil(y + radius);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const d = Math.hypot(cx + 0.5 - x, cy + 0.5 - y);
        if (d <= radius) {
          const tile = this.getTile(cx, cy);
          if (
            tile &&
            (tile.type === "Barrel" ||
              tile.type === "Crate" ||
              tile.type === "Door" ||
              tile.type === "Glass")
          ) {
            this.damageTile(cx, cy, damage, sourceAgent);
          }
        }
      }
    }
  }

  public transformToZombie(agent: Agent) {
    agent.isDead = false;
    agent.health = 80;
    agent.maxHealth = 80;
    agent.job = "Zombie";
    agent.name = `Zombie (${agent.name})`;
    agent.color = "#22c55e";
    agent.avatarIcon = "🧟";
    agent.statusEffects.addTrait("Zombified");
    agent.inventory.items = [];
    agent.inventory.addItem("zombie_claws");
    agent.say("МОЗЗЗГИ...", true);
    this.addLog({
      timestamp: Date.now(),
      message: `☣️ ${agent.name} transformed into an undead Zombie!`,
      type: "system",
      agentId: agent.id,
      agentName: agent.name,
    });
  }

  public notifyWitnessesOfAttack(victim: Agent, attacker: Agent) {
    for (const other of this.agents) {
      if (other.id === victim.id || other.id === attacker.id || other.isDead)
        continue;

      const dist = Math.hypot(other.x - victim.x, other.y - victim.y);
      if (dist <= other.getVisionRange()) {
        const seesVictim = this.hasLineOfSight(
          other.x,
          other.y,
          victim.x,
          victim.y,
        );
        if (seesVictim) {
          // Witness logic
          if (other.job === "Cop" || other.hasTrait("Cop")) {
            other.relationships.modifyHate(attacker.id, 70);
            other.relationships.setRelType(attacker.id, "Hostile");
            other.say("Именем закона! Стой!", true);
          } else if (other.relationships.getRelType(victim.id) === "Friendly") {
            // Defend ally
            other.relationships.modifyHate(attacker.id, 60);
            other.relationships.setRelType(attacker.id, "Hostile");
            other.say(`${victim.name} Отстань от меня!`, true);
          }
        }
      }
    }
  }

  public addLog(entry: Omit<LogEntry, "id">) {
    this.logs.unshift({
      ...entry,
      id: `log_${logIdCounter++}`,
    });
    if (this.logs.length > 50) {
      this.logs.pop();
    }
  }

  public update(rawDt: number) {
    if (this.isPaused) return;

    const dt = Math.min(0.1, rawDt) * this.simSpeed;

    // 1. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifetime -= dt;

      // Check wall collision
      const tx = Math.floor(p.x);
      const ty = Math.floor(p.y);
      const tile = this.getTile(tx, ty);

      if (!tile || !tile.walkable) {
        this.damageTile(tx, ty, p.damage);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check agent hits
      let hitAgent = false;
      for (const agent of this.agents) {
        if (agent.id === p.sourceAgentId || agent.isDead) continue;
        const dist = Math.hypot(agent.x - p.x, agent.y - p.y);
        if (dist <= (agent.radius || 0.35) + p.radius) {
          const shooter = this.getAgentById(p.sourceAgentId);
          agent.takeDamage(p.damage, shooter);
          this.spawnParticles({
            x: p.x,
            y: p.y,
            count: 5,
            type: "blood",
            color: "#dc2626",
          });
          hitAgent = true;
          break;
        }
      }

      if (hitAgent || p.lifetime <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Update Agents
    for (const agent of this.agents) {
      agent.update(dt, this);

      // Check pickup of dropped items
      for (let j = this.droppedItems.length - 1; j >= 0; j--) {
        const item = this.droppedItems[j];
        const dist = Math.hypot(agent.x - item.x, agent.y - item.y);
        if (dist <= 0.6) {
          agent.inventory.addItem(item.defId, item.count);
          sounds.playHeal();
          agent.say(`Поднял ${ITEM_REGISTRY[item.defId]?.name || "Предмет"}`);
          this.droppedItems.splice(j, 1);
        }
      }
    }
  }
}
