import { EnemyType } from '../world/Piece';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  isAlerted: boolean;
  turnDebt: number;
}

interface EnemyStats { hp: number; atk: number; def: number }

const BASE_STATS: Record<EnemyType, EnemyStats> = {
  [EnemyType.RAT]:      { hp: 6,  atk: 3,  def: 0 },
  [EnemyType.SKELETON]: { hp: 12, atk: 5,  def: 1 },
  [EnemyType.GOLEM]:    { hp: 20, atk: 6,  def: 4 },
  [EnemyType.LICH]:     { hp: 40, atk: 8,  def: 3 },
};

export function createEnemy(type: EnemyType, x: number, y: number, id: number, depth: number): Enemy {
  const base = BASE_STATS[type];
  const scale = 1 + (depth - 1) * 0.15;
  const hp   = Math.round(base.hp  * scale);
  const atk  = Math.round(base.atk * scale);
  const def  = Math.round(base.def * scale);
  return { id, type, x, y, hp, maxHp: hp, atk, def, isAlerted: false, turnDebt: 0 };
}

export function isSlow(enemy: Enemy): boolean {
  return enemy.type === EnemyType.GOLEM;
}
