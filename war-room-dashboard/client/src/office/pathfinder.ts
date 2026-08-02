// A* pathfinding through the office collision grid using PathFinding.js
import PF from 'pathfinding';
import { COLLISION_GRID, GRID_COLS, GRID_ROWS, pctToGrid, gridToPct } from './map';

export interface PctPoint {
  xPct: number;
  yPct: number;
}

// Base grid built once — PathFinding.js mutates grids during search so we clone per call
const baseGrid = new PF.Grid(COLLISION_GRID);

const finder = new PF.AStarFinder({
  allowDiagonal: true,
  dontCrossCorners: true,
});

// BFS to find nearest walkable cell when start/end lands on furniture or wall
function findNearestWalkable(
  grid: InstanceType<typeof PF.Grid>,
  gx: number,
  gy: number,
): { gx: number; gy: number } | null {
  // Already walkable
  if (gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS && grid.isWalkableAt(gx, gy)) {
    return { gx, gy };
  }

  const visited = new Set<string>();
  const queue: { gx: number; gy: number }[] = [{ gx, gy }];
  visited.add(`${gx},${gy}`);

  while (queue.length > 0) {
    const cell = queue.shift()!;
    const neighbors: [number, number][] = [
      [0, 1], [0, -1], [1, 0], [-1, 0],
      [1, 1], [1, -1], [-1, 1], [-1, -1],
    ];
    for (const [dx, dy] of neighbors) {
      const nx = cell.gx + dx;
      const ny = cell.gy + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (nx < 0 || ny < 0 || nx >= GRID_COLS || ny >= GRID_ROWS) continue;
      if (grid.isWalkableAt(nx, ny)) return { gx: nx, gy: ny };
      queue.push({ gx: nx, gy: ny });
    }
  }
  return null;
}

export function findPath(
  startXPct: number,
  startYPct: number,
  endXPct: number,
  endYPct: number,
): PctPoint[] {
  try {
    // Already at destination — no movement needed
    if (Math.abs(startXPct - endXPct) < 1.5 && Math.abs(startYPct - endYPct) < 1.5) return [];

    // Convert percentages to grid coordinates
    const startGrid = pctToGrid(startXPct, startYPct);
    const endGrid = pctToGrid(endXPct, endYPct);

    // Clone grid for this search (PathFinding.js mutates the grid during search)
    const grid = baseGrid.clone();

    // Find nearest walkable cells if start/end are blocked
    const startNode = findNearestWalkable(grid, startGrid.gx, startGrid.gy);
    const endNode = findNearestWalkable(grid, endGrid.gx, endGrid.gy);

    if (!startNode || !endNode) {
      return [{ xPct: endXPct, yPct: endYPct }];
    }

    if (startNode.gx === endNode.gx && startNode.gy === endNode.gy) return [];

    // Run A* on the cloned grid
    const gridPath = finder.findPath(
      startNode.gx,
      startNode.gy,
      endNode.gx,
      endNode.gy,
      grid,
    );

    if (gridPath.length === 0) {
      return [{ xPct: endXPct, yPct: endYPct }];
    }

    // Smooth the path — use try/catch as smoothenPath can fail on edge cases
    let smoothed: number[][];
    try {
      smoothed = PF.Util.smoothenPath(baseGrid.clone(), gridPath);
    } catch {
      smoothed = gridPath;
    }

    return smoothed.map(([gx, gy]) => gridToPct(gx, gy));
  } catch (e) {
    console.warn('[pathfinder] Error:', e);
    // Fallback: direct line to destination
    return [{ xPct: endXPct, yPct: endYPct }];
  }
}

// MAP_BOUNDS kept for any code that imports it
export const MAP_BOUNDS = { width: 100, height: 100 };
