export enum TileType {
  VOID = 0,
  WALL = 1,
  FLOOR = 2,
  DOOR = 3,
  STAIR_DOWN = 4,
  TRAP = 5,
}

export enum FogState {
  UNSEEN = 0,
  REMEMBERED = 1,
  VISIBLE = 2,
}

export interface Tile {
  type: TileType;
  fog: FogState;
  isTrap: boolean;
  pieceId: number;
}

export function createTile(type: TileType = TileType.VOID): Tile {
  return { type, fog: FogState.UNSEEN, isTrap: false, pieceId: -1 };
}

export function isPassable(tile: Tile): boolean {
  return tile.type === TileType.FLOOR
    || tile.type === TileType.DOOR
    || tile.type === TileType.STAIR_DOWN
    || tile.type === TileType.TRAP;
}

export function blocksLight(tile: Tile): boolean {
  return tile.type === TileType.WALL
    || tile.type === TileType.VOID
    || tile.type === TileType.DOOR;
}
