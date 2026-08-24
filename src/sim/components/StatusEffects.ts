import { getTraitDef, TRAIT_REGISTRY } from '../traits';
import { TraitDef } from '../types';

export class StatusEffects {
  public agent: any;
  public traitNames: Set<string> = new Set();
  public activeEffects: { id: string; duration: number; type: string }[] = [];

  constructor(agent: any) {
    this.agent = agent;
  }

  public addTrait(traitName: string): void {
    if (this.traitNames.has(traitName)) return;
    const def = getTraitDef(traitName);
    if (!def) return;

    this.traitNames.add(traitName);
    if (def.onAdd) {
      def.onAdd(this.agent);
    }
  }

  public removeTrait(traitName: string): void {
    if (!this.traitNames.has(traitName)) return;
    const def = getTraitDef(traitName);
    this.traitNames.delete(traitName);
    if (def && def.onRemove) {
      def.onRemove(this.agent);
    }
  }

  public hasTrait(traitName: string): boolean {
    return this.traitNames.has(traitName);
  }

  public getTraits(): TraitDef[] {
    const list: TraitDef[] = [];
    for (const name of this.traitNames) {
      const def = getTraitDef(name);
      if (def) list.push(def);
    }
    return list;
  }

  public getStatMod(modKey: keyof NonNullable<TraitDef['statMods']>): number {
    let result = 1.0;
    for (const name of this.traitNames) {
      const def = getTraitDef(name);
      if (def && def.statMods && def.statMods[modKey] !== undefined) {
        result *= def.statMods[modKey]!;
      }
    }
    return result;
  }

  public update(dt: number): void {
    // Tick trait callbacks
    for (const name of this.traitNames) {
      const def = getTraitDef(name);
      if (def && def.onTick) {
        def.onTick(this.agent, dt);
      }
    }

    // Tick temporary effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      this.activeEffects[i].duration -= dt;
      if (this.activeEffects[i].duration <= 0) {
        this.activeEffects.splice(i, 1);
      }
    }
  }
}
