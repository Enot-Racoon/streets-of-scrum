import type { World } from "./World";
import { Agent } from "./Agent";
import type { JobType } from "./types";
import type { TraitType } from "./traits";
import rand from "../utils/rand";

export interface ArchetypeDef {
  name: string;
  job: JobType;
  avatarIcon: string;
  color: string;
  health: number;
  traits: TraitType[];
  startingItems: string[];
  description: string;
}

export const ARCHETYPES = {
  Cop: {
    name: "Обычный полицейский",
    job: "Cop",
    avatarIcon: "👮",
    color: "#3b82f6",
    health: 120,
    traits: ["Cop", "Bulletproof", "Aggressive"],
    startingItems: ["pistol", "bat", "medkit"],
    description:
      "Обычный полицейский, который расследует преступления, вызывая подкрепление.",
  },
  Supercop: {
    name: "Тактический спецназовец",
    job: "Supercop",
    avatarIcon: "🛡️",
    color: "#1d4ed8",
    health: 180,
    traits: ["Cop", "Bulletproof", "Strength", "Fast"],
    startingItems: ["shotgun", "machinegun", "grenade"],
    description:
      "Тяжело бронированный правоохранитель с подавляющей огневой мощью.",
  },
  Gangster_Crepe: {
    name: "Член банды Крепов",
    job: "Gangster_Crepe",
    avatarIcon: "🔴",
    color: "#ef4444",
    health: 100,
    traits: ["Aggressive", "Strength"],
    startingItems: ["bat", "pistol", "beer"],
    description: "Верный цветам Crepe, смертельный враг банды Бладов.",
  },
  Gangster_Blahd: {
    name: "Член банды Бладов",
    job: "Gangster_Blahd",
    avatarIcon: "🔵",
    color: "#06b6d4",
    health: 100,
    traits: ["Aggressive", "SharpShooter"],
    startingItems: ["knife", "revolver", "beer"],
    description:
      "Контролирует переулки Южного округа, атакует Крепов при встрече.",
  },
  Thief: {
    name: "Вор",
    job: "Thief",
    avatarIcon: "🥷",
    color: "#8b5cf6",
    health: 80,
    traits: ["Thief", "Fast", "Invisible", "Coward"],
    startingItems: ["knife", "lockpick", "medkit"],
    description:
      "Тихий диверсант, который незаметно взламывает замки и грабит ящики.",
  },
  Scientist: {
    name: "Ученый",
    job: "Scientist",
    avatarIcon: "👨‍🔬",
    color: "#10b981",
    health: 75,
    traits: ["Coward", "Regenerate"],
    startingItems: ["fists", "medkit"],
    description: "Хрупкий лаборант, который легко паникует и зовет охрану.",
  },
  Soldier: {
    name: "Спецназовец",
    job: "Soldier",
    avatarIcon: "🪖",
    color: "#84cc16",
    health: 140,
    traits: ["SharpShooter", "Strength", "Bulletproof"],
    startingItems: ["machinegun", "knife", "grenade"],
    description:
      "Дисциплинированный специалист по ведению боя с высокой точностью.",
  },
  Bouncer: {
    name: "Вышибала",
    job: "Bouncer",
    avatarIcon: "🥊",
    color: "#f59e0b",
    health: 150,
    traits: ["Strength", "MartialArtist", "Aggressive"],
    startingItems: ["sledgehammer", "beer"],
    description: "Охраняет входы и вышвыривает нарушителей.",
  },
  Bartender: {
    name: "Бармен",
    job: "Bartender",
    avatarIcon: "🍸",
    color: "#ec4899",
    health: 90,
    traits: ["AboveTheLaw", "Medic"],
    startingItems: ["shotgun", "beer", "medkit"],
    description: "Подает напитки и защищает барную стойку из дробовика.",
  },
  Zombie: {
    name: "Зараженный зомби",
    job: "Zombie",
    avatarIcon: "🧟",
    color: "#22c55e",
    health: 90,
    traits: ["Zombified", "Aggressive", "Strength"],
    startingItems: ["zombie_claws"],
    description:
      "Неутомимый мертвец, который кусает и превращает жертв в зомби.",
  },
  Gorilla: {
    name: "Сбежавшая горилла",
    job: "Gorilla",
    avatarIcon: "🦍",
    color: "#78350f",
    health: 220,
    traits: ["Strength", "Bloodlust", "Aggressive"],
    startingItems: ["fists"],
    description: "Неудержимый зверь, презирающий ученых и крушащий стены.",
  },
  Assassin: {
    name: "Ассасин",
    job: "Assassin",
    avatarIcon: "🗡️",
    color: "#475569",
    health: 100,
    traits: ["Invisible", "Fast", "GlassCannon", "Bloodlust"],
    startingItems: ["knife", "revolver"],
    description:
      "Высокоскоростной нападающий с высоким импульсом, который движется незаметно.",
  },
  Citizen: {
    name: "Горожанин",
    job: "Citizen",
    avatarIcon: "🚶",
    color: "#94a3b8",
    health: 80,
    traits: ["Coward"],
    startingItems: ["fists", "beer"],
    description:
      "Живет своей жизнью, доносит на полицию, если на него нападают.",
  },
} as const satisfies Record<string, ArchetypeDef>;

