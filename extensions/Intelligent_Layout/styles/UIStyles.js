// 智能布局 UI 样式统一模块

// ==========================================================
// 主题管理相关功能
// ==========================================================

// 导入主题模块
import AncientGodTheme from "./AncientGodEye/AncientGodTheme.js";

// 存储所有已注册的主题
const registeredThemes = {};
let currentTheme = null;
let defaultTheme = 'ancient_gods_eye';

// 自动注册默认主题
export function initDefaultThemes() {  try {
    // 注册主题
    registerTheme('ancient_gods_eye', AncientGodTheme);
    
    setDefaultTheme('ancient_gods_eye');
    console.log("默认主题已成功注册");
    return true;
  } catch (error) {
    console.error("注册默认主题失败:", error);
    return false;
  }
}

// 注册主题 - 主题必须实现特定接口
export function registerTheme(id, themeModule) {
  if (!id || typeof id !== 'string') {
    console.error('主题ID必须是有效字符串');
    return false;
  }
  
  // 验证主题模块是否符合接口规范
  if (!themeModule || typeof themeModule !== 'object') {
    console.error(`主题 "${id}" 必须是有效对象`);
    return false;
  }
  
  // 验证必要的方法
  const requiredMethods = ['init', 'applyTheme', 'flipCoin', 'cleanup'];
  for (const method of requiredMethods) {
    if (typeof themeModule[method] !== 'function') {
      console.error(`主题 "${id}" 缺少必要方法: ${method}`);
      return false;
    }
  }
  
  // 验证必要的属性
  if (!themeModule.name) {
    console.error(`主题 "${id}" 缺少名称属性`);
    return false;
  }
  
  // 注册主题
  registeredThemes[id] = themeModule;
  console.log(`主题 "${id}" (${themeModule.name}) 已成功注册`);
  return true;
}

// 获取已注册的所有主题
export function getRegisteredThemes() {
  const themes = [];
  for (const id in registeredThemes) {
    themes.push({
      id: id,
      name: registeredThemes[id].name || id
    });
  }
  return themes;
}

// 获取主题模块
export function getTheme(id) {
  return registeredThemes[id] || null;
}

// 应用主题
export function applyTheme(id, container, coinElement) {
  // 清理当前主题(如果有)
  if (currentTheme && registeredThemes[currentTheme]) {
    registeredThemes[currentTheme].cleanup();
  }
  
  // 获取并应用新主题
  const themeModule = registeredThemes[id];
  if (!themeModule) {
    console.error(`主题 "${id}" 未注册`);
    return false;
  }
  
  // *** 关键修改：在主题应用前保存控制区域 ***
  let savedControlsContainer = null;
  let savedColorPicker = null;
  
  if (container) {
    // 临时移除控制区域，防止被主题操作影响
    savedControlsContainer = container.querySelector('.layout-controls-container');
    savedColorPicker = container.querySelector('.layout-inline-color-picker');
    
    if (savedControlsContainer) {
      savedControlsContainer.remove();
    }
    if (savedColorPicker) {
      savedColorPicker.remove();
    }
  }
  
  // 初始化并应用新主题
  // 确保硬币元素存在且为初始状态
  if (coinElement) {
    // 移除可能的 flipped 类，确保硬币始终从正面开始
    if (coinElement.classList.contains('flipped')) {
      coinElement.classList.remove('flipped');
    }
  }
  
  // 强制重新创建背景和硬币
  themeModule.init(container, coinElement);
  themeModule.applyTheme();
  currentTheme = id;
  
  // *** 关键修改：主题应用后恢复控制区域 ***
  if (container && (savedControlsContainer || savedColorPicker)) {
    setTimeout(() => {
      if (savedControlsContainer && !container.querySelector('.layout-controls-container')) {
        container.appendChild(savedControlsContainer);
      }
      if (savedColorPicker && !container.querySelector('.layout-inline-color-picker')) {
        container.appendChild(savedColorPicker);
      }
    }, 50); // 短延迟确保主题完全应用
  }
  
  return true;
}

// 设置默认主题
export function setDefaultTheme(id) {
  if (registeredThemes[id]) {
    defaultTheme = id;
    return true;
  }
  return false;
}

// 获取默认主题
export function getDefaultTheme() {
  return defaultTheme;
}

// ==========================================================
// 通用工具函数
// ==========================================================

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

// ==========================================================
// CSS 样式定义 - 简化为最基本的结构，其余移至主题实现
// ==========================================================

