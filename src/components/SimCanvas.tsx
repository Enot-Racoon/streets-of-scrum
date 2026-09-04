import React, { useRef, useEffect } from "react";
import type { World } from "../sim/World";
import type { Agent } from "../sim/Agent";
import type { MousePos } from "../sim/types";
import drawScene from "./drawScene";
import storeValue from "../utils/storeValue";
import Camera from "../sim/components/Camera";
import Keyboard from "../sim/components/Keyboard";

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
  const cameraRef = useRef<Camera>(
    new Camera({ x: 12, y: 10, zoom: parseInt(zoomStore()) ?? 34 }),
  );
  const mousePosRef = useRef<MousePos>({ x: 0, y: 0, worldX: 0, worldY: 0 });
  const keysDownRef = useRef<Record<string, boolean>>({});

  // Setup input handlers
  useEffect(() => {
    const preventDefaults = (e: KeyboardEvent) => {
      ["tab"].some((k) =>
        [e.key.toLowerCase(), e.code.toLowerCase()].includes(k),
      ) && e.preventDefault();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      preventDefaults(e);
      Keyboard.handleKeyDown(e);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", Keyboard.handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", Keyboard.handleKeyUp);
    };
  }, [world]);

  // Main Render & Simulation Animation Loop
  useEffect(() => {
    const camera = cameraRef.current;
    const mouse = mousePosRef.current;

    let animationFrameId: number;
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const possessedAgent = !world.possessedAgent?.isDead
        ? world.possessedAgent
        : null;

      // Next / previous agent hotkeys
      if (Keyboard.wasPressed("tab")) {
        const isShiftPressed = Keyboard.isDown("shift");
        if (possessedAgent) {
          isShiftPressed ? world.possessPrevAgent() : world.possessNextAgent();
          onSelectAgent(possessedAgent);
        } else {
          isShiftPressed ? world.selectPrevAgent() : world.selectNextAgent();
          if (world.selectedAgent) {
            onSelectAgent(world.selectedAgent);
            if (camera)
              camera.moveTo(world.selectedAgent.x, world.selectedAgent.y, 0.3);
          }
        }
      }

      if (Keyboard.wasPressed("escape") && possessedAgent)
        world.unpossessCurrent();

      if (Keyboard.wasPressed("e")) {
        // Possess / unpossess hotkey (E)
        if (possessedAgent) {
          world.unpossessCurrent();
        } else {
          onPossessAgent(world.selectedAgent);
        }
      }

      // Movement keys
      const upKey = Keyboard.isDown("w", "arrowup");
      const downKey = Keyboard.isDown("s", "arrowdown");
      const leftKey = Keyboard.isDown("a", "arrowleft");
      const rightKey = Keyboard.isDown("d", "arrowright");

      // Move possessed agent or camera
      let moveX = 0;
      let moveY = 0;
      if (upKey) moveY -= 1;
      if (downKey) moveY += 1;
      if (leftKey) moveX -= 1;
      if (rightKey) moveX += 1;
      if (moveX !== 0 || moveY !== 0) {
        if (possessedAgent) {
          possessedAgent.moveInDirection(Math.atan2(moveY, moveX));
        } else {
          const cameraSpeed = 0.2;
          camera.moveBy(moveX * cameraSpeed, moveY * cameraSpeed);
        }
      } else if (possessedAgent) {
        possessedAgent.stop();
      }

      // Process player possession inputs
      if (possessedAgent) {
        // Hotbar slots (1..9)
        [...Array(9).keys()].forEach((idx) => {
          if (Keyboard.wasPressed(`${idx + 1}`)) possessedAgent.equipIndex(idx);
        });

        if (mouse) {
          if (Keyboard.isDown("control"))
            possessedAgent.dash(mouse.worldX, mouse.worldY);
          if (Keyboard.isDown("mouse1", "space"))
            possessedAgent.attack(mouse.worldX, mouse.worldY);
        }

        // Aim towards mouse world position
        possessedAgent.facingAngle = Math.atan2(
          mousePosRef.current.worldY - possessedAgent.y,
          mousePosRef.current.worldX - possessedAgent.x,
        );

        if (camera) camera.moveTo(possessedAgent.x, possessedAgent.y, 0.3);
      }

      // Zoom hotkeys
      if (camera) {
        if (Keyboard.isDown("-")) camera.zoomBy(-1);
        if (Keyboard.isDown("=", "+")) camera.zoomBy(+1);
      }

      // Update World simulation
      world.update(dt);
      camera.update(dt);
      Keyboard.update();

      // Draw to Canvas
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
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const zoom = camera.zoom;
    const offsetX = canvas.width / 2 - camera.x * zoom;
    const offsetY = canvas.height / 2 - camera.y * zoom;

    const worldX = (clientX - offsetX) / zoom;
    const worldY = (clientY - offsetY) / zoom;

    mousePosRef.current = { x: clientX, y: clientY, worldX, worldY };

    // Pan camera when right mouse button held
    if (e.buttons === 2) {
      camera.moveBy(-e.movementX / zoom, -e.movementY / zoom);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    keysDownRef.current[`mouse${e.button + 1}`] = false;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    keysDownRef.current[`mouse${e.button + 1}`] = true;

    if (e.button === 0) {
      // Left click: if possessed, attack in aim direction; else select agent or inspect tile
      if (world.possessedAgent && !world.possessedAgent.isDead) {
        world.possessedAgent.attack(
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

  // Handle window resize
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

  // Handle mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.zoomBy(Math.sign(e.deltaY) * 0.3);
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
