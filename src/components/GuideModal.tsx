import React from "react";
import {
  X,
  BookOpen,
  Brain,
  // GitBranch,
  Cpu,
  Sparkles,
  Zap,
  // Shield,
  Flame,
} from "lucide-react";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-base text-slate-100">
              Streets of Rogue Architecture & Knowledge Base
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm leading-relaxed">
          {/* Section 1: Overview */}
          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <h3 className="font-bold text-sky-400 text-sm mb-1.5 flex items-center gap-1.5">
              <Brain className="w-4 h-4" /> 1. Goal Stack AI (Brain + Goal) vs
              FSM
            </h3>
            <p className="text-slate-300">
              Unlike a Finite State Machine (FSM) where states overwrite each
              other, SoR uses a <strong>hierarchical Goal Stack</strong>. When a
              citizen is wandering (<code>GoalWander</code>) and hears a
              gunshot, <code>GoalNoiseReact</code> is pushed to the top of the
              stack. When done investigating, the goal is popped and the agent
              smoothly returns to wandering where they left off.
            </p>
          </div>

          {/* Section 2: BrainUpdate Decision Engine */}
          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <h3 className="font-bold text-amber-400 text-sm mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> 2. BrainUpdate Decision Loop
            </h3>
            <p className="text-slate-300">
              <code>BrainUpdate</code> continuously evaluates nearby agents in
              Line-of-Sight, hearing cones, and danger sources. Decisions are
              rule-driven based on traits and relations:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400 font-mono text-xs">
              <li>
                Enemy visible + Aggressive trait → Push <code>GoalBattle</code>
              </li>
              <li>
                Enemy visible + Coward trait / Low HP → Push{" "}
                <code>GoalFlee</code>
              </li>
              <li>
                Gunshot heard + Cop / Soldier → Push{" "}
                <code>GoalInvestigate</code>
              </li>
              <li>
                Crime witnessed + Citizen → Push <code>GoalTattle</code> to
                inform Police
              </li>
            </ul>
          </div>

          {/* Section 3: Dynamic Relationships */}
          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <h3 className="font-bold text-rose-400 text-sm mb-1.5 flex items-center gap-1.5">
              <Flame className="w-4 h-4" /> 3. Per-Agent Relationship Matrix
            </h3>
            <p className="text-slate-300">
              Every agent maintains a dedicated relationship state for every
              other entity:
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-rose-400 font-bold">
                  Hate Accumulator:
                </span>{" "}
                0 to 100 scale. Over 25 = Annoyed, Over 60 = Hostile.
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-amber-400 font-bold">Strikes:</span>{" "}
                Increments on trespassing or collisions. 3 strikes = Attack.
              </div>
            </div>
          </div>

          {/* Section 4: Data-Driven Traits */}
          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <h3 className="font-bold text-emerald-400 text-sm mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 4. Data-Driven Traits & Event
              Hooks
            </h3>
            <p className="text-slate-300">
              Traits are not class inheritance trees; they are registered
              definitions with stat multipliers and event hooks:
              <code>onTakeDamage</code>, <code>onDealDamage</code>,{" "}
              <code>onHearNoise</code>, <code>onTick</code>. Agents can gain or
              lose traits at runtime (e.g. drinking beer adds <code>Drunk</code>
              , zombie bite adds <code>Zombified</code>).
            </p>
          </div>

          {/* Section 5: Seamless Possession */}
          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <h3 className="font-bold text-purple-400 text-sm mb-1.5 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> 5. Seamless Possession Mechanic
            </h3>
            <p className="text-slate-300">
              When possessing an agent, the AI goal stack is suspended with{" "}
              <code>brain.suspend()</code>. The player takes direct WASD and
              mouse aiming control. When unpossessing (Esc),{" "}
              <code>brain.resume()</code> reactivates the AI stack without
              destroying memories or active desires!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
          >
            Got it, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
