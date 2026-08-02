// Office background image: 2400x1792 pixels
// Collision grid: 80 cols x 56 rows (each cell = 30x30 pixels)
// 0 = walkable (floor, corridors, doorways)
// 1 = blocked  (walls, furniture, desks, shelves, servers)

// ─── Legacy tile constants (kept for fallback tile rendering in OfficeCanvas) ───
export const TILE_SIZE = 32;
export const MAP_WIDTH = 20;
export const MAP_HEIGHT = 16;

export const FLOOR = 0;
export const WALL = 1;
export const DESK = 2;
export const WHITEBOARD = 3;
export const COFFEE = 4;
export const SERVER = 5;
export const CABINET = 6;
export const MEETING = 7;
export const EXIT = 8;

// Legacy 20x16 map — used only for fallback tile rendering
export const OFFICE_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 2, 1, 0, 0, 2, 1, 0, 0, 2, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 4, 0, 1, 0, 0, 1],
  [1, 0, 0, 2, 1, 0, 0, 2, 1, 0, 0, 2, 1, 0, 4, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
  [1, 2, 0, 0, 1, 2, 0, 0, 1, 2, 0, 0, 1, 7, 7, 0, 1, 5, 0, 1],
  [1, 2, 0, 0, 1, 2, 0, 0, 1, 2, 0, 0, 1, 7, 7, 0, 1, 5, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// ─── Zone targets (percentage-based, 0-100) ─────────────────────────────────
export interface ZoneTarget {
  zone: string;
  xPct: number;
  yPct: number;
}

export const ZONE_TARGETS: ZoneTarget[] = [
  // CEO offices — chairs in front of desks, walkable floor areas
  { zone: 'ceo-1', xPct: 7,    yPct: 18   },
  { zone: 'ceo-2', xPct: 24.4, yPct: 18.8 }, // was (17,18) → grid(13,10) wall divider; moved to CEO-2 room interior grid(19,10)
  { zone: 'ceo-3', xPct: 27,   yPct: 18   },
  { zone: 'ceo-4', xPct: 65.6, yPct: 18.8 }, // was (63,18) → grid(50,10) oval table; moved right of table grid(52,10)
  { zone: 'ceo-5', xPct: 74,   yPct: 18   },
  { zone: 'ceo-6', xPct: 86,   yPct: 18   },

  // Command Center — positions around the oval table
  { zone: 'warroom', xPct: 37,   yPct: 16   },
  { zone: 'warroom', xPct: 45.6, yPct: 15.2 }, // was (47,16) → grid(37,8) oval table top; moved just left grid(36,8)
  { zone: 'warroom', xPct: 37,   yPct: 28   },
  { zone: 'warroom', xPct: 47,   yPct: 28   },
  { zone: 'warroom', xPct: 33,   yPct: 22   },
  { zone: 'warroom', xPct: 51.9, yPct: 25.9 }, // was (52,22) → grid(41,12) oval table; moved below table grid(41,14)

  // Lounge / Coffee area
  { zone: 'coffee', xPct: 87,   yPct: 27   },
  { zone: 'coffee', xPct: 83,   yPct: 30   },
  { zone: 'coffee', xPct: 89.4, yPct: 31.3 }, // was (90,32) → grid(72,17) right wall; moved left grid(71,17)

  // Corridor waypoints (H-shaped hallway)
  { zone: 'corridor', xPct: 15, yPct: 44 },
  { zone: 'corridor', xPct: 30, yPct: 44 },
  { zone: 'corridor', xPct: 45, yPct: 44 },
  { zone: 'corridor', xPct: 60, yPct: 44 },
  { zone: 'corridor', xPct: 75, yPct: 44 },
  { zone: 'corridor', xPct: 90, yPct: 44 },
  { zone: 'corridor', xPct: 15, yPct: 35 },
  { zone: 'corridor', xPct: 15, yPct: 55 },
  { zone: 'corridor', xPct: 90, yPct: 35 },
  { zone: 'corridor', xPct: 90, yPct: 55 },

  // Build department (bottom-left)
  { zone: 'build', xPct: 5.6, yPct: 67.0 }, // was (6,63) → grid(4,35) desk range; moved to open floor grid(4,37)
  { zone: 'build', xPct: 6,   yPct: 73   },
  { zone: 'build', xPct: 10,  yPct: 68   },

  // Design department
  { zone: 'design', xPct: 28.1, yPct: 65.2 }, // was (28,63) → grid(22,35) drafting table; moved below grid(22,36)
  { zone: 'design', xPct: 32,   yPct: 67   },

  // Research department
  { zone: 'research', xPct: 45, yPct: 63 },
  { zone: 'research', xPct: 48, yPct: 67 },

  // Meeting room
  { zone: 'meeting', xPct: 58.1, yPct: 63.4 }, // was (60,63) → grid(48,35) conference table; moved left grid(46,35)
  { zone: 'meeting', xPct: 64.4, yPct: 70.5 }, // was (64,67) → grid(51,37) conference table; moved below grid(51,39)
  { zone: 'meeting', xPct: 60,   yPct: 71   },

  // DevOps (server room)
  { zone: 'devops', xPct: 84,   yPct: 63   },
  { zone: 'devops', xPct: 86.9, yPct: 67.0 }, // was (88,67) → grid(70,37) server racks; moved left grid(69,37)

  // Entrance lobby
  { zone: 'entrance', xPct: 38.1, yPct: 84.8 }, // was (38,86) → grid(30,48) bottom wall; moved up grid(30,47)
  { zone: 'entrance', xPct: 41.9, yPct: 84.8 }, // was (42,86) → grid(33,48) bottom wall; moved up grid(33,47)
  { zone: 'entrance', xPct: 46,   yPct: 86   },
];

// Zone labels for fallback tile rendering
export const ZONE_LABELS: { x: number; y: number; text: string }[] = [
  { x: 1,    y: 1.3,  text: 'CEO-1' },
  { x: 5.5,  y: 1.3,  text: 'CEO-2' },
  { x: 9.5,  y: 1.3,  text: 'CEO-3' },
  { x: 1,    y: 3.3,  text: 'CEO-4' },
  { x: 5.5,  y: 3.3,  text: 'CEO-5' },
  { x: 9.5,  y: 3.3,  text: 'CEO-6' },
  { x: 13.5, y: 1.3,  text: 'COFFEE' },
  { x: 4,    y: 6.3,  text: 'WAR ROOM' },
  { x: 1,    y: 9.3,  text: 'BUILD' },
  { x: 5,    y: 9.3,  text: 'DESIGN' },
  { x: 8.5,  y: 9.3,  text: 'RESEARCH' },
  { x: 13,   y: 9.3,  text: 'MEETING' },
  { x: 16.5, y: 9.3,  text: 'OPS' },
  { x: 5,    y: 14.3, text: 'ENTRANCE' },
];

// Legacy walkable check (used only for fallback compatibility)
export function isWalkable(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return false;
  return OFFICE_MAP[y][x] !== WALL;
}

// ─── A* Collision Grid (80 cols × 56 rows) ──────────────────────────────────
//
// Image: 2400×1792 px  →  each cell = 30×30 px
// 0 = walkable, 1 = blocked
//
// Layout overview (approximate grid coordinates):
//   Rows  0- 1 : top outer wall
//   Rows  2-18 : upper zone (CEO wing left, Command Center, CEO wing right, Lounge)
//   Rows 19-22 : upper internal corridor + room exits
//   Rows 23-30 : main H-shaped horizontal corridor
//   Rows 31-48 : department rooms (Build, Design, Research, Meeting, DevOps)
//   Rows 49-52 : lower corridor above entrance
//   Rows 53-55 : entrance lobby / glass doors
//
// Column bands (approximate):
//   Cols  0- 1 : left outer wall
//   Cols  2-13 : CEO-1 office (left cluster, room 1)
//   Cols 13    : divider wall
//   Cols 14-24 : CEO-2 office
//   Cols 24    : divider wall
//   Cols 25-34 : CEO-3 office
//   Cols 35-53 : Command Center (oval table rows 8-15, cols 37-51)
//   Cols 54-63 : CEO-4 office (right cluster, room 1)
//   Cols 64-72 : CEO-5 office
//   Cols 73-75 : CEO-6 / Upper Right
//   Cols 76-79 : Lounge (couch + coffee machine)
//
// Bottom department cols (rows 31-48):
//   Cols  2-13 : BUILD room
//   Cols 14-15 : wall + doorway
//   Cols 16-27 : DESIGN room
//   Cols 28-29 : wall + doorway
//   Cols 30-42 : RESEARCH room
//   Cols 43-44 : wall + doorway
//   Cols 45-57 : MEETING room
//   Cols 58-59 : wall + doorway
//   Cols 60-76 : DEVOPS room
//   Cols 77-79 : right wall

// Helper: create a row of 80 cells, all set to `fill`
function row(fill: 0 | 1 = 0): number[] {
  return Array(80).fill(fill);
}

// Helper: create a row with a pattern of blocked/open ranges
// ranges: array of [start, end] column indices (inclusive) that are blocked (1)
// base: default value for unspecified cells
function blockedRow(blockedRanges: [number, number][], base: 0 | 1 = 0): number[] {
  const r = Array(80).fill(base);
  for (const [s, e] of blockedRanges) {
    for (let c = s; c <= e; c++) r[c] = base === 0 ? 1 : 0;
  }
  return r;
}

// Helper: open row with specific open (walkable) ranges, rest blocked
function openRow(openRanges: [number, number][], base: 0 | 1 = 1): number[] {
  return blockedRow(openRanges, base);
}

export const GRID_COLS = 80;
export const GRID_ROWS = 56;

// Convert percentage coordinates (0-100) to grid coordinates
export function pctToGrid(xPct: number, yPct: number): { gx: number; gy: number } {
  return {
    gx: Math.min(GRID_COLS - 1, Math.max(0, Math.floor((xPct / 100) * GRID_COLS))),
    gy: Math.min(GRID_ROWS - 1, Math.max(0, Math.floor((yPct / 100) * GRID_ROWS))),
  };
}

// Convert grid coordinates to percentage coordinates (center of cell)
export function gridToPct(gx: number, gy: number): { xPct: number; yPct: number } {
  return {
    xPct: ((gx + 0.5) / GRID_COLS) * 100,
    yPct: ((gy + 0.5) / GRID_ROWS) * 100,
  };
}

//
// COLLISION GRID — 80 columns × 56 rows
//
// Reading guide:
//   Each sub-array is one row (top→bottom of the image).
//   Each element is one cell (left→right).
//   0 = floor/walkable, 1 = wall/furniture/blocked.
//
// ┌─ Row  0: top outer wall (all blocked) ─────────────────────────────────────
// │ ...
// └─ Row 55: bottom edge ───────────────────────────────────────────────────────
//

export const COLLISION_GRID: number[][] = [
  // ── Row 0: top outer wall ─────────────────────────────────────────────────
  row(1),

  // ── Row 1: top wall continues ─────────────────────────────────────────────
  row(1),

  // ── Row 2: top interior — upper rooms begin; all outer walls blocked ───────
  // Left outer wall (0-1), CEO rooms interior, Command Center top, Right rooms, right wall (78-79)
  // CEO-1 (2-12), wall(13), CEO-2(14-24), wall(25), CEO-3(26-34), Command Ctr(35-53), CEO-4(54-63), CEO-5(64-72), CEO-6/Upper(73-75), Lounge(76-79)
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [53, 53], [63, 63], [72, 72], [76, 76], [78, 79]]),

  // ── Row 3: desks along top wall in CEO offices ─────────────────────────────
  // CEO offices have desks (blocked) at top; Lounge has coffee machine blocked
  blockedRow([[0, 1], [2, 6], [13, 13], [14, 18], [25, 25], [26, 30], [35, 35], [53, 53], [54, 58], [63, 63], [64, 68], [72, 72], [73, 75], [76, 76], [77, 79], [78, 79]]),

  // ── Row 4: desk depth continues ────────────────────────────────────────────
  blockedRow([[0, 1], [2, 6], [13, 13], [14, 18], [25, 25], [26, 30], [35, 35], [36, 37], [51, 52], [53, 53], [54, 58], [63, 63], [64, 68], [72, 72], [73, 75], [76, 76], [77, 79]]),

  // ── Row 5: desk bottom row / chair space (slightly open) ───────────────────
  blockedRow([[0, 1], [2, 4], [13, 13], [14, 16], [25, 25], [26, 28], [35, 35], [53, 53], [54, 56], [63, 63], [64, 66], [72, 72], [73, 75], [76, 76], [77, 79]]),

  // ── Row 6: open floor in CEO offices + Command Center top open ─────────────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 7: open floor ──────────────────────────────────────────────────────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 8: oval table starts in Command Center (rows 8-14, cols 37-51) ─────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [37, 51], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 9: oval table ──────────────────────────────────────────────────────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [37, 51], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 10: oval table + couch in lounge ───────────────────────────────────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [37, 51], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 11: oval table + couch ─────────────────────────────────────────────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [37, 51], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 12: oval table ─────────────────────────────────────────────────────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [37, 51], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 13: oval table bottom ──────────────────────────────────────────────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [37, 51], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 14: oval table bottom / open below table ───────────────────────────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 15: open floor (below table in command center) ─────────────────────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 16: open floor ─────────────────────────────────────────────────────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 17: open floor ─────────────────────────────────────────────────────
  blockedRow([[0, 1], [13, 13], [25, 25], [35, 35], [53, 53], [63, 63], [72, 72], [76, 76], [77, 79]]),

  // ── Row 18: bottom wall of upper rooms — with doorways ─────────────────────
  // Doorways (open) at: CEO-1 center ~col 7, CEO-2 ~col 19, CEO-3 ~col 30,
  //   Command Ctr stays open at ~col 43, CEO-4 ~col 58, CEO-5 ~col 67, CEO-6/Upper ~col 73
  //   Lounge open on left side col 77
  // Walls: 0-1, bottom of room dividers: 2-6(wall), 7(door), 8-12(wall), 13(wall)
  openRow([[7, 9], [20, 22], [31, 33], [36, 52], [57, 59], [67, 68], [73, 73], [77, 77]]),

  // ── Row 19: internal corridor below upper rooms ─────────────────────────────
  // Wide corridor connecting all upper rooms; left/right outer walls
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 20: corridor continues ─────────────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 21: corridor ───────────────────────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 22: corridor ───────────────────────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 23: main horizontal corridor (H-bar) ───────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 24: main corridor ──────────────────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 25: main corridor ──────────────────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 26: main corridor ──────────────────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 27: main corridor ──────────────────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 28: main corridor ──────────────────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 29: main corridor lower edge ───────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 30: bottom wall of corridor — doorways into departments ─────────────
  // Departments: BUILD(2-13), DESIGN(16-27), RESEARCH(30-42), MEETING(45-57), DEVOPS(60-76)
  // Doorways into each department from corridor:
  //   BUILD doorway: cols 7-8
  //   DESIGN doorway: cols 21-22
  //   RESEARCH doorway: cols 35-36
  //   MEETING doorway: cols 50-51
  //   DEVOPS doorway: cols 67-68
  // Walls between departments: 14-15, 28-29, 43-44, 58-59
  openRow([[2, 12], [7, 8], [16, 27], [21, 22], [30, 42], [35, 36], [45, 57], [50, 51], [60, 76], [67, 68]]),

  // ── Row 31: top of department rooms ────────────────────────────────────────
  // BUILD(2-13): desks on left, open floor right; DESIGN(16-27): drafting table; etc.
  // Room walls at 0-1, 14-15, 28-29, 43-44, 58-59, 77-79
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [58, 59], [77, 79]]),

  // ── Row 32: department rooms interior ──────────────────────────────────────
  // BUILD: desks along left wall (cols 2-5 blocked)
  // DESIGN: drafting table (cols 18-22 blocked)
  // RESEARCH: bookshelves (cols 30-33 blocked)
  // MEETING: conference table center (cols 47-55 blocked)
  // DEVOPS: server racks right (cols 70-76 blocked)
  blockedRow([[0, 1], [2, 5], [14, 15], [18, 22], [28, 29], [30, 33], [43, 44], [47, 55], [58, 59], [70, 76], [77, 79]]),

  // ── Row 33: department rooms interior ──────────────────────────────────────
  blockedRow([[0, 1], [2, 5], [14, 15], [18, 22], [28, 29], [30, 33], [43, 44], [47, 55], [58, 59], [70, 76], [77, 79]]),

  // ── Row 34: ────────────────────────────────────────────────────────────────
  blockedRow([[0, 1], [2, 5], [14, 15], [18, 22], [28, 29], [30, 33], [43, 44], [47, 55], [58, 59], [70, 76], [77, 79]]),

  // ── Row 35: ────────────────────────────────────────────────────────────────
  blockedRow([[0, 1], [2, 5], [14, 15], [18, 22], [28, 29], [30, 33], [43, 44], [47, 55], [58, 59], [70, 76], [77, 79]]),

  // ── Row 36: mid-room ───────────────────────────────────────────────────────
  blockedRow([[0, 1], [2, 5], [14, 15], [28, 29], [43, 44], [47, 55], [58, 59], [70, 76], [77, 79]]),

  // ── Row 37: ────────────────────────────────────────────────────────────────
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [47, 55], [58, 59], [70, 76], [77, 79]]),

  // ── Row 38: ────────────────────────────────────────────────────────────────
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [47, 55], [58, 59], [70, 76], [77, 79]]),

  // ── Row 39: lower half of department rooms ─────────────────────────────────
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [58, 59], [70, 76], [77, 79]]),

  // ── Row 40: ────────────────────────────────────────────────────────────────
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [58, 59], [70, 76], [77, 79]]),

  // ── Row 41: ────────────────────────────────────────────────────────────────
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [58, 59], [70, 76], [77, 79]]),

  // ── Row 42: ────────────────────────────────────────────────────────────────
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [58, 59], [70, 76], [77, 79]]),

  // ── Row 43: ────────────────────────────────────────────────────────────────
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [58, 59], [70, 76], [77, 79]]),

  // ── Row 44: ────────────────────────────────────────────────────────────────
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [58, 59], [70, 76], [77, 79]]),

  // ── Row 45: ────────────────────────────────────────────────────────────────
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [58, 59], [70, 76], [77, 79]]),

  // ── Row 46: ────────────────────────────────────────────────────────────────
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [58, 59], [70, 76], [77, 79]]),

  // ── Row 47: bottom of department rooms ─────────────────────────────────────
  blockedRow([[0, 1], [14, 15], [28, 29], [43, 44], [58, 59], [70, 76], [77, 79]]),

  // ── Row 48: bottom wall of department rooms — doorways into lower corridor ──
  // Doorways: BUILD ~col 7-8, DESIGN ~col 21-22, RESEARCH ~col 35-36, MEETING ~col 50-51, DEVOPS ~col 67-68
  // Between rooms: walls at 14-15, 28-29, 43-44, 58-59
  openRow([[7, 8], [21, 22], [35, 36], [50, 51], [67, 68]]),

  // ── Row 49: lower corridor (above entrance) ─────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 50: lower corridor ─────────────────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 51: lower corridor ─────────────────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 52: lower corridor / entrance top wall ──────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 53: entrance lobby — glass doors center (cols 35-45 open) ───────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 54: entrance lobby interior ────────────────────────────────────────
  blockedRow([[0, 1], [78, 79]]),

  // ── Row 55: bottom edge ────────────────────────────────────────────────────
  row(1),
];

// Sanity check in development — verifies grid dimensions
if (process.env.NODE_ENV !== 'production') {
  if (COLLISION_GRID.length !== GRID_ROWS) {
    console.error(`[map] COLLISION_GRID has ${COLLISION_GRID.length} rows, expected ${GRID_ROWS}`);
  }
  for (let r = 0; r < COLLISION_GRID.length; r++) {
    if (COLLISION_GRID[r].length !== GRID_COLS) {
      console.error(`[map] Row ${r} has ${COLLISION_GRID[r].length} cols, expected ${GRID_COLS}`);
    }
  }

  // Verify ZONE_TARGETS land on walkable cells
  for (const target of ZONE_TARGETS) {
    const { gx, gy } = pctToGrid(target.xPct, target.yPct);
    if (COLLISION_GRID[gy] && COLLISION_GRID[gy][gx] !== 0) {
      console.warn(
        `[map] Zone target "${target.zone}" at (${target.xPct}%, ${target.yPct}%) → grid (${gx},${gy}) is BLOCKED. Move target to nearest walkable cell.`,
      );
    }
  }
}
