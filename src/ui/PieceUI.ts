import { PieceQueue, selectedPiece } from '../world/PieceQueue';
import { PieceDef, PieceRarity, getRotatedCells, Rotation } from '../world/Piece';
import { TileType } from '../world/Tile';
import { EnemyType, ItemType } from '../world/Piece';

const CELL_SIZE = 20;

const PIECE_COLORS: Record<TileType, string> = {
  [TileType.VOID]:       'transparent',
  [TileType.WALL]:       '#3a3a4a',
  [TileType.FLOOR]:      '#8a7a60',
  [TileType.DOOR]:       '#8b5a2b',
  [TileType.STAIR_DOWN]: '#60a0e0',
  [TileType.TRAP]:       '#c08030',
};

const RARITY_BORDER: Record<PieceRarity, string> = {
  [PieceRarity.COMMON]:     '#555',
  [PieceRarity.UNCOMMON]:   '#4a8',
  [PieceRarity.RARE]:       '#48c',
  [PieceRarity.ULTRA_RARE]: '#c8a',
};

export class PieceUI {
  private container: HTMLElement;
  private rotation: Rotation = 0;
  private onSelect: (index: number) => void;
  private onRotate: () => void;
  private onDiscard: () => void;

  constructor(
    containerId: string,
    onSelect: (i: number) => void,
    onRotate: () => void,
    onDiscard: () => void,
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`PieceUI container #${containerId} not found`);
    this.container = el;
    this.onSelect  = onSelect;
    this.onRotate  = onRotate;
    this.onDiscard = onDiscard;
  }

  setRotation(r: Rotation): void { this.rotation = r; }

  render(queue: PieceQueue): void {
    this.container.innerHTML = '';

    queue.visible.forEach((def, i) => {
      const isSelected = i === queue.selectedIndex;
      const card = document.createElement('div');
      card.className = 'piece-card' + (isSelected ? ' selected' : '');
      card.style.borderColor = RARITY_BORDER[def.rarity];
      card.title = def.label;

      const label = document.createElement('div');
      label.className = 'piece-label';
      label.textContent = def.label;
      if (def.rarity === PieceRarity.ULTRA_RARE) {
        label.style.color = '#c8a';
        label.textContent += ' ★';
      }
      card.appendChild(label);

      const preview = this.buildPreview(def, isSelected ? this.rotation : 0);
      card.appendChild(preview);

      card.addEventListener('click', () => this.onSelect(i));
      this.container.appendChild(card);
    });

    // Controls below the cards
    const controls = document.createElement('div');
    controls.className = 'piece-controls';

    const rotBtn = document.createElement('button');
    rotBtn.textContent = `Rotate (R) [${this.rotation}°]`;
    rotBtn.addEventListener('click', this.onRotate);
    controls.appendChild(rotBtn);

    const discBtn = document.createElement('button');
    discBtn.textContent = 'Discard (X)';
    discBtn.addEventListener('click', this.onDiscard);
    controls.appendChild(discBtn);

    // Show selected piece info
    const sel = selectedPiece(queue);
    if (sel && sel.rarity === PieceRarity.ULTRA_RARE) {
      const note = document.createElement('div');
      note.className = 'piece-note';
      note.textContent = 'Cannot discard ultra-rare!';
      controls.appendChild(note);
    }

    this.container.appendChild(controls);
  }

  private buildPreview(def: PieceDef, rotation: Rotation): HTMLElement {
    const cells = getRotatedCells(def, rotation);
    const maxX  = Math.max(...cells.map(c => c.localX));
    const maxY  = Math.max(...cells.map(c => c.localY));
    const w     = maxX + 1;
    const h     = maxY + 1;

    const grid = document.createElement('div');
    grid.className = 'piece-preview-grid';
    grid.style.width  = `${w * CELL_SIZE}px`;
    grid.style.height = `${h * CELL_SIZE}px`;
    grid.style.position = 'relative';

    for (const c of cells) {
      const cell = document.createElement('div');
      cell.className = 'piece-preview-cell';
      cell.style.left   = `${c.localX * CELL_SIZE}px`;
      cell.style.top    = `${c.localY * CELL_SIZE}px`;
      cell.style.width  = `${CELL_SIZE}px`;
      cell.style.height = `${CELL_SIZE}px`;
      cell.style.background = PIECE_COLORS[c.tileType];

      if (c.spawnEnemy) {
        const dot = document.createElement('div');
        dot.className = 'piece-dot enemy-dot';
        dot.title = enemyLabel(c.spawnEnemy);
        cell.appendChild(dot);
      }
      if (c.spawnItem) {
        const dot = document.createElement('div');
        dot.className = 'piece-dot item-dot';
        dot.title = itemLabel(c.spawnItem);
        cell.appendChild(dot);
      }
      if (c.tileType === TileType.STAIR_DOWN) {
        cell.textContent = '>';
        cell.style.color = '#fff';
        cell.style.textAlign = 'center';
        cell.style.lineHeight = `${CELL_SIZE}px`;
        cell.style.fontSize = '14px';
        cell.style.fontWeight = 'bold';
      }

      grid.appendChild(cell);
    }

    return grid;
  }
}

function enemyLabel(t: EnemyType): string {
  return { RAT: 'Rat', SKELETON: 'Skeleton', GOLEM: 'Golem', LICH: 'Lich' }[t] ?? t;
}

function itemLabel(t: ItemType): string {
  return {
    HEALTH_POTION: 'Health Potion', STRENGTH_SCROLL: 'Scroll',
    IRON_SHIELD: 'Shield', GOLD_PILE: 'Gold', BOMB: 'Bomb',
    CRYSTAL_SHARD: 'Crystal Shard',
  }[t] ?? t;
}
