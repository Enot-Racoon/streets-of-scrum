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
  city: "Большой город",
} as const satisfies Record<string, string>;

export type ScenarioName = keyof typeof Scenarios;

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
  } else if (scenario === "city") {
    buildLargeCityScenario(world);
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
  world.addAgent(
    spawnArchetype("Cop", 4.5, 4.5, "Офицер Девис"),
    spawnArchetype("Cop", 5.5, 5.5, "Офицер Миллер"),
  );

  // Scientists in lab
  world.addAgent(
    spawnArchetype("Scientist", 19.5, 4.5, "Доктор Арис"),
    spawnArchetype("Scientist", 20.5, 4.5, "Доктор Чен"),
  );

  // Crepe Gangsters in southwest turf
  world.addAgent(
    spawnArchetype("Gangster_Crepe", 4.5, 14.5, "Красный Змей"),
    spawnArchetype("Gangster_Crepe", 3.5, 16.5, "Красный Бык"),
  );

  // Blahd Gangsters in southeast turf
  world.addAgent(
    spawnArchetype("Gangster_Blahd", 19.5, 14.5, "Синяя Гадюка"),
    spawnArchetype("Gangster_Blahd", 20.5, 16.5, "Синий туз"),
  );

  // Plaza Wanderers
  world.addAgent(
    spawnArchetype("Citizen", 10.5, 5.5, "Фрэнк (горожанин)"),
    spawnArchetype("Citizen", 13.5, 14.5, "Сара (горожанка)"),
    spawnArchetype("Thief", 11.5, 15.5, "Слай Купер (вор)"),
    spawnArchetype("Bouncer", 15.5, 9.5, "Бруно (вышибала)"),
  );
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
  world.addAgent(
    spawnArchetype("Gangster_Crepe", 4.5, 5.5, "Красный Крепыш"),
    spawnArchetype("Gangster_Crepe", 5.5, 8.5, "Красный Стрелок"),
    spawnArchetype("Gangster_Crepe", 4.5, 12.5, "Красный Бугай"),
    spawnArchetype("Gangster_Crepe", 3.5, 15.5, "Красный Лидер"),
  );

  // Spawn Blahds
  world.addAgent(
    spawnArchetype("Gangster_Blahd", 19.5, 5.5, "Синий Крепыш"),
    spawnArchetype("Gangster_Blahd", 18.5, 8.5, "Синий Стрелок"),
    spawnArchetype("Gangster_Blahd", 19.5, 12.5, "Синий Бугай"),
    spawnArchetype("Gangster_Blahd", 20.5, 15.5, "Синий Лидер"),
  );

  // Police squad ready to intervene
  world.addAgent(
    spawnArchetype("Supercop", 11.5, 2.5, "SWAT Commander"),
    spawnArchetype("Cop", 13.5, 2.5, "SWAT Rookie"),
  );
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
  world.addAgent(
    spawnArchetype("Zombie", 11.5, 9.5, "Нулевой Пациент"),
    spawnArchetype("Zombie", 12.5, 10.5, "Пациент №2"),
    spawnArchetype("Gorilla", 11.5, 10.5, "Гора (Эксперимент #4)"),
  );

  // Scientists & Guards outside
  world.addAgent(
    spawnArchetype("Scientist", 6.5, 9.5, "Главный Исследователь"),
    spawnArchetype("Scientist", 17.5, 9.5, "Вирусолог"),
    spawnArchetype("Soldier", 5.5, 4.5, "Карантинный Офицер"),
    spawnArchetype("Soldier", 18.5, 4.5, "Отряд Опасных Материалов"),
    spawnArchetype("Cop", 12.5, 16.5, "Городская Полиция"),
    spawnArchetype("Citizen", 4.5, 16.5, "Потерянный Гражданин"),
  );
}

export function buildBarCasinoScenario(world: World) {
  world.initEmptyGrid(24, 20);

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
  world.addAgent(
    spawnArchetype("Bartender", 8.5, 4.5, "Мак (Бармен)"),
    spawnArchetype("Bouncer", 12.5, 14.5, "Гризли (Вышибала)"),
    spawnArchetype("Bouncer", 4.5, 14.5, "Танк (Вышибала)"),
  );

  world.addAgent(
    spawnArchetype("Citizen", 8.5, 9.5, "Пьяный Пит").addTrait("Drunk"),
    spawnArchetype("Citizen", 10.5, 10.5, "Пьяный Вальтер").addTrait("Drunk"),
  );

  world.addAgent(
    spawnArchetype("Assassin", 19.5, 14.5, "Загадочный Незнакомец"),
    spawnArchetype("Thief", 3.5, 4.5, "Карманный Воришка"),
    spawnArchetype("Cop", 12.5, 2.5, "Патрульный Полицейский"),
  );
}