export type ArchetypeName = keyof typeof ARCHETYPES;

export function spawnArchetype(
  key: ArchetypeName,
  x: number,
  y: number,
  customName?: string,
): Agent {
  const def = ARCHETYPES[key];
  return new Agent({
    name: customName || def.name,
    job: def.job,
    x,
    y,
    health: def.health,
    maxHealth: def.health,
    color: def.color,
    avatarIcon: def.avatarIcon,
    traits: [...def.traits],
    startingItems: [...def.startingItems],
  });
}

export const Scenarios = {
  district: "Даунтаун",
  gangwar: "Война банд",
  zombie: "Лаборатория зомби",
  bar: "Бар",
  sandbox: "Песочница",
} as const satisfies Record<string, string>;

export type ScenarioName =
  | "district"
  | "gangwar"
  | "zombie"
  | "bar"
  | "sandbox";

export const buildScenario = (scenario: ScenarioName, world: World) => {
  world.agents = [];
  world.projectiles = [];
  world.particles = [];
  world.noiseEvents = [];
  world.droppedItems = [];
  world.logs = [];
  world.possessedAgent = null;

  if (scenario === "district") {
    buildDistrictMap(world);
  } else if (scenario === "gangwar") {
    buildGangWarScenario(world);
  } else if (scenario === "zombie") {
    buildZombieOutbreakScenario(world);
  } else if (scenario === "bar") {
    buildBarCasinoScenario(world);
  } else if (scenario === "sandbox") {
    buildSandboxScenario(world);
  }
};

