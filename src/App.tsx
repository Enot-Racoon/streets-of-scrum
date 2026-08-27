/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { World } from "./sim/World";
import { Agent } from "./sim/Agent";
import {
  buildDistrictMap,
  buildGangWarScenario,
  buildZombieOutbreakScenario,
  buildBarCasinoScenario,
} from "./sim/presets";
import { SimCanvas } from "./components/SimCanvas";
import { SandboxToolbar } from "./components/SandboxToolbar";
import { AgentInspector } from "./components/AgentInspector";
import { PossessionHUD } from "./components/PossessionHUD";
import { GuideModal } from "./components/GuideModal";
import useForceUpdate from "./utils/useForceUpdate";
import storeValue from "./utils/storeValue";
import type { ScenarioName } from "./types";

const scenarioStore = storeValue<ScenarioName>("scenario");

const buildScenario = (scenario: ScenarioName, world: World) => {
  world.agents = [];
  world.projectiles = [];
  world.particles = [];
  world.noiseEvents = [];
  world.droppedItems = [];
  world.logs = [];
  world.possessedAgent = null;

  if (scenario === "district") {
    buildDistrictMap(world);
  } else if (scenario === "gangwar") {
    buildGangWarScenario(world);
  } else if (scenario === "zombie") {
    buildZombieOutbreakScenario(world);
  } else if (scenario === "bar") {
    buildBarCasinoScenario(world);
  }
};

const initScenario = scenarioStore() ?? "district";

export default function App() {
  const worldRef = useRef<World | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const forceRefresh = useForceUpdate();

  // Initialize World on mount
  if (!worldRef.current) {
    const w = new World(24, 20);
    buildScenario(initScenario, w);
    worldRef.current = w;
  }

  const world = worldRef.current!;

  // Keep state sync timer for UI inspect updates
  useEffect(() => {
    const interval = setInterval(() => {
      forceRefresh();
    }, 150);
    return () => clearInterval(interval);
  }, [forceRefresh]);

  const handleLoadScenario = (scenario: ScenarioName) => {
    scenarioStore(scenario);
    buildScenario(scenario, world);
    setSelectedAgent(world.agents[0] || null);
    forceRefresh();
  };

  const handleSelectAgent = (agent: Agent) => {
    world.selectedAgent = agent;
    setSelectedAgent(agent);
    forceRefresh();
  };

  const handlePossessAgent = (agent: Agent) => {
    world.possessAgent(agent);
    setSelectedAgent(agent);
    forceRefresh();
  };

  const handleUnpossess = () => {
    world.unpossessCurrent();
    forceRefresh();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Sandbox Navigation Bar */}
      <SandboxToolbar
        world={world}
        initScenario={initScenario}
        onLoadScenario={handleLoadScenario}
        onOpenGuide={() => setIsGuideOpen(true)}
        onRefresh={forceRefresh}
      />

      {/* Main Workspace: Canvas Area + Right Inspector Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Simulation Canvas Area */}
        <div className="flex-1 relative h-full">
          <SimCanvas
            world={world}
            onSelectAgent={handleSelectAgent}
            onPossessAgent={handlePossessAgent}
          />

          {/* Bottom Possession HUD and Event Logs */}
          <PossessionHUD
            world={world}
            onUnpossess={handleUnpossess}
            onSelectAgent={handleSelectAgent}
          />
        </div>

        {/* Right Inspector & Goal Stack Sidebar */}
        <div className="w-80 md:w-96 h-full flex-shrink-0 z-10 shadow-2xl">
          <AgentInspector
            agent={
              selectedAgent || world.selectedAgent || world.agents[0] || null
            }
            world={world}
            onPossess={handlePossessAgent}
            onUnpossess={handleUnpossess}
          />
        </div>
      </div>

      {/* Architecture Guide & SoS AI Documentation Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
