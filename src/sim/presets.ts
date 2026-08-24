import { World } from './World';
import { Agent } from './Agent';
import { JobType } from './types';

export interface ArchetypeDef {
  name: string;
  job: JobType;
  avatarIcon: string;
  color: string;
  health: number;
  traits: string[];
  startingItems: string[];
  description: string;
}

export const ARCHETYPES: Record<string, ArchetypeDef> = {
  Cop: {
    name: 'Police Officer',
    job: 'Cop',
    avatarIcon: '👮',
    color: '#3b82f6',
    health: 120,
    traits: ['Cop', 'Bulletproof', 'Aggressive'],
    startingItems: ['pistol', 'bat', 'medkit'],
    description: 'Enforces the law, investigates loud noises, calls backup.'
  },
  Supercop: {
    name: 'Tactical SWAT Supercop',
    job: 'Supercop',
    avatarIcon: '🛡️',
    color: '#1d4ed8',
    health: 180,
    traits: ['Cop', 'Bulletproof', 'Strength', 'Fast'],
    startingItems: ['shotgun', 'machinegun', 'grenade'],
    description: 'Heavy armored law enforcer with overwhelming firepower.'
  },
  Gangster_Crepe: {
    name: 'Crepe Gang Member',
    job: 'Gangster_Crepe',
    avatarIcon: '🔴',
    color: '#ef4444',
    health: 100,
    traits: ['Aggressive', 'Strength'],
    startingItems: ['bat', 'pistol', 'beer'],
    description: 'Fiercely loyal to Crepe colors, mortal enemy of Blahd gang.'
  },
  Gangster_Blahd: {
    name: 'Blahd Gang Member',
    job: 'Gangster_Blahd',
    avatarIcon: '🔵',
    color: '#06b6d4',
    health: 100,
    traits: ['Aggressive', 'SharpShooter'],
    startingItems: ['knife', 'revolver', 'beer'],
    description: 'Controls South District alleys, attacks Crepes on sight.'
  },
  Thief: {
    name: 'Master Thief',
    job: 'Thief',
    avatarIcon: '🥷',
    color: '#8b5cf6',
    health: 80,
    traits: ['Thief', 'Fast', 'Invisible', 'Coward'],
    startingItems: ['knife', 'lockpick', 'medkit'],
    description: 'Silent infiltrator that picks locks and loots crates unnoticed.'
  },
  Scientist: {
    name: 'Research Scientist',
    job: 'Scientist',
    avatarIcon: '👨‍🔬',
    color: '#10b981',
    health: 75,
    traits: ['Coward', 'Regenerate'],
    startingItems: ['fists', 'medkit'],
    description: 'Fragile lab researcher who panics easily and calls for guards.'
  },
  Soldier: {
    name: 'Special Forces Soldier',
    job: 'Soldier',
    avatarIcon: '🪖',
    color: '#84cc16',
    health: 140,
    traits: ['SharpShooter', 'Strength', 'Bulletproof'],
    startingItems: ['machinegun', 'knife', 'grenade'],
    description: 'Disciplined combat specialist with high accuracy.'
  },
  Bouncer: {
    name: 'Club Bouncer',
    job: 'Bouncer',
    avatarIcon: '🥊',
    color: '#f59e0b',
    health: 150,
    traits: ['Strength', 'MartialArtist', 'Aggressive'],
    startingItems: ['sledgehammer', 'beer'],
    description: 'Guards entrances, brutally throws out troublemakers.'
  },
  Bartender: {
    name: 'Bartender',
    job: 'Bartender',
    avatarIcon: '🍸',
    color: '#ec4899',
    health: 90,
    traits: ['AboveTheLaw', 'Medic'],
    startingItems: ['shotgun', 'beer', 'medkit'],
    description: 'Serves drinks and defends the bar counter with a shotgun.'
  },
  Zombie: {
    name: 'Infected Zombie',
    job: 'Zombie',
    avatarIcon: '🧟',
    color: '#22c55e',
    health: 90,
    traits: ['Zombified', 'Aggressive', 'Strength'],
    startingItems: ['zombie_claws'],
    description: 'Relentless undead that bites and transforms victims into zombies.'
  },
  Gorilla: {
    name: 'Escaped Gorilla',
    job: 'Gorilla',
    avatarIcon: '🦍',
    color: '#78350f',
    health: 220,
    traits: ['Strength', 'Bloodlust', 'Aggressive'],
    startingItems: ['fists'],
    description: 'Unstoppable beast that despises scientists and smashes walls.'
  },
  Assassin: {
    name: 'Shadow Assassin',
    job: 'Assassin',
    avatarIcon: '🗡️',
    color: '#475569',
    health: 100,
    traits: ['Invisible', 'Fast', 'GlassCannon', 'Bloodlust'],
    startingItems: ['knife', 'revolver'],
    description: 'High burst damage striker who moves unseen.'
  },
  Citizen: {
    name: 'Ordinary Citizen',
    job: 'Citizen',
    avatarIcon: '🚶',
    color: '#94a3b8',
    health: 80,
    traits: ['Coward'],
    startingItems: ['fists', 'beer'],
    description: 'Mind their own business, tattles to police if attacked.'
  }
};

