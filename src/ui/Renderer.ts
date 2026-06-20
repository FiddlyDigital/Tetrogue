import { TILE_SIZE, CANVAS_W, CANVAS_H, VIEWPORT_TILES_W, VIEWPORT_TILES_H, GRID_W, GRID_H } from '../game/constants';
import { World } from '../world/World';
import { TileType, FogState } from '../world/Tile';
import { Player } from '../entities/Player';
import { EntityManager } from '../entities/EntityManager';
import { EnemyType, PieceDef } from '../world/Piece';
import { getRotatedCells, Rotation } from '../world/Piece';
import { getPlacementOrigin } from '../world/Placement';
import { canPlace } from '../world/Placement';
import { ITEM_COLORS } from '../entities/Item';

const TILE_COLORS: Record<TileType, string> = {
  [TileType.VOID]:       '#000000',
  [TileType.WALL]:       '#3a3a4a',
  [TileType.FLOOR]:      '#8a7a60',
  [TileType.DOOR]:       '#8b5a2b',
  [TileType.STAIR_DOWN]: '#60a0e0',
  [TileType.TRAP]:       '#8a7a60',
};

const TILE_REMEMBERED: Record<TileType, string> = {
  [TileType.VOID]:       '#000000',
  [TileType.WALL]:       '#1e1e28',
  [TileType.FLOOR]:      '#453d30',
  [TileType.DOOR]:       '#45301a',
  [TileType.STAIR_DOWN]: '#305060',
  [TileType.TRAP]:       '#453d30',
};

const ENEMY_COLORS: Record<EnemyType, string> = {
  [EnemyType.RAT]:      '#c8a060',
  [EnemyType.SKELETON]: '#e0e0d0',
  [EnemyType.GOLEM]:    '#708090',
  [EnemyType.LICH]:     '#c040e0',
};

