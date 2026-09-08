import type { World } from "../World";

export function drawLivingAgents(
  ctx: CanvasRenderingContext2D,
  world: World,
  zoom: number,
) {
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
    if (isSelected && !agent.isPlayerControlled && agent.hasPath) {
      ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      for (
        let i = agent.currentWaypointIndex;
        i < agent.waypoints.length;
        i++
      ) {
        const wp = agent.waypoints[i];
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
    let lhAngle = agent.facingAngle - 0.5;
    let rhAngle = agent.facingAngle + 0.5;
    let handDist = radius * 0.9;
    const swinigDist = 0.5;

    let lhDist = handDist;
    let rhDist = handDist;

    // S
    if (agent.isSwinging) {
      if (agent.swiningHand === "left") {
        lhDist += handDist * swinigDist;
        lhAngle += 0.5 * agent.swingProgress;
      } else {
        rhDist += handDist * swinigDist;
        rhAngle += -0.5 * agent.swingProgress;
      }
    }

    ctx.fillStyle = agent.color;
    // Left hand
    ctx.beginPath();
    ctx.arc(
      ax + Math.cos(lhAngle) * lhDist,
      ay + Math.sin(lhAngle) * lhDist,
      radius * 0.35,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();

    // Right hand & Weapon
    const rhX = ax + Math.cos(rhAngle) * rhDist;
    const rhY = ay + Math.sin(rhAngle) * rhDist;
    ctx.beginPath();
    ctx.arc(rhX, rhY, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Weapon sprite / barrel
    const weapon = agent.getEquippedWeapon();
    const gunTipX = ax + Math.cos(agent.facingAngle + 0.25) * (radius * 1.6);
    const gunTipY = ay + Math.sin(agent.facingAngle + 0.25) * (radius * 1.6);

    if (weapon.type === "gun") {
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(rhX, rhY);
      ctx.lineTo(gunTipX, gunTipY);
      ctx.stroke();
    }
    // else if (agent.isSwinging) {
    //   console.log("Melee swing arc");
    //   // Melee swing arc
    //   ctx.strokeStyle = "#f87171";
    //   ctx.lineWidth = 3;
    //   ctx.beginPath();
    //   ctx.arc(
    //     ax,
    //     ay,
    //     radius * 1.6,
    //     agent.facingAngle - 0.7,
    //     agent.facingAngle + 0.7,
    //   );
    //   ctx.stroke();
    // }

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
    const topGoal = agent.getTopGoal();
    if (!agent.isPlayerControlled && topGoal) {
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
}
