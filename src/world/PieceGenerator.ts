import { RNG } from '../utils/rng';
import { PIECE_CATALOGUE, PieceDef, PieceRarity, EnemyType } from './Piece';
import { FLOOR_POOL_SIZE } from '../game/constants';

const RARITY_WEIGHTS: Record<PieceRarity, number> = {
  [PieceRarity.COMMON]:     60,
  [PieceRarity.UNCOMMON]:   25,
  [PieceRarity.RARE]:       12,
  [PieceRarity.ULTRA_RARE]: 3,
};

function byRarity(rarity: PieceRarity, unlockedIds: Set<string>): PieceDef[] {
  return PIECE_CATALOGUE.filter(p => {
    if (p.rarity !== rarity) return false;
    if (p.locked) return unlockedIds.has(p.id);
    return true;
  });
}

function scalePiece(def: PieceDef, depth: number): PieceDef {
  if (depth <= 2) return def;
  const cells = def.cells.map(c => {
    if (c.spawnEnemy === EnemyType.RAT && depth >= 3) {
      return { ...c, spawnEnemy: EnemyType.SKELETON };
    }
    if (c.spawnEnemy === EnemyType.SKELETON && depth >= 5) {
      return { ...c, spawnEnemy: EnemyType.GOLEM };
    }
    return c;
  });
  return { ...def, cells };
}

export function generatePool(depth: number, rng: RNG, unlockedIds: Set<string> = new Set()): PieceDef[] {
  const commons    = byRarity(PieceRarity.COMMON, unlockedIds);
  const uncommons  = byRarity(PieceRarity.UNCOMMON, unlockedIds);
  const rares      = byRarity(PieceRarity.RARE, unlockedIds);
  const ultraRares = byRarity(PieceRarity.ULTRA_RARE, unlockedIds);

  const pool: PieceDef[] = [];

  const rarityTable = [
    { item: PieceRarity.COMMON,   weight: RARITY_WEIGHTS[PieceRarity.COMMON] },
    { item: PieceRarity.UNCOMMON, weight: RARITY_WEIGHTS[PieceRarity.UNCOMMON] },
    { item: PieceRarity.RARE,     weight: RARITY_WEIGHTS[PieceRarity.RARE] },
  ];

  while (pool.length < FLOOR_POOL_SIZE - 1) {
    const rarity = rng.getWeighted(rarityTable);
    let src: PieceDef[];
    switch (rarity) {
      case PieceRarity.COMMON:   src = commons.length   > 0 ? commons   : uncommons; break;
      case PieceRarity.UNCOMMON: src = uncommons.length > 0 ? uncommons : commons;   break;
      default:                   src = rares.length     > 0 ? rares     : uncommons; break;
    }
    pool.push(scalePiece(rng.getItem(src), depth));
  }

  const shuffled = rng.shuffle(pool);

  const ultraRare = scalePiece(rng.getItem(ultraRares), depth);
  const insertAt  = rng.getInt(10, shuffled.length);
  shuffled.splice(insertAt, 0, ultraRare);

  return shuffled;
}
