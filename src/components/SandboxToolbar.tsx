import React, { useState } from "react";
import { World } from "../sim/World";
import { ARCHETYPES, spawnArchetype } from "../sim/presets";
import { sounds } from "../sim/sound";
import {
  Play,
  Pause,
  PlusCircle,
  Flame,
  Skull,
  HelpCircle,
  MapPin,
} from "lucide-react";
import { VolumeControll } from "./VolumeControll";

interface SandboxToolbarProps {
  world: World;
  onLoadScenario: (scenario: "district" | "gangwar" | "zombie" | "bar") => void;
  onOpenGuide: () => void;
  onRefresh: () => void;
}

export const SandboxToolbar: React.FC<SandboxToolbarProps> = ({
  world,
  onLoadScenario,
  onOpenGuide,
  onRefresh,
}) => {
  const [selectedArchetype, setSelectedArchetype] =
    useState<string>("Gangster_Crepe");

  const handleSpawnAgent = () => {
    // Find walkable center location
    const cx =
      Math.floor(world.width / 2) + Math.floor((Math.random() - 0.5) * 4);
    const cy =
      Math.floor(world.height / 2) + Math.floor((Math.random() - 0.5) * 4);
    const agent = spawnArchetype(selectedArchetype, cx + 0.5, cy + 0.5);
    world.addAgent(agent);
    sounds.playPossess();
    onRefresh();
  };

  const handleTriggerRiot = () => {
    // Make everyone hostile to everyone!
    for (const a1 of world.agents) {
      for (const a2 of world.agents) {
        if (a1.id !== a2.id) {
          a1.relationships.setRelType(a2.id, "Hostile");
          a1.relationships.modifyHate(a2.id, 90);
        }
      }
      a1.say("АТТАКУЙ ВСЕХ!", true);
    }
    world.addLog({
      timestamp: Date.now(),
      message: "🚨 ГОРОДСКОЙ БУНТ! Все агенты стали враждебными!",
      type: "crime",
    });
    sounds.playAlarm();
    onRefresh();
  };

  const handleDetonateBarrels = () => {
    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        if (world.grid[x][y].type === "Barrel") {
          world.damageTile(x, y, 999);
        }
      }
    }
    onRefresh();
  };

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-slate-200 select-none z-20">
      {/* Brand & Preset Scenarios */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏙️</span>
          <div>
            <h1 className="font-bold text-sm text-slate-100 leading-tight">
              Streets of Rogue
            </h1>
            <p className="text-[10px] text-sky-400 font-mono">
              Agent Simulation Sandbox
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-1" />

        {/* Preset scenario dropdown */}
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Карта:</span>
          <select
            onChange={(e) => onLoadScenario(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 text-slate-200 font-medium"
            defaultValue="district"
          >
            <option value="district">Даунтаун (Сбалансированно)</option>
            <option value="gangwar">Аллея войны банд (Crepe vs Blahd)</option>
            <option value="zombie">Лаборатория зомби</option>
            <option value="bar">Бар и казино</option>
          </select>
        </div>
      </div>

      {/* Center Sim Controls (Play/Pause, Speed, Step) */}
      <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-lg">
        <button
          onClick={() => {
            world.isPaused = !world.isPaused;
            onRefresh();
          }}
          className={`p-1.5 rounded transition ${
            world.isPaused
              ? "bg-amber-600/30 text-amber-300 hover:bg-amber-600/40"
              : "bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40"
          }`}
          title={world.isPaused ? "Resume Simulation" : "Pause Simulation"}
        >
          {world.isPaused ? (
            <Play className="w-4 h-4" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => {
            world.update(0.08);
            onRefresh();
          }}
          disabled={!world.isPaused}
          className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 font-mono"
          title="Step forward 1 tick"
        >
          Step (1t)
        </button>

        <div className="flex items-center gap-0.5 border-l border-slate-800 pl-2">
          {[0.5, 1.0, 2.0, 4.0].map((speed) => (
            <button
              key={speed}
              onClick={() => {
                world.simSpeed = speed;
                onRefresh();
              }}
              className={`px-1.5 py-0.5 text-xs font-mono rounded transition ${
                world.simSpeed === speed
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls: Spawner, Disasters, Guide & Audio */}
      <div className="flex items-center gap-2.5">
        {/* Spawn Agent Widget */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded">
          <select
            value={selectedArchetype}
            onChange={(e) => setSelectedArchetype(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium px-1.5 py-0.5 outline-none"
          >
            {Object.keys(ARCHETYPES).map((key) => (
              <option
                key={key}
                value={key}
                className="bg-slate-900 text-slate-200"
              >
                {ARCHETYPES[key].avatarIcon} {ARCHETYPES[key].name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSpawnAgent}
            className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Создать
          </button>
        </div>

        {/* Disaster triggers */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleTriggerRiot}
            className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded"
            title="Trigger Citywide Riot"
          >
            <Flame className="w-4 h-4" />
          </button>
          <button
            onClick={handleDetonateBarrels}
            className="p-1.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/60 rounded"
            title="Detonate all explosive barrels"
          >
            <Skull className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        <VolumeControll
          initialValue={sounds.masterVolume}
          onChange={(v) => (sounds.masterVolume = v)}
        />

        {/* Architecture Knowledge Guide Modal */}
        <button
          onClick={onOpenGuide}
          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded flex items-center gap-1.5 font-medium transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" /> Guide & SoR AI
          Docs
        </button>
      </div>
    </header>
  );
};
