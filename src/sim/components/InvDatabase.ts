import { ITEM_REGISTRY, createInvItem } from "../Items";
import type { InvItem, ItemDef } from "../types";
import { sounds } from "../sound";
import type { Agent } from "../Agent";

export class InvDatabase {
  public agent: Agent;
  public items: InvItem[] = [];
  public equippedIndex: number = 0;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  public addItem(defId: string, count: number = 1): InvItem {
    const existing = this.items.find((i) => i.defId === defId);
    if (existing) {
      existing.count += count;
      return existing;
    }
    const item = createInvItem(defId, count);
    this.items.push(item);
    return item;
  }

  public removeItem(uid: string, count: number = 1): boolean {
    const idx = this.items.findIndex((i) => i.uid === uid);
    if (idx === -1) return false;
    this.items[idx].count -= count;
    if (this.items[idx].count <= 0) {
      this.items.splice(idx, 1);
      if (this.equippedIndex >= this.items.length) {
        this.equippedIndex = Math.max(0, this.items.length - 1);
      }
    }
    return true;
  }

  public getEquippedItem(): InvItem | null {
    if (this.items.length === 0) return null;
    return this.items[this.equippedIndex] || null;
  }

  public getEquippedWeaponDef(): ItemDef {
    const item = this.getEquippedItem();
    if (!item) return ITEM_REGISTRY["fists"];
    return ITEM_REGISTRY[item.defId] || ITEM_REGISTRY["fists"];
  }

  public equipNext(): void {
    if (this.items.length <= 1) return;
    this.equippedIndex = (this.equippedIndex + 1) % this.items.length;
  }

  public equipIndex(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.equippedIndex = index;
    }
  }

  public useItem(uid: string): boolean {
    const item = this.items.find((i) => i.uid === uid);
    if (!item) return false;

    const def = ITEM_REGISTRY[item.defId];
    if (!def) return false;

    if (def.type === "consumable") {
      if (def.healAmount) {
        this.agent.health = Math.min(
          this.agent.maxHealth,
          this.agent.health + def.healAmount,
        );
        sounds.playHeal();
        this.agent.say(`Used ${def.name} (+${def.healAmount} HP)`);
      }
      if (def.effectTrait) {
        this.agent.addTrait(def.effectTrait);
      }
      this.removeItem(uid, 1);
      return true;
    }

    return false;
  }
}
