declare module 'pathfinding' {
  export class Grid {
    width: number;
    height: number;
    constructor(width_or_matrix: number | number[][], height?: number, matrix?: number[][]);
    clone(): Grid;
    isWalkableAt(x: number, y: number): boolean;
    setWalkableAt(x: number, y: number, walkable: boolean): void;
  }

  export const DiagonalMovement: {
    Always: number;
    Never: number;
    OnlyWhenNoObstacles: number;
    IfAtMostOneObstacle: number;
  };

  export class AStarFinder {
    constructor(opts?: {
      allowDiagonal?: boolean;
      dontCrossCorners?: boolean;
      diagonalMovement?: number;
      heuristic?: (dx: number, dy: number) => number;
      weight?: number;
    });
    findPath(startX: number, startY: number, endX: number, endY: number, grid: Grid): number[][];
  }

  export class BreadthFirstFinder {
    constructor(opts?: { allowDiagonal?: boolean; dontCrossCorners?: boolean });
    findPath(startX: number, startY: number, endX: number, endY: number, grid: Grid): number[][];
  }

  export namespace Util {
    function smoothenPath(grid: Grid, path: number[][]): number[][];
    function compressPath(path: number[][]): number[][];
  }
}