export function buildDistrictMap(world: World) {
  world.initEmptyGrid();

  // Outer border & Rooms
  // Room 1: Police Station (Top Left 1..7, 1..7)
  for (let x = 1; x <= 7; x++) {
    for (let y = 1; y <= 7; y++) {
      if (x === 7 || y === 7) {
        world.setTile(x, y, 'Wall');
      }
    }
  }
  world.setTile(7, 4, 'Door', { isOpen: false });
  world.setTile(4, 7, 'Door', { isOpen: false });
  world.setTile(2, 2, 'ATM');
  world.setTile(3, 2, 'Crate');

  // Room 2: Lab / Containment (Top Right 16..22, 1..7)
  for (let x = 16; x <= 22; x++) {
    for (let y = 1; y <= 7; y++) {
      if (x === 16 || y === 7) {
        world.setTile(x, y, 'Wall');
      }
    }
  }
  world.setTile(16, 4, 'Door', { isOpen: false });
  world.setTile(19, 7, 'Glass');
  world.setTile(20, 7, 'Glass');
  world.setTile(21, 2, 'Crate');
  world.setTile(18, 2, 'Barrel');

  // Room 3: Crepe Turf / Bar (Bottom Left 1..7, 12..18)
  for (let x = 1; x <= 7; x++) {
    for (let y = 12; y <= 18; y++) {
      if (x === 7 || y === 12) {
        world.setTile(x, y, 'Wall');
      }
    }
  }
  world.setTile(7, 15, 'Door', { isOpen: false });
  world.setTile(4, 12, 'Door', { isOpen: false });
  world.setTile(2, 17, 'Barrel');
  world.setTile(3, 17, 'Crate');
  world.setTile(5, 17, 'ATM');

  // Room 4: Blahd Hideout (Bottom Right 16..22, 12..18)
  for (let x = 16; x <= 22; x++) {
    for (let y = 12; y <= 18; y++) {
      if (x === 16 || y === 12) {
        world.setTile(x, y, 'Wall');
      }
    }
  }
  world.setTile(16, 15, 'Door', { isOpen: false });
  world.setTile(19, 12, 'Door', { isOpen: false });
  world.setTile(21, 17, 'Barrel');
  world.setTile(20, 17, 'Crate');

  // Center Plaza with Fountain / Barrels & Crates
  world.setTile(11, 9, 'Crate');
  world.setTile(12, 9, 'Crate');
  world.setTile(11, 10, 'Barrel');
  world.setTile(12, 10, 'Barrel');

  // Spawn District Agents
  // Cops in precinct
  world.addAgent(spawnArchetype('Cop', 4, 3, 'Officer Davis'));
  world.addAgent(spawnArchetype('Cop', 5, 5, 'Officer Miller'));

  // Scientists in lab
  world.addAgent(spawnArchetype('Scientist', 19, 3, 'Dr. Aris'));
  world.addAgent(spawnArchetype('Scientist', 20, 4, 'Dr. Chen'));

  // Crepe Gangsters in southwest turf
  world.addAgent(spawnArchetype('Gangster_Crepe', 4, 14, 'Red Snake'));
  world.addAgent(spawnArchetype('Gangster_Crepe', 3, 16, 'Red Bull'));

  // Blahd Gangsters in southeast turf
  world.addAgent(spawnArchetype('Gangster_Blahd', 19, 14, 'Blue Viper'));
  world.addAgent(spawnArchetype('Gangster_Blahd', 20, 16, 'Blue Ace'));

  // Plaza Wanderers
  world.addAgent(spawnArchetype('Citizen', 10, 5, 'Frank (Citizen)'));
  world.addAgent(spawnArchetype('Citizen', 13, 14, 'Sarah (Citizen)'));
  world.addAgent(spawnArchetype('Thief', 11, 15, 'Sly Cooper (Thief)'));
  world.addAgent(spawnArchetype('Bouncer', 15, 9, 'Bruno (Bouncer)'));
}