export function buildDistrictMap(world: World) {
  world.initEmptyGrid();

  // Outer border & Rooms
  // Room 1: Police Station (Top Left 1..7, 1..7)
  for (let x = 1; x <= 7; x++) {
    for (let y = 1; y <= 7; y++) {
      if (x === 7 || y === 7) {
        world.setTile(x, y, "Wall");
      }
    }
  }
  world.setTile(7, 4, "Door", { isOpen: false });
  world.setTile(4, 7, "Door", { isOpen: false });
  world.setTile(2, 2, "ATM");
  world.setTile(3, 2, "Crate");

  // Room 2: Lab / Containment (Top Right 16..22, 1..7)
  for (let x = 16; x <= 22; x++) {
    for (let y = 1; y <= 7; y++) {
      if (x === 16 || y === 7) {
        world.setTile(x, y, "Wall");
      }
    }
  }
  world.setTile(16, 4, "Door", { isOpen: false });
  world.setTile(19, 7, "Glass");
  world.setTile(20, 7, "Glass");
  world.setTile(21, 2, "Crate");
  world.setTile(18, 2, "Barrel");

  // Room 3: Crepe Turf / Bar (Bottom Left 1..7, 12..18)
  for (let x = 1; x <= 7; x++) {
    for (let y = 12; y <= 18; y++) {
      if (x === 7 || y === 12) {
        world.setTile(x, y, "Wall");
      }
    }
  }
  world.setTile(7, 15, "Door", { isOpen: false });
  world.setTile(4, 12, "Door", { isOpen: false });
  world.setTile(2, 17, "Barrel");
  world.setTile(3, 17, "Crate");
  world.setTile(5, 17, "ATM");

  // Room 4: Blahd Hideout (Bottom Right 16..22, 12..18)
  for (let x = 16; x <= 22; x++) {
    for (let y = 12; y <= 18; y++) {
      if (x === 16 || y === 12) {
        world.setTile(x, y, "Wall");
      }
    }
  }
  world.setTile(16, 15, "Door", { isOpen: false });
  world.setTile(19, 12, "Door", { isOpen: false });
  world.setTile(21, 17, "Barrel");
  world.setTile(20, 17, "Crate");

  // Center Plaza with Fountain / Barrels & Crates
  world.setTile(11, 9, "Crate");
  world.setTile(12, 9, "Crate");
  world.setTile(11, 10, "Barrel");
  world.setTile(12, 10, "Barrel");

  // Spawn District Agents
  // Cops in precinct
  world.addAgent(spawnArchetype("Cop", 4, 4, "Офицер Девис"));
  world.addAgent(spawnArchetype("Cop", 5, 5, "Офицер Миллер"));

  // Scientists in lab
  world.addAgent(spawnArchetype("Scientist", 19, 4, "Доктор Арис"));
  world.addAgent(spawnArchetype("Scientist", 20, 4, "Доктор Чен"));

  // Crepe Gangsters in southwest turf
  world.addAgent(spawnArchetype("Gangster_Crepe", 4, 14, "Красный Змей"));
  world.addAgent(spawnArchetype("Gangster_Crepe", 3, 16, "Красный Бык"));

  // Blahd Gangsters in southeast turf
  world.addAgent(spawnArchetype("Gangster_Blahd", 19, 14, "Синяя Гадюка"));
  world.addAgent(spawnArchetype("Gangster_Blahd", 20, 16, "Синий туз"));

  // Plaza Wanderers
  world.addAgent(spawnArchetype("Citizen", 10, 5, "Фрэнк (горожанин)"));
  world.addAgent(spawnArchetype("Citizen", 13, 14, "Сара (горожанка)"));
  world.addAgent(spawnArchetype("Thief", 11, 15, "Слай Купер (вор)"));
  world.addAgent(spawnArchetype("Bouncer", 15, 9, "Бруно (вышибала)"));
}

export function buildGangWarScenario(world: World) {
  world.initEmptyGrid();

  // Alley barriers
  for (let y = 1; y < 19; y++) {
    if (y !== 9 && y !== 10) {
      world.setTile(12, y, "Wall");
    }
  }
  world.setTile(12, 9, "Door", { isOpen: true });
  world.setTile(12, 10, "Door", { isOpen: true });

  // Barrels and barricades
  world.setTile(8, 9, "Barrel");
  world.setTile(8, 10, "Barrel");
  world.setTile(16, 9, "Barrel");
  world.setTile(16, 10, "Barrel");
  world.setTile(6, 4, "Crate");
  world.setTile(18, 4, "Crate");

  // Spawn Crepes
  world.addAgent(spawnArchetype("Gangster_Crepe", 4, 5, "Красный Крепыш"));
  world.addAgent(spawnArchetype("Gangster_Crepe", 5, 8, "Красный Стрелок"));
  world.addAgent(spawnArchetype("Gangster_Crepe", 4, 12, "Красный Бугай"));
  world.addAgent(spawnArchetype("Gangster_Crepe", 3, 15, "Красный Лидер"));

  // Spawn Blahds
  world.addAgent(spawnArchetype("Gangster_Blahd", 19, 5, "Синий Крепыш"));
  world.addAgent(spawnArchetype("Gangster_Blahd", 18, 8, "Синий Стрелок"));
  world.addAgent(spawnArchetype("Gangster_Blahd", 19, 12, "Синий Бугай"));
  world.addAgent(spawnArchetype("Gangster_Blahd", 20, 15, "Синий Лидер"));

  // Police squad ready to intervene
  world.addAgent(spawnArchetype("Supercop", 11, 2, "SWAT Commander"));
  world.addAgent(spawnArchetype("Cop", 13, 2, "SWAT Rookie"));
}

