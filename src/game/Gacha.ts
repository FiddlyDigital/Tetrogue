import { RNG } from '../utils/rng';
import { CrystalGear, CRYSTAL_GEAR_POOL, GearRarity } from '../entities/Gear';
import { PieceDef, PIECE_CATALOGUE } from '../world/Piece';

export const CRYSTAL_PULL_COST = 5;
export const PIECE_PULL_COST   = 2;

const GEAR_RARITY_TABLE = [
  { item: GearRarity.SHARD,   weight: 65 },
  { item: GearRarity.CRYSTAL, weight: 28 },
  { item: GearRarity.GEM,     weight: 7  },
];

export interface CrystalPullResult {
  gear: CrystalGear;
  isNew: boolean;
}

export interface PiecePullResult {
  piece: PieceDef;
}

export function pullCrystalGear(player: { crystalShards: number }, rng: RNG): CrystalPullResult | { error: string } {
  if (player.crystalShards < CRYSTAL_PULL_COST) {
    return { error: `Need ${CRYSTAL_PULL_COST} crystal shards (have ${player.crystalShards}).` };
  }
  player.crystalShards -= CRYSTAL_PULL_COST;

  const rarity = rng.getWeighted(GEAR_RARITY_TABLE);
  const pool   = CRYSTAL_GEAR_POOL.filter(g => g.rarity === rarity);
  const gear   = rng.getItem(pool);
  return { gear, isNew: true };
}

export function pullPieceUnlock(
  player: { pieceShards: number },
  rng: RNG,
  unlockedIds: Set<string>,
): PiecePullResult | { error: string } {
  if (player.pieceShards < PIECE_PULL_COST) {
    return { error: `Need ${PIECE_PULL_COST} piece shards (have ${player.pieceShards}).` };
  }
  const available = PIECE_CATALOGUE.filter(p => p.locked && !unlockedIds.has(p.id));
  if (available.length === 0) {
    return { error: 'All piece types already unlocked!' };
  }
  player.pieceShards -= PIECE_PULL_COST;
  const piece = rng.getItem(available);
  unlockedIds.add(piece.id);
  return { piece };
}

export function crystalShardDropAmount(enemyType: string): number {
  switch (enemyType) {
    case 'RAT':      return 1;
    case 'SKELETON': return 2;
    case 'GOLEM':    return 3;
    case 'LICH':     return 8;
    default:         return 1;
  }
}