export function buildGangWarScenario(world: World) {
  world.initEmptyGrid();

  // Alley barriers
  for (let y = 1; y < 19; y++) {
    if (y !== 9 && y !== 10) {
      world.setTile(12, y, 'Wall');
    }
  }
  world.setTile(12, 9, 'Door', { isOpen: true });
  world.setTile(12, 10, 'Door', { isOpen: true });

  // Barrels and barricades
  world.setTile(8, 9, 'Barrel');
  world.setTile(8, 10, 'Barrel');
  world.setTile(16, 9, 'Barrel');
  world.setTile(16, 10, 'Barrel');
  world.setTile(6, 4, 'Crate');
  world.setTile(18, 4, 'Crate');

  // Spawn Crepes
  world.addAgent(spawnArchetype('Gangster_Crepe', 4, 5, 'Crepe Enforcer'));
  world.addAgent(spawnArchetype('Gangster_Crepe', 5, 8, 'Crepe Gunner'));
  world.addAgent(spawnArchetype('Gangster_Crepe', 4, 12, 'Crepe Bruiser'));
  world.addAgent(spawnArchetype('Gangster_Crepe', 3, 15, 'Crepe Boss'));

  // Spawn Blahds
  world.addAgent(spawnArchetype('Gangster_Blahd', 19, 5, 'Blahd Enforcer'));
  world.addAgent(spawnArchetype('Gangster_Blahd', 18, 8, 'Blahd Sniper'));
  world.addAgent(spawnArchetype('Gangster_Blahd', 19, 12, 'Blahd Shotgunner'));
  world.addAgent(spawnArchetype('Gangster_Blahd', 20, 15, 'Blahd Leader'));

  // Police squad ready to intervene
  world.addAgent(spawnArchetype('Supercop', 11, 2, 'SWAT Commander'));
  world.addAgent(spawnArchetype('Cop', 13, 2, 'SWAT Rookie'));
}

export function buildZombieOutbreakScenario(world: World) {
  world.initEmptyGrid();

  // Central Quarantine Cage
  for (let x = 9; x <= 14; x++) {
    for (let y = 7; y <= 12; y++) {
      if (x === 9 || x === 14 || y === 7 || y === 12) {
        world.setTile(x, y, 'Glass');
      }
    }
  }
  world.setTile(11, 12, 'Door', { isOpen: false });
  world.setTile(12, 12, 'Door', { isOpen: false });

  // Explosive barrels around containment
  world.setTile(8, 12, 'Barrel');
  world.setTile(15, 12, 'Barrel');
  world.setTile(11, 6, 'Barrel');

  // Inside cage: Alpha Zombie & Gorilla
  world.addAgent(spawnArchetype('Zombie', 11, 9, 'Patient Zero'));
  world.addAgent(spawnArchetype('Zombie', 12, 10, 'Infected Carrier'));
  world.addAgent(spawnArchetype('Gorilla', 11, 10, 'Gorg (Experiment #4)'));

  // Scientists & Guards outside
  world.addAgent(spawnArchetype('Scientist', 6, 9, 'Chief Researcher'));
  world.addAgent(spawnArchetype('Scientist', 17, 9, 'Virologist'));
  world.addAgent(spawnArchetype('Soldier', 5, 4, 'Quarantine Guard'));
  world.addAgent(spawnArchetype('Soldier', 18, 4, 'Hazard Squad'));
  world.addAgent(spawnArchetype('Cop', 12, 16, 'City Police'));
  world.addAgent(spawnArchetype('Citizen', 4, 16, 'Lost Civilian'));
}

export function buildBarCasinoScenario(world: World) {
  world.initEmptyGrid();

  // Bar Counter (L-shape)
  for (let x = 4; x <= 12; x++) {
    world.setTile(x, 6, 'Crate');
  }
  world.setTile(4, 7, 'Crate');
  world.setTile(4, 8, 'Crate');

  // ATMs & Crates
  world.setTile(2, 2, 'ATM');
  world.setTile(3, 2, 'ATM');
  world.setTile(21, 2, 'Barrel');
  world.setTile(21, 17, 'Barrel');

  // Agents
  world.addAgent(spawnArchetype('Bartender', 8, 4, 'Mac (Bartender)'));
  world.addAgent(spawnArchetype('Bouncer', 12, 14, 'Grizzly (Bouncer)'));
  world.addAgent(spawnArchetype('Bouncer', 4, 14, 'Tank (Bouncer)'));

  const drunk1 = spawnArchetype('Citizen', 8, 9, 'Drunk Pete');
  drunk1.addTrait('Drunk');
  world.addAgent(drunk1);

  const drunk2 = spawnArchetype('Citizen', 10, 10, 'Drunk Walter');
  drunk2.addTrait('Drunk');
  world.addAgent(drunk2);

  world.addAgent(spawnArchetype('Assassin', 19, 14, 'Mysterious Stranger'));
  world.addAgent(spawnArchetype('Thief', 3, 4, 'Pocket Thief'));
  world.addAgent(spawnArchetype('Cop', 12, 2, 'Patrol Officer'));
}

export function spawnArchetype(key: string, x: number, y: number, customName?: string): Agent {
  const def = ARCHETYPES[key] || ARCHETYPES['Citizen'];
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
    startingItems: [...def.startingItems]
  });
}