// 布局面板相关样式 - 只保留必要的基础结构
export const layoutPanelStyles = `
  .layout-panel {
    position: fixed;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    user-select: none;
    transition: opacity 0.3s;
    border-radius: 16px;
  }
  
  /* 控制区域容器样式 */
  .layout-controls-container {
    display: block;
    width: 100%;
  }
`;

// ==========================================================
// 面板相关函数
// ==========================================================

// 创建面板UI元素
export function createPanelElement(mousePosition) {
  // 创建容器
  const container = document.createElement('div');
  container.className = 'layout-panel';
  // 初始位置，后续会根据面板实际大小进行调整
  container.style.left = `${mousePosition.x}px`;  
  container.style.top = `${mousePosition.y}px`;
  container.style.transform = 'none';
  container.style.display = 'none';
  container.style.pointerEvents = 'none';  
  container.style.opacity = '0';  container.style.padding = '30px'; // 增加内边距适应大尺寸硬币
  container.style.width = '360px'; // 恢复原始宽度
  container.style.boxSizing = 'border-box'; // 确保padding不增加总宽度
  
  // 添加拖动区域 - 改为在面板边缘创建多个拖动区域
  addDragHandles(container);

  // 注入基础样式
  injectStyles('layout-panel-styles', layoutPanelStyles);
  
  return container;
}

