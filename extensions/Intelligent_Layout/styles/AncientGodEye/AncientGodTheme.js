/**
 * AncientGodTheme.js - 古神之眼主题
 * 整合秩序和混沌两种风格的面板和硬币效果
 */

import './AncientGod1.js'; // 秩序主题硬币
import './AncientGod2.js'; // 混沌主题硬币
import { injectStyles, removeStyles } from '../UIStyles.js';

// 导入模块化的面板背景SVG
import { OrderPanelSVG } from './OrderPanelStyle.js';
import { ChaosPanelSVG } from './ChaosPanelStyle.js';

// 秩序主题CSS
const OrderPanelCSS = `
  .layout-panel {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(176, 141, 225, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 8px rgba(138, 43, 226, 0.2);
  }
  
  .layout-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(176, 141, 225, 0.7), transparent);
  }
  
  .ancient-god-coin-container {
    perspective: 1600px;
    width: 180px;
    height: 180px;
    margin: 5px auto 25px auto;
    position: relative;
  }

  .ancient-god-coin {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.9s cubic-bezier(.4,2,.3,1);
    cursor: pointer;
  }
  
  .ancient-god-coin.flipped {
    transform: rotateY(180deg);
  }
  
  .ancient-god-coin-face {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  }
  
  .ancient-god-coin-face.back {
    transform: rotateY(180deg);
  }
  
  .layout-btn {
    background: rgba(106, 90, 205, 0.4);
    border: 1px solid rgba(176, 141, 225, 0.5);
    color: #e1e1e1;
  }

  .layout-btn:hover {
    background: rgba(106, 90, 205, 0.6);
    box-shadow: 0 0 15px rgba(138, 43, 226, 0.5);
    border: 1px solid rgba(176, 141, 225, 0.8);
    color: white;
  }

  /* 移除特殊按钮样式，统一所有按钮外观 */
  
  select {
    border: 1px solid rgba(176, 141, 225, 0.4);
    background-color: rgba(42, 30, 74, 0.6);
  }
`;

// 混沌主题CSS
const ChaosPanelCSS = `
  .layout-panel {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 0, 0, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 10px rgba(184, 0, 0, 0.2);
  }
  
  .layout-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 0, 0, 0.7), transparent);
  }
  
  .ancient-god-coin-container {
    perspective: 1600px;
    width: 180px;
    height: 180px;
    margin: 5px auto 25px auto;
    position: relative;
  }
  
  .ancient-god-coin {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.9s cubic-bezier(.4,2,.3,1);
    cursor: pointer;
  }
  
  .ancient-god-coin.flipped {
    transform: rotateY(180deg);
  }
  
  .ancient-god-coin-face {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  }
  
  .ancient-god-coin-face.back {
    transform: rotateY(180deg);
  }
  
  .layout-btn {
    background: rgba(170, 0, 0, 0.4);
    border: 1px solid rgba(255, 0, 0, 0.5);
    color: #e1e1e1;
  }

  .layout-btn:hover {
    background: rgba(170, 0, 0, 0.6);
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
    border: 1px solid rgba(255, 0, 0, 0.8);
    color: white;
  }
  
  select {
    border: 1px solid rgba(255, 0, 0, 0.4);
    background-color: rgba(51, 0, 0, 0.6);
  }
`;

// 添加主题切换过渡动画CSS
const themeTransitionCSS = `
  .ancient-god-ripple-container {
    pointer-events: none;
    z-index: 10000;
  }
  
  .theme-svg-background {
    transition: opacity 0.6s ease;
  }
  
  .layout-panel {
    transition: border-color 0.8s ease, box-shadow 0.8s ease, opacity 0.5s ease !important;
  }
  
  .layout-btn {
    transition: background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
  }
  
  select {
    transition: border-color 0.5s ease, background-color 0.5s ease;
  }
  
  .theme-old-layer, .theme-new-layer {
    backface-visibility: hidden;
    transform: translateZ(0);
  }
  
  .theme-new-layer {
    clip-path: circle(0% at 50% 50%);
  }
`;

