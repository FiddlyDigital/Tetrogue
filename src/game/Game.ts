import * as ROT from 'rot-js';
import { World, createWorld } from '../world/World';
import { TileType, isPassable } from '../world/Tile';
import { Player, createPlayer, playerEffectiveAtk, tickStatusEffects, canPickup } from '../entities/Player';
import { EntityManager } from '../entities/EntityManager';
import { Enemy, isSlow } from '../entities/Enemy';
import { ItemType } from '../world/Piece';
import { PieceQueue, createQueue, consumeSelected, discardSelected, selectPiece, selectedPiece } from '../world/PieceQueue';
import { Rotation } from '../world/Piece';
import { canPlace, commitPlacement, getPlacementOrigin } from '../world/Placement';
import { RNG } from '../utils/rng';
import { FOVComputer } from '../utils/fov';
import { Renderer } from '../ui/Renderer';
import { HUD } from '../ui/HUD';
import { PieceUI } from '../ui/PieceUI';
import { GachaUI } from '../ui/GachaUI';
import { equipGear, getPassiveEffects } from '../entities/Gear';
import { pullCrystalGear, pullPieceUnlock, crystalShardDropAmount } from './Gacha';
import { START_X, START_Y, TILE_SIZE } from './constants';

export enum GameState {
  PLACE_PIECE = 'PLACE_PIECE',
  EXPLORE     = 'EXPLORE',
  DESCEND     = 'DESCEND',
  GAME_OVER   = 'GAME_OVER',
}

interface GhostState {
  cursorWX: number;
  cursorWY: number;
}

export class Game {
  private world!: World;
  private player!: Player;
  private entities!: EntityManager;
  private queue!: PieceQueue;
  private rng!: RNG;
  private fov!: FOVComputer;
  private rotation: Rotation = 0;
  private state: GameState = GameState.PLACE_PIECE;
  private ghost: GhostState | null = null;
  private unlockedPieceIds = new Set<string>();

  private renderer: Renderer;
  private hud: HUD;
  private pieceUI: PieceUI;
  private gachaUI: GachaUI;
  private canvas: HTMLCanvasElement;

  private gameOverEl: HTMLElement;
  private gameOverSeedEl: HTMLElement;
  private gameOverDepthEl: HTMLElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas   = canvas;
    this.renderer = new Renderer(canvas);
    this.hud      = new HUD();
    this.pieceUI  = new PieceUI(
      'piece-queue',
      (i) => this.handleSelectPiece(i),
      ()  => this.handleRotate(),
      ()  => this.handleDiscard(),
    );
    this.gachaUI = new GachaUI(
      () => this.handleCrystalPull(),
      () => this.handlePiecePull(),
    );

    this.gameOverEl      = document.getElementById('game-over')!;
    this.gameOverSeedEl  = document.getElementById('game-over-seed')!;
    this.gameOverDepthEl = document.getElementById('game-over-depth')!;

    document.getElementById('btn-restart')!.addEventListener('click', () => this.newGame());
    document.getElementById('btn-place-done')!.addEventListener('click', () => this.switchToExplore());
    document.getElementById('btn-gacha-crystal')!.addEventListener('click', () => this.gachaUI.toggle('crystal'));
    document.getElementById('btn-gacha-piece')!.addEventListener('click', () => this.gachaUI.toggle('piece'));

    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click',     (_e) => this.handleCanvasClick());
    document.addEventListener('keydown',      (e) => this.handleKey(e));

