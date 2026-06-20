import { EnemyType, ItemType } from '../world/Piece';
import { Enemy, createEnemy } from './Enemy';
import { Item, createItem } from './Item';

export class EntityManager {
  private enemies = new Map<number, Enemy>();
  private items   = new Map<number, Item>();
  private nextId  = 1;
  private depth   = 1;

  constructor(depth: number) { this.depth = depth; }

  setDepth(d: number): void { this.depth = d; }

  spawnEnemy(type: EnemyType, x: number, y: number): Enemy {
    const id = this.nextId++;
    const e  = createEnemy(type, x, y, id, this.depth);
    this.enemies.set(id, e);
    return e;
  }

  spawnItem(type: ItemType, x: number, y: number): Item {
    const id = this.nextId++;
    const item = createItem(type, x, y, id);
    this.items.set(id, item);
    return item;
  }

  getEnemy(id: number): Enemy | undefined { return this.enemies.get(id); }
  getItem(id: number): Item | undefined   { return this.items.get(id); }

  allEnemies(): Enemy[] { return [...this.enemies.values()]; }
  allItems():   Item[]  { return [...this.items.values()]; }

  enemyAt(x: number, y: number): Enemy | undefined {
    for (const e of this.enemies.values()) {
      if (e.x === x && e.y === y) return e;
    }
    return undefined;
  }

  itemAt(x: number, y: number): Item | undefined {
    for (const i of this.items.values()) {
      if (i.x === x && i.y === y) return i;
    }
    return undefined;
  }

  removeEnemy(id: number): void { this.enemies.delete(id); }
  removeItem(id: number): void  { this.items.delete(id); }

  clear(): void { this.enemies.clear(); this.items.clear(); }
}
