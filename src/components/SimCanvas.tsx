import React, { useRef, useEffect } from "react";
import type { World } from "../sim/World";
import type { Agent } from "../sim/Agent";
import type { Camera, MousePos } from "../sim/types";
import drawScene from "./drawScene";
import storeValue from "../utils/storeValue";

interface SimCanvasProps {
  world: World;
  onSelectAgent: (agent: Agent) => void;
  onPossessAgent: (agent: Agent) => void;
}

const zoomStore = storeValue("camera-zoom");

export const SimCanvas: React.FC<SimCanvasProps> = ({
  world,
  onSelectAgent,
  onPossessAgent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera>({
    x: 12,
    y: 10,
    zoom: parseInt(zoomStore()) || 34,
  });
  const mousePosRef = useRef<MousePos>({ x: 0, y: 0, worldX: 0, worldY: 0 });
  const keysDownRef = useRef<Record<string, boolean>>({});

  // Setup input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = true;
      keysDownRef.current[e.code.toLowerCase()] = true;

      // Unpossess hotkey (Escape)
      if (e.key === "Escape") {
        e.preventDefault();
        if (world.possessedAgent) {
          world.unpossessCurrent();
        }
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const isShiftPressed = keysDownRef.current["shift"];
        if (world.possessedAgent) {
          isShiftPressed ? world.possessPrevAgent() : world.possessNextAgent();
          onSelectAgent(world.possessedAgent);
        } else {
          isShiftPressed ? world.selectPrevAgent() : world.selectNextAgent();
          onSelectAgent(world.selectedAgent!);
        }
      }

      // Interact hotkey (E / F)
      if (e.key.toLowerCase() === "e" || e.key.toLowerCase() === "f") {
        if (world.possessedAgent) {
          world.possessedAgent.interact();
        } else if (world.possessedAgent !== world.selectedAgent) {
          onPossessAgent(world.selectedAgent);
        }
      }

      // Hotbar slots (1..9)
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        if (world.possessedAgent) {
          world.possessedAgent.inventory.equipIndex(num - 1);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = false;
      keysDownRef.current[e.code.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [world]);

  // Main Render & Simulation Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // 1. Process player possession inputs
      if (world.possessedAgent && !world.possessedAgent.isDead) {
        const p = world.possessedAgent;
        let moveX = 0;
        let moveY = 0;

        if (keysDownRef.current["mouse-1"]) {
          p.combat.attack(
            mousePosRef.current.worldX,
            mousePosRef.current.worldY,
          );
        }

        if (keysDownRef.current["space"]) {
          p.combat.dash(mousePosRef.current.worldX, mousePosRef.current.worldY);
        }

        if (keysDownRef.current["w"] || keysDownRef.current["arrowup"])
          moveY -= 1;
        if (keysDownRef.current["s"] || keysDownRef.current["arrowdown"])
          moveY += 1;
        if (keysDownRef.current["a"] || keysDownRef.current["arrowleft"])
          moveX -= 1;
        if (keysDownRef.current["d"] || keysDownRef.current["arrowright"])
          moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
          const moveAngle = Math.atan2(moveY, moveX);
          p.movement.moveInDirection(moveAngle, dt);
        }
        // else {
        //   world.addLog({
        //     message: "stop",
        //     agentName: p.name,
        //   });
        //   p.movement.stop();
        // }

        // Aim towards mouse world position
        p.facingAngle = Math.atan2(
          mousePosRef.current.worldY - p.y,
          mousePosRef.current.worldX - p.x,
        );

        // Center camera smoothly on possessed agent via ref without trigger component re-render
        const smooth = 0.06;
        cameraRef.current.x += (p.x - cameraRef.current.x) * smooth;
        cameraRef.current.y += (p.y - cameraRef.current.y) * smooth;
      }

      // 2. Update World simulation
      world.update(dt);

      // 3. Draw to Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawScene(ctx, world, cameraRef.current, canvas.width, canvas.height);
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [world]);

  // Canvas Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const zoom = cameraRef.current.zoom;
    const offsetX = canvas.width / 2 - cameraRef.current.x * zoom;
    const offsetY = canvas.height / 2 - cameraRef.current.y * zoom;

    const worldX = (clientX - offsetX) / zoom;
    const worldY = (clientY - offsetY) / zoom;

    mousePosRef.current = { x: clientX, y: clientY, worldX, worldY };

    // Pan camera when right mouse button held
    if (e.buttons === 2) {
      cameraRef.current.x -= e.movementX / zoom;
      cameraRef.current.y -= e.movementY / zoom;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    keysDownRef.current[`mouse-${e.button + 1}`] = false;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    keysDownRef.current[`mouse-${e.button + 1}`] = true;

    if (e.button === 0) {
      // Left click: if possessed, attack in aim direction; else select agent or inspect tile
      if (world.possessedAgent && !world.possessedAgent.isDead) {
        world.possessedAgent.combat.attack(
          mousePosRef.current.worldX,
          mousePosRef.current.worldY,
        );
      } else {
        // Select agent under cursor
        const clickedAgent = world.agents.find((a) => {
          const dist = Math.hypot(
            a.x - mousePosRef.current.worldX,
            a.y - mousePosRef.current.worldY,
          );
          return dist <= (a.radius || 0.4) + 0.2;
        });

        if (clickedAgent) {
          onSelectAgent(clickedAgent);
        }
      }
    }
    if (
      e.buttons === 2 &&
      world.possessedAgent &&
      !world.possessedAgent.isDead
    ) {
      world.possessedAgent.interact();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Double click to possess agent
    const clickedAgent = world.agents.find((a) => {
      const dist = Math.hypot(
        a.x - mousePosRef.current.worldX,
        a.y - mousePosRef.current.worldY,
      );
      return dist <= (a.radius || 0.4) + 0.2;
    });

    if (clickedAgent && !clickedAgent.isDead) {
      onPossessAgent(clickedAgent);
    }
  };

  // Adjust canvas resolution to parent
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -2 : 2;
      const smooth = 0.2;
      cameraRef.current.zoom = Math.max(
        16,
        Math.min(128, cameraRef.current.zoom + zoomDelta * smooth),
      );
      zoomStore(cameraRef.current.zoom.toString());
    };

    canvasRef.current.addEventListener("wheel", handleWheel);
    return () => canvasRef.current?.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};