    this.newGame();
    this.loop();
  }

  private newGame(seed?: number): void {
    this.rng             = new RNG(seed);
    this.world           = createWorld(1);
    this.player          = createPlayer();
    this.entities        = new EntityManager(1);
    this.unlockedPieceIds = new Set();
    this.queue           = createQueue(1, this.rng, this.unlockedPieceIds);
    this.fov             = new FOVComputer();
    this.rotation        = 0;
    this.ghost           = null;
    this.state           = GameState.PLACE_PIECE;

    this.fov.compute(this.world, this.player.x, this.player.y);
    this.hud.clearMessages();
    this.hud.addMessage('Welcome to Tetrogue!');
    this.hud.addMessage('Place pieces then explore.');
    this.hud.addMessage('Kill enemies for ⬡ crystal shards!');
    this.hud.showSeed(this.rng.getSeed());
    this.hud.update(this.player, this.world.depth);
    this.pieceUI.setRotation(0);
    this.pieceUI.render(this.queue);
    this.gachaUI.updateShards(0, 0);
    this.gameOverEl.style.display = 'none';
    this.gachaUI.hide();
    this.updateStatusBar();
  }

  private updateStatusBar(): void {
    const labels: Record<GameState, string> = {
      [GameState.PLACE_PIECE]: 'PLACE PIECE — click canvas to place, R to rotate, X to discard',
      [GameState.EXPLORE]:     'EXPLORE — WASD/arrows to move, 1-6 use items, G pickup, C/V gacha',
      [GameState.DESCEND]:     'DESCENDING...',
      [GameState.GAME_OVER]:   'GAME OVER',
    };
    this.hud.setStatus(labels[this.state]);
    document.getElementById('btn-place-done')!.style.display =
      this.state === GameState.PLACE_PIECE ? 'inline-block' : 'none';
  }

  private switchToExplore(): void {
    if (this.state !== GameState.PLACE_PIECE) return;
    this.state = GameState.EXPLORE;
    this.ghost = null;
    this.updateStatusBar();
    this.hud.addMessage('Exploring. Find the staircase (>) to descend.');
  }

  private switchToPlace(): void {
    this.state    = GameState.PLACE_PIECE;
    this.ghost    = null;
    this.rotation = 0;
    this.pieceUI.setRotation(0);
    this.pieceUI.render(this.queue);
    this.updateStatusBar();
  }

  // ── Gacha ──────────────────────────────────────────────────────────────────

  private handleCrystalPull(): void {
    const result = pullCrystalGear(this.player, this.rng);
    if ('error' in result) {
      this.gachaUI.showError(result.error);
      return;
    }
    const msg = equipGear(this.player, result.gear);
    this.hud.addMessage(`★ Crystal pull: ${result.gear.name}!`);
    this.hud.addMessage(msg);
    this.gachaUI.showCrystalResult(result.gear);
    this.gachaUI.updateShards(this.player.crystalShards, this.player.pieceShards);
    this.hud.update(this.player, this.world.depth);
  }

  private handlePiecePull(): void {
    const result = pullPieceUnlock(this.player, this.rng, this.unlockedPieceIds);
    if ('error' in result) {
      this.gachaUI.showError(result.error);
      return;
    }
    this.hud.addMessage(`◈ Piece unlock: ${result.piece.label}!`);
    this.hud.addMessage('New piece type added to the pool.');
    this.gachaUI.showPieceResult(result.piece);
    this.gachaUI.updateShards(this.player.crystalShards, this.player.pieceShards);
    this.hud.update(this.player, this.world.depth);
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  private handleKey(e: KeyboardEvent): void {
    if (this.state === GameState.GAME_OVER) return;
    if (this.state === GameState.DESCEND) return;

    if (e.key === 'c' || e.key === 'C') { this.gachaUI.toggle('crystal'); return; }
    if (e.key === 'v' || e.key === 'V') { this.gachaUI.toggle('piece'); return; }

    if (this.gachaUI.isVisible()) return;

    if (this.state === GameState.PLACE_PIECE) {
      if (e.key === 'r' || e.key === 'R') { this.handleRotate(); return; }
      if (e.key === 'x' || e.key === 'X') { this.handleDiscard(); return; }
      if (e.key === '1') { this.handleSelectPiece(0); return; }
      if (e.key === '2') { this.handleSelectPiece(1); return; }
      if (e.key === '3') { this.handleSelectPiece(2); return; }
      if (e.key === 'Enter' || e.key === ' ') { this.switchToExplore(); return; }
      return;
    }

    if (this.state === GameState.EXPLORE) {
      let dx = 0, dy = 0;
      switch (e.key) {
        case 'ArrowUp':    case 'w': case 'k': dy = -1; break;
        case 'ArrowDown':  case 's': case 'j': dy =  1; break;
        case 'ArrowLeft':  case 'a': case 'h': dx = -1; break;
        case 'ArrowRight': case 'd': case 'l': dx =  1; break;
        case 'g': case 'G': this.handlePickup(); return;
        case '.': this.endPlayerTurn(); return;
        case 'p': case 'P': this.switchToPlace(); return;
      }
      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        this.handleMove(dx, dy);
        return;
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 6) this.handleUseItem(num - 1);
    }
  }

  private handleSelectPiece(i: number): void {
    selectPiece(this.queue, i);
    this.pieceUI.render(this.queue);
  }

  private handleRotate(): void {
    const rotations: Rotation[] = [0, 90, 180, 270];
    const idx = rotations.indexOf(this.rotation);
    this.rotation = rotations[(idx + 1) % 4];
    this.pieceUI.setRotation(this.rotation);
    this.pieceUI.render(this.queue);
  }

  private handleDiscard(): void {
    const ok = discardSelected(this.queue, this.rng);
    if (!ok) {
      this.hud.addMessage('Cannot discard an ultra-rare piece!');
    } else {
      this.hud.addMessage('Piece discarded.');
    }
    this.pieceUI.render(this.queue);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.state !== GameState.PLACE_PIECE) { this.ghost = null; return; }
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;
    const tx = Math.floor(mx / TILE_SIZE);
    const ty = Math.floor(my / TILE_SIZE);
    this.ghost = {
      cursorWX: this.renderer.cameraX + tx,
      cursorWY: this.renderer.cameraY + ty,
    };
  }

  private handleCanvasClick(): void {
    if (this.state !== GameState.PLACE_PIECE) return;
    const def = selectedPiece(this.queue);
    if (!def || !this.ghost) return;

    const origin = getPlacementOrigin(this.ghost.cursorWX, this.ghost.cursorWY, def, this.rotation);
    if (!canPlace(this.world, def, origin.x, origin.y, this.rotation)) {
      this.hud.addMessage('Cannot place piece there.');
      return;
    }

    commitPlacement(this.world, def, origin.x, origin.y, this.rotation, this.entities);
    consumeSelected(this.queue, this.rng);
    this.fov.compute(this.world, this.player.x, this.player.y);
    this.hud.addMessage(`Placed: ${def.label}`);
    this.rotation = 0;
    this.pieceUI.setRotation(0);
    this.pieceUI.render(this.queue);
    this.hud.update(this.player, this.world.depth);
    this.switchToExplore();
  }

  // ── Player Actions ─────────────────────────────────────────────────────────

  private handleMove(dx: number, dy: number): void {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    if (nx < 0 || ny < 0 || nx >= 50 || ny >= 50) return;
    const tile = this.world.grid[ny][nx];
    if (!isPassable(tile)) return;

    const enemy = this.entities.enemyAt(nx, ny);
    if (enemy) {
      this.attackEnemy(enemy);
    } else {
      this.player.x = nx;
      this.player.y = ny;
      this.player.facing = dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
      this.handleStepEffects(nx, ny, tile.type);
    }
    this.endPlayerTurn();
  }

  private handleStepEffects(x: number, y: number, tileType: TileType): void {
    for (const item of this.entities.itemsAt(x, y)) {
      if (item.type === ItemType.GOLD_PILE) {
        const gold = this.rng.getInt(10, 25);
        this.player.gold += gold;
        this.entities.removeItem(item.id);
        this.hud.addMessage(`Picked up ${gold} gold.`);
      } else if (item.type === ItemType.CRYSTAL_SHARD) {
        const amt = item.value;
        this.player.crystalShards += amt;
        this.entities.removeItem(item.id);
        this.hud.addMessage(`⬡ Collected ${amt} crystal shard${amt > 1 ? 's' : ''}! (${this.player.crystalShards} total)`);
        this.gachaUI.updateShards(this.player.crystalShards, this.player.pieceShards);
      }
    }

    if (tileType === TileType.TRAP && this.world.grid[y][x].isTrap) {
      const dmg = Math.max(1, 4 - this.player.def);
      this.player.hp -= dmg;
      this.hud.addMessage(`Trap! Took ${dmg} damage.`);
    }

    if (tileType === TileType.STAIR_DOWN) {
      this.descend();
    }
  }

  private handlePickup(): void {
    const item = this.entities.itemAt(this.player.x, this.player.y);
    if (!item) { this.hud.addMessage('Nothing here to pick up.'); return; }
    if (item.type === ItemType.GOLD_PILE || item.type === ItemType.CRYSTAL_SHARD) {
      this.handleStepEffects(this.player.x, this.player.y, this.world.grid[this.player.y][this.player.x].type);
      this.endPlayerTurn();
      return;
    }
    if (!canPickup(this.player)) { this.hud.addMessage('Inventory full!'); return; }
    this.player.inventory.push(item.type);
    this.entities.removeItem(item.id);
    this.hud.addMessage(`Picked up ${item.type.replace(/_/g, ' ')}.`);
    this.hud.update(this.player, this.world.depth);
    this.endPlayerTurn();
  }

  private handleUseItem(slot: number): void {
    if (slot >= this.player.inventory.length) return;
    const type = this.player.inventory[slot];
    this.applyItem(type);
    this.player.inventory.splice(slot, 1);
    this.hud.update(this.player, this.world.depth);
    this.endPlayerTurn();
  }

  private applyItem(type: ItemType): void {
    switch (type) {
      case ItemType.HEALTH_POTION: {
        const heal = Math.min(this.player.maxHp - this.player.hp, 15);
        this.player.hp += heal;
        this.hud.addMessage(`Drank potion. Healed ${heal} HP.`);
        break;
      }
      case ItemType.STRENGTH_SCROLL:
        this.player.statusEffects.push({ type: 'STRENGTH', turnsLeft: 10, magnitude: 3 });
        this.hud.addMessage('Strength scroll! +3 ATK for 10 turns.');
        break;
      case ItemType.IRON_SHIELD:
        this.player.def += 2;
        this.hud.addMessage('Iron shield equipped. +2 DEF permanently.');
        break;
      case ItemType.BOMB: {
        let killed = 0;
        for (const e of this.entities.allEnemies()) {
          const dist = Math.abs(e.x - this.player.x) + Math.abs(e.y - this.player.y);
          if (dist <= 2) {
            e.hp -= 15;
            if (e.hp <= 0) { this.entities.removeEnemy(e.id); killed++; }
          }
        }
        this.hud.addMessage(`Bomb! Damaged nearby enemies.${killed ? ` Killed ${killed}.` : ''}`);
        break;
      }
      case ItemType.GOLD_PILE:
        this.hud.addMessage("That's already gold!");
        break;
      case ItemType.CRYSTAL_SHARD:
        this.hud.addMessage('Crystal shards are auto-collected!');
        break;
    }
  }

  private attackEnemy(enemy: Enemy): void {
    const dmg = Math.max(1, playerEffectiveAtk(this.player) - enemy.def);
    enemy.hp -= dmg;
    this.hud.addMessage(`Hit ${enemy.type} for ${dmg} damage.`);

    if (enemy.hp <= 0) {
      this.onEnemyKilled(enemy);
    } else {
      enemy.isAlerted = true;
    }
  }

  private onEnemyKilled(enemy: Enemy): void {
    this.entities.removeEnemy(enemy.id);

    const gold = this.rng.getInt(2, 8);
    this.player.gold += gold;

    const passive = getPassiveEffects(this.player.equipment);

    // Lifesteal
    if (passive.lifeStealOnKill > 0) {
      const healed = Math.min(passive.lifeStealOnKill, this.player.maxHp - this.player.hp);
      this.player.hp += healed;
      if (healed > 0) this.hud.addMessage(`Lifesteal: +${healed} HP.`);
    }

    // Crystal shard drop
    const baseShards  = crystalShardDropAmount(enemy.type);
    const bonusShards = passive.shardBonusOnKill;
    const totalShards = baseShards + bonusShards;
    this.entities.spawnItem(ItemType.CRYSTAL_SHARD, enemy.x, enemy.y, totalShards);

    this.hud.addMessage(`${enemy.type} defeated! +${gold} gold. ⬡×${totalShards} shard${totalShards > 1 ? 's' : ''} dropped.`);

    // Piece shards for boss kill
    if (enemy.type === 'LICH') {
      this.player.pieceShards += 2;
      this.hud.addMessage('◈ Boss slain! +2 piece shards!');
      this.gachaUI.updateShards(this.player.crystalShards, this.player.pieceShards);
    }
  }

  // ── Enemy Turn ─────────────────────────────────────────────────────────────

  private endPlayerTurn(): void {
    const msgs = tickStatusEffects(this.player);
    for (const m of msgs) this.hud.addMessage(m);

    for (const enemy of this.entities.allEnemies()) {
      this.runEnemyTurn(enemy);
    }

    if (this.player.hp <= 0) {
      this.gameOver();
      return;
    }

    this.fov.compute(this.world, this.player.x, this.player.y);
    this.hud.update(this.player, this.world.depth);
  }

  private runEnemyTurn(enemy: Enemy): void {
    if (isSlow(enemy)) {
      enemy.turnDebt++;
      if (enemy.turnDebt % 2 !== 0) return;
    }

    if (!enemy.isAlerted) {
      const dist = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
      if (dist <= 6) {
        enemy.isAlerted = true;
        this.hud.addMessage(`The ${enemy.type} notices you!`);
      }
    }

    if (!enemy.isAlerted) return;

    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      // Dodge check
      const passive = getPassiveEffects(this.player.equipment);
      if (passive.dodgeChance > 0 && this.rng.getUniform() < passive.dodgeChance) {
        this.hud.addMessage(`Dodged ${enemy.type}'s attack!`);
        return;
      }
      const dmg = Math.max(1, enemy.atk - this.player.def);
      this.player.hp -= dmg;
      this.hud.addMessage(`${enemy.type} hits you for ${dmg} damage!`);
      return;
    }

    const passable = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= 50 || y >= 50) return false;
      if (!isPassable(this.world.grid[y][x])) return false;
      if (this.entities.enemyAt(x, y)) return false;
      return true;
    };

    const astar = new ROT.Path.AStar(this.player.x, this.player.y, passable, { topology: 4 });
    const path: Array<[number, number]> = [];
    astar.compute(enemy.x, enemy.y, (x, y) => path.push([x, y]));

    if (path.length >= 2) {
      const [nx, ny] = path[1];
      if (nx !== this.player.x || ny !== this.player.y) {
        enemy.x = nx;
        enemy.y = ny;
      }
    }
  }

  // ── State Transitions ──────────────────────────────────────────────────────

  private descend(): void {
    this.state = GameState.DESCEND;
    const newDepth = this.world.depth + 1;
    this.hud.addMessage(`Descending to floor ${newDepth}...`);

    // Piece shard reward every 3 floors
    if (newDepth % 3 === 0) {
      this.player.pieceShards += 1;
      this.hud.addMessage(`◈ Floor milestone! +1 piece shard. (${this.player.pieceShards} total)`);
    }

    this.world    = createWorld(newDepth);
    this.world.depth = newDepth;
    this.entities = new EntityManager(newDepth);
    this.entities.setDepth(newDepth);
    this.queue    = createQueue(newDepth, this.rng, this.unlockedPieceIds);
    this.fov      = new FOVComputer();
    this.player.x = START_X;
    this.player.y = START_Y;
    this.rotation = 0;

    this.fov.compute(this.world, this.player.x, this.player.y);
    this.hud.update(this.player, newDepth);
    this.gachaUI.updateShards(this.player.crystalShards, this.player.pieceShards);
    this.hud.addMessage(`Floor ${newDepth}. Place a piece to continue.`);
    this.pieceUI.setRotation(0);
    this.pieceUI.render(this.queue);
    this.state = GameState.PLACE_PIECE;
    this.updateStatusBar();
  }

  private gameOver(): void {
    this.state = GameState.GAME_OVER;
    this.gameOverEl.style.display = 'flex';
    this.gameOverSeedEl.textContent  = `Seed: ${this.rng.getSeed()}`;
    this.gameOverDepthEl.textContent = `Floor ${this.world.depth}`;
    this.updateStatusBar();
  }

  // ── Render Loop ────────────────────────────────────────────────────────────

  private loop(): void {
    const def = selectedPiece(this.queue);
    const ghostPayload = (this.state === GameState.PLACE_PIECE && def && this.ghost)
      ? { def, rotation: this.rotation, cursorWX: this.ghost.cursorWX, cursorWY: this.ghost.cursorWY }
      : null;

    this.renderer.render(this.world, this.player, this.entities, ghostPayload);
    requestAnimationFrame(() => this.loop());
  }
}
