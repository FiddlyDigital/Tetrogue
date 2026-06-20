import { TileType } from './Tile';

export enum PieceRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  ULTRA_RARE = 'ULTRA_RARE',
}

export enum EnemyType {
  RAT = 'RAT',
  SKELETON = 'SKELETON',
  GOLEM = 'GOLEM',
  LICH = 'LICH',
}

export enum ItemType {
  HEALTH_POTION = 'HEALTH_POTION',
  STRENGTH_SCROLL = 'STRENGTH_SCROLL',
  IRON_SHIELD = 'IRON_SHIELD',
  GOLD_PILE = 'GOLD_PILE',
  BOMB = 'BOMB',
}

export interface PieceCell {
  localX: number;
  localY: number;
  tileType: TileType;
  isTrap: boolean;
  spawnEnemy: EnemyType | null;
  spawnItem: ItemType | null;
}

export interface PieceDef {
  id: string;
  label: string;
  rarity: PieceRarity;
  cells: PieceCell[];
  boundingW: number;
  boundingH: number;
}

export type Rotation = 0 | 90 | 180 | 270;

export function rotateCells(cells: PieceCell[], rotation: Rotation, bW: number, bH: number): PieceCell[] {
  return cells.map(c => {
    let nx: number, ny: number;
    switch (rotation) {
      case 0:   nx = c.localX;        ny = c.localY;        break;
      case 90:  nx = bH - 1 - c.localY; ny = c.localX;     break;
      case 180: nx = bW - 1 - c.localX; ny = bH - 1 - c.localY; break;
      case 270: nx = c.localY;        ny = bW - 1 - c.localX; break;
    }
    return { ...c, localX: nx, localY: ny };
  });
}

export function normalizeCells(cells: PieceCell[]): PieceCell[] {
  const minX = Math.min(...cells.map(c => c.localX));
  const minY = Math.min(...cells.map(c => c.localY));
  return cells.map(c => ({ ...c, localX: c.localX - minX, localY: c.localY - minY }));
}

export function getRotatedCells(def: PieceDef, rotation: Rotation): PieceCell[] {
  const rotated = rotateCells(def.cells, rotation, def.boundingW, def.boundingH);
  return normalizeCells(rotated);
}

export function getRotatedBounds(def: PieceDef, rotation: Rotation): { w: number; h: number } {
  return (rotation === 90 || rotation === 270)
    ? { w: def.boundingH, h: def.boundingW }
    : { w: def.boundingW, h: def.boundingH };
}

function floor(lx: number, ly: number, opts?: Partial<PieceCell>): PieceCell {
  return { localX: lx, localY: ly, tileType: TileType.FLOOR, isTrap: false, spawnEnemy: null, spawnItem: null, ...opts };
}

function wall(lx: number, ly: number): PieceCell {
  return { localX: lx, localY: ly, tileType: TileType.WALL, isTrap: false, spawnEnemy: null, spawnItem: null };
}

function door(lx: number, ly: number): PieceCell {
  return { localX: lx, localY: ly, tileType: TileType.DOOR, isTrap: false, spawnEnemy: null, spawnItem: null };
}

// ── PIECE CATALOGUE ──────────────────────────────────────────────────────────