export function buildSandboxScenario(world: World) {
  world.initEmptyGrid(20, 18);

  for (let x = 4; x <= 12; x++) {
    world.setTile(x, 6, "Barrel");
  }
  world
    .setTile(4, 7, "Barrel")
    .setTile(4, 8, "Barrel")
    .setTile(2, 2, "Barrel")
    .setTile(3, 2, "Barrel")
    .setTile(17, 2, "Barrel")
    .setTile(17, 15, "Barrel");

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
    Math.floor(rand(8, 16)) + 0.5,
    "God Gorilla Jack",
  ).addTrait("God");

  world.addAgent(
    g1.setRelationship(g2.id, "Hostile", 90),
    g2.setRelationship(g1.id, "Hostile", 90),
  );
}

export function buildLargeCityScenario(world: World) {
  const WIDTH = 200;
  const HEIGHT = 150;

  world.initEmptyGrid(WIDTH, HEIGHT);

  // ============================================================
  // CITY LAYOUT
  //
  //  ┌───────────────┬────────────────────┬───────────────┐
  //  │ POLICE        │     DOWNTOWN       │  LABORATORY   │
  //  │ HQ            │     + PARK         │               │
  //  ├───────────────┼────────────────────┼───────────────┤
  //  │ CREPE         │     CENTRAL        │  BLAHD        │
  //  │ TERRITORY     │     DISTRICT       │  TERRITORY    │
  //  ├───────────────┼────────────────────┼───────────────┤
  //  │ INDUSTRIAL    │   RESIDENTIAL      │  NIGHT CLUB   │
  //  │ ZONE          │   DISTRICT         │  + CASINO     │
  //  ├───────────────┴────────────────────┴───────────────┤
  //  │                     SOUTH SIDE                     │
  //  └────────────────────────────────────────────────────┘
  //
  // ============================================================

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  const wallRect = (x1: number, y1: number, x2: number, y2: number) => {
    for (let x = x1; x <= x2; x++) {
      world.setTile(x, y1, "Wall");
      world.setTile(x, y2, "Wall");
    }

    for (let y = y1; y <= y2; y++) {
      world.setTile(x1, y, "Wall");
      world.setTile(x2, y, "Wall");
    }
  };

  const road = (x1: number, y1: number, x2: number, y2: number) => {
    // Empty tiles are already walkable.
    // This helper exists mainly to make the map readable.
    for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) {
        // Intentionally empty.
      }
    }
  };

  const scatter = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    count: number,
    tile: "Crate" | "Barrel" | "ATM",
  ) => {
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rand(x1, x2));
      const y = Math.floor(rand(y1, y2));
      world.setTile(x, y, tile);
    }
  };

  // ------------------------------------------------------------
  // Main city roads
  // ------------------------------------------------------------

  // Main horizontal boulevard
  road(0, 72, WIDTH - 1, 78);

  // Main vertical boulevard
  road(96, 0, 104, HEIGHT - 1);

  // Secondary roads
  road(45, 0, 50, HEIGHT - 1);
  road(150, 0, 155, HEIGHT - 1);

  road(0, 35, WIDTH - 1, 40);
  road(0, 110, WIDTH - 1, 115);

  // ------------------------------------------------------------
  // POLICE HQ
  // ------------------------------------------------------------

  wallRect(8, 8, 40, 30);

  // Entrances
  world.setTile(24, 30, "Door", { isOpen: true });
  world.setTile(40, 19, "Door", { isOpen: true });

  // Cells / rooms
  wallRect(10, 10, 20, 18);
  wallRect(28, 10, 38, 18);

  world.setTile(15, 18, "Door", { isOpen: true });
  world.setTile(33, 18, "Door", { isOpen: true });

  scatter(11, 20, 38, 27, 5, "Crate");
  scatter(11, 20, 38, 27, 3, "Barrel");

  world.setTile(13, 12, "ATM");

  // Police
  world.addAgent(
    spawnArchetype("Supercop", 15.5, 23.5, "Командир Харрис"),
    spawnArchetype("Supercop", 30.5, 23.5, "Офицер Браун"),
    spawnArchetype("Cop", 20.5, 25.5, "Офицер Джонсон"),
    spawnArchetype("Cop", 25.5, 22.5, "Офицер Уилсон"),
    spawnArchetype("Cop", 34.5, 25.5, "Офицер Мартин"),
  );

  // ------------------------------------------------------------
  // DOWNTOWN
  // ------------------------------------------------------------

  wallRect(58, 8, 92, 30);

  world.setTile(75, 30, "Door", { isOpen: true });
  world.setTile(92, 19, "Door", { isOpen: true });

  // Shops / offices
  wallRect(61, 11, 70, 20);
  wallRect(76, 11, 89, 20);

  world.setTile(66, 20, "Door", { isOpen: true });
  world.setTile(82, 20, "Door", { isOpen: true });

  world.setTile(64, 14, "ATM");
  world.setTile(86, 14, "ATM");

  scatter(61, 22, 90, 28, 6, "Crate");

  // Civilians
  world.addAgent(
    spawnArchetype("Citizen", 65.5, 25.5, "Майкл"),
    spawnArchetype("Citizen", 70.5, 23.5, "Эмили"),
    spawnArchetype("Citizen", 78.5, 25.5, "Джеймс"),
    spawnArchetype("Citizen", 84.5, 23.5, "Оливия"),
    spawnArchetype("Citizen", 88.5, 27.5, "Джек"),
    spawnArchetype("Citizen", 61.5, 27.5, "София"),
  );

  // ------------------------------------------------------------
  // CENTRAL PARK
  // ------------------------------------------------------------

  // Park perimeter
  wallRect(60, 48, 92, 68);

  // Four "park obstacles"
  world.setTile(67, 53, "Barrel");
  world.setTile(85, 53, "Barrel");
  world.setTile(67, 63, "Barrel");
  world.setTile(85, 63, "Barrel");

  // Lots of civilians
  world.addAgent(
    spawnArchetype("Citizen", 65.5, 52.5, "Том"),
    spawnArchetype("Citizen", 72.5, 55.5, "Линда"),
    spawnArchetype("Citizen", 80.5, 51.5, "Дэвид"),
    spawnArchetype("Citizen", 87.5, 56.5, "Нэнси"),
    spawnArchetype("Citizen", 68.5, 62.5, "Роберт"),
    spawnArchetype("Citizen", 77.5, 64.5, "Энн"),
    spawnArchetype("Citizen", 86.5, 63.5, "Стив"),
    spawnArchetype("Thief", 76.5, 59.5, "Теневой Вор"),
  );

  // ------------------------------------------------------------
  // LABORATORY
  // ------------------------------------------------------------

  wallRect(115, 8, 145, 32);

  world.setTile(130, 32, "Door", { isOpen: false });
  world.setTile(115, 20, "Door", { isOpen: false });

  // Containment rooms
  wallRect(118, 11, 128, 22);
  wallRect(132, 11, 142, 22);

  world.setTile(123, 22, "Door", { isOpen: false });
  world.setTile(137, 22, "Door", { isOpen: false });

  world.setTile(120, 14, "Glass");
  world.setTile(121, 14, "Glass");
  world.setTile(139, 14, "Glass");
  world.setTile(140, 14, "Glass");

  scatter(118, 25, 142, 30, 5, "Crate");
  scatter(118, 25, 142, 30, 4, "Barrel");

  world.addAgent(
    spawnArchetype("Scientist", 123.5, 27.5, "Доктор Уайт"),
    spawnArchetype("Scientist", 137.5, 27.5, "Доктор Ли"),
    spawnArchetype("Scientist", 130.5, 25.5, "Доктор Морган"),
    spawnArchetype("Soldier", 119.5, 27.5, "Охрана лаборатории"),
    spawnArchetype("Soldier", 141.5, 27.5, "Карантинный солдат"),
  );

  // Secret zombie experiment
  world.addAgent(spawnArchetype("Zombie", 123.5, 16.5, "Образец Z-01"));

  // ------------------------------------------------------------
  // CREPE TERRITORY
  // ------------------------------------------------------------

  wallRect(8, 48, 40, 68);

  world.setTile(24, 48, "Door", { isOpen: true });
  world.setTile(40, 58, "Door", { isOpen: true });

  // Gang hideout
  wallRect(12, 52, 25, 64);
  world.setTile(18, 64, "Door", { isOpen: true });

  scatter(10, 50, 38, 66, 7, "Crate");
  scatter(10, 50, 38, 66, 6, "Barrel");

  world.addAgent(
    spawnArchetype("Gangster_Crepe", 15.5, 55.5, "Красный Король"),
    spawnArchetype("Gangster_Crepe", 20.5, 56.5, "Красный Бык"),
    spawnArchetype("Gangster_Crepe", 14.5, 61.5, "Красный Пёс"),
    spawnArchetype("Gangster_Crepe", 23.5, 60.5, "Красный Стрелок"),
    spawnArchetype("Gangster_Crepe", 30.5, 55.5, "Красный Клык"),
    spawnArchetype("Gangster_Crepe", 34.5, 61.5, "Красный Призрак"),
  );

  // ------------------------------------------------------------
  // BLAHD TERRITORY
  // ------------------------------------------------------------

  wallRect(160, 48, 192, 68);

  world.setTile(160, 58, "Door", { isOpen: true });
  world.setTile(176, 48, "Door", { isOpen: true });

  wallRect(174, 52, 188, 64);
  world.setTile(181, 64, "Door", { isOpen: true });

  scatter(162, 50, 190, 66, 7, "Crate");
  scatter(162, 50, 190, 66, 6, "Barrel");

  world.addAgent(
    spawnArchetype("Gangster_Blahd", 178.5, 55.5, "Синий Король"),
    spawnArchetype("Gangster_Blahd", 183.5, 56.5, "Синий Бык"),
    spawnArchetype("Gangster_Blahd", 176.5, 61.5, "Синий Пёс"),
    spawnArchetype("Gangster_Blahd", 186.5, 60.5, "Синий Стрелок"),
    spawnArchetype("Gangster_Blahd", 166.5, 55.5, "Синий Клык"),
    spawnArchetype("Gangster_Blahd", 170.5, 61.5, "Синий Призрак"),
  );

  // ------------------------------------------------------------
  // INDUSTRIAL ZONE
  // ------------------------------------------------------------

  wallRect(8, 85, 55, 105);

  world.setTile(31, 85, "Door", { isOpen: true });
  world.setTile(55, 95, "Door", { isOpen: true });

  scatter(12, 88, 51, 102, 18, "Crate");
  scatter(12, 88, 51, 102, 14, "Barrel");

  world.addAgent(
    spawnArchetype("Bouncer", 20.5, 94.5, "Охранник склада"),
    spawnArchetype("Bouncer", 42.5, 96.5, "Рабочий Танк"),
    spawnArchetype("Thief", 35.5, 92.5, "Карманник"),
  );

  // ------------------------------------------------------------
  // RESIDENTIAL DISTRICT
  // ------------------------------------------------------------

  wallRect(60, 85, 142, 105);

  // Apartment blocks
  wallRect(65, 88, 80, 102);
  wallRect(88, 88, 103, 102);
  wallRect(112, 88, 127, 102);

  world.setTile(72, 102, "Door", { isOpen: true });
  world.setTile(95, 102, "Door", { isOpen: true });
  world.setTile(119, 102, "Door", { isOpen: true });

  world.addAgent(
    spawnArchetype("Citizen", 68.5, 94.5, "Анна"),
    spawnArchetype("Citizen", 74.5, 96.5, "Питер"),
    spawnArchetype("Citizen", 91.5, 94.5, "Мэри"),
    spawnArchetype("Citizen", 98.5, 97.5, "Джордж"),
    spawnArchetype("Citizen", 115.5, 94.5, "Кейт"),
    spawnArchetype("Citizen", 122.5, 97.5, "Генри"),
    spawnArchetype("Citizen", 132.5, 92.5, "Джулия"),
    spawnArchetype("Citizen", 137.5, 98.5, "Чарли"),
  );

  // ------------------------------------------------------------
  // NIGHT CLUB / CASINO
  // ------------------------------------------------------------

  wallRect(158, 85, 192, 110);

  world.setTile(175, 85, "Door", { isOpen: true });
  world.setTile(158, 97, "Door", { isOpen: true });

  // Bar counter
  for (let x = 164; x <= 183; x++) {
    world.setTile(x, 91, "Crate");
  }

  world.setTile(166, 95, "ATM");
  world.setTile(180, 95, "ATM");

  scatter(162, 99, 188, 108, 5, "Barrel");

  world.addAgent(
    spawnArchetype("Bartender", 173.5, 89.5, "Винсент"),
    spawnArchetype("Bouncer", 162.5, 101.5, "Большой Джо"),
    spawnArchetype("Bouncer", 187.5, 101.5, "Молот"),
    spawnArchetype("Assassin", 184.5, 94.5, "Таинственный Клиент"),
    spawnArchetype("Thief", 168.5, 97.5, "Карманный Фокусник"),
    spawnArchetype("Citizen", 177.5, 98.5, "Пьяный Билл").addTrait("Drunk"),
    spawnArchetype("Citizen", 181.5, 104.5, "Пьяная Сара").addTrait("Drunk"),
  );

  // ------------------------------------------------------------
  // SOUTH SIDE
  // ------------------------------------------------------------

  wallRect(70, 120, 135, 142);

  world.setTile(102, 120, "Door", { isOpen: true });
  world.setTile(70, 132, "Door", { isOpen: true });
  world.setTile(135, 132, "Door", { isOpen: true });

  scatter(75, 123, 130, 140, 10, "Crate");
  scatter(75, 123, 130, 140, 8, "Barrel");

  // Mixed population
  world.addAgent(
    spawnArchetype("Citizen", 82.5, 128.5, "Сэм"),
    spawnArchetype("Citizen", 91.5, 136.5, "Луиза"),
    spawnArchetype("Citizen", 113.5, 127.5, "Фрэнк"),
    spawnArchetype("Citizen", 125.5, 136.5, "Молли"),
    spawnArchetype("Cop", 103.5, 130.5, "Патрульный"),
    spawnArchetype("Thief", 116.5, 135.5, "Ночной Вор"),
  );

  // ------------------------------------------------------------
  // RANDOM CITY POPULATION
  // ------------------------------------------------------------

  // Additional citizens wandering around the city.
  for (let i = 0; i < 35; i++) {
    let x: number;
    let y: number;

    do {
      x = Math.floor(rand(5, WIDTH - 5)) + 0.5;
      y = Math.floor(rand(5, HEIGHT - 5)) + 0.5;
    } while (
      // Keep random civilians mostly on roads/open areas.
      (x > 8 && x < 40 && y > 8 && y < 30) ||
      (x > 115 && x < 145 && y > 8 && y < 32) ||
      (x > 8 && x < 40 && y > 48 && y < 68) ||
      (x > 160 && x < 192 && y > 48 && y < 68)
    );

    world.addAgent(spawnArchetype("Citizen", x, y, `Горожанин #${i + 1}`));
  }

  // ------------------------------------------------------------
  // EXTRA TROUBLEMAKERS
  // ------------------------------------------------------------

  world.addAgent(
    spawnArchetype("Assassin", 105.5, 75.5, "Наёмник"),
    spawnArchetype("Thief", 53.5, 76.5, "Профессиональный Вор"),
    spawnArchetype("Bouncer", 146.5, 76.5, "Уличный Вышибала"),
  );

  // ------------------------------------------------------------
  // GANG RELATIONSHIPS
  // ------------------------------------------------------------

  const crepes = world.agents.filter((agent) => agent.job === "Gangster_Crepe");

  const blahds = world.agents.filter((agent) => agent.job === "Gangster_Blahd");

  for (const crepe of crepes) {
    for (const blahd of blahds) {
      crepe.setRelationship(blahd.id, "Hostile", 100);
      blahd.setRelationship(crepe.id, "Hostile", 100);
    }
  }

  // ------------------------------------------------------------
  // INITIAL POLICE / GANG RELATIONS
  // ------------------------------------------------------------

  const cops = world.agents.filter(
    (agent) =>
      agent.job === "Cop" ||
      agent.job === "Supercop" ||
      agent.job === "Soldier",
  );

  for (const cop of cops) {
    for (const gangster of [...crepes, ...blahds]) {
      cop.setRelationship(gangster.id, "Hostile", 80);
    }
  }

  // ------------------------------------------------------------
  // CITY EVENT TRIGGERS
  // ------------------------------------------------------------

  // The city deliberately starts relatively calm.
  //
  // But:
  //
  //   - gangs hate each other
  //   - police hate gangs
  //   - thiefs are around civilians
  //   - assassin is hidden in downtown
  //   - zombie is locked inside the laboratory
  //
  // This means the player can simply watch and wait for
  // the simulation to create its own chain reaction.
}