// 添加多个拖动区域到面板边缘
function addDragHandles(container) {
  // 创建拖动状态对象 - 所有拖动句柄共享
  const dragState = {
    isDragging: false,
    offsetX: 0,
    offsetY: 0
  };
  
  // 拖动处理函数 - 所有拖动区域共享
  const handleMouseMove = function(e) {
    if (!dragState.isDragging) return;
    
    // 计算新位置
    const left = e.clientX - dragState.offsetX;
    const top = e.clientY - dragState.offsetY;
    
    // 使用 requestAnimationFrame 减少重绘次数
    requestAnimationFrame(() => {
      container.style.left = `${left}px`;
      container.style.top = `${top}px`;
      // 一旦开始拖动，就固定不使用 transform，避免布局重新计算
      if (container.style.transform !== 'none') {
        container.style.transform = 'none';
      }
    });
  };
  
  const handleMouseUp = function() {
    if (!dragState.isDragging) return;
    
    dragState.isDragging = false;
    document.body.style.cursor = '';
    
    // 重要：在拖动结束后移除临时添加的事件监听器
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // 创建拖动开始函数
  const createDragStart = (handle) => {
    return (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // 记录鼠标与面板左上角的偏移
      const rect = container.getBoundingClientRect();
      dragState.offsetX = e.clientX - rect.left;
      dragState.offsetY = e.clientY - rect.top;
      
      dragState.isDragging = true;
      document.body.style.cursor = 'move';
      
      // 只在开始拖动时添加事件监听器
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  };
  
  // 定义边缘宽度
  const edgeWidth = 15; // 拖动区域宽度，px
  
  // 创建顶部拖动区域
  const topHandle = document.createElement('div');
  topHandle.className = 'layout-drag-handle layout-drag-handle-top';
  Object.assign(topHandle.style, {
    position: 'absolute',
    top: '0',
    left: edgeWidth + 'px',
    right: edgeWidth + 'px',
    height: edgeWidth + 'px',
    cursor: 'move',
    zIndex: '10001'
  });
  topHandle.addEventListener('mousedown', createDragStart(topHandle));
  container.appendChild(topHandle);
  
  // 创建底部拖动区域
  const bottomHandle = document.createElement('div');
  bottomHandle.className = 'layout-drag-handle layout-drag-handle-bottom';
  Object.assign(bottomHandle.style, {
    position: 'absolute',
    bottom: '0',
    left: edgeWidth + 'px',
    right: edgeWidth + 'px',
    height: edgeWidth + 'px',
    cursor: 'move',
    zIndex: '10001'
  });
  bottomHandle.addEventListener('mousedown', createDragStart(bottomHandle));
  container.appendChild(bottomHandle);
  
  // 创建左侧拖动区域
  const leftHandle = document.createElement('div');
  leftHandle.className = 'layout-drag-handle layout-drag-handle-left';
  Object.assign(leftHandle.style, {
    position: 'absolute',
    top: edgeWidth + 'px',
    bottom: edgeWidth + 'px',
    left: '0',
    width: edgeWidth + 'px',
    cursor: 'move',
    zIndex: '10001'
  });
  leftHandle.addEventListener('mousedown', createDragStart(leftHandle));
  container.appendChild(leftHandle);
  
  // 创建右侧拖动区域
  const rightHandle = document.createElement('div');
  rightHandle.className = 'layout-drag-handle layout-drag-handle-right';
  Object.assign(rightHandle.style, {
    position: 'absolute',
    top: edgeWidth + 'px',
    bottom: edgeWidth + 'px',
    right: '0',
    width: edgeWidth + 'px',
    cursor: 'move',
    zIndex: '10001'
  });
  rightHandle.addEventListener('mousedown', createDragStart(rightHandle));
  container.appendChild(rightHandle);
  
  // 创建四个角落的拖动区域
  const topLeftHandle = document.createElement('div');
  topLeftHandle.className = 'layout-drag-handle layout-drag-handle-top-left';
  Object.assign(topLeftHandle.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: edgeWidth + 'px',
    height: edgeWidth + 'px',
    cursor: 'move',
    zIndex: '10001',
    borderTopLeftRadius: '16px'
  });
  topLeftHandle.addEventListener('mousedown', createDragStart(topLeftHandle));
  container.appendChild(topLeftHandle);
  
  const topRightHandle = document.createElement('div');
  topRightHandle.className = 'layout-drag-handle layout-drag-handle-top-right';
  Object.assign(topRightHandle.style, {
    position: 'absolute',
    top: '0',
    right: '0',
    width: edgeWidth + 'px',
    height: edgeWidth + 'px',
    cursor: 'move',
    zIndex: '10001',
    borderTopRightRadius: '16px'
  });
  topRightHandle.addEventListener('mousedown', createDragStart(topRightHandle));
  container.appendChild(topRightHandle);
  
  const bottomLeftHandle = document.createElement('div');
  bottomLeftHandle.className = 'layout-drag-handle layout-drag-handle-bottom-left';
  Object.assign(bottomLeftHandle.style, {
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: edgeWidth + 'px',
    height: edgeWidth + 'px',
    cursor: 'move',
    zIndex: '10001',
    borderBottomLeftRadius: '16px'
  });
  bottomLeftHandle.addEventListener('mousedown', createDragStart(bottomLeftHandle));
  container.appendChild(bottomLeftHandle);
  
  const bottomRightHandle = document.createElement('div');
  bottomRightHandle.className = 'layout-drag-handle layout-drag-handle-bottom-right';
  Object.assign(bottomRightHandle.style, {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: edgeWidth + 'px',
    height: edgeWidth + 'px',
    cursor: 'move',
    zIndex: '10001',
    borderBottomRightRadius: '16px'
  });
  bottomRightHandle.addEventListener('mousedown', createDragStart(bottomRightHandle));
  container.appendChild(bottomRightHandle);
  
  // 为调试可视化边框 - 通过注释控制是否添加
  // injectStyles('drag-handles-debug', `
  //   .layout-drag-handle {
  //     border: 1px dashed rgba(255, 255, 255, 0.15);
  //     background-color: rgba(128, 128, 255, 0.05);
  //   }
  // `);
}

// ==========================================================
// UI 控件相关函数
// ==========================================================

// 创建按钮容器
export function createButtonsContainer() {
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'layout-buttons-container';
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.flexWrap = 'wrap'; // 允许按钮在需要时换行
  buttonsContainer.style.justifyContent = 'center'; // 居中排列 
  buttonsContainer.style.width = '100%';
  buttonsContainer.style.gap = '8px'; // 按钮之间的间距
  
  return buttonsContainer;
}

// 创建按钮
export function createButton(text, type, bgColor) {
  const button = document.createElement('button');
  button.className = `layout-btn layout-btn-${type}`;
  button.textContent = text;
  button.title = text;
  
  // 自适应布局的按钮样式
  button.style.padding = '8px 12px';
  button.style.flexGrow = '1'; // 按钮可以增长
  button.style.flexBasis = '0'; // 所有按钮基础宽度相同
  button.style.minWidth = '80px'; // 最小宽度
  button.style.maxWidth = 'none'; // 移除最大宽度限制，让按钮自动适应
  button.style.textAlign = 'center'; // 确保文本居中
  button.style.justifyContent = 'center'; // Flex布局居中
  button.style.alignItems = 'center'; // Flex布局居中
  button.style.display = 'flex'; // 改为flex布局以确保内容居中
  button.style.cursor = 'pointer';
  button.style.borderRadius = '10px';
  button.style.transition = 'all 0.2s ease';
  button.style.margin = '1px';
  button.style.whiteSpace = 'nowrap'; // 防止文字换行
  button.style.overflow = 'hidden';
  
  // 使用自定义属性存储原始文本和字体大小，便于调整显示
  button.dataset.originalText = text;
  button.dataset.originalFontSize = '15px'; // 调大默认字体大小为15px（原为14px）
  button.style.fontSize = button.dataset.originalFontSize;
  
  // 添加点击效果
  button.addEventListener('mousedown', () => {
    button.style.transform = 'translateY(1px)';
  });
  
  button.addEventListener('mouseup', () => {
    button.style.transform = 'translateY(0)';
  });
  
  // 添加自适应字体大小功能
  button.addEventListener('DOMNodeInserted', () => {
    setTimeout(() => adjustTextFontSize(button), 0);
  });
  
  return button;
}

// 新增函数：调整文字字体大小以适应按钮宽度
function adjustTextFontSize(button) {
  if (!button || !button.dataset.originalText) return;
  
  // 重置为原始字体大小以便测量
  button.style.fontSize = button.dataset.originalFontSize || '15px';
  
  // 计算按钮可用宽度（考虑内边距）
  const buttonWidth = button.clientWidth;
  const paddingLeft = parseInt(getComputedStyle(button).paddingLeft) || 0;
  const paddingRight = parseInt(getComputedStyle(button).paddingRight) || 0;
  const availableWidth = buttonWidth - paddingLeft - paddingRight - 4; // 额外留4px边距
  
  // 创建临时元素测量文本宽度
  const tempSpan = document.createElement('span');
  tempSpan.style.visibility = 'hidden';
  tempSpan.style.position = 'absolute';
  tempSpan.style.whiteSpace = 'nowrap';
  tempSpan.style.fontSize = button.dataset.originalFontSize || '15px';
  tempSpan.textContent = button.dataset.originalText;
  document.body.appendChild(tempSpan);
  
  const textWidth = tempSpan.offsetWidth;
  document.body.removeChild(tempSpan);
  
  // 如果文本宽度大于可用宽度，则缩小字体
  if (textWidth > availableWidth) {
    const scaleFactor = availableWidth / textWidth;
    const originalFontSize = parseInt(button.dataset.originalFontSize) || 15;
    // 限制字体最小缩小到11px（原为9px），确保字体不会太小
    const newFontSize = Math.max(11, Math.floor(originalFontSize * scaleFactor));
    
    button.style.fontSize = `${newFontSize}px`;
  } else {
    // 恢复原始字体大小
    button.style.fontSize = button.dataset.originalFontSize || '15px';
  }
  
  // 确保显示完整文本
  button.textContent = button.dataset.originalText;
}

// 调整按钮布局 - 添加新函数用于根据按钮数量自动调整布局
export function adjustButtonsLayout(buttonsContainer) {
  if (!buttonsContainer) return;
  
  const buttons = buttonsContainer.querySelectorAll('.layout-btn');
  const count = buttons.length;
  if (count === 0) return;
  
  // 根据按钮数量决定每行显示多少个按钮
  let buttonsPerRow;
  if (count <= 3) {
    // 1-3个按钮时，放在一行
    buttonsPerRow = count;
  } else if (count === 4) {
    // 4个按钮时，每行2个
    buttonsPerRow = 2;
  } else {
    // 5个及以上按钮时，每行3个
    buttonsPerRow = 3;
  }
  
  // 计算每行宽度的百分比
  const widthPercent = Math.floor(100 / buttonsPerRow);
  
  // 应用样式到每个按钮
  buttons.forEach((button, index) => {
    // 计算当前按钮是当前行的第几个按钮
    const positionInRow = index % buttonsPerRow;
    
    // 设置按钮宽度
    button.style.flexBasis = `calc(${widthPercent}% - 8px)`;
    
    // 每行最后一个按钮需处理外边距
    if (positionInRow === buttonsPerRow - 1) {
      button.style.marginRight = '0';
    }
    
    // 调整文字大小以适应按钮
    adjustTextFontSize(button);
  });
}

// 创建模式选择器容器
export function createModeContainer(labelText) {
  const modeContainer = document.createElement('div');
  modeContainer.className = 'layout-mode-container';
  modeContainer.style.display = 'flex';
  modeContainer.style.flexDirection = 'column';
  modeContainer.style.width = '100%';
  modeContainer.style.marginTop = '10px';
  modeContainer.style.gap = '8px';
  
  const modeLabel = document.createElement('div');
  modeLabel.className = 'layout-mode-label';
  modeLabel.textContent = labelText;
  modeLabel.style.fontSize = '14px';
  
  modeContainer.appendChild(modeLabel);
  
  return { modeContainer, modeLabel };
}

// 创建下拉选择框
export function createSelectBox() {
  const selectBox = document.createElement('select');
  selectBox.className = 'layout-select';
  selectBox.style.width = '100%';
  selectBox.style.padding = '6px 10px';
  selectBox.style.borderRadius = '6px';
  selectBox.style.outline = 'none';
  
  return selectBox;
}

// ==========================================================
// 添加选项到选择框
// ==========================================================

export function addOptionsToSelect(selectBox, options) {
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.text;
    selectBox.appendChild(optionElement);
  });
  
  return selectBox;
}

