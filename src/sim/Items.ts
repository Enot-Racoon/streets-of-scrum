import { ItemDef, InvItem } from './types';

export const ITEM_REGISTRY: Record<string, ItemDef> = {
  fists: {
    id: 'fists',
    name: 'Fists',
    type: 'melee',
    damage: 8,
    range: 1.1,
    attackSpeed: 2.2,
    description: 'Bare knuckles. Fast but low damage.',
    icon: '🥊'
  },
  knife: {
    id: 'knife',
    name: 'Combat Knife',
    type: 'melee',
    damage: 18,
    range: 1.2,
    attackSpeed: 2.5,
    description: 'Sharp steel blade. Silent and deadly.',
    icon: '🔪'
  },
  bat: {
    id: 'bat',
    name: 'Baseball Bat',
    type: 'melee',
    damage: 24,
    range: 1.5,
    attackSpeed: 1.4,
    description: 'Heavy wooden bat with great knockback.',
    icon: '🏏'
  },
  sledgehammer: {
    id: 'sledgehammer',
    name: 'Sledgehammer',
    type: 'melee',
    damage: 42,
    range: 1.7,
    attackSpeed: 0.9,
    description: 'Massive crushing power that can smash doors and crates easily.',
    icon: '🔨'
  },
  pistol: {
    id: 'pistol',
    name: 'Pistol',
    type: 'gun',
    damage: 16,
    range: 12,
    attackSpeed: 2.0,
    ammo: 15,
    maxAmmo: 15,
    bulletSpeed: 18,
    spread: 0.05,
    bulletCount: 1,
    soundName: 'gunshot',
    description: 'Standard issue 9mm service handgun.',
    icon: '🔫'
  },
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    type: 'gun',
    damage: 12, // per pellet (x5)
    range: 8,
    attackSpeed: 0.9,
    ammo: 8,
    maxAmmo: 8,
    bulletSpeed: 14,
    spread: 0.25,
    bulletCount: 5,
    soundName: 'shotgun',
    description: 'Devastating close-range scattergun.',
    icon: '💥'
  },
  machinegun: {
    id: 'machinegun',
    name: 'Machine Gun',
    type: 'gun',
    damage: 14,
    range: 14,
    attackSpeed: 6.0,
    ammo: 30,
    maxAmmo: 30,
    bulletSpeed: 20,
    spread: 0.12,
    bulletCount: 1,
    soundName: 'gunshot',
    description: 'Rapid-fire submachine gun.',
    icon: '⚡'
  },
  revolver: {
    id: 'revolver',
    name: 'Magnum Revolver',
    type: 'gun',
    damage: 38,
    range: 15,
    attackSpeed: 1.1,
    ammo: 6,
    maxAmmo: 6,
    bulletSpeed: 22,
    spread: 0.02,
    bulletCount: 1,
    soundName: 'shotgun',
    description: 'High-caliber hand cannon.',
    icon: '🤠'
  },
  medkit: {
    id: 'medkit',
    name: 'First Aid Kit',
    type: 'consumable',
    healAmount: 40,
    description: 'Restores 40 Health points instantly.',
    icon: '🩹'
  },
  beer: {
    id: 'beer',
    name: 'Beer Bottle',
    type: 'consumable',
    healAmount: 15,
    effectTrait: 'Drunk',
    description: 'Restores 15 HP and provides intoxication courage.',
    icon: '🍺'
  },
  grenade: {
    id: 'grenade',
    name: 'Frag Grenade',
    type: 'explosive',
    damage: 65,
    range: 8,
    description: 'Thrown explosive that shatters walls and crowds.',
    icon: '💣'
  },
  lockpick: {
    id: 'lockpick',
    name: 'Lockpick',
    type: 'tool',
    description: 'Silently picks locked doors and security safes.',
    icon: '🗝️'
  },
  zombie_claws: {
    id: 'zombie_claws',
    name: 'Infected Claws',
    type: 'melee',
    damage: 14,
    range: 1.1,
    attackSpeed: 1.8,
    description: 'Infectious bite and claw attack.',
    icon: '🧟'
  }
};

let uidCounter = 1;

export function createInvItem(defId: string, count: number = 1): InvItem {
  const def = ITEM_REGISTRY[defId] || ITEM_REGISTRY['fists'];
  return {
    uid: `item_${uidCounter++}_${defId}`,
    defId,
    count,
    ammo: def.ammo
  };
}
