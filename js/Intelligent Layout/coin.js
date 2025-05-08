// 独立的复古硬币动画模块
import { coinStyles, injectStyles } from './styles.js';

export class RetroCoin {
  constructor(options = {}) {
    this.side = options.side === 'devil' ? 'devil' : 'angel';
    this.flipping = false;
    this.duration = options.duration || 700;
    this.onFlip = typeof options.onFlip === 'function' ? options.onFlip : null;
    this.el = this._createCoin();
  }

  _createCoin() {
    const container = document.createElement('div');
    container.className = 'coin-container';
    
    container.innerHTML = `
      <div class="coin${this.side === 'devil' ? ' flipped' : ''}">
        <div class="coin-face coin-face-front">
          <span class="coin-angel" title="天使">👼</span>
        </div>
        <div class="coin-face coin-face-back">
          <span class="coin-devil" title="恶魔">😈</span>
        </div>
      </div>
    `;
    
    // 使用外部样式模块注入样式
    injectStyles('layout-coin-styles', coinStyles);
    
    container.addEventListener('click', () => this.flip());
    return container;
  }

  get element() {
    return this.el;
  }

  flip() {
    if (this.flipping) return;
    this.flipping = true;
    const coin = this.el.querySelector('.coin');
    const willBeDevil = !coin.classList.contains('flipped');
    coin.classList.toggle('flipped');
    
    setTimeout(() => {
      this.side = willBeDevil ? 'devil' : 'angel';
      this.flipping = false;
      if (this.onFlip) this.onFlip(this.side);
    }, this.duration);
  }

  setPosition(x, y) {
    this.el.style.position = 'absolute';
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
    this.el.style.transform = 'translate(-50%, -50%)';
    this.el.style.zIndex = 100;
  }
}
