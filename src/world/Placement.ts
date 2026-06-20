import { GRID_W, GRID_H } from '../game/constants';
import { TileType, FogState } from './Tile';
import { World, updateEdgeCacheAround } from './World';
import { PieceDef, Rotation, getRotatedCells, getRotatedBounds } from './Piece';
import type { EntityManager } from '../entities/EntityManager';

export function canPlace(world: World, def: PieceDef, worldX: number, worldY: number, rotation: Rotation): boolean {
  const cells = getRotatedCells(def, rotation);

  // Rule 1 & 2: bounds + no overlap
  for (const c of cells) {
    const gx = worldX + c.localX;
    const gy = worldY + c.localY;
    if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return false;
    if (world.grid[gy][gx].type !== TileType.VOID) return false;
  }

  // Rule 3: at least one floor cell adjacent to existing floor
  const floorCells = cells.filter(c =>
    c.tileType === TileType.FLOOR ||
    c.tileType === TileType.DOOR ||
    c.tileType === TileType.STAIR_DOWN ||
    c.tileType === TileType.TRAP
  );

  for (const c of floorCells) {
    const gx = worldX + c.localX;
    const gy = worldY + c.localY;
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const nx = gx + dx;
      const ny = gy + dy;
      if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
      const nt = world.grid[ny][nx].type;
      if (nt === TileType.FLOOR || nt === TileType.DOOR || nt === TileType.STAIR_DOWN || nt === TileType.TRAP) {
        return true;
      }
    }
  }

  return false;
}

export function commitPlacement(
  world: World,
  def: PieceDef,
  worldX: number,
  worldY: number,
  rotation: Rotation,
  entityManager: EntityManager,
): void {
  const cells = getRotatedCells(def, rotation);
  const pieceId = world.nextPieceId++;
  const placedCoords: Array<{ x: number; y: number }> = [];

  for (const c of cells) {
    const gx = worldX + c.localX;
    const gy = worldY + c.localY;
    world.grid[gy][gx] = {
      type: c.tileType,
      fog: FogState.UNSEEN,
      isTrap: c.isTrap,
      pieceId,
    };
    placedCoords.push({ x: gx, y: gy });

    if (c.spawnEnemy !== null) {
      entityManager.spawnEnemy(c.spawnEnemy, gx, gy);
    }
    if (c.spawnItem !== null) {
      entityManager.spawnItem(c.spawnItem, gx, gy);
    }
  }

  updateEdgeCacheAround(world, placedCoords);
}

export function getPlacementOrigin(
  cursorWorldX: number,
  cursorWorldY: number,
  def: PieceDef,
  rotation: Rotation,
): { x: number; y: number } {
  const { w, h } = getRotatedBounds(def, rotation);
  return {
    x: cursorWorldX - Math.floor(w / 2),
    y: cursorWorldY - Math.floor(h / 2),
  };
}