// ==========================================================
// 透明度管理系统 - 集中管理所有透明度相关功能
// ==========================================================

// 默认透明度值
const DEFAULT_OPACITY = {
  panel: 0.85, // 面板背景默认透明度 (85%)
  buttons: 0.90 // 按钮默认透明度 (90%)
};

// 当前透明度设置
let currentOpacity = {
  panel: DEFAULT_OPACITY.panel,
  buttons: DEFAULT_OPACITY.buttons
};

// 设置面板背景透明度
export function setPanelBackgroundOpacity(container, opacity) {
  if (!container) return;
  
  // 将百分比值转换为0-1范围的小数
  const opacityValue = Math.max(10, Math.min(100, Number(opacity))) / 100;
  currentOpacity.panel = opacityValue;
  
  // 存储透明度值到数据属性，方便主题系统读取
  container.dataset.bgOpacity = String(opacityValue);
  
  // 设置背景容器的透明度
  const bgContainer = container.querySelector('.theme-svg-background');
  if (bgContainer) {
    bgContainer.style.opacity = String(opacityValue);
  }
  
  // 调整面板整体透明度 - 背景透明但内容清晰
  _updatePanelStyles(container);
  
  // 通知当前主题更新透明度设置
  _notifyThemeOpacityChange(container, opacityValue);
  
  return opacityValue;
}

