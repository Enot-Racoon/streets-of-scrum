import { useState, useEffect, useRef } from "react";
import { World } from "./sim/World";
import { Agent } from "./sim/Agent";
import { SimCanvas } from "./components/SimCanvas";
import { SandboxToolbar } from "./components/SandboxToolbar";
import { AgentInspector } from "./components/AgentInspector";
import { PossessionHUD } from "./components/PossessionHUD";
import { GuideModal } from "./components/GuideModal";
import useForceUpdate from "./utils/useForceUpdate";
import storeValue from "./utils/storeValue";
import { type ScenarioName, buildScenario } from "./sim/presets";
import Camera from "./sim/components/Camera";

const scenarioStore = storeValue<ScenarioName>("scenario");

const initScenario = scenarioStore() ?? "district";

const zoomStore = storeValue("camera-zoom", String, Number);

export default function App() {
  const forceRefresh = useForceUpdate();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const worldRef = useRef<World | null>(null);
  // Initialize World on mount
  if (!worldRef.current) {
    const w = new World(24, 20);
    buildScenario(initScenario, w);
    worldRef.current = w;
  }
  const world = worldRef.current!;

  const cameraRef = useRef<Camera>(null);
  if (!cameraRef.current)
    cameraRef.current = new Camera({
      x: 12,
      y: 10,
      zoom: zoomStore() ?? 34,
    });
  const camera = cameraRef.current!;

  // Keep state sync timer for UI inspect updates
  useEffect(() => {
    const interval = setInterval(forceRefresh, 150);
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

  const handleLocateEvent = (x: number, y: number) => {
    camera.moveTo(x, y, 0.3);
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
            camera={camera}
            onSelectAgent={handleSelectAgent}
            onPossessAgent={handlePossessAgent}
          />

          {/* Bottom Possession HUD and Event Logs */}
          <PossessionHUD
            world={world}
            onUnpossess={handleUnpossess}
            onSelectAgent={handleSelectAgent}
            onLocateEvent={handleLocateEvent}
          />
        </div>

        {/* Right Inspector & Goal Stack Sidebar */}
        <div className="w-80 md:w-96 h-full flex-shrink-0 z-10 shadow-2xl">
          <AgentInspector
            agent={
              selectedAgent || world.selectedAgent || world.agents[0] || null
            }
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
