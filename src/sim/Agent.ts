import { Brain } from "./Brain";
import { BrainUpdate } from "./BrainUpdate";
import { Relationships } from "./Relationships";
import { StatusEffects } from "./components/StatusEffects";
import { InvDatabase } from "./components/InvDatabase";
import { Movement } from "./components/Movement";
import { Combat } from "./components/Combat";
import { PathfindingAI } from "./components/PathfindingAI";
import { GoalWander, GoalBattle, GoalFlee, GoalIdle } from "./goals/GoalTypes";
import type { AgentMemory, JobType, SpeechBubble } from "./types";
import { getTraitDef, type TraitType } from "./traits";
import { sounds } from "./sound";
import type { World } from "./World";
import type { Goal } from "./goals/Goal";

let agentIdCounter = 1;

export class Agent {
  public id: string;
  public name: string;
  public job: JobType;
  public x: number;
  public y: number;
  public radius: number = 0.38;
  public facingAngle: number = 0;
  public health: number = 100;
  public maxHealth: number = 100;
  public isDead: boolean = false;
  public deadTime: number | null = null;
  public killedBy: Agent | null = null;
  public kills: number = 0;
  public isPlayerControlled: boolean = false;
  public canOpenDoors: boolean = true;
  public color: string = "#60a5fa";
  public avatarIcon: string = "👤";
  public speechBubble: SpeechBubble | null = null;
  public world: World = null;

  // Components (SoS Architecture)
  public brain: Brain;
  public brainUpdate: BrainUpdate;
  public relationships: Relationships;
  public statusEffects: StatusEffects;
  public inventory: InvDatabase;
  public movement: Movement;
  public combat: Combat;
  public pathfindingAI: PathfindingAI;

  // Brain facade
  get lastThought(): string {
    return this.brain.lastThought;
  }

  get goalStack(): Goal[] {
    return this.brain.goalStack;
  }

  get isSuspended(): boolean {
    return this.brain.isSuspended;
  }

  pushGoal(goal: Goal): this {
    this.brain.pushGoal(goal);
    return this;
  }

  popGoal(): Goal | null {
    return this.brain.popGoal();
  }

  getTopGoal(): Goal | null {
    return this.brain.getTopGoal();
  }

  clearAllGoals(): this {
    this.brain.clearAllGoals();
    return this;
  }

  getMemory(key: string): AgentMemory | null {
    return this.brain.getMemory(key);
  }

  setMemory(key: string, val: any, durationMs: number = 10000): this {
    this.brain.setMemory(key, val, durationMs);
    return this;
  }

  // Combat facade
  get isSwinging(): boolean {
    return this.combat.isSwinging;
  }

  get swiningHand(): "left" | "right" {
    return this.combat.swiningHand;
  }

  get swingProgress(): number {
    return this.combat.swingProgress;
  }

  attack(targetX?: number, targetY?: number): boolean {
    return this.combat.attack(targetX, targetY);
  }

  dash(targetX?: number, targetY?: number): boolean {
    return this.combat.dash(targetX, targetY);
  }

  // Main object definitions
  constructor(options: {
    id?: string;
    name: string;
    job: JobType;
    x: number;
    y: number;
    health?: number;
    maxHealth?: number;
    color?: string;
    avatarIcon?: string;
    traits?: TraitType[];
    startingItems?: string[];
  }) {
    this.id = options.id || `agent_${agentIdCounter++}`;
    this.name = options.name;
    this.job = options.job;
    this.x = options.x;
    this.y = options.y;
    this.health = options.health || 100;
    this.maxHealth = options.maxHealth || 100;
    this.color = options.color || "#60a5fa";
    this.avatarIcon = options.avatarIcon || "👤";

    // Initialize components
    this.brain = new Brain(this);
    this.brainUpdate = new BrainUpdate(this);
    this.relationships = new Relationships(this);
    this.statusEffects = new StatusEffects(this);
    this.inventory = new InvDatabase(this);
    this.movement = new Movement(this);
    this.combat = new Combat(this);
    this.pathfindingAI = new PathfindingAI(this);

    // Add starting traits
    if (options.traits) {
      for (const t of options.traits) {
        this.statusEffects.addTrait(t);
      }
    }

    // Add starting items
    if (options.startingItems) {
      for (const it of options.startingItems) {
        this.inventory.addItem(it);
      }
    } else {
      this.inventory.addItem("fists");
    }

    // Apply max health multiplier trait if any
    const hpMult = this.statusEffects.getStatMod("maxHealthMult") || 1.0;
    this.maxHealth = Math.round(this.maxHealth * hpMult);
    this.health = this.maxHealth;
  }

