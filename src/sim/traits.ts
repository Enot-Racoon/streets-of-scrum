import { TraitDef } from "./types";

export const TRAIT_REGISTRY = {
  Fast: {
    name: "Fast",
    displayName: "Скорость",
    description: "Увеличивает скорость передвижения на 40%.",
    category: "positive",
    statMods: {
      speedMult: 1.4,
    },
  },
  Strength: {
    name: "Strength",
    displayName: "Суперсила",
    description:
      "Увеличивает урон в ближнем бою на 80% и применяет высокий эффект отбрасывания.",
    category: "positive",
    statMods: {
      meleeDamageMult: 1.8,
    },
  },
  Aggressive: {
    name: "Aggressive",
    displayName: "Агрессивный",
    description:
      "Низкая терпимость к оскорблениям или урону. Быстро атакует врагов.",
    category: "negative",
    statMods: {
      hateMultiplier: 1.8,
    },
  },
  Coward: {
    name: "Coward",
    displayName: "Трусливый",
    description:
      "Немедленно убегает или сообщает об опасности, атаках или выстрелах.",
    category: "negative",
    onHearNoise: (agent, noise) => {
      if (noise.noiseType === "gunshot" || noise.noiseType === "explosion") {
        agent.say("Ой! Выстрелы! Бежим!", true);
        return true;
      }
      return false;
    },
  },
  Paranoid: {
    name: "Paranoid",
    displayName: "Параноик",
    description:
      "Очень чувствителен к шуму и случайным прохожим. Быстро раздражается.",
    category: "negative",
    statMods: {
      visionRangeMult: 1.3,
      hateMultiplier: 2.0,
    },
  },
  Regenerate: {
    name: "Regenerate",
    displayName: "Регенерация",
    description: "Пассивно восстанавливает 1.5 HP каждую секунду.",
    category: "positive",
    onTick: (agent, dt) => {
      if (agent.health < agent.maxHealth) {
        agent.health = Math.min(agent.maxHealth, agent.health + 1.5 * dt);
      }
    },
  },
  AboveTheLaw: {
    name: "AboveTheLaw",
    displayName: "Вне закона",
    description:
      "Правоохранительные органы игнорируют ваши подозрительные действия и незаконное проникновение на чужую территорию.",
    category: "positive",
  },
  Pyromaniac: {
    name: "Pyromaniac",
    displayName: "Пироман",
    description:
      "Получает 0 урона от огня и приходит в возбуждение рядом с горящими объектами.",
    category: "special",
  },
  Invisible: {
    name: "Invisible",
    displayName: "Хамелеон",
    description: "Врагам нужно быть в два раза ближе, чтобы заметить вас.",
    category: "positive",
    statMods: {
      visionRangeMult: 0.5,
    },
  },
  ElectroTouch: {
    name: "ElectroTouch",
    displayName: "Шокирующее прикосновение",
    description:
      "Ближний бой наносит электрический разряд, который оглушает и наносит дополнительный урон от удара током.",
    category: "positive",
    onDealDamage: (agent, damage, victim) => {
      if (victim && victim.takeDamage) {
        victim.say("БЗЗЗТ! Электрический шок!", true);
      }
      return damage + 8;
    },
  },
  Thief: {
    name: "Thief",
    displayName: "Мастер воровства",
    description: "Мгновенно открывает двери и передвигается без шума шагов.",
    category: "positive",
  },
  Cop: {
    name: "Cop",
    displayName: "Полицейский",
    description:
      "Полиция реагирует на преступления, задерживает преступников и вызывает подкрепление.",
    category: "special",
  },
  Bloodlust: {
    name: "Bloodlust",
    displayName: "Кровавая жажда",
    description:
      "Восстанавливает 20 HP и получает всплеск скорости после убийства врага.",
    category: "positive",
  },
  Bulletproof: {
    name: "Bulletproof",
    displayName: "Бронежилет",
    description: "Уменьшает входящий урон от снарядов и пуль на 45%.",
    category: "positive",
    statMods: {
      bulletDamageMult: 0.55,
    },
  },
  GlassCannon: {
    name: "GlassCannon",
    displayName: "Стеклопушка",
    description:
      "Наносит 2.2x урона всем оружием, но имеет на 40% меньше максимального здоровья.",
    category: "special",
    statMods: {
      maxHealthMult: 0.6,
      meleeDamageMult: 2.2,
      bulletDamageMult: 2.2,
    },
  },
  Zombified: {
    name: "Zombified",
    displayName: "Вирус зомби",
    description:
      "Медленное передвижение, не способен вести дальний бой, укусы превращают павших врагов в зомби.",
    category: "special",
    statMods: {
      speedMult: 0.7,
      meleeDamageMult: 1.5,
    },
  },
  Drunk: {
    name: "Drunk",
    displayName: "Пьян",
    description: "Спотыкается при ходьбе. Игнорирует 25% всего урона.",
    category: "negative",
    onTakeDamage: (agent, damage) => {
      return damage * 0.75;
    },
  },
  SharpShooter: {
    name: "SharpShooter",
    displayName: "Снайпер",
    description: "Увеличивает урон от огнестрельного оружия на 40%.",
    category: "positive",
    statMods: {
      bulletDamageMult: 1.4,
    },
  },
  Loudmouth: {
    name: "Loudmouth",
    displayName: "Болтун",
    description:
      "Громко кричит и создает звуковые волны, которые будят окружающих.",
    category: "negative",
  },
  Medic: {
    name: "Medic",
    displayName: "Полевой медик",
    description:
      "Носит медицинские принадлежности и активно лечит раненых союзников.",
    category: "positive",
  },
  MartialArtist: {
    name: "MartialArtist",
    displayName: "Мастер боевых искусств",
    description:
      "Высокая скорость ударов без оружия и отбрасывает врагов назад.",
    category: "positive",
    statMods: {
      meleeDamageMult: 1.6,
    },
  },
  Paralyzed: {
    name: "Paralyzed",
    displayName: "Парализованный",
    description: "Парализует движения.",
    category: "special",
    statMods: {
      speedMult: 0,
    },
  },
  Pacifist: {
    name: "Pacifist",
    displayName: "Пацифист",
    description: "Не наносит урон другим существам.",
    category: "special",
    statMods: {
      meleeDamageMult: 0,
      bulletDamageMult: 0,
    },
  },
} as const satisfies Record<string, TraitDef>;

export type TraitType = keyof typeof TRAIT_REGISTRY;

export function getTraitDef(traitName: TraitType): TraitDef {
  return TRAIT_REGISTRY[traitName];
}