export const PIECE_CATALOGUE: PieceDef[] = [

  // ── COMMON: corridor pieces ──────────────────────────────────────────────

  {
    id: 'corridor-I-h', label: 'Corridor', rarity: PieceRarity.COMMON,
    boundingW: 4, boundingH: 1,
    cells: [floor(0,0), floor(1,0), floor(2,0), floor(3,0)],
  },
  {
    id: 'corridor-I-h-enemy', label: 'Corridor', rarity: PieceRarity.COMMON,
    boundingW: 4, boundingH: 1,
    cells: [floor(0,0), floor(1,0,{spawnEnemy: EnemyType.RAT}), floor(2,0), floor(3,0)],
  },
  {
    id: 'corridor-L', label: 'L-Bend', rarity: PieceRarity.COMMON,
    boundingW: 2, boundingH: 3,
    cells: [floor(0,0), floor(0,1), floor(0,2), floor(1,2)],
  },
  {
    id: 'corridor-L-enemy', label: 'L-Bend', rarity: PieceRarity.COMMON,
    boundingW: 2, boundingH: 3,
    cells: [floor(0,0), floor(0,1), floor(0,2,{spawnEnemy: EnemyType.RAT}), floor(1,2)],
  },
  {
    id: 'corridor-J', label: 'J-Bend', rarity: PieceRarity.COMMON,
    boundingW: 2, boundingH: 3,
    cells: [floor(1,0), floor(1,1), floor(1,2), floor(0,2)],
  },
  {
    id: 'corridor-T', label: 'T-Junction', rarity: PieceRarity.COMMON,
    boundingW: 3, boundingH: 2,
    cells: [floor(0,0), floor(1,0), floor(2,0), floor(1,1)],
  },
  {
    id: 'corridor-T-enemy', label: 'T-Junction', rarity: PieceRarity.COMMON,
    boundingW: 3, boundingH: 2,
    cells: [floor(0,0), floor(1,0,{spawnEnemy: EnemyType.RAT}), floor(2,0), floor(1,1)],
  },
  {
    id: 'corridor-S', label: 'S-Bend', rarity: PieceRarity.COMMON,
    boundingW: 3, boundingH: 2,
    cells: [floor(1,0), floor(2,0), floor(0,1), floor(1,1)],
  },
  {
    id: 'corridor-Z', label: 'Z-Bend', rarity: PieceRarity.COMMON,
    boundingW: 3, boundingH: 2,
    cells: [floor(0,0), floor(1,0), floor(1,1), floor(2,1)],
  },
  {
    id: 'corridor-plus', label: 'Crossroads', rarity: PieceRarity.COMMON,
    boundingW: 3, boundingH: 3,
    cells: [floor(1,0), floor(0,1), floor(1,1), floor(2,1), floor(1,2)],
  },
  {
    id: 'corridor-long', label: 'Long Hall', rarity: PieceRarity.COMMON,
    boundingW: 5, boundingH: 1,
    cells: [floor(0,0), floor(1,0), floor(2,0,{spawnEnemy: EnemyType.RAT}), floor(3,0), floor(4,0)],
  },
  {
    id: 'corridor-walled', label: 'Walled Hall', rarity: PieceRarity.COMMON,
    boundingW: 3, boundingH: 3,
    cells: [
      wall(0,0), floor(1,0), wall(2,0),
      floor(0,1), floor(1,1), floor(2,1),
      wall(0,2), floor(1,2), wall(2,2),
    ],
  },

  // ── UNCOMMON: room pieces ─────────────────────────────────────────────────

  {
    id: 'room-2x2', label: 'Small Room', rarity: PieceRarity.UNCOMMON,
    boundingW: 3, boundingH: 3,
    cells: [
      floor(0,0), floor(1,0), floor(2,0),
      floor(0,1), floor(1,1,{spawnEnemy: EnemyType.RAT}), floor(2,1),
      floor(0,2), floor(1,2), floor(2,2),
    ],
  },
  {
    id: 'room-2x3', label: 'Side Room', rarity: PieceRarity.UNCOMMON,
    boundingW: 3, boundingH: 4,
    cells: [
      door(1,0),
      floor(0,1), floor(1,1), floor(2,1),
      floor(0,2), floor(1,2,{spawnEnemy: EnemyType.SKELETON}), floor(2,2),
      floor(0,3), floor(1,3,{spawnItem: ItemType.HEALTH_POTION}), floor(2,3),
    ],
  },
  {
    id: 'room-loot', label: 'Loot Nook', rarity: PieceRarity.UNCOMMON,
    boundingW: 3, boundingH: 3,
    cells: [
      floor(0,0), door(1,0), floor(2,0),
      floor(0,1,{spawnEnemy: EnemyType.RAT}), floor(1,1,{spawnItem: ItemType.GOLD_PILE}), floor(2,1,{spawnEnemy: EnemyType.RAT}),
      wall(0,2), floor(1,2), wall(2,2),
    ],
  },
  {
    id: 'room-corner', label: 'Corner Den', rarity: PieceRarity.UNCOMMON,
    boundingW: 3, boundingH: 3,
    cells: [
      floor(0,0), floor(1,0), floor(2,0),
      floor(0,1), floor(1,1), wall(2,1),
      floor(0,2), floor(1,2,{spawnEnemy: EnemyType.SKELETON}), wall(2,2),
    ],
  },
  {
    id: 'room-armory', label: 'Armory', rarity: PieceRarity.UNCOMMON,
    boundingW: 3, boundingH: 3,
    cells: [
      wall(0,0), door(1,0), wall(2,0),
      floor(0,1), floor(1,1), floor(2,1),
      floor(0,2,{spawnItem: ItemType.IRON_SHIELD}), floor(1,2,{spawnEnemy: EnemyType.SKELETON}), floor(2,2,{spawnItem: ItemType.STRENGTH_SCROLL}),
    ],
  },

  // ── RARE: special rooms ───────────────────────────────────────────────────

  {
    id: 'room-shop', label: 'Shop', rarity: PieceRarity.RARE,
    boundingW: 3, boundingH: 3,
    cells: [
      wall(0,0), door(1,0), wall(2,0),
      floor(0,1,{spawnItem: ItemType.HEALTH_POTION}), floor(1,1), floor(2,1,{spawnItem: ItemType.STRENGTH_SCROLL}),
      wall(0,2), floor(1,2,{spawnItem: ItemType.IRON_SHIELD}), wall(2,2),
    ],
  },
  {
    id: 'room-shrine', label: 'Shrine', rarity: PieceRarity.RARE,
    boundingW: 3, boundingH: 4,
    cells: [
      floor(0,0), door(1,0), floor(2,0),
      floor(0,1), floor(1,1), floor(2,1),
      wall(0,2), floor(1,2), wall(2,2),
      wall(0,3), floor(1,3,{spawnItem: ItemType.HEALTH_POTION}), wall(2,3),
    ],
  },
  {
    id: 'room-vault', label: 'Vault', rarity: PieceRarity.RARE,
    boundingW: 3, boundingH: 3,
    cells: [
      wall(0,0), door(1,0), wall(2,0),
      floor(0,1,{spawnItem: ItemType.GOLD_PILE}), floor(1,1,{spawnEnemy: EnemyType.GOLEM}), floor(2,1,{spawnItem: ItemType.GOLD_PILE}),
      wall(0,2), floor(1,2,{spawnItem: ItemType.BOMB}), wall(2,2),
    ],
  },

  // ── ULTRA-RARE ────────────────────────────────────────────────────────────

  {
    id: 'room-boss', label: 'Boss Chamber', rarity: PieceRarity.ULTRA_RARE,
    boundingW: 5, boundingH: 5,
    cells: [
      wall(0,0), floor(1,0), floor(2,0), floor(3,0), wall(4,0),
      floor(0,1), floor(1,1), floor(2,1), floor(3,1), floor(4,1),
      door(0,2), floor(1,2), floor(2,2,{spawnEnemy: EnemyType.LICH}), floor(3,2), door(4,2),
      floor(0,3), floor(1,3,{spawnItem: ItemType.GOLD_PILE}), floor(2,3), floor(3,3,{spawnItem: ItemType.HEALTH_POTION}), floor(4,3),
      wall(0,4), floor(1,4), floor(2,4), floor(3,4), wall(4,4),
    ],
  },
  {
    id: 'room-stair', label: 'Staircase', rarity: PieceRarity.ULTRA_RARE,
    boundingW: 3, boundingH: 3,
    cells: [
      floor(0,0), door(1,0), floor(2,0),
      floor(0,1), { localX:1, localY:1, tileType: TileType.STAIR_DOWN, isTrap:false, spawnEnemy:null, spawnItem:null }, floor(2,1),
      wall(0,2), floor(1,2), wall(2,2),
    ],
  },
];
