import React, { useRef, useEffect } from "react";
import type { World } from "../sim/World";
import type { Agent } from "../sim/Agent";
import type { Mouse } from "../sim/types";
import drawScene from "./drawScene";
import storeValue from "../utils/storeValue";
import type Camera from "../sim/components/Camera";
import Keyboard from "../sim/components/Keyboard";

interface SimCanvasProps {
  world: World;
  camera: Camera;
  onSelectAgent: (agent: Agent) => void;
  onPossessAgent: (agent: Agent) => void;
}

const zoomStore = storeValue("camera-zoom", String, Number);

export const SimCanvas: React.FC<SimCanvasProps> = ({
  world,
  camera,
  onSelectAgent,
  onPossessAgent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const mouseRef = useRef<Mouse>(null);
  if (!mouseRef.current)
    mouseRef.current = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      worldX: 0,
      worldY: 0,
      buttons: {} as never,
    };
  const mouse = mouseRef.current!;

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

  // Handle Mouse interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const zoom = camera.zoom;
      const offsetX = canvas.width / 2 - camera.x * zoom;
      const offsetY = canvas.height / 2 - camera.y * zoom;

      const worldX = (clientX - offsetX) / zoom;
      const worldY = (clientY - offsetY) / zoom;

      mouse.dx = clientX - mouse.x;
      mouse.dy = clientY - mouse.y;

      mouse.x = clientX;
      mouse.y = clientY;
      mouse.worldX = worldX;
      mouse.worldY = worldY;
    };

    const buttons = ["left", "wheel", "right", "back", "forward"] as const;

    const handleMouseUp = (e: MouseEvent) => {
      if (mouse.buttons.forward || mouse.buttons.back) {
        e.preventDefault();
      }
      mouse.buttons[buttons[e.button]] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      mouse.buttons[buttons[e.button]] = true;
      if (mouse.buttons.forward || mouse.buttons.back) {
        e.preventDefault();
      }

      const possessedAgent = !world.possessedAgent?.isDead
        ? world.possessedAgent
        : null;

      // Left click
      if (mouse.buttons.left) {
        // Select agent under cursor
        const clickedAgent = world.agents.find((a) => {
          const dist = Math.hypot(a.x - mouse.worldX, a.y - mouse.worldY);
          return dist <= (a.radius || 0.4) + 0.2;
        });

        if (clickedAgent) onSelectAgent(clickedAgent);
      }

      if (mouse.buttons.right && possessedAgent) possessedAgent.interact();
    };

    const handleDoubleClick = (e: MouseEvent) => {
      const clickedAgent = world.agents.find((a) => {
        const dist = Math.hypot(a.x - mouse.worldX, a.y - mouse.worldY);
        return dist <= (a.radius || 0.4) + 0.2;
      });
      if (clickedAgent && !clickedAgent.isDead) onPossessAgent(clickedAgent);
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.zoomBy(e.deltaY * 0.2);
      zoomStore(camera.zoom);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("dblclick", handleDoubleClick);
    canvas.addEventListener("contextmenu", handleContextMenu);
    canvas.addEventListener("wheel", handleWheel);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("dblclick", handleDoubleClick);
      canvas.removeEventListener("contextmenu", handleContextMenu);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [world]);

  // Main Render & Simulation Animation Loop
  useEffect(() => {
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

      // Unpossess
      if (Keyboard.wasPressed("escape") && possessedAgent)
        world.unpossessCurrent();

      // Possess / unpossess
      if (Keyboard.wasPressed("e")) {
        // Possess / unpossess hotkey (E)
        if (possessedAgent) {
          world.unpossessCurrent();
        } else if (world.selectedAgent) {
          onPossessAgent(world.selectedAgent);
        }
      }

      // Mouse movement
      if (mouse.dx !== 0 || mouse.dy !== 0) {
        if (possessedAgent) {
          // Aim towards mouse world position
          possessedAgent.facingAngle = Math.atan2(
            mouse.worldY - possessedAgent.y,
            mouse.worldX - possessedAgent.x,
          );
        } else if (mouse.buttons.right) {
          // Pan camera when right mouse button held
          camera.moveBy(-mouse.dx / camera.zoom, -mouse.dy / camera.zoom);
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
          const cameraSpeed = Math.max(0.2, 1 - 0.005 * camera.zoom);
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
          console.log(mouse.buttons);
          if (Keyboard.isDown("control") || mouse.buttons.right)
            possessedAgent.dash(undefined, undefined, 3.0);

          if (Keyboard.isDown("space") || mouse.buttons.left)
            possessedAgent.attack();
        }

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

      // Reset mouse delta
      if (mouse.dx !== 0 || mouse.dy !== 0) {
        mouse.dx = 0;
        mouse.dy = 0;
      }

      // Draw to Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) drawScene(ctx, world, camera, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [world]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
      />
    </div>
  );
};
