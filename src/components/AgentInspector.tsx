import React, { useState } from "react";
import type { Agent } from "../sim/Agent";
import type { World } from "../sim/World";
import { TRAIT_REGISTRY, type TraitType } from "../sim/traits";
import { ITEM_REGISTRY } from "../sim/Items";
import {
  GoalBattle,
  GoalFlee,
  GoalWander,
  GoalIdle,
} from "../sim/goals/GoalTypes";
import {
  Heart,
  Brain as BrainIcon,
  Sparkles,
  Users,
  Crosshair,
  ShieldAlert,
  Package,
  Plus,
  Trash2,
  Zap,
  ArrowRightCircle,
  Radio,
} from "lucide-react";
import { JobNames } from "../sim/types";
import storeValue from "../utils/storeValue";

interface AgentInspectorProps {
  agent: Agent | null;
  onPossess: (agent: Agent) => void;
  onUnpossess: () => void;
}

type TabName = "goals" | "relations" | "traits" | "inventory";

const activeTabStore = storeValue<TabName>("active_tab");
const selectedTraitToAddStore = storeValue<TraitType>("selected_trait_to_add");
const selectedItemToAddStore = storeValue("selected_item_to_add");

const InspectorHeader = ({
  agent,
  onPossess,
  onUnpossess,
}: AgentInspectorProps) => {
  const isPossessed = agent?.world?.possessedAgent?.id === agent?.id;
  const hpPercent = agent
    ? Math.round((agent.health / agent.maxHealth) * 100)
    : 0;
  return (
    <div className="p-4 bg-slate-950/80 border-b border-slate-800">
      {!!agent && (
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{agent.avatarIcon}</span>
            <div>
              <h2 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
                {agent.name}
                {isPossessed && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded font-mono font-normal">
                    ОДЕРЖИМ
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Роль:{" "}
                <span className="text-sky-400">{JobNames[agent.job]}</span> |
                ID: #{agent.id.slice(-6)}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Позиция: {agent.x.toFixed(2)} x {agent.y.toFixed(2)}
          </div>

          <div className="flex items-center gap-1.5">
            {isPossessed ? (
              <button
                onClick={onUnpossess}
                className="px-2.5 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded transition flex items-center gap-1 shadow-sm whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5" /> Отпустить (Esc)
              </button>
            ) : (
              <button
                onClick={() => onPossess(agent)}
                disabled={agent.isDead}
                className="px-2.5 py-1 text-xs font-semibold bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded transition flex items-center gap-1 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" /> Завладеть телом
              </button>
            )}
          </div>
        </div>
      )}

      {/* Health Bar & Vital Stats */}
      <div className="space-y-1.5 mt-3">
        <div className="flex justify-between text-xs font-mono text-slate-300">
          Убийств: {agent?.kills ?? 0}
        </div>

        {agent?.isDead ? (
          <div className="flex justify-between text-xs font-mono text-slate-300">
            <span className="text-rose-500">
              {agent.killedBy
                ? `Убит ${agent.killedBy !== agent ? agent.killedBy.name : "собой"}`
                : "Убит (сам?)"}
            </span>
          </div>
        ) : null}

        {!!agent && !agent.isDead && (
          <>
            <div className="flex justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />{" "}
                Здоровье
              </span>
              <span>
                {agent.health.toFixed(0)} / {agent.maxHealth} ({hpPercent}%)
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  hpPercent > 50
                    ? "bg-emerald-500"
                    : hpPercent > 25
                      ? "bg-amber-500"
                      : "bg-rose-600"
                }`}
                style={{ width: `${Math.max(0, hpPercent)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Current Brain Thought Banner */}
      {!!agent && !agent?.isDead && (
        <div className="mt-3 p-2 bg-slate-900 rounded border border-slate-800/80 flex items-start gap-2">
          <BrainIcon className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="text-slate-400 font-mono">Занят: </span>
            <span className="text-sky-200 font-medium">
              {isPossessed ? "Контролирует игрок" : agent.lastThought}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const TabsButtons = ({
  agent,
  activeTab,
  onTabChange,
}: {
  agent: Agent;
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}) => (
  <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-medium gap-3 px-3 whitespace-nowrap overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
    <button
      onClick={() => onTabChange("goals")}
      className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
        activeTab === "goals"
          ? "border-sky-500 text-sky-400 bg-slate-900/60"
          : "border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      <BrainIcon className="w-3.5 h-3.5" /> Список задач (
      {agent.goalStack.length})
    </button>

    <button
      onClick={() => onTabChange("relations")}
      className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
        activeTab === "relations"
          ? "border-sky-500 text-sky-400 bg-slate-900/60"
          : "border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      <Users className="w-3.5 h-3.5" /> Отношения (
      {agent.getAllRelationships(true)?.length})
    </button>

    <button
      onClick={() => onTabChange("traits")}
      className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
        activeTab === "traits"
          ? "border-sky-500 text-sky-400 bg-slate-900/60"
          : "border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      <Sparkles className="w-3.5 h-3.5" /> Эффекты(
      {agent.traitNames.length})
    </button>

    <button
      onClick={() => onTabChange("inventory")}
      className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
        activeTab === "inventory"
          ? "border-sky-500 text-sky-400 bg-slate-900/60"
          : "border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      <Package className="w-3.5 h-3.5" /> Инвентарь ({agent.items.length})
    </button>
  </div>
);

const GoalsTab = ({ agent }: { agent: Agent }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Список задач
        <br /> <small className="text-slate-500">(верх = активная)</small>
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => agent.popGoal()}
          disabled={agent.goalStack.length === 0}
          className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300"
        >
          Убрать
        </button>
        <button
          onClick={() => agent.clearAllGoals()}
          disabled={agent.goalStack.length === 0}
          className="px-2 py-0.5 text-[11px] bg-rose-950/60 hover:bg-rose-900 text-rose-300 disabled:opacity-30 rounded"
        >
          Очистить
        </button>
      </div>
    </div>

    {agent.goalStack.length === 0 ? (
      <div className="p-3 bg-slate-950/50 rounded border border-dashed border-slate-800 text-center text-xs text-slate-500">
        Цели закончились.
        <br />
        Агент переключится на поведение по умолчанию.
      </div>
    ) : (
      <div className="space-y-2">
        {[...agent.goalStack].reverse().map((goal, idx) => {
          const isTop = idx === 0;
          return (
            <div
              key={idx}
              className={`p-2.5 rounded border text-xs transition ${
                isTop
                  ? "bg-sky-950/40 border-sky-500/50 shadow-sm"
                  : "bg-slate-950/30 border-slate-800 opacity-70"
              }`}
            >
              <div className="flex items-center justify-between font-mono">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  {isTop ? (
                    <ArrowRightCircle className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  ) : (
                    <span className="w-3.5 text-center text-slate-500">
                      #{agent.goalStack.length - idx}
                    </span>
                  )}
                  {goal.name}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    goal.status === "Active"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : goal.status === "Completed"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {goal.status}
                </span>
              </div>
              {goal.debugInfo && (
                <p className="mt-1 text-[11px] text-slate-400 font-sans">
                  {goal.debugInfo}
                </p>
              )}
            </div>
          );
        })}
      </div>
    )}

    {/* Force Goal Injections */}
    <div className="pt-2 border-t border-slate-800">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
        Назначить цель
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => {
            if (!agent.world) return;
            const nearestEnemy = agent.world.agents.find(
              (a) => a.id !== agent.id && !a.isDead,
            );
            if (nearestEnemy) {
              agent.pushGoal(new GoalBattle(agent, nearestEnemy));
            }
          }}
          className="px-2 py-1.5 text-xs bg-rose-900/40 hover:bg-rose-800 text-rose-200 border border-rose-800/60 rounded flex items-center justify-center gap-1"
        >
          <Crosshair className="w-3.5 h-3.5" /> Атаковать прохожих
        </button>
        <button
          onClick={() => {
            if (!agent.world) return;
            const threat = agent.world.agents.find(
              (a) => a.id !== agent.id && !a.isDead,
            );
            if (threat) {
              agent.pushGoal(new GoalFlee(agent, threat, 6.0));
            }
          }}
          className="px-2 py-1.5 text-xs bg-amber-900/40 hover:bg-amber-800 text-amber-200 border border-amber-800/60 rounded flex items-center justify-center gap-1"
        >
          <ShieldAlert className="w-3.5 h-3.5" /> Напугать
        </button>
        <button
          onClick={() => agent.pushGoal(new GoalWander(agent, 6))}
          className="px-2 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center gap-1"
        >
          Бродить
        </button>
        <button
          onClick={() => agent.pushGoal(new GoalIdle(agent, 4.0))}
          className="px-2 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center gap-1"
        >
          Бездельничать (4s)
        </button>
      </div>
    </div>
  </div>
);

const RelationsTab = ({ agent }: { agent: Agent }) => {
  const relationships = agent.getAllRelationships(true);
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
        Отношения
      </span>

      {relationships.length === 0 ? (
        <div className="p-3 bg-slate-950/50 rounded border border-dashed border-slate-800 text-center text-xs text-slate-500">
          Отношения не отслеживаются.
        </div>
      ) : (
        <div className="space-y-2">
          {relationships.map((rel) => {
            const target = agent?.world?.getAgentById(rel.targetAgentId);
            if (!target) return null;

            const relColor =
              rel.relType === "Hostile"
                ? "text-rose-400 bg-rose-950/40 border-rose-800/50"
                : rel.relType === "Friendly" || rel.relType === "Loyal"
                  ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/50"
                  : rel.relType === "Annoyed"
                    ? "text-amber-400 bg-amber-950/40 border-amber-800/50"
                    : "text-slate-300 bg-slate-950/30 border-slate-800";

            return (
              <div
                key={rel.targetAgentId}
                className={`p-2 rounded border text-xs ${relColor}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>{target.avatarIcon}</span>
                    <span>{target.name}</span>
                  </div>
                  <span className="font-bold text-[11px] uppercase tracking-wider">
                    {rel.relType}
                  </span>
                </div>

                {/* Hate bar & stats */}
                <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Hate Accumulator:</span>
                    <span className="font-mono">
                      {rel.hate.toFixed(0)} / 100
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${Math.min(100, rel.hate)}%` }}
                    />
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>LOS: {rel.hasLOS ? "👁️ Видно" : "🙈 Не видно"}</span>
                    <span>Расстояние: {rel.distance.toFixed(1)}м</span>
                    <span>Ударов: {rel.strikes}</span>
                  </div>
                </div>

                {/* Quick override buttons */}
                <div className="mt-2 flex gap-1 pt-1.5 border-t border-slate-800/60">
                  <button
                    onClick={() => agent.setRelationship(target.id, "Hostile")}
                    className="flex-1 py-0.5 text-[10px] bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded"
                  >
                    Сделать врагом
                  </button>
                  <button
                    onClick={() => agent.setRelationship(target.id, "Friendly")}
                    className="flex-1 py-0.5 text-[10px] bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded"
                  >
                    Сделать другом
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TraitsTab = ({ agent }: { agent: Agent }) => {
  const [selectedTraitToAdd, _setSelectedTraitToAdd] = useState<TraitType>(
    selectedTraitToAddStore() ?? "Fast",
  );
  const setSelectedTraitToAdd = (value: TraitType) => {
    _setSelectedTraitToAdd(value);
    selectedTraitToAddStore(value);
  };

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
        Список эффектов
      </span>

      <div className="space-y-2">
        {agent.getTraits().map((trait) => (
          <div
            key={trait.name}
            className="p-2.5 bg-slate-950/40 rounded border border-slate-800 text-xs relative group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {trait.displayName}
              </span>
              <button
                onClick={() => agent.removeTrait(trait.name as TraitType)}
                className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                title="Remove trait"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-1 text-slate-400 text-[11px] leading-relaxed">
              {trait.description}
            </p>
          </div>
        ))}
      </div>

      {/* Add New Trait */}
      <div className="pt-2 border-t border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Добавить особенность
        </span>
        <div className="flex gap-2">
          <select
            value={selectedTraitToAdd}
            onChange={(e) => setSelectedTraitToAdd(e.target.value as TraitType)}
            className="flex-1 bg-slate-950 border border-slate-700 text-xs rounded px-2 py-1.5 text-slate-200"
          >
            {(Object.keys(TRAIT_REGISTRY) as TraitType[]).map((key) => (
              <option key={key} value={key}>
                {TRAIT_REGISTRY[key].displayName}
              </option>
            ))}
          </select>
          <button
            onClick={() => agent.addTrait(selectedTraitToAdd)}
            className="px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded font-medium flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Добавить
          </button>
        </div>
      </div>
    </div>
  );
};

const InventoryTab = ({ agent }: { agent: Agent }) => {
  const [selectedItemToAdd, _setSelectedItemToAdd] = useState<string>(
    selectedItemToAddStore() ?? "pistol",
  );
  const setSelectedItemToAdd = (value: string) => {
    _setSelectedItemToAdd(value);
    selectedItemToAddStore(value);
  };
  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
        Предметы
      </span>

      <div className="space-y-2">
        {agent.items.map((item, idx) => {
          const def = ITEM_REGISTRY[item.defId];
          if (!def) return null;
          const isEquipped = agent.equippedIndex === idx;

          return (
            <div
              key={item.uid}
              className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                isEquipped
                  ? "bg-sky-950/40 border-sky-500/60 shadow-sm"
                  : "bg-slate-950/30 border-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{def.icon}</span>
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    {def.name}
                    {isEquipped && (
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded font-mono">
                        НАДЕТО
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {def.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {def.type === "consumable" ? (
                  <button
                    onClick={() => agent.useItem(item.uid)}
                    className="px-2 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                  >
                    Применить
                  </button>
                ) : (
                  <button
                    onClick={() => agent.equipIndex(idx)}
                    disabled={isEquipped}
                    className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded"
                  >
                    Надеть
                  </button>
                )}
                <button
                  onClick={() => agent.removeItem(item.uid, 1)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                  title="Drop item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item to Inventory */}
      <div className="pt-2 border-t border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Дать предмет
        </span>
        <div className="flex gap-2">
          <select
            value={selectedItemToAdd}
            onChange={(e) => setSelectedItemToAdd(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 text-xs rounded px-2 py-1.5 text-slate-200"
          >
            {Object.keys(ITEM_REGISTRY).map((iId) => (
              <option key={iId} value={iId}>
                {ITEM_REGISTRY[iId].icon} {ITEM_REGISTRY[iId].name}
              </option>
            ))}
          </select>
          <button
            onClick={() => agent.addItem(selectedItemToAdd, 1)}
            className="px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded font-medium flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Дать
          </button>
        </div>
      </div>
    </div>
  );
};

const InspectorFooer = ({ agent }: { agent: Agent }) => {
  return (
    <div className="p-3 bg-slate-950 border-t border-slate-800 grid grid-cols-3 gap-1.5 text-xs">
      <button
        onClick={() => agent.resurrect()}
        className="py-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded font-medium text-center"
      >
        {agent.isDead ? "Воскресить" : "Исцелить"}
      </button>
      <button
        onClick={() => agent.say("Эй всем привет", true)}
        className="py-1.5 bg-sky-950/60 hover:bg-sky-900 text-sky-300 border border-sky-800/60 rounded font-medium text-center"
      >
        Возглас
      </button>
      <button
        onClick={() => agent.die()}
        disabled={agent.isDead}
        className="py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 disabled:opacity-40 rounded font-medium text-center"
      >
        Убить агента
      </button>
    </div>
  );
};

export const AgentInspector: React.FC<AgentInspectorProps> = ({
  agent,
  onPossess,
  onUnpossess,
}) => {
  const [activeTab, _setActiveTab] = useState<TabName>(
    activeTabStore() ?? "goals",
  );
  const setActiveTab = (value: TabName) => {
    _setActiveTab(value);
    activeTabStore(value);
  };

  if (!agent) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-slate-500 bg-slate-900 border-l border-slate-800">
        <Radio className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
        <p className="text-sm font-medium text-slate-400">Аген т не выбран</p>
        <p className="text-xs text-center mt-1 text-slate-500">
          Нажмите на любого агента в городе или дважды щелкните, чтобы завладеть
          им и взять прямое управление.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-200 overflow-hidden select-none">
      <InspectorHeader
        agent={agent}
        onPossess={onPossess}
        onUnpossess={onUnpossess}
      />

      <TabsButtons
        agent={agent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {activeTab === "goals" && <GoalsTab agent={agent} />}
        {activeTab === "relations" && <RelationsTab agent={agent} />}
        {activeTab === "traits" && <TraitsTab agent={agent} />}
        {activeTab === "inventory" && <InventoryTab agent={agent} />}
      </div>

      <InspectorFooer agent={agent} />
    </div>
  );
};