export function buildZombieOutbreakScenario(world: World) {
  world.initEmptyGrid();

  // Central Quarantine Cage
  for (let x = 9; x <= 14; x++) {
    for (let y = 7; y <= 12; y++) {
      if (x === 9 || x === 14 || y === 7 || y === 12) {
        world.setTile(x, y, "Glass");
      }
    }
  }
  world.setTile(11, 12, "Door", { isOpen: false });
  world.setTile(12, 12, "Door", { isOpen: false });

  // Explosive barrels around containment
  world.setTile(8, 12, "Barrel");
  world.setTile(15, 12, "Barrel");
  world.setTile(11, 6, "Barrel");

  // Inside cage: Alpha Zombie & Gorilla
  world.addAgent(spawnArchetype("Zombie", 11, 9, "Нулевой Пациент"));
  world.addAgent(spawnArchetype("Zombie", 12, 10, "Пациент №2"));
  world.addAgent(spawnArchetype("Gorilla", 11, 10, "Гора (Эксперимент #4)"));

  // Scientists & Guards outside
  world.addAgent(spawnArchetype("Scientist", 6, 9, "Главный Исследователь"));
  world.addAgent(spawnArchetype("Scientist", 17, 9, "Вирусолог"));
  world.addAgent(spawnArchetype("Soldier", 5, 4, "Карантинный Офицер"));
  world.addAgent(spawnArchetype("Soldier", 18, 4, "Отряд Опасных Материалов"));
  world.addAgent(spawnArchetype("Cop", 12, 16, "Городская Полиция"));
  world.addAgent(spawnArchetype("Citizen", 4, 16, "Потерянный Гражданин"));
}

export function buildBarCasinoScenario(world: World) {
  world.initEmptyGrid();

  // Bar Counter (L-shape)
  for (let x = 4; x <= 12; x++) {
    world.setTile(x, 6, "Crate");
  }
  world.setTile(4, 7, "Crate");
  world.setTile(4, 8, "Crate");

  // ATMs & Crates
  world.setTile(2, 2, "ATM");
  world.setTile(3, 2, "ATM");
  world.setTile(21, 2, "Barrel");
  world.setTile(21, 17, "Barrel");

  // Agents
  world.addAgent(spawnArchetype("Bartender", 8, 4, "Мак (Бармен)"));
  world.addAgent(spawnArchetype("Bouncer", 12, 14, "Гризли (Вышибала)"));
  world.addAgent(spawnArchetype("Bouncer", 4, 14, "Танк (Вышибала)"));

  const drunk1 = spawnArchetype("Citizen", 8, 9, "Пьяный Пит");
  drunk1.addTrait("Drunk");
  world.addAgent(drunk1);

  const drunk2 = spawnArchetype("Citizen", 10, 10, "Пьяный Вальтер");
  drunk2.addTrait("Drunk");
  world.addAgent(drunk2);

  world.addAgent(spawnArchetype("Assassin", 19, 14, "Загадочный Незнакомец"));
  world.addAgent(spawnArchetype("Thief", 3, 4, "Карманный Воришка"));
  world.addAgent(spawnArchetype("Cop", 12, 2, "Патрульный Полицейский"));
}

export function buildSandboxScenario(world: World) {
  world.initEmptyGrid();

  for (let x = 4; x <= 12; x++) {
    world.setTile(x, 6, "Barrel");
  }
  world
    .setTile(4, 7, "Barrel")
    .setTile(4, 8, "Barrel")
    .setTile(2, 2, "Barrel")
    .setTile(3, 2, "Barrel")
    .setTile(21, 2, "Barrel")
    .setTile(21, 17, "Barrel");

  const g1 = spawnArchetype(
    //
    "Gorilla",
    5.5,
    7.5,
    "God Gorilla Bob",
  ).addTrait("God");

  const g2 = spawnArchetype(
    "Gorilla",
    Math.floor(rand(8, 16)) + 0.5,
    Math.floor(rand(8, 18)) + 0.5,
    "God Gorilla Jack",
  ).addTrait("God");

  world.addAgent(
    g1.setRelationship(g2.id, "Hostile", 90),
    g2.setRelationship(g1.id, "Hostile", 90),
  );
}
