import { Goal } from "./Goal";
import type { GoalStatus } from "../types";
import type { Agent } from "../Agent";

/**
 * GoalInteract: Approaches an interactable tile (ATM, Crate, Door) and interacts
 */
export class GoalInteract extends Goal {
  private tileX: number;
  private tileY: number;

  constructor(agent: Agent, tileX: number, tileY: number) {
    super("GoalInteract", agent, 5);
    this.tileX = tileX;
    this.tileY = tileY;
  }

  public activate(): void {
    this.status = "Active";
    this.agent.setDestination(this.tileX + 0.5, this.tileY + 0.5);
    this.debugInfo = `Взаимодействие с объектом в (${this.tileX}, ${this.tileY})`;
  }

  public process(dt: number): GoalStatus {
    if (this.status !== "Active") return this.status;

    const dist = Math.hypot(
      this.agent.x - (this.tileX + 0.5),
      this.agent.y - (this.tileY + 0.5),
    );
    if (dist <= 1.4) {
      this.agent.interactAt(this.tileX, this.tileY);
      this.status = "Completed";
      return "Completed";
    }

    this.agent.updatePathfindingAI(dt);
    return "Active";
  }

  public terminate(): void {
    this.status = "Inactive";
    this.agent.stop();
  }
}
