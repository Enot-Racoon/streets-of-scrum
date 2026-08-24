import React, { useState } from 'react';
import { World } from '../sim/World';
import { Agent } from '../sim/Agent';
import { ITEM_REGISTRY } from '../sim/Items';
import { Zap, Heart, Shield, Radio, Terminal, ChevronUp, ChevronDown } from 'lucide-react';

interface PossessionHUDProps {
  world: World;
  onUnpossess: () => void;
  onSelectAgent: (agent: Agent) => void;
}

export const PossessionHUD: React.FC<PossessionHUDProps> = ({ world, onUnpossess, onSelectAgent }) => {
  const [logsExpanded, setLogsExpanded] = useState<boolean>(false);
  const possessed = world.possessedAgent;

  return (
    <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex flex-col items-center gap-2 select-none z-10">
      {/* POSSESSED HUD BANNER */}
      {possessed && !possessed.isDead && (
        <div className="pointer-events-auto bg-slate-950/90 border-2 border-purple-500/60 shadow-xl backdrop-blur-md rounded-xl p-3 flex items-center gap-5 text-slate-100 max-w-2xl w-full">
          {/* Avatar & Soul Indicator */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <span className="text-3xl p-1 bg-purple-950/60 border border-purple-500/50 rounded-lg block">
                {possessed.avatarIcon}
              </span>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-purple-200">{possessed.name}</span>
                <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded font-mono border border-purple-700/50">
                  {possessed.job}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  {possessed.health.toFixed(0)}/{possessed.maxHealth}
                </span>
                <span>•</span>
                <span>Speed: x{(possessed.statusEffects.getStatMod('speedMult') || 1.0).toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          {/* Weapon Hotbar */}
          <div className="flex items-center gap-1.5 flex-1 justify-center">
            {possessed.inventory.items.map((item, idx) => {
              const def = ITEM_REGISTRY[item.defId];
              const isEquipped = possessed.inventory.equippedIndex === idx;
              return (
                <button
                  key={item.uid}
                  onClick={() => possessed.inventory.equipIndex(idx)}
                  className={`px-2 py-1 rounded border flex items-center gap-1.5 text-xs font-mono transition ${
                    isEquipped
                      ? 'bg-purple-900/50 border-purple-400 text-purple-200 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-slate-500 font-bold">[{idx + 1}]</span>
                  <span>{def?.icon}</span>
                  <span className="font-sans font-medium text-slate-200">{def?.name}</span>
                </button>
              );
            })}
          </div>

          <div className="h-8 w-px bg-slate-800" />

          {/* Control hints & Unpossess */}
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-slate-400 font-mono text-right leading-tight hidden sm:block">
              <div>WASD: Move | Click: Attack</div>
              <div>E: Open Door | Esc: Release</div>
            </div>
            <button
              onClick={onUnpossess}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md"
            >
              <Zap className="w-3.5 h-3.5" /> Release (Esc)
            </button>
          </div>
        </div>
      )}

      {/* RECENT EVENT LOGS DRAWER */}
      <div className="pointer-events-auto w-full max-w-2xl bg-slate-950/85 border border-slate-800 rounded-lg shadow-lg backdrop-blur-sm overflow-hidden">
        <div
          onClick={() => setLogsExpanded(!logsExpanded)}
          className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 flex items-center justify-between cursor-pointer text-xs text-slate-300 font-mono"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-slate-200">Simulation Event Stream</span>
            <span className="text-[10px] text-slate-500 font-sans">({world.logs.length} events)</span>
          </div>
          <button className="text-slate-400 hover:text-slate-200">
            {logsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Log Entries */}
        <div
          className={`p-2 space-y-1 font-mono text-[11px] overflow-y-auto transition-all ${
            logsExpanded ? 'max-h-48' : 'max-h-14'
          }`}
        >
          {world.logs.length === 0 ? (
            <p className="text-slate-500 italic">No events logged yet...</p>
          ) : (
            world.logs.slice(0, logsExpanded ? 20 : 3).map(log => {
              const typeColor =
                log.type === 'combat'
                  ? 'text-rose-400'
                  : log.type === 'possession'
                  ? 'text-purple-400'
                  : log.type === 'speech'
                  ? 'text-sky-300'
                  : log.type === 'crime'
                  ? 'text-amber-400'
                  : 'text-slate-400';

              return (
                <div key={log.id} className={`flex items-start gap-1.5 ${typeColor}`}>
                  <span className="text-slate-600 shrink-0">
                    [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                  <span>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
