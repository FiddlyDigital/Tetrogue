import * as ROT from 'rot-js';

export class RNG {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2 ** 32);
    ROT.RNG.setSeed(this.seed);
  }

  getSeed(): number { return this.seed; }

  getUniform(): number { return ROT.RNG.getUniform(); }

  getInt(min: number, max: number): number {
    return Math.floor(this.getUniform() * (max - min + 1)) + min;
  }

  getItem<T>(arr: T[]): T {
    return arr[Math.floor(this.getUniform() * arr.length)];
  }

  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.getUniform() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  getWeighted<T>(table: Array<{ item: T; weight: number }>): T {
    const total = table.reduce((s, e) => s + e.weight, 0);
    let roll = this.getUniform() * total;
    for (const entry of table) {
      roll -= entry.weight;
      if (roll <= 0) return entry.item;
    }
    return table[table.length - 1].item;
  }
}
