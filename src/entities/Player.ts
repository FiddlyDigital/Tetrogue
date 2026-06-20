import { START_X, START_Y, INVENTORY_MAX } from '../game/constants';
import { ItemType } from '../world/Piece';
import { EquipSlot, CrystalGear } from './Gear';

export interface StatusEffect {
  type: 'STRENGTH' | 'POISON';
  turnsLeft: number;
  magnitude: number;
}

export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  gold: number;
  crystalShards: number;
  pieceShards: number;
  inventory: ItemType[];
  statusEffects: StatusEffect[];
  facing: 'up' | 'down' | 'left' | 'right';
  equipment: Record<EquipSlot, CrystalGear | null>;
}

export function createPlayer(): Player {
  return {
    x: START_X,
    y: START_Y,
    hp: 20,
    maxHp: 20,
    atk: 5,
    def: 2,
    gold: 0,
    crystalShards: 0,
    pieceShards: 0,
    inventory: [],
    statusEffects: [],
    facing: 'down',
    equipment: {
      [EquipSlot.WEAPON]: null,
      [EquipSlot.ARMOR]:  null,
      [EquipSlot.RING]:   null,
      [EquipSlot.AMULET]: null,
    },
  };
}

export function playerEffectiveAtk(player: Player): number {
  const bonus = player.statusEffects
    .filter(e => e.type === 'STRENGTH')
    .reduce((s, e) => s + e.magnitude, 0);
  return player.atk + bonus;
}

export function tickStatusEffects(player: Player): string[] {
  const messages: string[] = [];
  player.statusEffects = player.statusEffects.filter(e => {
    e.turnsLeft--;
    if (e.turnsLeft <= 0) {
      if (e.type === 'STRENGTH') messages.push('Your strength boost fades.');
      return false;
    }
    return true;
  });
  return messages;
}

export function canPickup(player: Player): boolean {
  return player.inventory.length < INVENTORY_MAX;
}
