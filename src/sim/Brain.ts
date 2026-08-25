import type { Agent } from "./Agent";
import type { Goal } from "./goals/Goal";
import type { AgentMemory, GoalStatus, GoalTypeName } from "./types";

export class Brain {
  public agent: Agent;
  public goalStack: Goal[] = [];
  public isSuspended: boolean = false;
  public lastThought: string = "Idle";
  public memory: AgentMemory[] = [];

  constructor(agent: Agent) {
    this.agent = agent;
  }

  public pushGoal(goal: Goal): void {
    // If agent already has an identical high priority goal at top, don't stack duplicates
    if (this.goalStack.length > 0) {
      const top = this.goalStack[this.goalStack.length - 1];
      if (top.name === goal.name && top.priority >= goal.priority) {
        return;
      }
    }

    // Limit max stack depth to 8
    if (this.goalStack.length >= 8) {
      const dropped = this.goalStack.shift();
      if (dropped) dropped.terminate();
    }

    this.goalStack.push(goal);
    this.lastThought = `Switched goal to ${goal.name}`;
    if (!this.isSuspended) {
      goal.activate();
    }
  }

  public popGoal(): Goal | undefined {
    const popped = this.goalStack.pop();
    if (popped) {
      popped.terminate();
    }
    // Activate new top goal if inactive
    if (this.goalStack.length > 0 && !this.isSuspended) {
      const top = this.goalStack[this.goalStack.length - 1];
      if (top.status === "Inactive") {
        top.activate();
      }
    }
    return popped;
  }

  public getTopGoal(): Goal | null {
    return this.goalStack.length > 0
      ? this.goalStack[this.goalStack.length - 1]
      : null;
  }

  public hasGoal(name: GoalTypeName): boolean {
    return this.goalStack.some((g) => g.name === name);
  }

  public removeGoalType(name: GoalTypeName): void {
    for (let i = this.goalStack.length - 1; i >= 0; i--) {
      if (this.goalStack[i].name === name) {
        this.goalStack[i].terminate();
        this.goalStack.splice(i, 1);
      }
    }
  }

  public clearAllGoals(): void {
    for (const g of this.goalStack) {
      g.terminate();
    }
    this.goalStack = [];
  }

  public suspend(): void {
    this.isSuspended = true;
    this.lastThought = "Контролирует игрок";
  }

  public resume(): void {
    this.isSuspended = false;
    if (this.goalStack.length > 0) {
      const top = this.goalStack[this.goalStack.length - 1];
      if (top.status === "Inactive") {
        top.activate();
      }
      this.lastThought = `Возвращаюсь к: ${top.name}`;
    }
  }

  public update(dt: number): void {
    if (this.isSuspended || this.agent.isDead) return;

    // Clean expired memory
    const now = Date.now();
    this.memory = this.memory.filter((m) => m.expiresAt > now);

    // Process top goal
    if (this.goalStack.length === 0) {
      // Default goal
      this.agent.initDefaultGoal();
      return;
    }

    const currentGoal = this.goalStack[this.goalStack.length - 1];
    if (currentGoal.status === "Inactive") {
      currentGoal.activate();
    }

    const status: GoalStatus = currentGoal.process(dt);
    this.lastThought = `${currentGoal.name}: ${currentGoal.debugInfo || status}`;

    if (status === "Completed" || status === "Failed") {
      this.popGoal();
    }
  }

  public setMemory(key: string, val: any, durationMs: number = 10000) {
    this.memory.push({
      key,
      val,
      expiresAt: Date.now() + durationMs,
    });
  }

  public getMemory(key: string): AgentMemory | null {
    const mem = this.memory.find((m) => m.key === key);
    return mem ? mem.val : null;
  }
}