  public setWorld(world: World) {
    this.world = world;
  }

  public initDefaultGoal() {
    if (this.isDead || this.isPlayerControlled) return;
    if (this.job === "Zombie") {
      this.brain.pushGoal(new GoalWander(this, 8));
    } else if (this.job === "Bouncer" || this.job === "Bartender") {
      this.brain.pushGoal(new GoalIdle(this, 5.0));
    } else {
      this.brain.pushGoal(new GoalWander(this, 5));
    }
  }

  public addTrait(traitName: TraitType): this {
    this.statusEffects.addTrait(traitName);
    return this;
  }

  public removeTrait(traitName: TraitType) {
    this.statusEffects.removeTrait(traitName);
  }

  public hasTrait(traitName: TraitType): boolean {
    return this.statusEffects.hasTrait(traitName);
  }

  public getVisionRange(): number {
    const base = 9.0;
    const mult = this.statusEffects.getStatMod("visionRangeMult") || 1.0;
    return base * mult;
  }

  public getHearingRadius(): number {
    return 10.0;
  }

  public say(text: string, isYell: boolean = false) {
    if (this.isDead) return;

    const duration = isYell ? 3.5 : 2.5;
    this.speechBubble = {
      text,
      duration,
      maxDuration: duration,
      isYell,
      color: isYell ? "#ef7a44ff" : "#ffffff",
    };

    if (isYell && this.world) {
      this.world.emitNoise({
        x: this.x,
        y: this.y,
        radius: 3,
        volume: 0.3,
        sourceAgentId: this.id,
        noiseType: "shout",
      });
    }

    if (this.world) {
      this.world.addLog({
        timestamp: Date.now(),
        message: `${this.name}: "${text}"`,
        type: "speech",
        agentId: this.id,
        agentName: this.name,
      });
    }
  }

  public takeDamage(amount: number, attacker?: Agent) {
    if (this.isDead) return;

    let finalDamage = amount;

    // Apply trait mitigation hooks
    for (const tName of this.statusEffects.traitNames) {
      const def = getTraitDef(tName);
      if (def && def.onTakeDamage) {
        finalDamage = def.onTakeDamage(this, finalDamage, attacker);
      }
    }

    this.health = Math.max(0, this.health - finalDamage);

    if (this.world) {
      this.world.addLog({
        timestamp: Date.now(),
        message: `${this.name} получает ${finalDamage.toFixed(0)} урона${attacker ? ` от ${attacker.name}` : ""}! (HP: ${this.health.toFixed(0)}/${this.maxHealth})`,
        type: "combat",
        agentId: this.id,
        agentName: this.name,
      });
    }

    // Hate & combat reaction towards attacker
    if (attacker && attacker.id !== this.id) {
      this.relationships.modifyHate(attacker.id, 45);
      this.relationships.setRelType(attacker.id, "Hostile");

      if (!this.isPlayerControlled) {
        const isCoward = this.hasTrait("Coward") || this.hasTrait("Pacifist");
        if (
          isCoward ||
          (this.health / this.maxHealth < 0.3 && !this.hasTrait("Aggressive"))
        ) {
          this.brain.pushGoal(new GoalFlee(this, attacker, 6.0));
        } else {
          this.brain.pushGoal(new GoalBattle(this, attacker));
        }
      }

      // Alert nearby witness allies
      if (this.world) {
        this.world.notifyWitnessesOfAttack(this, attacker);
      }
    }

    if (this.health <= 0) {
      this.die(attacker);
    }
  }