// 主题标识符
const THEME_ID = {
  PURPLE: 'purple', // 秩序主题
  BLOOD: 'blood'    // 混沌主题
};

let currentThemeId = THEME_ID.PURPLE;
let panelContainer = null;
let coinElement = null;
let coinFlipped = false;
let currentPanelOpacity = 0.8; // 默认透明度设置为80%

// 主题SVG定义 - 使用导入的模块
const themeSVGs = {
  [THEME_ID.PURPLE]: OrderPanelSVG,
  [THEME_ID.BLOOD]: ChaosPanelSVG
};

// 主题CSS样式 - 使用导入的模块
const themeCSSTemplates = {
  [THEME_ID.PURPLE]: OrderPanelCSS,
  [THEME_ID.BLOOD]: ChaosPanelCSS
};

// 主题样式注入函数
function injectThemeStyles() {
  // 注入当前主题的CSS
  removeStyles('ancient-god-theme-css');
  injectStyles('ancient-god-theme-css', themeCSSTemplates[currentThemeId]);
  
  // 注入过渡动画CSS
  removeStyles('ancient-god-transition-css');
  injectStyles('ancient-god-transition-css', themeTransitionCSS);
}

// 辅助函数：设置SVG元素样式，避免重复代码
function applySVGStyles(svgElement) {
  if (!svgElement) return;
  
  svgElement.style.width = '100%';
  svgElement.style.height = '100%';
  svgElement.style.display = 'block';
  svgElement.setAttribute('preserveAspectRatio', 'xMidYMid slice');
}

// 设置SVG背景
function setSVGBackground(themeId = null) {
  if (!panelContainer) return;
  
  // 如果未指定主题ID，则使用当前主题
  const targetThemeId = themeId || currentThemeId;
  
  // 创建或获取SVG背景容器
  let svgContainer = panelContainer.querySelector('.theme-svg-background');
  if (!svgContainer) {
    svgContainer = document.createElement('div');
    svgContainer.className = 'theme-svg-background';
    svgContainer.style.position = 'absolute';
    svgContainer.style.top = '0';
    svgContainer.style.left = '0';
    svgContainer.style.width = '100%';
    svgContainer.style.height = '100%';
    svgContainer.style.zIndex = '-1';
    svgContainer.style.borderRadius = 'inherit';
    svgContainer.style.overflow = 'hidden';
    
    // 确保SVG背景完全覆盖面板，包括边缘和内边距
    svgContainer.style.boxSizing = 'border-box';
    svgContainer.style.margin = '0';
    svgContainer.style.padding = '0';
    
    panelContainer.insertBefore(svgContainer, panelContainer.firstChild);
  }
  
  // 设置SVG内容
  svgContainer.innerHTML = themeSVGs[targetThemeId];
  
  // 确保SVG元素本身也完全填充容器
  const svgElement = svgContainer.querySelector('svg');
  if (svgElement) {
    applySVGStyles(svgElement);
  }
}

// 创建硬币元素
function createCoinElement() {
  // 创建容器
  const container = document.createElement('div');
  container.className = 'ancient-god-coin-container';
  
  // 创建硬币元素
  const coin = document.createElement('div');
  coin.className = 'ancient-god-coin';
  
  // 创建正面 (紫色)
  const front = document.createElement('div');
  front.className = 'ancient-god-coin-face front';
  front.id = 'ancient-god-eye1';
  
  // 创建反面 (血色)
  const back = document.createElement('div');
  back.className = 'ancient-god-coin-face back';
  back.id = 'ancient-god-eye2';
  
  // 组装硬币
  coin.appendChild(front);
  coin.appendChild(back);
  container.appendChild(coin);
  
  // 初始化硬币眼睛
  setTimeout(() => {
    if (typeof window.createAncientGod1Eye === 'function') {
      window.createAncientGod1Eye('ancient-god-eye1');
    }
    if (typeof window.createAncientGod2Eye === 'function') {
      window.createAncientGod2Eye('ancient-god-eye2');
    }
  }, 100);
  
  return {container, coin};
}

