import { findPath, type PctPoint } from './pathfinder';

// Layer determines rendering order and size
export type AgentLayer = 1 | 2 | 3;
// Layer 1 = CEO (largest, drawn on top)
// Layer 2 = Lead (medium)
// Layer 3 = Worker (smallest, drawn first)

interface LayerConfig {
  bodyRadius: number;
  headRadius: number;
  fontSize: number;
  labelFontSize: number;
  spriteHeight: number;
}

// Base sizes at reference canvas height of 1024px — scale proportionally to actual canvas
const REF_HEIGHT = 1024;
const LAYER_CONFIG: Record<AgentLayer, LayerConfig> = {
  1: { bodyRadius: 12, headRadius: 8, fontSize: 12, labelFontSize: 10, spriteHeight: 70 },
  2: { bodyRadius: 8,  headRadius: 5, fontSize: 10, labelFontSize: 8,  spriteHeight: 52 },
  3: { bodyRadius: 5,  headRadius: 3, fontSize: 8,  labelFontSize: 6,  spriteHeight: 36 },
};

function scaled(base: number, canvasHeight: number): number {
  return Math.round(base * (canvasHeight / REF_HEIGHT));
}

// ---- Sprite loading ----

const spriteCache = new Map<string, HTMLImageElement>();

function loadSprite(filename: string): HTMLImageElement {
  if (spriteCache.has(filename)) return spriteCache.get(filename)!;
  const img = new Image();
  img.src = `/sprites/${filename}`;
  spriteCache.set(filename, img);
  return img;
}

// Load all CEO-A sprites once at module level
const SPRITES: Record<string, HTMLImageElement> = {
  'walk-left':  loadSprite('ceo-a-walk-left-.png'),
  'walk-right': loadSprite('ceo-a-walk-right-.png'),
  'idle-left':  loadSprite('ceo-a-idle-left-.png'),
  'idle-right': loadSprite('ceo-a-idle-right-.png'),
  'sit-left':   loadSprite('ceo-a-sit-left-.png'),
  'sit-right':  loadSprite('ceo-a-sit-right-.png'),
};

// Lighten a hex color for sub-layer agents
export function deriveColor(hexColor: string, layer: AgentLayer): string {
  if (layer === 1) return hexColor;

  const clean = hexColor.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const factor = layer === 2 ? 0.35 : 0.55;
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);

  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

export class AgentSprite {
  // Identity
  readonly ceoN: number;
  readonly agentId: string;
  readonly layer: AgentLayer;
  readonly color: string;
  readonly name: string;

  // Position state — all in percentages (0-100)
  xPct: number;
  yPct: number;
  targetXPct: number;
  targetYPct: number;
  path: PctPoint[] = [];
  pathIndex = 0;
  moveProgress = 0;
  // Fraction of path segment per frame (at 15fps, ~0.45s per grid segment)
  // Increased from 0.06 → 0.15 because A* grid paths have many short waypoints
  moveSpeed = 0.15;

  // Status text
  status: string = 'idle';
  statusLabel: string = '';
  currentZone: string = 'warroom';

  // Facing direction for idle state (persists between moves)
  private facingRight: boolean = true;

  // Cached pixel positions (computed from pct + canvas size)
  private pixelX: number = 0;
  private pixelY: number = 0;

  constructor(
    ceoN: number,
    agentId: string,
    layer: AgentLayer,
    colorHex: string,
    name: string,
    startXPct: number,
    startYPct: number,
  ) {
    this.ceoN = ceoN;
    this.agentId = agentId;
    this.layer = layer;
    this.color = colorHex;
    this.name = name;
    this.xPct = startXPct;
    this.yPct = startYPct;
    this.targetXPct = startXPct;
    this.targetYPct = startYPct;
    // pixel values will be set when draw/update is called with canvas dimensions
    this.pixelX = 0;
    this.pixelY = 0;
  }

  setStatus(status: string | undefined, taskLabel: string | undefined) {
    this.status = status || 'idle';
    const label = taskLabel || '';
    this.statusLabel = label.length > 14 ? label.slice(0, 14) + '..' : label;
  }

  moveTo(targetXPct: number, targetYPct: number, zone: string) {
    if (targetXPct === this.targetXPct && targetYPct === this.targetYPct) return;
    this.targetXPct = targetXPct;
    this.targetYPct = targetYPct;
    this.currentZone = zone;

    const pathResult = findPath(this.xPct, this.yPct, targetXPct, targetYPct);

    if (pathResult.length > 0) {
      this.path = pathResult;
      this.pathIndex = 0;
      this.moveProgress = 0;
    }
  }

