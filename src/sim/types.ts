import type { Agent } from "./Agent";
import type { TraitType } from "./traits";

export type RelType =
  | "Neutral"
  | "Friendly"
  | "Hostile"
  | "Annoyed"
  | "Loyal"
  | "Submissive"
  | "Fearful";

export type JobType =
  | "Citizen"
  | "Cop"
  | "Gangster_Crepe"
  | "Gangster_Blahd"
  | "Thief"
  | "Scientist"
  | "Soldier"
  | "Bouncer"
  | "Bartender"
  | "Doctor"
  | "Zombie"
  | "Gorilla"
  | "Assassin"
  | "Hacker"
  | "Supercop"
  | "Custom";

export const JobNames = {
  Citizen: "Горожанин",
  Cop: "Полицейский",
  Gangster_Crepe: "Бандит Крепов",
  Gangster_Blahd: "Бандит Блад",
  Thief: "Вор",
  Scientist: "Ученый",
  Soldier: "Солдат",
  Bouncer: "Вышибала",
  Bartender: "Бармен",
  Doctor: "Доктор",
  Zombie: "Зомби",
  Gorilla: "Горилла",
  Assassin: "Ассасин",
  Hacker: "Хакер",
  Supercop: "Супер коп",
  Custom: "Пользователь",
} as const satisfies Record<JobType, string>;

export type TileType =
  | "Floor"
  | "Wall"
  | "Door"
  | "Glass"
  | "Crate"
  | "Barrel"
  | "ATM"
  | "Vent"
  | "FireHazard"
  | "Water";

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  walkable: boolean;
  transparent: boolean;
  health?: number;
  maxHealth?: number;
  isOpen?: boolean; // For doors
  isLocked?: boolean;
  color?: string;
  metadata?: Record<string, unknown>;
}

export type GoalStatus = "Inactive" | "Active" | "Completed" | "Failed";

export type GoalTypeName =
  | "GoalIdle"
  | "GoalWander"
  | "GoalPatrol"
  | "GoalMoveTo"
  | "GoalBattle"
  | "GoalFlee"
  | "GoalInvestigate"
  | "GoalNoiseReact"
  | "GoalTattle"
  | "GoalInteract"
  | "GoalSteal"
  | "GoalBite"
  | "GoalExtinguishFire";

export interface TraitDef {
  name: string;
  displayName: string;
  description: string;
  category: "positive" | "negative" | "special";
  statMods?: {
    maxHealthMult?: number;
    speedMult?: number;
    meleeDamageMult?: number;
    bulletDamageMult?: number;
    visionRangeMult?: number;
    hateMultiplier?: number;
  };
  onAdd?: (agent: Agent) => void;
  onRemove?: (agent: Agent) => void;
  onTick?: (agent: Agent, dt: number) => void;
  onTakeDamage?: (agent: Agent, damage: number, attacker: Agent) => number;
  onDealDamage?: (agent: Agent, damage: number, victim: Agent) => number;
  onHearNoise?: (agent: Agent, noise: NoiseEvent) => boolean;
}

export interface ItemDef {
  id: string;
  name: string;
  type: "melee" | "gun" | "consumable" | "tool" | "explosive";
  damage?: number;
  range?: number;
  attackSpeed?: number; // attacks per second
  ammo?: number;
  maxAmmo?: number;
  bulletSpeed?: number;
  spread?: number;
  bulletCount?: number;
  soundName?: string;
  description: string;
  icon: string;
  healAmount?: number;
  effectTrait?: TraitType;
}

export interface InvItem {
  uid: string;
  defId: string;
  count: number;
  ammo?: number;
}

export interface NoiseEvent {
  id: string;
  x: number;
  y: number;
  radius: number;
  volume: number; // 0..1
  sourceAgentId?: string;
  noiseType:
    | "gunshot"
    | "footstep"
    | "shout"
    | "explosion"
    | "smash"
    | "alarm"
    | "scream";
  timestamp: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  sourceAgentId: string;
  lifetime: number;
  rangeLeft: number;
  isExplosive?: boolean;
  color?: string;
  radius: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: "spark" | "blood" | "smoke" | "fire" | "teleport" | "possession";
}

export interface SpeechBubble {
  text: string;
  duration: number;
  maxDuration: number;
  color?: string;
  isYell?: boolean;
}

export interface RelationshipState {
  targetAgentId: string;
  relType: RelType;
  initialRelType: RelType;
  relBeforeRage?: RelType;
  hate: number; // 0..100+ (over 30 -> Annoyed, over 60 -> Hostile)
  strikes: number;
  lastSawPos?: { x: number; y: number };
  lastSawTime?: number;
  hasLOS: boolean;
  distance: number;
  annoyedCountdown: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: "combat" | "ai" | "possession" | "system" | "crime" | "speech";
  agentId?: string;
  agentName?: string;
}

export interface AgentMemory {
  key: string;
  val: any;
  expiresAt: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface MousePos {
  x: number;
  y: number;
  worldX: number;
  worldY: number;
}
