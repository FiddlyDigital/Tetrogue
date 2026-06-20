import { RNG } from '../utils/rng';
import { PieceDef, PieceRarity } from './Piece';
import { generatePool } from './PieceGenerator';
import { QUEUE_SIZE } from '../game/constants';

export interface PieceQueue {
  visible: PieceDef[];
  selectedIndex: number;
  drawPile: PieceDef[];
  discardPile: PieceDef[];
}

export function createQueue(depth: number, rng: RNG, unlockedIds: Set<string> = new Set()): PieceQueue {
  const drawPile = generatePool(depth, rng, unlockedIds);
  const visible: PieceDef[] = [];
  for (let i = 0; i < QUEUE_SIZE; i++) {
    const p = drawPile.shift();
    if (p) visible.push(p);
  }
  return { visible, selectedIndex: 0, drawPile, discardPile: [] };
}

function drawNext(queue: PieceQueue, rng: RNG): PieceDef | null {
  if (queue.drawPile.length === 0) {
    if (queue.discardPile.length === 0) return null;
    queue.drawPile = rng.shuffle(queue.discardPile);
    queue.discardPile = [];
  }
  return queue.drawPile.shift() ?? null;
}

export function consumeSelected(queue: PieceQueue, rng: RNG): void {
  const consumed = queue.visible.splice(queue.selectedIndex, 1)[0];
  queue.discardPile.push(consumed);
  const next = drawNext(queue, rng);
  if (next) {
    queue.visible.splice(queue.selectedIndex, 0, next);
  }
  queue.selectedIndex = Math.min(queue.selectedIndex, queue.visible.length - 1);
}

export function discardSelected(queue: PieceQueue, rng: RNG): boolean {
  const piece = queue.visible[queue.selectedIndex];
  if (!piece || piece.rarity === PieceRarity.ULTRA_RARE) return false;
  queue.discardPile.push(piece);
  const next = drawNext(queue, rng);
  if (next) {
    queue.visible[queue.selectedIndex] = next;
  } else {
    queue.visible.splice(queue.selectedIndex, 1);
    queue.selectedIndex = Math.min(queue.selectedIndex, queue.visible.length - 1);
  }
  return true;
}

export function selectPiece(queue: PieceQueue, index: number): void {
  if (index >= 0 && index < queue.visible.length) {
    queue.selectedIndex = index;
  }
}

export function selectedPiece(queue: PieceQueue): PieceDef | null {
  return queue.visible[queue.selectedIndex] ?? null;
}
