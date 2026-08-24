import { TraitDef } from './types';

export const TRAIT_REGISTRY: Record<string, TraitDef> = {
  Fast: {
    name: 'Fast',
    displayName: 'Fast Movement',
    description: 'Increases movement speed by 40%.',
    category: 'positive',
    statMods: {
      speedMult: 1.4
    }
  },
  Strength: {
    name: 'Strength',
    displayName: 'Super Strength',
    description: 'Increases melee damage by 80% and applies high knockback.',
    category: 'positive',
    statMods: {
      meleeDamageMult: 1.8
    }
  },
  Aggressive: {
    name: 'Aggressive',
    displayName: 'Aggressive',
    description: 'Low tolerance for insult or damage. Attacks foes quickly.',
    category: 'negative',
    statMods: {
      hateMultiplier: 1.8
    }
  },
  Coward: {
    name: 'Coward',
    displayName: 'Cowardly',
    description: 'Immediately flees or tattles when sensing danger, attacks, or gunfire.',
    category: 'negative',
    onHearNoise: (agent, noise) => {
      if (noise.noiseType === 'gunshot' || noise.noiseType === 'explosion') {
        agent.say('Eeeek! Gunfire! Run!', true);
        return true;
      }
      return false;
    }
  },
  Paranoid: {
    name: 'Paranoid',
    displayName: 'Paranoid',
    description: 'Very sensitive to noise and nearby strangers. Gets annoyed rapidly.',
    category: 'negative',
    statMods: {
      visionRangeMult: 1.3,
      hateMultiplier: 2.0
    }
  },
  Regenerate: {
    name: 'Regenerate',
    displayName: 'Regeneration',
    description: 'Passively restores 1.5 HP every second.',
    category: 'positive',
    onTick: (agent, dt) => {
      if (agent.health < agent.maxHealth) {
        agent.health = Math.min(agent.maxHealth, agent.health + 1.5 * dt);
      }
    }
  },
  AboveTheLaw: {
    name: 'AboveTheLaw',
    displayName: 'Above The Law',
    description: 'Law enforcement ignores your suspicious actions and trespassing.',
    category: 'positive'
  },
  Pyromaniac: {
    name: 'Pyromaniac',
    displayName: 'Pyromaniac',
    description: 'Takes 0 damage from fire and becomes excited near burning objects.',
    category: 'special'
  },
  Invisible: {
    name: 'Invisible',
    displayName: 'Chameleon Cloak',
    description: 'Enemies need to be twice as close to spot you.',
    category: 'positive',
    statMods: {
      visionRangeMult: 0.5
    }
  },
  ElectroTouch: {
    name: 'ElectroTouch',
    displayName: 'Shocking Touch',
    description: 'Melee attacks deliver an electric burst that stuns and deals bonus shock damage.',
    category: 'positive',
    onDealDamage: (agent, damage, victim) => {
      if (victim && victim.takeDamage) {
        victim.say('BZZZT! Electric shock!', true);
      }
      return damage + 8;
    }
  },
  Thief: {
    name: 'Thief',
    displayName: 'Master Thief',
    description: 'Unlocks doors instantly and moves without making footstep noise.',
    category: 'positive'
  },
  Cop: {
    name: 'Cop',
    displayName: 'Law Enforcer',
    description: 'Responds to crimes, arrests offenders, and calls nearby officers for backup.',
    category: 'special'
  },
  Bloodlust: {
    name: 'Bloodlust',
    displayName: 'Bloodlust',
    description: 'Restores 20 HP and gains a burst of speed upon defeating an enemy.',
    category: 'positive'
  },
  Bulletproof: {
    name: 'Bulletproof',
    displayName: 'Kevlar Vest',
    description: 'Reduces incoming projectile and bullet damage by 45%.',
    category: 'positive',
    statMods: {
      bulletDamageMult: 0.55
    }
  },
  GlassCannon: {
    name: 'GlassCannon',
    displayName: 'Glass Cannon',
    description: 'Deals 2.2x damage with all weapons, but has 40% reduced maximum health.',
    category: 'special',
    statMods: {
      maxHealthMult: 0.6,
      meleeDamageMult: 2.2,
      bulletDamageMult: 2.2
    }
  },
  Zombified: {
    name: 'Zombified',
    displayName: 'Zombie Virus',
    description: 'Slow movement, incapable of ranged combat, bites transform fallen foes into zombies.',
    category: 'special',
    statMods: {
      speedMult: 0.7,
      meleeDamageMult: 1.5
    }
  },
  Drunk: {
    name: 'Drunk',
    displayName: 'Intoxicated',
    description: 'Staggers randomly when walking. Ignores 25% of all pain.',
    category: 'negative',
    onTakeDamage: (agent, damage) => {
      return damage * 0.75;
    }
  },
  SharpShooter: {
    name: 'SharpShooter',
    displayName: 'Sharpshooter',
    description: 'Increases firearm damage by 40% with high bullet velocity.',
    category: 'positive',
    statMods: {
      bulletDamageMult: 1.4
    }
  },
  Loudmouth: {
    name: 'Loudmouth',
    displayName: 'Loudmouth',
    description: 'Shouts frequently and generates large noise waves that alert surrounding rooms.',
    category: 'negative'
  },
  Medic: {
    name: 'Medic',
    displayName: 'Field Medic',
    description: 'Carries medical supplies and actively heals injured allies.',
    category: 'positive'
  },
  MartialArtist: {
    name: 'MartialArtist',
    displayName: 'Martial Artist',
    description: 'High unarmed strike speed and knocks enemies backward.',
    category: 'positive',
    statMods: {
      meleeDamageMult: 1.6
    }
  }
};

export function getTraitDef(traitName: string): TraitDef | undefined {
  return TRAIT_REGISTRY[traitName];
}