  // Update position state each frame, given canvas dimensions for pixel conversion
  update(canvasWidth: number, canvasHeight: number) {
    if (this.path.length === 0 || this.pathIndex >= this.path.length) {
      // Idle — stay at current percentage position
      this.pixelX = (this.xPct / 100) * canvasWidth;
      this.pixelY = (this.yPct / 100) * canvasHeight;
      return;
    }

    const target = this.path[this.pathIndex];
    this.moveProgress += this.moveSpeed;

    // Update facing direction
    const prevXPct = this.pathIndex === 0 ? this.xPct : this.path[this.pathIndex - 1].xPct;
    const dx = target.xPct - prevXPct;
    if (dx < 0) this.facingRight = false;
    else if (dx > 0) this.facingRight = true;

    if (this.moveProgress >= 1) {
      this.xPct = target.xPct;
      this.yPct = target.yPct;
      this.pathIndex++;
      this.moveProgress = 0;
      this.pixelX = (this.xPct / 100) * canvasWidth;
      this.pixelY = (this.yPct / 100) * canvasHeight;
    } else {
      const prevYPct = this.pathIndex === 0 ? this.yPct : this.path[this.pathIndex - 1].yPct;
      const interpX = prevXPct + (target.xPct - prevXPct) * this.moveProgress;
      const interpY = prevYPct + (target.yPct - prevYPct) * this.moveProgress;
      this.pixelX = (interpX / 100) * canvasWidth;
      this.pixelY = (interpY / 100) * canvasHeight;
    }
  }

  // Returns current pixel position with idle bobbing applied
  getPixelPos(now: number): { x: number; y: number } {
    const isMoving = this.path.length > 0 && this.pathIndex < this.path.length;
    const bob = isMoving ? 0 : Math.sin(now / 600 + this.ceoN * 0.8) * 1.5;
    return { x: this.pixelX, y: this.pixelY + bob };
  }

  private getSpriteKey(): string {
    const isMoving = this.path.length > 0 && this.pathIndex < this.path.length;

    if (isMoving) {
      return this.facingRight ? 'walk-right' : 'walk-left';
    }

    const isAtDesk = this.status === 'active' && this.currentZone.startsWith('ceo-');
    if (isAtDesk) {
      return this.facingRight ? 'sit-right' : 'sit-left';
    }

    return this.facingRight ? 'idle-right' : 'idle-left';
  }

  private drawFallbackCircle(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const cfg = LAYER_CONFIG[this.layer];

    ctx.beginPath();
    ctx.arc(x, y, cfg.bodyRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y - cfg.bodyRadius - cfg.headRadius, cfg.headRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    if (this.layer <= 2) {
      const eyeY = y - cfg.bodyRadius - cfg.headRadius;
      const eyeOffset = cfg.headRadius * 0.4;
      ctx.fillStyle = '#1e1e2e';

      ctx.beginPath();
      ctx.arc(x - eyeOffset, eyeY, 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x + eyeOffset, eyeY, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  draw(ctx: CanvasRenderingContext2D, now: number, canvasWidth?: number, canvasHeight?: number) {
    const ch = canvasHeight || REF_HEIGHT;
    const cfg = LAYER_CONFIG[this.layer];
    const { x, y } = this.getPixelPos(now);

    const useSprite = this.layer === 1;
    const s = (v: number) => scaled(v, ch);

    let spriteDrawn = false;
    const spriteH = s(cfg.spriteHeight);

    if (useSprite) {
      const spriteKey = this.getSpriteKey();
      const sprite = SPRITES[spriteKey];

      if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        const w = Math.round(spriteH * (sprite.naturalWidth / sprite.naturalHeight));
        const drawX = Math.round(x - w / 2);
        const drawY = Math.round(y - spriteH + s(8));

        ctx.drawImage(sprite, drawX, drawY, w, spriteH);
        spriteDrawn = true;
      }
    }

    if (!spriteDrawn) {
      this.drawFallbackCircle(ctx, x, y);
    }

    // Name tag above sprite
    const nameOffsetY = useSprite && spriteDrawn
      ? Math.round(y - spriteH + s(8)) - s(4)
      : y - s(cfg.bodyRadius) - s(cfg.headRadius) * 2 - 3;

    ctx.font = `bold ${s(cfg.fontSize)}px monospace`;
    ctx.textAlign = 'center';

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillText(this.name, x + 1, nameOffsetY + 1);
    ctx.fillStyle = '#cdd6f4';
    ctx.fillText(this.name, x, nameOffsetY);

    // Status label below sprite
    if (this.statusLabel) {
      const labelOffsetY = useSprite && spriteDrawn
        ? Math.round(y + s(12))
        : y + s(cfg.bodyRadius) + s(cfg.labelFontSize) + 1;

      ctx.font = `${s(cfg.labelFontSize)}px monospace`;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillText(this.statusLabel, x + 1, labelOffsetY + 1);
      ctx.fillStyle = '#a6adc8';
      ctx.fillText(this.statusLabel, x, labelOffsetY);
    }
  }
}