// 设置按钮透明度
export function setButtonsOpacity(container, opacity) {
  if (!container) return;
  
  // 将百分比值转换为0-1范围的小数
  const opacityValue = Math.max(10, Math.min(100, Number(opacity))) / 100;
  currentOpacity.buttons = opacityValue;
  
  // 存储透明度值到数据属性
  container.dataset.btnOpacity = String(opacityValue);
  
  // 获取当前按钮背景颜色基础值（不含透明度）
  const getCurrentButtonBaseColor = (button) => {
    try {
      const currentBg = window.getComputedStyle(button).backgroundColor;
      // 从rgba中提取rgb部分
      if (currentBg.includes('rgba')) {
        return currentBg.replace(/rgba\((.+?), [\d\.]+\)/, 'rgba($1, ' + opacityValue + ')');
      } 
      // 如果是rgb，转换为rgba
      else if (currentBg.includes('rgb')) {
        return currentBg.replace(/rgb\((.+?)\)/, 'rgba($1, ' + opacityValue + ')');
      }
      return currentBg;
    } catch (e) {
      console.warn('获取按钮颜色失败:', e);
      // 根据当前主题提供默认颜色
      if (currentTheme === '古神之眼') {
        return 'rgba(106, 90, 205, ' + opacityValue + ')';
      } else {
        return 'rgba(0, 180, 220, ' + opacityValue + ')';
      }
    }
  };
  
  // 获取所有按钮并设置透明度
  const buttons = container.querySelectorAll('.layout-btn');
  if (buttons.length > 0) {
    buttons.forEach(button => {
      button.style.backgroundColor = getCurrentButtonBaseColor(button);
    });
  }
  
  return opacityValue;
}

// 保留setPanelOpacity函数，但将其实现为只调用背景透明度函数
// 这样可以保持与原来代码的兼容性
export function setPanelOpacity(container, opacity) {
  // 调用背景透明度设置函数，不再同时设置按钮透明度
  return setPanelBackgroundOpacity(container, opacity);
}

// 获取当前面板透明度设置
export function getPanelOpacity() {
  return {
    panel: currentOpacity.panel * 100, // 转换为百分比形式
    buttons: currentOpacity.buttons * 100
  };
}

