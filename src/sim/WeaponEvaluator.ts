import { ITEM_REGISTRY } from "./Items";
import type { InvItem, ItemDef } from "./types";

export class WeaponEvaluator {
  /**
   * Calculates theoretical damage per second.
   */
  public getWeaponDPS(def: ItemDef): number {
    const damage = def.damage ?? 0;
    const attackSpeed = def.attackSpeed ?? 0;
    const bulletCount = def.bulletCount ?? 1;

    return damage * attackSpeed * bulletCount;
  }

  /**
   * Checks whether an inventory item can currently be used as a weapon.
   */
  private isWeaponAvailable(item: InvItem, def: ItemDef): boolean {
    if (def.type !== "gun" && def.type !== "melee") {
      return false;
    }

    // Melee weapons do not need ammo.
    if (def.type === "melee") {
      return true;
    }

    // Guns require ammunition.
    return (item.ammo ?? 0) > 0;
  }

  /**
   * Calculates how effective a weapon is in the current situation.
   * Higher score = better weapon.
   */
  public getWeaponScore(item: InvItem, def: ItemDef, distance: number): number {
    if (!this.isWeaponAvailable(item, def)) {
      return -Infinity;
    }

    const range = def.range ?? 1;
    // Target is outside weapon range.
    if (distance > range) {
      return -Infinity;
    }

    return this.getWeaponDPS(def);
  }

  /**
   * Finds the best available weapon from inventory.
   *
   * Returns null if there is no usable weapon.
   * In that case the caller should use fists.
   */
  public findBestWeapon(
    items: InvItem[],
    distance: number,
  ): { index: number; item: InvItem; def: ItemDef } | null {
    let bestIndex = -1;
    let bestScore = -Infinity;
    let bestItem: InvItem | null = null;
    let bestDef: ItemDef | null = null;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const def = ITEM_REGISTRY[item.defId];
      if (!def) continue;

      const score = this.getWeaponScore(item, def, distance);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
        bestItem = item;
        bestDef = def;
      }
    }

    if (bestIndex === -1 || !bestItem || !bestDef) {
      return null;
    }

    return {
      index: bestIndex,
      item: bestItem,
      def: bestDef,
    };
  }
}