  public die(killer?: Agent) {
    if (this.isDead) return;

    this.killedBy = killer;
    this.isDead = true;
    this.deadTime = Date.now();
    this.health = 0;

    this.say("Ааарргх...", true);

    if (this.world) {
      this.world.addLog({
        timestamp: Date.now(),
        message: `☠️ ${this.name} умер${killer ? ` от рук ${killer.name}` : ""}!`,
        type: "combat",
        agentId: this.id,
        agentName: this.name,
      });

      // Killer traits hook (e.g. Bloodlust, Zombie infection)
      if (killer) {
        if (killer.hasTrait("Bloodlust")) {
          killer.health = Math.min(killer.maxHealth, killer.health + 25);
          killer.say("Кровожадность удовлетворена! (+25 HP)");
        }
        if (killer.hasTrait("Zombified") && this.job !== "Zombie") {
          // Transform victim into zombie!
          this.world.transformToZombie(this);
        }
      }

      if (!this.isDead) return;

      // Drop loot on death
      for (const item of this.inventory.items) {
        this.world.spawnDroppedItem(this.x, this.y, item.defId, item.count);
      }

      if (this.isPlayerControlled) {
        this.world.unpossessCurrent();
      }

      if (!killer || killer.id === this.id) {
        this.kills--;
      } else {
        killer.kills++;
      }

      setTimeout(() => {
        this.world.removeAgent(this);
        this.world.addLog({
          timestamp: Date.now(),
          message: `${this.name} покинул нас...`,
          type: "combat",
          agentId: this.id,
          agentName: this.name,
        });
      }, 3_000);
    }

    this.brain.clearAllGoals();
  }

  public resurrect() {
    this.health = this.maxHealth;

    if (!this.isDead) {
      this.say("Полностью исцелён!");
      return;
    }

    this.killedBy = null;
    this.isDead = false;
    this.deadTime = 0;

    this.say("Я снова жив!", true);

    if (this.world) {
      this.world.addAgent(this);
      this.world.addLog({
        timestamp: Date.now(),
        message: `💀 ${this.name} ожил! `,
        type: "combat",
        agentId: this.id,
        agentName: this.name,
      });
    }
  }

  public interactAt(tileX: number, tileY: number) {
    if (!this.world) return;
    const tile = this.world.getTile(tileX, tileY);
    if (!tile) return;

    if (tile.type === "Door") {
      tile.isOpen = !tile.isOpen;
      tile.walkable = tile.isOpen;
      tile.transparent = tile.isOpen;
      sounds.playDoor();
      this.say(tile.isOpen ? "Opened door" : "Closed door");
    } else if (tile.type === "Crate") {
      // Open crate
      sounds.playPunch();
      this.world.damageTile(tileX, tileY, 999, this);
    } else if (tile.type === "ATM") {
      this.say("Взлом ATM... Получено $50!");
      sounds.playAlert();
    }
  }

  public interact() {
    const interactDist = 1.3;
    const tx = Math.floor(this.x + Math.cos(this.facingAngle) * interactDist);
    const ty = Math.floor(this.y + Math.sin(this.facingAngle) * interactDist);
    this.interactAt(tx, ty);
  }

  public possess() {
    this.isPlayerControlled = true;
    this.brain.suspend();
    sounds.playPossess();
    this.say("🌀 Душа овладела телом!", true);
    if (this.world) {
      this.world.spawnParticles({
        x: this.x,
        y: this.y,
        count: 20,
        type: "possession",
        color: "#a855f7",
      });
      this.world.addLog({
        timestamp: Date.now(),
        message: `🎮 Захватил тело ${this.name} (${this.job})`,
        type: "possession",
        agentId: this.id,
        agentName: this.name,
      });
    }
  }

  public unpossess() {
    this.isPlayerControlled = false;
    this.brain.resume();
    sounds.playUnpossess();
    this.say("Что только что произошло...?", false);
    if (this.world) {
      this.world.spawnParticles({
        x: this.x,
        y: this.y,
        count: 15,
        type: "possession",
        color: "#38bdf8",
      });
      this.world.addLog({
        timestamp: Date.now(),
        message: `👻 Управление ${this.name} освобождено. AI resumed.`,
        type: "possession",
        agentId: this.id,
        agentName: this.name,
      });
    }
  }

  public update(dt: number, world: World) {
    if (this.isDead) return;

    // Tick speech bubble
    if (this.speechBubble) {
      this.speechBubble.duration -= dt;
      if (this.speechBubble.duration <= 0) {
        this.speechBubble = null;
      }
    }

    // Tick components
    this.statusEffects.update(dt);
    this.combat.update(dt);
    this.relationships.update(dt, world);

    if (!this.isPlayerControlled) {
      this.brainUpdate.update(dt, world);
      this.brain.update(dt);
    }

    this.movement.update(dt, world);
  }
}