// 更新面板整体样式
function _updatePanelStyles(container) {
  if (!container) return;
  
  // 获取背景透明度
  const bgOpacity = parseFloat(container.dataset.bgOpacity || currentOpacity.panel);
  
  // 设置适当的背景模糊效果 - 透明度越高模糊越少
  const blurAmount = Math.round(14 - bgOpacity * 8); // 根据透明度计算模糊值
  container.style.backdropFilter = `blur(${blurAmount}px)`;
  container.style.webkitBackdropFilter = `blur(${blurAmount}px)`;
  
  // 设置适当的边框透明度 - 透明度低时边框更明显
  const borderOpacity = Math.min(0.6, 0.8 - bgOpacity * 0.3);
  const borderRGBA = container.classList.contains('theme-dark') 
    ? `rgba(0, 0, 0, ${borderOpacity})` 
    : `rgba(255, 255, 255, ${borderOpacity})`;
  
  // 只设置边框颜色，不修改边框宽度和样式
  if (container.style.border) {
    container.style.border = container.style.border.replace(/rgba?\(.+?\)/, borderRGBA);
  }
}

// 通知当前主题透明度变化
function _notifyThemeOpacityChange(container, opacity) {
  if (!container) return;
  
  try {
    // 获取当前主题ID
    const themeId = currentTheme;
    if (themeId) {
      const theme = getTheme(themeId);
      if (theme && typeof theme.setPanelOpacity === 'function') {
        theme.setPanelOpacity(opacity);
      }
    }
  } catch (e) {
    console.warn('无法通过主题系统设置透明度:', e);
  }
}

// ==========================================================
// 硬币元素创建相关
// ==========================================================

// 创建硬币元素
export function createCoinElement() {
  const coinElement = document.createElement('div');
  coinElement.className = 'layout-coin-container';
  coinElement.style.width = '180px'; 
  coinElement.style.height = '180px';
  coinElement.style.margin = '5px auto 25px auto'; 
  coinElement.style.position = 'relative';
  coinElement.style.perspective = '1600px'; // 增强3D效果
  
  return coinElement;
}

// 翻转硬币动画
export function flipCoin(coinElement) {
  if (!coinElement) return;
  
  // 简单切换flipped类来触发动画
  coinElement.classList.toggle('flipped');
  
  // 如果当前主题有自定义的翻转功能，则调用
  const currentTheme = getTheme(currentTheme);
  if (currentTheme && typeof currentTheme.flipCoin === 'function') {
    currentTheme.flipCoin(coinElement);
  }
}

// ==========================================================
// 面板位置计算函数
// ==========================================================

// 在鼠标位置显示面板
export function showAtMousePosition(container, mousePosition) {
  if (!container) return;
  
  // 修改导入路径 - 从相对路径调整为同目录导入
  try {
    const { calculatePanelPosition } = require('./UIUtils.js');
    const position = calculatePanelPosition(mousePosition, container);
    
    container.style.left = `${position.left}px`;
    container.style.top = `${position.top}px`;
    container.style.transform = 'none'; // 不再使用 transform 进行定位
  } catch (e) {
    // 如果导入失败，使用简单的居中逻辑
    const width = container.offsetWidth || 300;
    const height = container.offsetHeight || 400;
    
    container.style.left = `${mousePosition.x - width/2}px`;
    container.style.top = `${mousePosition.y - height/2}px`;
    container.style.transform = 'none';
  }
}

// ==========================================================
// 通知相关函数
// ==========================================================

// 显示通知信息
export function showNotification(message, type = 'error') {
  const notification = document.createElement('div');
  notification.className = 'layout-notification';
  notification.textContent = message;
  
  // 通知基本样式 - 保留，因为通知应该有一致的UI体验
  Object.assign(notification.style, {
    position: 'fixed',
    top: '24px', 
    left: '50%',
    transform: 'translateX(-50%) translateY(-20px)',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '10000',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    width: 'auto',
    minWidth: '240px',
    maxWidth: '90%',
    textAlign: 'center',
    opacity: '0'
  });
  
  if (type === 'info') {
    notification.style.backgroundColor = 'rgba(20, 120, 60, 0.85)';
    notification.style.color = 'white';
  } else if (type === 'warn') {
    notification.style.backgroundColor = 'rgba(230, 150, 10, 0.85)';
    notification.style.color = 'white';
  } else {
    notification.style.backgroundColor = 'rgba(200, 0, 0, 0.85)';
    notification.style.color = 'white';
  }
  
  document.body.appendChild(notification);
  
  // 显示动画 - 从上方移入
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(-20px)'; // 向上方消失
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}