const ENEMY_GLYPHS: Record<EnemyType, string> = {
  [EnemyType.RAT]:      'r',
  [EnemyType.SKELETON]: 's',
  [EnemyType.GOLEM]:    'G',
  [EnemyType.LICH]:     'L',
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  cameraX = 0;
  cameraY = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    this.ctx = ctx;
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;
  }

  private updateCamera(player: Player): void {
    this.cameraX = Math.max(0, Math.min(
      player.x - Math.floor(VIEWPORT_TILES_W / 2),
      GRID_W - VIEWPORT_TILES_W,
    ));
    this.cameraY = Math.max(0, Math.min(
      player.y - Math.floor(VIEWPORT_TILES_H / 2),
      GRID_H - VIEWPORT_TILES_H,
    ));
  }

  render(
    world: World,
    player: Player,
    entities: EntityManager,
    ghost: { def: PieceDef; rotation: Rotation; cursorWX: number; cursorWY: number } | null,
  ): void {
    const ctx = this.ctx;
    this.updateCamera(player);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Tile layer
    for (let ty = 0; ty < VIEWPORT_TILES_H; ty++) {
      for (let tx = 0; tx < VIEWPORT_TILES_W; tx++) {
        const wx = this.cameraX + tx;
        const wy = this.cameraY + ty;
        if (wx >= GRID_W || wy >= GRID_H) continue;
        const tile = world.grid[wy][wx];
        if (tile.fog === FogState.UNSEEN) continue;

        const color = tile.fog === FogState.VISIBLE
          ? TILE_COLORS[tile.type]
          : TILE_REMEMBERED[tile.type];

        ctx.fillStyle = color;
        ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Tile detail lines
        if (tile.fog === FogState.VISIBLE) {
          if (tile.type === TileType.WALL) {
            ctx.fillStyle = '#4a4a5a';
            ctx.fillRect(tx * TILE_SIZE + 2, ty * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          } else if (tile.type === TileType.STAIR_DOWN) {
            ctx.fillStyle = '#fff';
            ctx.font = `${TILE_SIZE - 6}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('>', tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2);
          } else if (tile.type === TileType.DOOR) {
            ctx.fillStyle = '#5a3010';
            ctx.fillRect(tx * TILE_SIZE + TILE_SIZE * 0.3, ty * TILE_SIZE + 2, TILE_SIZE * 0.4, TILE_SIZE - 4);
          }
        }
      }
    }

    // Item layer (visible tiles only)
    ctx.font = `${TILE_SIZE - 8}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const item of entities.allItems()) {
      const tile = world.grid[item.y]?.[item.x];
      if (!tile || tile.fog !== FogState.VISIBLE) continue;
      const sx = (item.x - this.cameraX) * TILE_SIZE;
      const sy = (item.y - this.cameraY) * TILE_SIZE;
      if (sx < 0 || sx >= CANVAS_W || sy < 0 || sy >= CANVAS_H) continue;
      ctx.fillStyle = ITEM_COLORS[item.type];
      ctx.fillText('*', sx + TILE_SIZE / 2, sy + TILE_SIZE / 2);
    }

    // Enemy layer (visible tiles only)
    for (const enemy of entities.allEnemies()) {
      const tile = world.grid[enemy.y]?.[enemy.x];
      if (!tile || tile.fog !== FogState.VISIBLE) continue;
      const sx = (enemy.x - this.cameraX) * TILE_SIZE;
      const sy = (enemy.y - this.cameraY) * TILE_SIZE;
      if (sx < 0 || sx >= CANVAS_W || sy < 0 || sy >= CANVAS_H) continue;

      // BG circle
      ctx.fillStyle = ENEMY_COLORS[enemy.type];
      ctx.beginPath();
      ctx.arc(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, TILE_SIZE / 2 - 3, 0, Math.PI * 2);
      ctx.fill();

      // HP bar
      const barW = TILE_SIZE - 4;
      const hpFrac = enemy.hp / enemy.maxHp;
      ctx.fillStyle = '#400';
      ctx.fillRect(sx + 2, sy + TILE_SIZE - 6, barW, 4);
      ctx.fillStyle = hpFrac > 0.5 ? '#0c0' : hpFrac > 0.25 ? '#cc0' : '#c00';
      ctx.fillRect(sx + 2, sy + TILE_SIZE - 6, Math.round(barW * hpFrac), 4);

      // Glyph
      ctx.fillStyle = '#000';
      ctx.font = `bold ${TILE_SIZE - 10}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ENEMY_GLYPHS[enemy.type], sx + TILE_SIZE / 2, sy + TILE_SIZE / 2 - 2);
    }

    // Player
    {
      const sx = (player.x - this.cameraX) * TILE_SIZE;
      const sy = (player.y - this.cameraY) * TILE_SIZE;
      ctx.fillStyle = '#50c8ff';
      ctx.beginPath();
      ctx.arc(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, TILE_SIZE / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#003';
      ctx.font = `bold ${TILE_SIZE - 10}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('@', sx + TILE_SIZE / 2, sy + TILE_SIZE / 2 - 2);
    }

    // Ghost overlay (placement mode)
    if (ghost) {
      const { def, rotation, cursorWX, cursorWY } = ghost;
      const origin = getPlacementOrigin(cursorWX, cursorWY, def, rotation);
      const valid  = canPlace(world, def, origin.x, origin.y, rotation);
      const cells  = getRotatedCells(def, rotation);

      ctx.globalAlpha = 0.5;
      for (const c of cells) {
        const wx = origin.x + c.localX;
        const wy = origin.y + c.localY;
        const sx = (wx - this.cameraX) * TILE_SIZE;
        const sy = (wy - this.cameraY) * TILE_SIZE;
        if (sx < -TILE_SIZE || sx > CANVAS_W || sy < -TILE_SIZE || sy > CANVAS_H) continue;
        ctx.fillStyle = valid
          ? (c.tileType === TileType.FLOOR ? '#40c040' : c.tileType === TileType.WALL ? '#206020' : '#30a030')
          : (c.tileType === TileType.WALL ? '#602020' : '#c04040');
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      }
      ctx.globalAlpha = 1.0;
    }
  }
}
