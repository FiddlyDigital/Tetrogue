import { RNG } from '../utils/rng';
import { PIECE_CATALOGUE, PieceDef, PieceRarity, EnemyType } from './Piece';
import { FLOOR_POOL_SIZE } from '../game/constants';

const RARITY_WEIGHTS: Record<PieceRarity, number> = {
  [PieceRarity.COMMON]: 60,
  [PieceRarity.UNCOMMON]: 25,
  [PieceRarity.RARE]: 12,
  [PieceRarity.ULTRA_RARE]: 3,
};

function byRarity(rarity: PieceRarity): PieceDef[] {
  return PIECE_CATALOGUE.filter(p => p.rarity === rarity);
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

export function generatePool(depth: number, rng: RNG): PieceDef[] {
  const commons    = byRarity(PieceRarity.COMMON);
  const uncommons  = byRarity(PieceRarity.UNCOMMON);
  const rares      = byRarity(PieceRarity.RARE);
  const ultraRares = byRarity(PieceRarity.ULTRA_RARE);

  const pool: PieceDef[] = [];

  const rarityTable = [
    { item: PieceRarity.COMMON,     weight: RARITY_WEIGHTS[PieceRarity.COMMON] },
    { item: PieceRarity.UNCOMMON,   weight: RARITY_WEIGHTS[PieceRarity.UNCOMMON] },
    { item: PieceRarity.RARE,       weight: RARITY_WEIGHTS[PieceRarity.RARE] },
  ];

  // Fill pool (no ultra-rare yet — we inject exactly one below)
  while (pool.length < FLOOR_POOL_SIZE - 1) {
    const rarity = rng.getWeighted(rarityTable);
    let src: PieceDef[];
    switch (rarity) {
      case PieceRarity.COMMON:   src = commons;   break;
      case PieceRarity.UNCOMMON: src = uncommons; break;
      default:                   src = rares;     break;
    }
    pool.push(scalePiece(rng.getItem(src), depth));
  }

  // Shuffle the regular pool
  const shuffled = rng.shuffle(pool);

  // Inject one guaranteed ultra-rare piece between position 10 and end
  const ultraRare = scalePiece(rng.getItem(ultraRares), depth);
  const insertAt = rng.getInt(10, shuffled.length);
  shuffled.splice(insertAt, 0, ultraRare);

  return shuffled;
}
