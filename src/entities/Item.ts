import { ItemType } from '../world/Piece';

export interface Item {
  id: number;
  type: ItemType;
  x: number;
  y: number;
  value: number;
}

export function createItem(type: ItemType, x: number, y: number, id: number, value = 1): Item {
  return { id, type, x, y, value };
}

export const ITEM_LABELS: Record<ItemType, string> = {
  [ItemType.HEALTH_POTION]:    'Health Potion',
  [ItemType.STRENGTH_SCROLL]:  'Strength Scroll',
  [ItemType.IRON_SHIELD]:      'Iron Shield',
  [ItemType.GOLD_PILE]:        'Gold Pile',
  [ItemType.BOMB]:             'Bomb',
  [ItemType.CRYSTAL_SHARD]:    'Crystal Shard',
};

export const ITEM_COLORS: Record<ItemType, string> = {
  [ItemType.HEALTH_POTION]:    '#e05555',
  [ItemType.STRENGTH_SCROLL]:  '#e0a020',
  [ItemType.IRON_SHIELD]:      '#8080c0',
  [ItemType.GOLD_PILE]:        '#f0d030',
  [ItemType.BOMB]:             '#404040',
  [ItemType.CRYSTAL_SHARD]:    '#44eeff',
};
