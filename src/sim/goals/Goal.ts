import { GoalStatus, GoalTypeName } from '../types';

export abstract class Goal {
  public name: GoalTypeName;
  public status: GoalStatus = 'Inactive';
  public subGoals: Goal[] = [];
  public agent: any; // reference to Agent
  public priority: number = 0;
  public debugInfo: string = '';

  constructor(name: GoalTypeName, agent: any, priority: number = 0) {
    this.name = name;
    this.agent = agent;
    this.priority = priority;
  }

  /**
   * Called when goal becomes active on the top of the stack
   */
  public abstract activate(): void;

  /**
   * Called on every game update tick. Returns status.
   */
  public abstract process(dt: number): GoalStatus;

  /**
   * Called when goal finishes or is preempted/cancelled
   */
  public abstract terminate(): void;

  public setGoalState(status: GoalStatus) {
    this.status = status;
  }

  public addSubGoal(goal: Goal) {
    this.subGoals.push(goal);
  }

  public processSubGoals(dt: number): GoalStatus {
    // Process subgoals from top
    while (this.subGoals.length > 0) {
      const topSub = this.subGoals[this.subGoals.length - 1];
      if (topSub.status === 'Inactive') {
        topSub.activate();
      }

      const status = topSub.process(dt);
      if (status === 'Completed' || status === 'Failed') {
        topSub.terminate();
        this.subGoals.pop();
      } else {
        return 'Active';
      }
    }
    return 'Completed';
  }
}
