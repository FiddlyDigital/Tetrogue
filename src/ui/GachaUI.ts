import { CrystalGear, GEAR_RARITY_COLOR, EquipSlot } from '../entities/Gear';
import { PieceDef } from '../world/Piece';
import { CRYSTAL_PULL_COST, PIECE_PULL_COST } from '../game/Gacha';

export class GachaUI {
  private modal: HTMLElement;
  private crystalTab: HTMLElement;
  private pieceTab: HTMLElement;
  private crystalResult: HTMLElement;
  private pieceResult: HTMLElement;
  private activeTab: 'crystal' | 'piece' = 'crystal';

  private onCrystalPull: () => void;
  private onPiecePull: () => void;

  constructor(onCrystalPull: () => void, onPiecePull: () => void) {
    this.onCrystalPull = onCrystalPull;
    this.onPiecePull   = onPiecePull;

    this.modal         = this.el('gacha-modal');
    this.crystalTab    = this.el('gacha-crystal-tab');
    this.pieceTab      = this.el('gacha-piece-tab');
    this.crystalResult = this.el('gacha-crystal-result');
    this.pieceResult   = this.el('gacha-piece-result');

    this.el('gacha-close').addEventListener('click',      () => this.hide());
    this.el('gacha-tab-crystal').addEventListener('click', () => this.showTab('crystal'));
    this.el('gacha-tab-piece').addEventListener('click',   () => this.showTab('piece'));
    this.el('btn-pull-crystal').addEventListener('click',  () => this.onCrystalPull());
    this.el('btn-pull-piece').addEventListener('click',    () => this.onPiecePull());

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isVisible()) this.hide();
    });
  }

  private el(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`GachaUI element #${id} not found`);
    return el;
  }

  isVisible(): boolean { return this.modal.style.display !== 'none'; }

  show(tab: 'crystal' | 'piece' = this.activeTab): void {
    this.modal.style.display = 'flex';
    this.showTab(tab);
  }

  hide(): void { this.modal.style.display = 'none'; }

  toggle(tab: 'crystal' | 'piece'): void {
    if (this.isVisible() && this.activeTab === tab) this.hide();
    else this.show(tab);
  }

  private showTab(tab: 'crystal' | 'piece'): void {
    this.activeTab = tab;
    this.crystalTab.style.display = tab === 'crystal' ? 'block' : 'none';
    this.pieceTab.style.display   = tab === 'piece'   ? 'block' : 'none';
    this.el('gacha-tab-crystal').classList.toggle('active', tab === 'crystal');
    this.el('gacha-tab-piece').classList.toggle('active', tab === 'piece');
  }

  updateShards(crystalShards: number, pieceShards: number): void {
    this.el('gacha-crystal-shards').textContent = String(crystalShards);
    this.el('gacha-piece-shards').textContent   = String(pieceShards);
    this.el('gacha-crystal-cost').textContent   = String(CRYSTAL_PULL_COST);
    this.el('gacha-piece-cost').textContent     = String(PIECE_PULL_COST);

    (this.el('btn-pull-crystal') as HTMLButtonElement).disabled = crystalShards < CRYSTAL_PULL_COST;
    (this.el('btn-pull-piece')   as HTMLButtonElement).disabled = pieceShards   < PIECE_PULL_COST;
  }

  showCrystalResult(gear: CrystalGear): void {
    const color = GEAR_RARITY_COLOR[gear.rarity];
    const slotLabel = ({ WEAPON: 'Weapon', ARMOR: 'Armor', RING: 'Ring', AMULET: 'Amulet' } as Record<EquipSlot, string>)[gear.slot];
    this.reveal(this.crystalResult, `
      <div class="gacha-result-box" style="border-color: ${color}">
        <div class="gacha-result-rarity" style="color: ${color}">${gear.rarity}</div>
        <div class="gacha-result-name"   style="color: ${color}">${gear.name}</div>
        <div class="gacha-result-slot">[${slotLabel}]</div>
        <div class="gacha-result-desc">${gear.description}</div>
        <div class="gacha-result-note">Auto-equipped!</div>
      </div>`);
  }

  showPieceResult(piece: PieceDef): void {
    this.reveal(this.pieceResult, `
      <div class="gacha-result-box" style="border-color: #a0e080">
        <div class="gacha-result-rarity" style="color: #a0e080">UNLOCKED</div>
        <div class="gacha-result-name"   style="color: #c0f0a0">${piece.label}</div>
        <div class="gacha-result-desc">New piece type added to pool!</div>
        <div class="gacha-result-note">Will appear in future draws this run.</div>
      </div>`);
  }

  showError(msg: string): void {
    const target = this.activeTab === 'crystal' ? this.crystalResult : this.pieceResult;
    target.innerHTML = `<div class="gacha-result-box gacha-error">${msg}</div>`;
  }

  private reveal(el: HTMLElement, html: string): void {
    el.innerHTML = html;
    el.firstElementChild?.classList.remove('flash');
    void (el.firstElementChild as HTMLElement | null)?.offsetWidth;
    el.firstElementChild?.classList.add('flash');
  }
}
