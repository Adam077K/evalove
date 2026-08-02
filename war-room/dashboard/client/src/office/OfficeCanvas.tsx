import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  OFFICE_MAP,
  WALL,
  DESK,
  COFFEE,
  SERVER,
  MEETING,
  ZONE_LABELS,
} from './map';
import { AgentSprite, deriveColor } from './AgentSprite';
import { getZoneForCeo, getTargetForCeo, getZoneForSubagent } from './zones';

// Catppuccin Mocha palette tile colors — used for fallback rendering only
const TILE_COLORS: Record<number, string> = {
  0: '#313244',
  1: '#181825',
  2: '#45475a',
  3: '#585b70',
  4: '#3b3f51',
  5: '#2a2d3d',
  6: '#3d3f52',
  7: '#404358',
  8: '#45475a',
};

// Target 15 FPS
const FRAME_MS = 1000 / 15;

// Background image aspect ratio: 2400 / 1792 = 1.339...
const BG_ASPECT = 2400 / 1792;

// Load the background image once at module level
const bgImage = new Image();
bgImage.src = '/Office Background.png';

// Draw the static background at given dimensions
function buildBackground(w: number, h: number): HTMLCanvasElement {
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const ctx = offscreen.getContext('2d')!;

  if (bgImage.complete && bgImage.naturalWidth > 0) {
    ctx.drawImage(bgImage, 0, 0, w, h);
  } else {
    // Fallback: programmatic tile rendering while image loads
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, w, h);

    const tileW = w / MAP_WIDTH;
    const tileH = h / MAP_HEIGHT;

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = OFFICE_MAP[y][x];
        const color = TILE_COLORS[tile] ?? '#313244';

        ctx.fillStyle = color;
        ctx.fillRect(x * tileW, y * tileH, tileW, tileH);

        if (tile !== WALL) {
          ctx.strokeStyle = '#1e1e2e';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x * tileW + 0.25, y * tileH + 0.25, tileW - 0.5, tileH - 0.5);
        }
      }
    }

    // Furniture overlays
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = OFFICE_MAP[y][x];
        const px = x * tileW;
        const py = y * tileH;

        if (tile === DESK) {
          ctx.fillStyle = '#585b70';
          ctx.beginPath();
          ctx.roundRect(px + tileW * 0.1, py + tileH * 0.2, tileW * 0.7, tileH * 0.5, 2);
          ctx.fill();
          ctx.fillStyle = '#89b4fa';
          ctx.beginPath();
          ctx.roundRect(px + tileW * 0.2, py + tileH * 0.1, tileW * 0.4, tileH * 0.25, 1);
          ctx.fill();
        }

        if (tile === COFFEE) {
          ctx.fillStyle = '#f9e2af';
          ctx.beginPath();
          ctx.arc(px + tileW / 2, py + tileH / 2, tileW * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }

        if (tile === SERVER) {
          ctx.fillStyle = '#6c7086';
          ctx.beginPath();
          ctx.roundRect(px + tileW * 0.2, py + tileH * 0.05, tileW * 0.6, tileH * 0.9, 2);
          ctx.fill();
          ctx.fillStyle = '#a6e3a1';
          ctx.beginPath();
          ctx.arc(px + tileW * 0.35, py + tileH * 0.25, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        if (tile === MEETING) {
          ctx.fillStyle = '#585b7088';
          ctx.beginPath();
          ctx.roundRect(px + 3, py + 3, tileW - 6, tileH - 6, 2);
          ctx.fill();
        }
      }
    }

    // Zone labels
    ctx.font = `bold ${Math.round(tileH * 0.28)}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6c7086';
    for (const lbl of ZONE_LABELS) {
      ctx.fillText(lbl.text, lbl.x * tileW, lbl.y * tileH);
    }
  }

  return offscreen;
}

// Keep the old TILE_SIZE import used just so the import doesn't error
const _unusedTileSize = TILE_SIZE;
void _unusedTileSize;

export function OfficeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);
  const agentsRef = useRef<Map<string, AgentSprite>>(new Map());
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const ceos = useStore((s) => s.ceos);

  // Canvas dimensions — responsive, fills container width
  const [canvasSize, setCanvasSize] = useState({ w: 960, h: 768 });

  // Observe container width and update canvas size accordingly
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      // Keep full resolution internally but constrain display via CSS max-height
      const w = Math.max(320, Math.min(width, 1280));
      const h = Math.round(w / BG_ASPECT);
      setCanvasSize({ w, h });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Animation loop — draws bg image directly every frame (no offscreen buffer needed at 15fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let running = true;

    function renderFrame(now: number) {
      if (!running) return;
      rafRef.current = requestAnimationFrame(renderFrame);

      if (now - lastFrameRef.current < FRAME_MS) return;
      lastFrameRef.current = now;

      if (!ctx) return;

      const cw = canvas!.width;
      const ch = canvas!.height;

      // Update all agent positions with current canvas dimensions
      for (const agent of agentsRef.current.values()) {
        agent.update(cw, ch);
      }

      // Draw background directly from the loaded image — no stale buffer, no black flash
      if (bgImage.complete && bgImage.naturalWidth > 0) {
        ctx.drawImage(bgImage, 0, 0, cw, ch);
      } else {
        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(0, 0, cw, ch);
      }

      // Sort agents: workers first (drawn below), CEOs last (drawn on top)
      const sortedAgents = [...agentsRef.current.values()].sort(
        (a, b) => b.layer - a.layer,
      );

      for (const agent of sortedAgents) {
        agent.draw(ctx, now, cw, ch);
      }
    }

    rafRef.current = requestAnimationFrame(renderFrame);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Sync agent sprites with CEO/subagent state
  useEffect(() => {
    const agents = agentsRef.current;
    const activeIds = new Set<string>();

    for (const ceo of ceos) {
      const ceoId = `ceo-${ceo.n}`;
      activeIds.add(ceoId);

      let ceoSprite = agents.get(ceoId);
      if (!ceoSprite) {
        // Spawn in war room center (percentage coordinates)
        ceoSprite = new AgentSprite(
          ceo.n,
          ceoId,
          1,
          ceo.color,
          `CEO-${ceo.n}`,
          42,  // xPct — war room center
          28,  // yPct
        );
        agents.set(ceoId, ceoSprite);
      }

      // Determine behavior: roaming (no task) vs working (has task)
      const hasTask = ceo.task && ceo.task !== '—' && ceo.task !== '\u2014' && ceo.task.trim() !== '';
      let zone: string;

      if (hasTask) {
        // CEO has a real task — go to their personal office and sit at desk
        zone = getZoneForCeo(ceo);
      } else {
        // No task — roam around the office naturally
        // Change destination every ~8 seconds, each CEO on different phase
        const roamZones = ['coffee', 'warroom', 'corridor', 'entrance', 'warroom', 'coffee', 'corridor', 'meeting'];
        const roamSeed = Math.floor(Date.now() / 8000) + ceo.n * 3;
        zone = roamZones[roamSeed % roamZones.length];
      }

      const target = getTargetForCeo(ceo, zone);
      ceoSprite.moveTo(target.xPct, target.yPct, zone);
      ceoSprite.setStatus(ceo.status, hasTask ? ceo.task : '');

      if (ceo.subagents) {
        for (const sub of ceo.subagents) {
          const subId = `sub-${sub.id}`;
          activeIds.add(subId);

          let subSprite = agents.get(subId);
          if (!subSprite) {
            const subColor = deriveColor(ceo.color, 2);
            subSprite = new AgentSprite(
              ceo.n,
              subId,
              2,
              subColor,
              sub.role.slice(0, 8),
              42,
              28,
            );
            agents.set(subId, subSprite);
          }

          const subZone = getZoneForSubagent(sub.role);
          const subTarget = getTargetForCeo({ ...ceo, n: ceo.n }, subZone);
          subSprite.moveTo(subTarget.xPct, subTarget.yPct, subZone);
          subSprite.setStatus(sub.status, sub.task || sub.description || sub.role || '');
        }
      }
    }

    // Remove sprites for departed agents
    for (const [id] of agents) {
      if (!activeIds.has(id)) {
        agents.delete(id);
      }
    }
  }, [ceos]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg border border-surface0 overflow-hidden"
      style={{
        resize: 'both',
        minWidth: 320,
        minHeight: 240,
        maxWidth: 1400,
        maxHeight: 1050,
        height: 580,
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        className="block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
