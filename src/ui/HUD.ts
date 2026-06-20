import { Player } from '../entities/Player';
import { ITEM_LABELS } from '../entities/Item';

const MAX_MESSAGES = 7;

export class HUD {
  private messages: string[] = [];
  private els: {
    hp: HTMLElement;
    hpBar: HTMLElement;
    atk: HTMLElement;
    def: HTMLElement;
    gold: HTMLElement;
    depth: HTMLElement;
    inventory: HTMLElement;
    log: HTMLElement;
    seed: HTMLElement;
    statusMsg: HTMLElement;
  };

  constructor() {
    this.els = {
      hp:        this.get('hud-hp'),
      hpBar:     this.get('hud-hp-bar'),
      atk:       this.get('hud-atk'),
      def:       this.get('hud-def'),
      gold:      this.get('hud-gold'),
      depth:     this.get('hud-depth'),
      inventory: this.get('hud-inventory'),
      log:       this.get('hud-log'),
      seed:      this.get('hud-seed'),
      statusMsg: this.get('hud-status'),
    };
  }

  private get(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`HUD element #${id} not found`);
    return el;
  }

  update(player: Player, depth: number): void {
    this.els.hp.textContent    = `${player.hp} / ${player.maxHp}`;
    this.els.atk.textContent   = String(player.atk);
    this.els.def.textContent   = String(player.def);
    this.els.gold.textContent  = String(player.gold);
    this.els.depth.textContent = String(depth);

    const pct = Math.max(0, player.hp / player.maxHp) * 100;
    this.els.hpBar.style.width = `${pct}%`;
    this.els.hpBar.style.background = pct > 50 ? '#3a8' : pct > 25 ? '#a83' : '#a33';

    const inv = player.inventory;
    this.els.inventory.innerHTML = inv.length === 0
      ? '<span class="empty">empty</span>'
      : inv.map((t, i) => `<div class="inv-item">[${i+1}] ${ITEM_LABELS[t]}</div>`).join('');
  }

  addMessage(msg: string): void {
    this.messages.push(msg);
    if (this.messages.length > MAX_MESSAGES) this.messages.shift();
    this.els.log.innerHTML = this.messages
      .map(m => `<div>${m}</div>`)
      .join('');
    this.els.log.scrollTop = this.els.log.scrollHeight;
  }

  showSeed(seed: number): void {
    this.els.seed.textContent = `Seed: ${seed}`;
  }

  setStatus(msg: string): void {
    this.els.statusMsg.textContent = msg;
  }

  clearMessages(): void {
    this.messages = [];
    this.els.log.innerHTML = '';
  }
}
