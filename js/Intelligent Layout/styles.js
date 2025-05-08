// Intelligent Layout 样式模块
// 统一管理所有CSS样式，方便维护和修改

// 硬币相关样式
export const coinStyles = `
  .coin-container {
    position: relative;
    width: 90px;
    height: 90px;
    user-select: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .coin {
    width: 90px;
    height: 90px;
    perspective: 600px;
    position: relative;
    border-radius: 50%;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 0 4px #d4b56e inset;
    background: radial-gradient(ellipse at 60% 40%, #ffe9b3 60%, #d4b56e 100%);
    transition: box-shadow 0.3s;
    transform-style: preserve-3d;
    transition: transform 0.7s cubic-bezier(.4,2,.6,.9);
  }
  .coin:active {
    box-shadow: 0 5px 15px rgba(0,0,0,0.3), 0 0 0 4px #d4b56e inset;
  }
  .coin-face {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    font-family: serif;
    font-weight: bold;
    color: #fffbe6;
    text-shadow: 0 2px 8px #d4b56e, 0 0 2px #fffbe6;
    box-shadow: 0 0 0 2px #d4b56e inset;
    background: radial-gradient(ellipse at 60% 40%, #ffe9b3 70%, #d4b56e 100%);
  }
  .coin-face-front {
    transform: rotateY(0deg);
  }
  .coin-face-back {
    transform: rotateY(180deg);
    color: #fff0f0;
    text-shadow: 0 2px 8px #a66, 0 0 2px #fff;
    background: radial-gradient(ellipse at 40% 60%, #f8c8c8 70%, #a66 100%);
  }
  .coin.flipped {
    animation: coin-flip 0.7s cubic-bezier(.4,2,.6,.9);
    transform: rotateY(180deg);
  }
  .coin:not(.flipped) {
    animation: coin-flip-rev 0.7s cubic-bezier(.4,2,.6,.9);
    transform: rotateY(0deg);
  }
  @keyframes coin-flip {
    0% { transform: rotateY(0deg);}
    100% { transform: rotateY(180deg);}
  }
  @keyframes coin-flip-rev {
    0% { transform: rotateY(180deg);}
    100% { transform: rotateY(0deg);}
  }
  .coin-angel, .coin-devil {
    pointer-events: none;
    user-select: none;
    font-size: 42px;
  }
  /* 复古边缘高光增强 */
  .coin::before {
    content: "";
    position: absolute;
    left: 0; top: 0; width: 100%; height: 100%;
    border-radius: 50%;
    box-shadow: 0 0 0 6px #e6c97a inset, 0 0 20px 2px #fffbe6 inset;
    pointer-events: none;
    z-index: 2;
  }
  /* 3D浮雕感增强 */
  .coin::after {
    content: "";
    position: absolute;
    left: 10%; top: 10%; width: 80%; height: 80%;
    border-radius: 50%;
    box-shadow: 0 2px 16px 2px #bfa76a inset, 0 -2px 8px 2px #fffbe6 inset;
    pointer-events: none;
    z-index: 1;
  }
`;

// 布局面板相关样式
export const layoutPanelStyles = `
  .layout-coin-panel {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  
  /* 按钮彩虹动画 */
  @keyframes rainbow {
    0% { background-position: 0% 82% }
    50% { background-position: 100% 19% }
    100% { background-position: 0% 82% }
  }
  .layout-btn-rainbow:hover {
    background-image: linear-gradient(124deg, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #dd00f3) !important;
    background-size: 1800% 1800% !important;
    animation: rainbow 6s ease infinite !important;
  }
  
  /* 按钮水波纹效果 */
  .layout-btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, .5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }
  
  .layout-btn:active::after {
    animation: ripple 0.6s ease-out;
  }
  
  @keyframes ripple {
    0% {
      transform: scale(0, 0) translate(-50%, -50%);
      opacity: 0.5;
    }
    100% {
      transform: scale(20, 20) translate(-50%, -50%);
      opacity: 0;
    }
  }
`;

// 工具函数：向页面注入样式
export function injectStyles(styleId, styleContent) {
  // 如果已经存在相同ID的样式，则不重复注入
  if (document.getElementById(styleId)) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = styleContent;
  document.head.appendChild(styleElement);
}

// 工具函数：移除已注入的样式
export function removeStyles(styleId) {
  const styleElement = document.getElementById(styleId);
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
  }
}