// 设置面板透明度 - 修改为配合UIStyles.js的统一透明度控制
export function setPanelOpacity(opacity) {
  // 只保存当前透明度，实际的透明度设置由UIStyles.js处理
  currentPanelOpacity = Math.max(0.1, Math.min(1.0, Number(opacity)));
  
  // 更新数据属性，供UIStyles.js读取
  if (panelContainer) {
    panelContainer.dataset.opacity = String(currentPanelOpacity);
  }
}

// 获取当前面板透明度
export function getPanelOpacity() {
  return currentPanelOpacity;
}

// 从DOM元素或默认值恢复透明度设置
function restorePanelOpacity() {
  if (!panelContainer) return;
  
  const savedOpacity = panelContainer.dataset.opacity;
  const opacity = savedOpacity ? Number(savedOpacity) : currentPanelOpacity;
  setPanelOpacity(opacity);
}

// 翻转硬币并切换主题
function flipCoin() {
  if (!coinElement || !panelContainer) return;
  
  // 保存当前的透明度设置，以便稍后恢复
  const savedBgOpacity = panelContainer.dataset.bgOpacity || currentPanelOpacity;
  const savedBtnOpacity = panelContainer.dataset.btnOpacity || DEFAULT_OPACITY.buttons;
  
  // 根据目标状态确定硬币的翻转方向
  const targetState = !coinFlipped;
  coinFlipped = targetState; // 直接设置为目标状态
  
  // 获取当前和目标主题
  const fromTheme = !targetState ? THEME_ID.BLOOD : THEME_ID.PURPLE;
  const toTheme = targetState ? THEME_ID.BLOOD : THEME_ID.PURPLE;
  
  // 更新硬币翻转状态
  if (coinFlipped) {
    coinElement.classList.add('flipped');
    currentThemeId = THEME_ID.BLOOD;
  } else {
    coinElement.classList.remove('flipped');
    currentThemeId = THEME_ID.PURPLE;
  }
  
  // 等待硬币翻转动画完成后再开始扩散效果
  setTimeout(() => {
    // 准备新旧主题层
    prepareThemeLayers(fromTheme, toTheme);
    
    // 获取硬币元素在面板中的位置
    const coinRect = coinElement.getBoundingClientRect();
    const panelRect = panelContainer.getBoundingClientRect();
    
    // 计算硬币中心相对于面板的位置
    const coinCenterX = (coinRect.left + coinRect.width / 2) - panelRect.left;
    const coinCenterY = (coinRect.top + coinRect.height / 2) - panelRect.top;
    
    // 计算面板对角线长度 (作为最大扩散半径)
    const maxRadius = Math.sqrt(Math.pow(panelRect.width, 2) + Math.pow(panelRect.height, 2));
    
    // 创建扩散效果容器 - 仅用于视觉效果
    const rippleContainer = document.createElement('div');
    rippleContainer.className = 'ancient-god-ripple-container';
    rippleContainer.style.position = 'absolute';
    rippleContainer.style.top = '0';
    rippleContainer.style.left = '0';
    rippleContainer.style.width = '100%';
    rippleContainer.style.height = '100%';
    rippleContainer.style.pointerEvents = 'none';
    rippleContainer.style.zIndex = '10000';
    rippleContainer.style.borderRadius = 'inherit';
    rippleContainer.style.overflow = 'hidden';
    
    // 创建发光扩散效果元素 - 纯视觉效果
    const glowRipple = document.createElement('div');
    glowRipple.className = 'ancient-god-glow-ripple';
    glowRipple.style.position = 'absolute';
    glowRipple.style.top = coinCenterY + 'px';
    glowRipple.style.left = coinCenterX + 'px';
    glowRipple.style.width = '0';
    glowRipple.style.height = '0';
    glowRipple.style.borderRadius = '50%';
    glowRipple.style.transform = 'translate(-50%, -50%)';
    glowRipple.style.pointerEvents = 'none';
    glowRipple.style.background = coinFlipped 
      ? 'radial-gradient(circle, rgba(255, 0, 0, 0.3) 0%, rgba(122, 0, 0, 0.1) 70%, transparent 100%)'
      : 'radial-gradient(circle, rgba(176, 141, 225, 0.3) 0%, rgba(106, 90, 205, 0.1) 70%, transparent 100%)';
    glowRipple.style.boxShadow = coinFlipped
      ? '0 0 20px 10px rgba(255, 0, 0, 0.3)'
      : '0 0 20px 10px rgba(138, 43, 226, 0.3)';
    
    // 添加CSS动画样式
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
      @keyframes ancient-god-glow-animation {
        0% {
          width: 0;
          height: 0;
          opacity: 0.8;
        }
        100% {
          width: ${maxRadius * 2}px;
          height: ${maxRadius * 2}px;
          opacity: 0;
        }
      }
      
      @keyframes ancient-god-reveal-animation {
        0% {
          clip-path: circle(0% at ${coinCenterX}px ${coinCenterY}px);
        }
        100% {
          clip-path: circle(${maxRadius}px at ${coinCenterX}px ${coinCenterY}px);
        }
      }
      
      .theme-transition-active {
        animation: ancient-god-reveal-animation 2s ease-out forwards;
      }
      
      .ancient-god-glow-ripple {
        animation: ancient-god-glow-animation 2s ease-out forwards;
      }
    `;
    document.head.appendChild(rippleStyle);
    
    // 添加扩散元素到容器
    rippleContainer.appendChild(glowRipple);
    panelContainer.appendChild(rippleContainer);
    // 启动新主题的显示动画
    const newThemeLayer = panelContainer.querySelector('.theme-new-layer');
    if (newThemeLayer) {
      // 设置新主题背景的初始clip-path位置到硬币中心
      newThemeLayer.style.clipPath = `circle(0% at ${coinCenterX}px ${coinCenterY}px)`;
      // 让CSS接管动画，而不是通过JS重设位置
      newThemeLayer.classList.add('theme-transition-active');
      // 保留新主题中的SVG动画，不要重新渲染
      const svgElement = newThemeLayer.querySelector('svg');
      if (svgElement) {
        svgElement.setAttribute('data-preserve-animation', 'true');
        applySVGStyles(svgElement);
      }
    }
    
    // 注入当前主题的CSS以确保应用正确的样式
    injectThemeStyles();

    // 动画结束后清理并恢复透明度
    setTimeout(() => {
      // 移除临时元素
      rippleContainer.remove();
      rippleStyle.remove();

      // 优化主题层，但保留动画状态
      cleanupThemeLayers();

      // 恢复之前保存的透明度设置
      if (panelContainer) {
        // 设置数据属性
        panelContainer.dataset.bgOpacity = savedBgOpacity;
        panelContainer.dataset.btnOpacity = savedBtnOpacity;

        // 应用透明度
        const bgContainer = panelContainer.querySelector('.theme-svg-background');
        if (bgContainer) {
          bgContainer.style.opacity = savedBgOpacity;
        }

        // 通知主题系统透明度已更改
        _updatePanelStyles(panelContainer);
      }

      // 通知颜色选择器更新主题
      AncientGodTheme.notifyColorPickerThemeChange();
    }, 2000);
  }, 900); // 等待硬币翻转动画完成(0.9秒)
}

// 准备主题过渡层
function prepareThemeLayers(fromTheme, toTheme) {
  if (!panelContainer) return;
  
  // 清除可能存在的旧层
  cleanupThemeLayers();
  
  // 创建旧主题层 (底层)
  const oldLayer = document.createElement('div');
  oldLayer.className = 'theme-old-layer';
  oldLayer.style.position = 'absolute';
  oldLayer.style.top = '0';
  oldLayer.style.left = '0';
  oldLayer.style.width = '100%';
  oldLayer.style.height = '100%';
  oldLayer.style.borderRadius = 'inherit';
  oldLayer.style.zIndex = '-2';
  oldLayer.style.overflow = 'hidden';
  
  // 创建新主题层 (顶层)
  const newLayer = document.createElement('div');
  newLayer.className = 'theme-new-layer';
  newLayer.style.position = 'absolute';
  newLayer.style.top = '0';
  newLayer.style.left = '0';
  newLayer.style.width = '100%';
  newLayer.style.height = '100%';
  newLayer.style.borderRadius = 'inherit';
  newLayer.style.zIndex = '-1';
  newLayer.style.overflow = 'hidden';
  
  // 初始状态下，新主题层是隐藏的（通过clip-path）
  newLayer.style.clipPath = 'circle(0% at 50% 50%)';
  
  // 为新旧层设置不同的背景和样式
  // 旧主题背景
  const oldBg = document.createElement('div');
  oldBg.innerHTML = themeSVGs[fromTheme];
  oldBg.style.width = '100%';
  oldBg.style.height = '100%';
  oldLayer.appendChild(oldBg);
  
  // 确保SVG完全覆盖容器
  const oldSvg = oldBg.querySelector('svg');
  if (oldSvg) {
    applySVGStyles(oldSvg);
  }
  
  // 新主题背景
  const newBg = document.createElement('div');
  newBg.innerHTML = themeSVGs[toTheme];
  newBg.style.width = '100%';
  newBg.style.height = '100%';
  newLayer.appendChild(newBg);
  
  // 确保SVG完全覆盖容器
  const newSvg = newBg.querySelector('svg');
  if (newSvg) {
    applySVGStyles(newSvg);
  }
  
  // 添加主题样式
  applyThemeToLayer(oldLayer, fromTheme);
  applyThemeToLayer(newLayer, toTheme);
  
  // 添加层到面板
  panelContainer.insertBefore(oldLayer, panelContainer.firstChild);
  panelContainer.insertBefore(newLayer, panelContainer.firstChild);
  
  // 移除原来的SVG背景容器
  const oldSvgContainer = panelContainer.querySelector('.theme-svg-background');
  if (oldSvgContainer) {
    oldSvgContainer.remove();
  }
}

// 应用主题样式到层
function applyThemeToLayer(layer, themeId) {
  // 添加边框样式
  if (themeId === THEME_ID.PURPLE) {
    layer.style.border = '1px solid rgba(176, 141, 225, 0.3)';
    layer.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 8px rgba(138, 43, 226, 0.2)';
  } else {
    layer.style.border = '1px solid rgba(255, 0, 0, 0.3)';
    layer.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 10px rgba(184, 0, 0, 0.2)';
  }
  
  // 添加背景模糊效果
  layer.style.backdropFilter = 'blur(12px)';
  layer.style.webkitBackdropFilter = 'blur(12px)';
}

// 清理主题层
function cleanupThemeLayers() {
  if (!panelContainer) return;
  
  // 保存当前透明度设置
  const savedBgOpacity = panelContainer.dataset.bgOpacity || currentPanelOpacity;
  
  // 移除旧层，但保留新层作为当前背景
  const oldLayer = panelContainer.querySelector('.theme-old-layer');
  if (oldLayer) oldLayer.remove();
  
  // 将新层转换为标准背景层
  const newLayer = panelContainer.querySelector('.theme-new-layer');
  if (newLayer) {
    // 移除动画类并重设clip-path，保持全覆盖状态
    newLayer.classList.remove('theme-transition-active');
    newLayer.style.clipPath = 'none';
    newLayer.className = 'theme-svg-background';
    newLayer.style.zIndex = '-1';
    
    // 保留SVG中的动画状态，不要重新设置内容
    const existingSvg = newLayer.querySelector('svg');
    if (existingSvg && existingSvg.getAttribute('data-preserve-animation') === 'true') {
      applySVGStyles(existingSvg);
    }
    
    // 恢复透明度设置
    newLayer.style.opacity = savedBgOpacity;
  } else {
    // 如果没有新层(异常情况)，则创建标准背景
    setSVGBackground();
    
    // 恢复透明度
    const bgContainer = panelContainer.querySelector('.theme-svg-background');
    if (bgContainer) {
      bgContainer.style.opacity = savedBgOpacity;
    }
  }
  
  // 添加以下代码来更新按钮颜色
  setTimeout(() => {
    if (panelContainer) {
      const buttons = panelContainer.querySelectorAll('.layout-btn');
      const btnOpacity = parseFloat(panelContainer.dataset.btnOpacity || DEFAULT_OPACITY.buttons);
      
      buttons.forEach(button => {
        // 根据当前主题设置按钮背景颜色
        const bgColor = currentThemeId === THEME_ID.PURPLE 
          ? `rgba(106, 90, 205, ${btnOpacity})`  // 秩序主题 - 紫色
          : `rgba(170, 0, 0, ${btnOpacity})`;    // 混沌主题 - 红色
        
        button.style.backgroundColor = bgColor;
      });
    }
  }, 50);
}

// 主题模块接口
const AncientGodTheme = {
  name: '古神之眼',
  description: '一款融合秩序与混沌的主题，通过硬币翻转切换两种截然不同的视觉风格',
    // 初始化主题
  init(container, existingCoinEl) {
    panelContainer = container;
    
    // 确保每次初始化时硬币都处于正面状态
    coinFlipped = false;
    currentThemeId = THEME_ID.PURPLE;
    
    // 创建或使用硬币元素
    if (existingCoinEl) {
      // 完全清空现有容器并重建硬币
      existingCoinEl.innerHTML = '';
      
      // 创建硬币元素
      const coin = document.createElement('div');
      coin.className = 'ancient-god-coin';
      // 确保移除任何可能存在的flipped类
      coin.classList.remove('flipped');
      
      // 创建正面 (紫色)
      const front = document.createElement('div');
      front.className = 'ancient-god-coin-face front';
      front.id = 'ancient-god-eye1';
      front.style.width = '100%';
      front.style.height = '100%';
      front.style.position = 'absolute';
      front.style.backfaceVisibility = 'hidden';
      front.style.borderRadius = '50%';
      
      // 创建反面 (血色)
      const back = document.createElement('div');
      back.className = 'ancient-god-coin-face back';
      back.id = 'ancient-god-eye2';
      back.style.width = '100%';
      back.style.height = '100%';
      back.style.position = 'absolute';
      back.style.backfaceVisibility = 'hidden';
      back.style.borderRadius = '50%';
      back.style.transform = 'rotateY(180deg)';
      
      // 组装硬币
      coin.appendChild(front);
      coin.appendChild(back);
      existingCoinEl.appendChild(coin);
      coinElement = coin;
      
      // 初始化硬币眼睛
      setTimeout(() => {
        if (typeof window.createAncientGod1Eye === 'function') {
          window.createAncientGod1Eye('ancient-god-eye1');
        }
        if (typeof window.createAncientGod2Eye === 'function') {
          window.createAncientGod2Eye('ancient-god-eye2');
        }
      }, 100);
    } else {
      // 如果没有提供容器，则创建完整的硬币容器
      const coinContainer = document.createElement('div');
      coinContainer.className = 'ancient-god-coin-container';
      
      // 创建硬币元素
      const coin = document.createElement('div');
      coin.className = 'ancient-god-coin';
      
      // 创建正面 (紫色)
      const front = document.createElement('div');
      front.className = 'ancient-god-coin-face front';
      front.id = 'ancient-god-eye1';
      
      // 创建反面 (血色)
      const back = document.createElement('div');
      back.className = 'ancient-god-coin-face back';
      back.id = 'ancient-god-eye2';
      
      // 组装硬币
      coin.appendChild(front);
      coin.appendChild(back);
      coinContainer.appendChild(coin);
      coinElement = coin;
      
      // 初始化硬币眼睛
      setTimeout(() => {
        if (typeof window.createAncientGod1Eye === 'function') {
          window.createAncientGod1Eye('ancient-god-eye1');
        }
        if (typeof window.createAncientGod2Eye === 'function') {
          window.createAncientGod2Eye('ancient-god-eye2');
        }
      }, 100);
      
      // 添加到面板
      if (panelContainer.firstChild) {
        panelContainer.insertBefore(coinContainer, panelContainer.firstChild);
      } else {
        panelContainer.appendChild(coinContainer);
      }
    }
    
    // 添加硬币点击事件
    coinElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.flipCoin();
    });
    
    return true;
  },
    // 应用主题
  applyTheme() {
    injectThemeStyles();
    
    // 总是重新初始化背景，保证背景与硬币状态同步
    // 移除任何现有的背景层
    const existingBgs = panelContainer?.querySelectorAll('.theme-svg-background, .theme-new-layer, .theme-old-layer');
    if (existingBgs) {
      existingBgs.forEach(bg => bg.remove());
    }
    
    // 设置初始状态的背景（与硬币的正面状态对应）
    setSVGBackground();
    
    // 添加更新按钮样式的过程
    setTimeout(() => {
      // 根据当前主题ID更新按钮样式
      if (panelContainer) {
        const buttons = panelContainer.querySelectorAll('.layout-btn');
        const btnOpacity = parseFloat(panelContainer.dataset.btnOpacity || DEFAULT_OPACITY.buttons);
        
        buttons.forEach(button => {
          // 根据当前主题设置按钮背景颜色
          const bgColor = currentThemeId === THEME_ID.PURPLE 
            ? `rgba(106, 90, 205, ${btnOpacity})`  // 秩序主题 - 紫色
            : `rgba(170, 0, 0, ${btnOpacity})`;    // 混沌主题 - 红色
          
          button.style.backgroundColor = bgColor;
        });
      }
    }, 100);
    
    return true;
  },
  
  // 翻转硬币
  flipCoin() {
    flipCoin();
    return true;
  },
  
  // 设置面板透明度
  setPanelOpacity(opacity) {
    setPanelOpacity(opacity);
    return true;
  },
  
  // 获取面板透明度
  getPanelOpacity() {
    return currentPanelOpacity;
  },
  
  // 获取当前主题样式ID
  getCurrentThemeId() {
    return currentThemeId;
  },

  // 通知颜色选择器更新主题
  notifyColorPickerThemeChange() {
    // 查找颜色选择器实例并更新主题
    const colorPicker = panelContainer?.querySelector('.layout-inline-color-picker');
    if (colorPicker && colorPicker._inlineColorPickerInstance) {
      colorPicker._inlineColorPickerInstance.updateTheme();
    }
  },
  // 清理主题资源
  cleanup() {
    removeStyles('ancient-god-theme-css');
    removeStyles('ancient-god-transition-css');
    if (panelContainer) {
      // 移除所有类型的背景层
      const backgrounds = panelContainer.querySelectorAll('.theme-svg-background, .theme-old-layer, .theme-new-layer');
      backgrounds.forEach(bg => bg.remove());
      
      // 移除可能存在的扩散效果容器
      const rippleContainer = panelContainer.querySelector('.ancient-god-ripple-container');
      if (rippleContainer) {
        rippleContainer.remove();
      }
    }
    return true;
  }
};

export default AncientGodTheme;
