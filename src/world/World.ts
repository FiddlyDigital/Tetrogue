import { GRID_W, GRID_H, START_X, START_Y } from '../game/constants';
import { Tile, TileType, FogState, createTile } from './Tile';

export interface World {
  grid: Tile[][];
  depth: number;
  validPlacementEdges: Set<string>;
  nextPieceId: number;
}

export function createWorld(depth = 1): World {
  const grid: Tile[][] = [];
  for (let y = 0; y < GRID_H; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_W; x++) {
      grid[y][x] = createTile(TileType.VOID);
    }
  }

  const world: World = { grid, depth, validPlacementEdges: new Set(), nextPieceId: 0 };
  placeStartingRoom(world);
  return world;
}

function placeStartingRoom(world: World): void {
  const pieceId = world.nextPieceId++;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = START_X + dx;
      const y = START_Y + dy;
      world.grid[y][x] = { type: TileType.FLOOR, fog: FogState.VISIBLE, isTrap: false, pieceId };
    }
  }
  rebuildEdgeCache(world);
}

export function rebuildEdgeCache(world: World): void {
  world.validPlacementEdges.clear();
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (world.grid[y][x].type !== TileType.VOID) continue;
      if (hasAdjacentFloor(world, x, y)) {
        world.validPlacementEdges.add(`${x},${y}`);
      }
    }
  }
}

export function updateEdgeCacheAround(world: World, cells: Array<{ x: number; y: number }>): void {
  for (const { x, y } of cells) {
    world.validPlacementEdges.delete(`${x},${y}`);
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
      if (world.grid[ny][nx].type === TileType.VOID && hasAdjacentFloor(world, nx, ny)) {
        world.validPlacementEdges.add(`${nx},${ny}`);
      } else {
        world.validPlacementEdges.delete(`${nx},${ny}`);
      }
    }
  }
}

function hasAdjacentFloor(world: World, x: number, y: number): boolean {
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
    const t = world.grid[ny][nx].type;
    if (t === TileType.FLOOR || t === TileType.DOOR || t === TileType.STAIR_DOWN || t === TileType.TRAP) {
      return true;
    }
  }
  return false;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_W && y >= 0 && y < GRID_H;
}
