export enum EquipSlot {
  WEAPON = 'WEAPON',
  ARMOR  = 'ARMOR',
  RING   = 'RING',
  AMULET = 'AMULET',
}

export enum GearRarity {
  SHARD   = 'SHARD',
  CRYSTAL = 'CRYSTAL',
  GEM     = 'GEM',
}

export interface GearEffect {
  atkBonus?: number;
  defBonus?: number;
  maxHpBonus?: number;
  lifeStealOnKill?: number;
  dodgeChance?: number;
  shardBonusOnKill?: number;
}

export interface CrystalGear {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: GearRarity;
  effect: GearEffect;
  description: string;
}

export const CRYSTAL_GEAR_POOL: CrystalGear[] = [
  // WEAPON
  { id: 'w-shard-dagger',    name: 'Shard Dagger',    slot: EquipSlot.WEAPON, rarity: GearRarity.SHARD,
    effect: { atkBonus: 2 }, description: '+2 ATK' },
  { id: 'w-shard-bow',       name: 'Shard Bow',        slot: EquipSlot.WEAPON, rarity: GearRarity.SHARD,
    effect: { atkBonus: 1, shardBonusOnKill: 1 }, description: '+1 ATK, +1 shard/kill' },
  { id: 'w-crystal-blade',   name: 'Crystal Blade',    slot: EquipSlot.WEAPON, rarity: GearRarity.CRYSTAL,
    effect: { atkBonus: 4 }, description: '+4 ATK' },
  { id: 'w-crystal-axe',     name: 'Crystal Axe',      slot: EquipSlot.WEAPON, rarity: GearRarity.CRYSTAL,
    effect: { atkBonus: 3, lifeStealOnKill: 1 }, description: '+3 ATK, lifesteal' },
  { id: 'w-gem-sword',       name: 'Gem Sword',        slot: EquipSlot.WEAPON, rarity: GearRarity.GEM,
    effect: { atkBonus: 6, lifeStealOnKill: 2 }, description: '+6 ATK, +2 HP/kill' },
  { id: 'w-gem-lance',       name: 'Gem Lance',        slot: EquipSlot.WEAPON, rarity: GearRarity.GEM,
    effect: { atkBonus: 8 }, description: '+8 ATK' },

  // ARMOR
  { id: 'a-shard-vest',      name: 'Shard Vest',       slot: EquipSlot.ARMOR, rarity: GearRarity.SHARD,
    effect: { defBonus: 2 }, description: '+2 DEF' },
  { id: 'a-shard-mail',      name: 'Shard Mail',       slot: EquipSlot.ARMOR, rarity: GearRarity.SHARD,
    effect: { defBonus: 1, maxHpBonus: 5 }, description: '+1 DEF, +5 max HP' },
  { id: 'a-crystal-plate',   name: 'Crystal Plate',    slot: EquipSlot.ARMOR, rarity: GearRarity.CRYSTAL,
    effect: { defBonus: 3, maxHpBonus: 8 }, description: '+3 DEF, +8 max HP' },
  { id: 'a-crystal-robe',    name: 'Crystal Robe',     slot: EquipSlot.ARMOR, rarity: GearRarity.CRYSTAL,
    effect: { defBonus: 2, maxHpBonus: 5, dodgeChance: 0.05 }, description: '+2 DEF, +5 HP, 5% dodge' },
  { id: 'a-gem-aegis',       name: 'Gem Aegis',        slot: EquipSlot.ARMOR, rarity: GearRarity.GEM,
    effect: { defBonus: 5, maxHpBonus: 15 }, description: '+5 DEF, +15 max HP' },

  // RING
  { id: 'r-shard-band',      name: 'Shard Band',       slot: EquipSlot.RING, rarity: GearRarity.SHARD,
    effect: { maxHpBonus: 8 }, description: '+8 max HP' },
  { id: 'r-shard-ring',      name: 'Shard Ring',       slot: EquipSlot.RING, rarity: GearRarity.SHARD,
    effect: { atkBonus: 1, defBonus: 1 }, description: '+1 ATK, +1 DEF' },
  { id: 'r-crystal-ring',    name: 'Crystal Ring',     slot: EquipSlot.RING, rarity: GearRarity.CRYSTAL,
    effect: { atkBonus: 2, defBonus: 2 }, description: '+2 ATK, +2 DEF' },
  { id: 'r-gem-ring',        name: 'Gem Ring',         slot: EquipSlot.RING, rarity: GearRarity.GEM,
    effect: { shardBonusOnKill: 2, maxHpBonus: 5 }, description: '+2 shards/kill, +5 HP' },

  // AMULET
  { id: 'am-shard-charm',    name: 'Shard Charm',      slot: EquipSlot.AMULET, rarity: GearRarity.SHARD,
    effect: { lifeStealOnKill: 1 }, description: '+1 HP/kill' },
  { id: 'am-shard-amulet',   name: 'Shard Amulet',     slot: EquipSlot.AMULET, rarity: GearRarity.SHARD,
    effect: { maxHpBonus: 6 }, description: '+6 max HP' },
  { id: 'am-crystal-pendant',name: 'Crystal Pendant',  slot: EquipSlot.AMULET, rarity: GearRarity.CRYSTAL,
    effect: { dodgeChance: 0.1, atkBonus: 1 }, description: '10% dodge, +1 ATK' },
  { id: 'am-gem-amulet',     name: 'Gem Amulet',       slot: EquipSlot.AMULET, rarity: GearRarity.GEM,
    effect: { dodgeChance: 0.2, lifeStealOnKill: 2, defBonus: 1 }, description: '20% dodge, +2 HP/kill, +1 DEF' },
];

export interface EquippedPlayer {
  atk: number; def: number; maxHp: number; hp: number;
  equipment: Record<EquipSlot, CrystalGear | null>;
}

export function equipGear(player: EquippedPlayer, gear: CrystalGear): string {
  const old = player.equipment[gear.slot];
  if (old) {
    player.atk   -= old.effect.atkBonus   ?? 0;
    player.def   -= old.effect.defBonus   ?? 0;
    player.maxHp -= old.effect.maxHpBonus ?? 0;
    player.hp = Math.min(player.hp, player.maxHp);
  }
  player.atk   += gear.effect.atkBonus   ?? 0;
  player.def   += gear.effect.defBonus   ?? 0;
  player.maxHp += gear.effect.maxHpBonus ?? 0;
  player.equipment[gear.slot] = gear;
  return `Equipped ${gear.name}: ${gear.description}`;
}

export function getPassiveEffects(equipment: Record<EquipSlot, CrystalGear | null>) {
  let dodge = 0, lifesteal = 0, shardBonus = 0;
  for (const gear of Object.values(equipment)) {
    if (!gear) continue;
    dodge      += gear.effect.dodgeChance      ?? 0;
    lifesteal  += gear.effect.lifeStealOnKill  ?? 0;
    shardBonus += gear.effect.shardBonusOnKill ?? 0;
  }
  return { dodgeChance: dodge, lifeStealOnKill: lifesteal, shardBonusOnKill: shardBonus };
}

export const GEAR_RARITY_COLOR: Record<GearRarity, string> = {
  [GearRarity.SHARD]:   '#88aacc',
  [GearRarity.CRYSTAL]: '#44ccff',
  [GearRarity.GEM]:     '#ffcc00',
};

export const SLOT_LABEL: Record<EquipSlot, string> = {
  [EquipSlot.WEAPON]: 'WPN',
  [EquipSlot.ARMOR]:  'ARM',
  [EquipSlot.RING]:   'RNG',
  [EquipSlot.AMULET]: 'AMU',
};
