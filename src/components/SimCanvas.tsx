import React, { useRef, useEffect, useState, useCallback } from "react";
import { World } from "../sim/World";
import { Agent } from "../sim/Agent";
import { ITEM_REGISTRY } from "../sim/Items";

interface SimCanvasProps {
  world: World;
  onSelectAgent: (agent: Agent) => void;
  onPossessAgent: (agent: Agent) => void;
}

export const SimCanvas: React.FC<SimCanvasProps> = ({
  world,
  onSelectAgent,
  onPossessAgent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef({ x: 12, y: 10, zoom: 34 });
  const mousePosRef = useRef({ x: 0, y: 0, worldX: 0, worldY: 0 });
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
        if (world.possessedAgent) {
          world.possessNextAgent();
        } else if (world.selectedAgent) {
          world.selectNextAgent();
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
          if (world.possessedAgent && !world.possessedAgent.isDead) {
            world.possessedAgent.combat.attack(
              mousePosRef.current.worldX,
              mousePosRef.current.worldY,
            );
          }
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
        } else {
          p.movement.stop();
        }

        // Aim towards mouse world position
        p.facingAngle = Math.atan2(
          mousePosRef.current.worldY - p.y,
          mousePosRef.current.worldX - p.x,
        );

        // Center camera smoothly on possessed agent via ref without trigger component re-render
        cameraRef.current.x += (p.x - cameraRef.current.x) * 0.12;
        cameraRef.current.y += (p.y - cameraRef.current.y) * 0.12;
      }

      // 2. Update World simulation
      world.update(dt);

      // 3. Draw to Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawScene(ctx, canvas.width, canvas.height);
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [world]);

  // Draw scene
  const drawScene = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    ctx.clearRect(0, 0, width, height);

    const zoom = cameraRef.current.zoom;
    const offsetX = width / 2 - cameraRef.current.x * zoom;
    const offsetY = height / 2 - cameraRef.current.y * zoom;

    // Dark grid background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // 1. Draw Tiles
    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        const tile = world.grid[x][y];
        const tx = x * zoom;
        const ty = y * zoom;

        // Floor
        ctx.fillStyle = (x + y) % 2 === 0 ? "#1e293b" : "#334155";
        ctx.fillRect(tx, ty, zoom, zoom);
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1;
        ctx.strokeRect(tx, ty, zoom, zoom);

        // Tile specific graphics
        if (tile.type === "Wall") {
          ctx.fillStyle = "#475569";
          ctx.fillRect(tx, ty, zoom, zoom);
          // 3D wall top bevel
          ctx.fillStyle = "#64748b";
          ctx.fillRect(tx + 2, ty + 2, zoom - 4, zoom - 6);
          ctx.strokeStyle = "#1e293b";
          ctx.strokeRect(tx, ty, zoom, zoom);
        } else if (tile.type === "Door") {
          if (tile.isOpen) {
            ctx.fillStyle = "#854d0e";
            ctx.fillRect(tx, ty, 6, zoom);
          } else {
            ctx.fillStyle = "#b45309";
            ctx.fillRect(tx + 2, ty + 2, zoom - 4, zoom - 4);
            ctx.fillStyle = "#fef08a";
            ctx.beginPath();
            ctx.arc(tx + zoom / 2, ty + zoom / 2, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (tile.type === "Glass") {
          ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
          ctx.fillRect(tx + 3, ty + 3, zoom - 6, zoom - 6);
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.strokeRect(tx + 3, ty + 3, zoom - 6, zoom - 6);
        } else if (tile.type === "Crate") {
          ctx.fillStyle = "#92400e";
          ctx.fillRect(tx + 4, ty + 4, zoom - 8, zoom - 8);
          ctx.strokeStyle = "#78350f";
          ctx.lineWidth = 2;
          ctx.strokeRect(tx + 4, ty + 4, zoom - 8, zoom - 8);
          // X pattern
          ctx.beginPath();
          ctx.moveTo(tx + 4, ty + 4);
          ctx.lineTo(tx + zoom - 4, ty + zoom - 4);
          ctx.moveTo(tx + zoom - 4, ty + 4);
          ctx.lineTo(tx + 4, ty + zoom - 4);
          ctx.stroke();
        } else if (tile.type === "Barrel") {
          ctx.fillStyle = "#dc2626";
          ctx.beginPath();
          ctx.arc(tx + zoom / 2, ty + zoom / 2, zoom * 0.36, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fbbf24";
          ctx.font = `bold ${zoom * 0.35}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("⚡", tx + zoom / 2, ty + zoom / 2);
        } else if (tile.type === "ATM") {
          ctx.fillStyle = "#0284c7";
          ctx.fillRect(tx + 4, ty + 4, zoom - 8, zoom - 8);
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(tx + 6, ty + 6, zoom - 12, zoom * 0.3);
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${zoom * 0.3}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("$", tx + zoom / 2, ty + zoom * 0.7);
        }
      }
    }

    // 2. Draw Noise Ripple Waves
    const now = Date.now();
    for (const noise of world.noiseEvents) {
      const age = (now - noise.timestamp) / 1000;
      if (age < 1.2) {
        const radius = age * (noise.radius * 0.9) * zoom;
        const alpha = Math.max(0, 1.0 - age / 1.2) * 0.4;
        ctx.strokeStyle =
          noise.noiseType === "gunshot"
            ? `rgba(239, 68, 68, ${alpha})`
            : `rgba(234, 179, 8, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(noise.x * zoom, noise.y * zoom, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 3. Draw Dropped Items
    for (const item of world.droppedItems) {
      const def = ITEM_REGISTRY[item.defId];
      const ix = item.x * zoom;
      const iy = item.y * zoom;

      ctx.fillStyle = "rgba(234, 179, 8, 0.25)";
      ctx.beginPath();
      ctx.arc(ix, iy, zoom * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `${zoom * 0.4}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(def ? def.icon : "📦", ix, iy);
    }

    // 4. Draw Dead Agent Corpses
    for (const agent of world.agents) {
      if (agent.isDead) {
        const ax = agent.x * zoom;
        const ay = agent.y * zoom;

        // Blood pool
        ctx.fillStyle = "rgba(185, 28, 28, 0.75)";
        ctx.beginPath();
        ctx.arc(ax, ay, zoom * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#64748b";
        ctx.beginPath();
        ctx.arc(ax, ay, zoom * 0.28, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `${zoom * 0.35}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💀", ax, ay);
      }
    }

    // 5. Draw Living Agents
    for (const agent of world.agents) {
      if (agent.isDead) continue;

      const ax = agent.x * zoom;
      const ay = agent.y * zoom;
      const radius = (agent.radius || 0.38) * zoom;
      const isSelected = world.selectedAgent?.id === agent.id;
      const isPossessed = world.possessedAgent?.id === agent.id;

      // Selection / Possession Ring
      if (isPossessed) {
        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ax, ay, radius + 6, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsing glow
        ctx.fillStyle = "rgba(192, 132, 252, 0.2)";
        ctx.beginPath();
        ctx.arc(
          ax,
          ay,
          radius + 8 + Math.sin(Date.now() * 0.008) * 3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else if (isSelected) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(ax, ay, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Vision Cone (if selected or possessed)
      if (isSelected || isPossessed) {
        const vRange = agent.getVisionRange() * zoom;
        const vAngle = agent.facingAngle;
        const vCone = Math.PI * 0.45;

        const grad = ctx.createRadialGradient(ax, ay, 0, ax, ay, vRange);
        grad.addColorStop(
          0,
          isPossessed ? "rgba(168, 85, 247, 0.2)" : "rgba(56, 189, 248, 0.15)",
        );
        grad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.arc(ax, ay, vRange, vAngle - vCone / 2, vAngle + vCone / 2);
        ctx.closePath();
        ctx.fill();
      }

      // Path line preview for AI debugging
      if (
        isSelected &&
        !agent.isPlayerControlled &&
        agent.pathfindingAI.hasPath
      ) {
        ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        for (
          let i = agent.pathfindingAI.currentWaypointIndex;
          i < agent.pathfindingAI.path.length;
          i++
        ) {
          const wp = agent.pathfindingAI.path[i];
          ctx.lineTo(wp.x * zoom, wp.y * zoom);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Body circle
      ctx.fillStyle = agent.color;
      ctx.beginPath();
      ctx.arc(ax, ay, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Direction / Hands / Weapon
      const handDist = radius * 0.9;
      const handAngle1 = agent.facingAngle - 0.5;
      const handAngle2 = agent.facingAngle + 0.5;

      ctx.fillStyle = agent.color;
      // Left hand
      ctx.beginPath();
      ctx.arc(
        ax + Math.cos(handAngle1) * handDist,
        ay + Math.sin(handAngle1) * handDist,
        radius * 0.35,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();

      // Right hand & Weapon
      const rhX = ax + Math.cos(handAngle2) * handDist;
      const rhY = ay + Math.sin(handAngle2) * handDist;
      ctx.beginPath();
      ctx.arc(rhX, rhY, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Weapon sprite / barrel
      const weapon = agent.inventory.getEquippedWeaponDef();
      const gunTipX = ax + Math.cos(agent.facingAngle) * (radius * 1.6);
      const gunTipY = ay + Math.sin(agent.facingAngle) * (radius * 1.6);

      if (weapon.type === "gun") {
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(rhX, rhY);
        ctx.lineTo(gunTipX, gunTipY);
        ctx.stroke();
      } else if (agent.combat.isSwinging) {
        // Melee swing arc
        ctx.strokeStyle = "#f87171";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
          ax,
          ay,
          radius * 1.6,
          agent.facingAngle - 0.7,
          agent.facingAngle + 0.7,
        );
        ctx.stroke();
      }

      // Icon Avatar
      ctx.font = `${radius * 1.0}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(agent.avatarIcon, ax, ay);

      // Name & Job Tag
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = "#f8fafc";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 4;
      ctx.fillText(agent.name, ax, ay - radius - 14);
      ctx.shadowBlur = 0;

      // Health Bar
      const hpWidth = zoom * 0.9;
      const hpHeight = 5;
      const hpRatio = Math.max(0, agent.health / agent.maxHealth);
      const hpBarX = ax - hpWidth / 2;
      const hpBarY = ay - radius - 8;

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(hpBarX, hpBarY, hpWidth, hpHeight);
      ctx.fillStyle =
        hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#eab308" : "#ef4444";
      ctx.fillRect(hpBarX, hpBarY, hpWidth * hpRatio, hpHeight);
      ctx.strokeStyle = "#090d16";
      ctx.lineWidth = 1;
      ctx.strokeRect(hpBarX, hpBarY, hpWidth, hpHeight);

      // Goal badge / Thought above head
      if (!agent.isPlayerControlled && agent.brain.getTopGoal()) {
        const topGoal = agent.brain.getTopGoal()!;
        let goalIcon = "💭";
        if (topGoal.name === "GoalBattle") goalIcon = "⚔️";
        if (topGoal.name === "GoalFlee") goalIcon = "💨";
        if (topGoal.name === "GoalInvestigate") goalIcon = "🔍";
        if (topGoal.name === "GoalTattle") goalIcon = "📢";

        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(goalIcon, ax + radius + 6, ay - radius);
      }

      // Speech Bubble
      if (agent.speechBubble) {
        const text = agent.speechBubble.text;
        ctx.font = "11px sans-serif";
        const textMetrics = ctx.measureText(text);
        const bubbleW = textMetrics.width + 12;
        const bubbleH = 20;
        const bubbleX = ax - bubbleW / 2;
        const bubbleY = ay - radius - 38;

        ctx.fillStyle = agent.speechBubble.isYell ? "#ef4444" : "#ffffff";
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6);
        ctx.fill();
        ctx.stroke();

        // Bubble tail
        ctx.beginPath();
        ctx.moveTo(ax - 4, bubbleY + bubbleH);
        ctx.lineTo(ax, bubbleY + bubbleH + 6);
        ctx.lineTo(ax + 4, bubbleY + bubbleH);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = agent.speechBubble.isYell ? "#ffffff" : "#0f172a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, ax, bubbleY + bubbleH / 2);
      }
    }

    // 6. Draw Projectiles
    for (const p of world.projectiles) {
      ctx.fillStyle = p.color || "#fbbf24";
      ctx.beginPath();
      ctx.arc(
        p.x * zoom,
        p.y * zoom,
        (p.radius || 0.12) * zoom,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Tracer
      ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x * zoom, p.y * zoom);
      ctx.lineTo((p.x - p.vx * 0.03) * zoom, (p.y - p.vy * 0.03) * zoom);
      ctx.stroke();
    }

    // 7. Draw Particles
    for (const pt of world.particles) {
      const alpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pt.x * zoom, pt.y * zoom, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  };

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
      cameraRef.current.zoom = Math.max(
        16,
        Math.min(64, cameraRef.current.zoom + zoomDelta * 0.1),
      );
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
        // onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};
