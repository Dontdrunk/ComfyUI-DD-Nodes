// 智能布局核心模块

// 布局面板相关样式
const layoutPanelStyles = `
  .layout-panel {
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
function injectStyles(styleId, styleContent) {
  // 如果已经存在相同ID的样式，则不重复注入
  if (document.getElementById(styleId)) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = styleContent;
  document.head.appendChild(styleElement);
}

// 工具函数：移除已注入的样式
function removeStyles(styleId) {
  const styleElement = document.getElementById(styleId);
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
  }
}

// 跟踪鼠标位置
let mousePosition = { x: 0, y: 0 };
document.addEventListener('mousemove', (e) => {
  mousePosition = { x: e.clientX, y: e.clientY };
});

export class LayoutPanel {  constructor() {
    this.shortcut = 'alt+x';
    this.visible = false;
    this.container = null;
    this.buttonsContainer = null;
    this.colorMode = '完全随机'; // 默认为完全随机模式
  }
  
  setEnabled() {
    // 功能始终启用，只需确保面板已创建
    if (!this.container) {
      this._createPanel();
    }
  }
  
  setShortcut(shortcut) {
    if (typeof shortcut === 'string' && shortcut.includes('+')) {
      this.shortcut = shortcut;
    }
  }
  
  // 只有通过toggle方法才能控制面板显示/隐藏，确保只能通过快捷键激活
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  show() {
    if (!this.container) {
      this._createPanel();
    }
    
    // 使用当前鼠标位置
    this._showAtMousePosition();
    
    this.container.style.display = 'flex';
    this.container.style.pointerEvents = 'auto'; // 显示时允许事件
    
    // 使用动画效果显示
    requestAnimationFrame(() => {
      this.container.style.opacity = '1';
      this.container.style.transform = 'scale(1)';
    });
    
    this.visible = true;
  }
  
  // 在鼠标位置显示面板
  _showAtMousePosition() {
    if (!this.container) return;
    // 调整为居中显示
    this.container.style.left = `${mousePosition.x}px`;
    this.container.style.top = `${mousePosition.y}px`;
    this.container.style.transform = 'translate(-50%, -50%)';
  }
  
  hide() {
    if (!this.container) return;
    
    this.container.style.opacity = '0';
    this.container.style.transform = 'translate(-50%, -50%) scale(0.95)';
    this.container.style.pointerEvents = 'none'; // 隐藏时禁止事件
    
    setTimeout(() => {
      if (this.container) {
        this.container.style.display = 'none';
      }
    }, 300);
    
    this.visible = false;
  }
  
  setOpacity(opacity) {
    // opacity: 0~100
    if (!this.container) return;
    const percent = Math.max(0, Math.min(100, Number(opacity)));
    this.container.style.backgroundColor = `rgba(30, 30, 40, ${percent/100})`;
  }

  _createPanel() {
    if (this.container) return;
    // 创建容器
    this.container = document.createElement('div');
    this.container.className = 'layout-panel';
    // 只设置一次 position
    this.container.style.position = 'fixed';
    this.container.style.left = `${mousePosition.x}px`;
    this.container.style.top = `${mousePosition.y}px`;
    this.container.style.transform = 'translate(-50%, -50%)';
    this.container.style.zIndex = 99999;
    this.container.style.display = 'none';
    this.container.style.pointerEvents = 'none'; // 默认禁用事件，确保只有在面板显示时才能交互
    this.container.style.transition = 'opacity 0.3s, transform 0.3s';
    this.container.style.opacity = '0';
    // 更现代的面板样式
    this.container.style.padding = '20px';
    this.container.style.borderRadius = '16px';
    this.container.style.backdropFilter = 'blur(12px)';
    this.container.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset';
    // 移除 backgroundColor 的硬编码，交由 setOpacity 控制
    this.container.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.gap = '16px';
    // 初始化透明度为全局设置值
    let opacity = 85;
    try {
      if (window.app?.extensionManager?.setting) {
        opacity = window.app.extensionManager.setting.get("LayoutPanel.opacity", 85);
      }
    } catch(e) {}
    this.setOpacity(opacity);
    // 监听设置变化（如果有API）
    if (window.app?.extensionManager?.setting?.onChange) {
      window.app.extensionManager.setting.onChange("LayoutPanel.opacity", (val) => {
        this.setOpacity(val);
      });
    }
    // 创建按钮容器 - 居中对齐
    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.className = 'layout-buttons-container';
    this.buttonsContainer.style.display = 'flex';
    this.buttonsContainer.style.justifyContent = 'center'; // 确保按钮居中
    this.buttonsContainer.style.width = '100%';
    this.buttonsContainer.style.gap = '12px';
    this.buttonsContainer.style.marginTop = '4px';
    
    // 创建随机颜色按钮
    const randomColorBtn = this._createButton('随机颜色', 'rainbow');
    randomColorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._setRandomNodeColor();
    });
    
    // 创建自定义颜色按钮
    const customColorBtn = this._createButton('自定义颜色', 'pick');
    customColorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._openCustomColorPicker();
    });
    
    // 创建节点同步按钮
    const syncBtn = this._createButton('节点同步', 'sync', '#2db7f5');
    // 节点同步模式选择器
    const syncModeContainer = document.createElement('div');
    syncModeContainer.style.display = 'flex';
    syncModeContainer.style.flexDirection = 'column';
    syncModeContainer.style.width = '100%';
    syncModeContainer.style.marginTop = '10px';
    syncModeContainer.style.gap = '8px';
    const syncModeLabel = document.createElement('div');
    syncModeLabel.textContent = '节点同步模式：';
    syncModeLabel.style.color = '#e1e1e1';
    syncModeLabel.style.fontSize = '14px';
    syncModeLabel.style.fontWeight = '500';
    const syncModeSelect = document.createElement('select');
    syncModeSelect.style.width = '100%';
    syncModeSelect.style.padding = '6px 10px';
    syncModeSelect.style.backgroundColor = 'rgba(45, 45, 55, 0.8)';
    syncModeSelect.style.color = '#e1e1e1';
    syncModeSelect.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    syncModeSelect.style.borderRadius = '6px';
    syncModeSelect.style.outline = 'none';
    [
      { value: 'size', text: '同步大小' },
      { value: 'wh', text: '同步宽高' },
      { value: 'align', text: '同步对齐' }
    ].forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.text;
      syncModeSelect.appendChild(opt);
    });
    syncModeContainer.appendChild(syncModeLabel);
    syncModeContainer.appendChild(syncModeSelect);
    syncBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._syncSelectedNodes(syncModeSelect.value);
    });
    
    // 创建颜色模式选择器
    const modeContainer = document.createElement('div');
    modeContainer.style.display = 'flex';
    modeContainer.style.flexDirection = 'column';
    modeContainer.style.width = '100%';
    modeContainer.style.marginTop = '10px';
    modeContainer.style.gap = '8px';
    
    const modeLabel = document.createElement('div');
    modeLabel.textContent = '随机颜色模式：';
    modeLabel.style.color = '#e1e1e1';
    modeLabel.style.fontSize = '14px';
    modeLabel.style.fontWeight = '500';
    
    const modeSelect = document.createElement('select');
    modeSelect.style.width = '100%';
    modeSelect.style.padding = '6px 10px';
    modeSelect.style.backgroundColor = 'rgba(45, 45, 55, 0.8)';
    modeSelect.style.color = '#e1e1e1';
    modeSelect.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    modeSelect.style.borderRadius = '6px';
    modeSelect.style.outline = 'none';
      // 添加选项
    const options = [
      { value: '完全随机', text: '完全随机（每个节点不同颜色）' },
      { value: '统一随机', text: '统一随机（所有节点相同颜色）' }
    ];
    
    options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.text;
      if (option.value === this.colorMode) {
        opt.selected = true;
      }
      modeSelect.appendChild(opt);
    });
    
    // 监听选择变化
    modeSelect.addEventListener('change', (e) => {
      this.colorMode = e.target.value;
    });    modeContainer.appendChild(modeLabel);
    modeContainer.appendChild(modeSelect);
    
    // 添加按钮到容器
    this.buttonsContainer.appendChild(randomColorBtn);
    this.buttonsContainer.appendChild(customColorBtn);
    this.buttonsContainer.appendChild(syncBtn);
    
    // 添加按钮容器和模式选择器到主容器
    this.container.appendChild(this.buttonsContainer);
    this.container.appendChild(modeContainer);
    this.container.appendChild(syncModeContainer);
    
    // 使用外部样式模块注入样式
    injectStyles('layout-panel-styles', layoutPanelStyles);
    
    // 添加面板点击事件，阻止冒泡
    this.container.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // 添加可拖动区域（左上角）
    const dragHandle = document.createElement('div');
    dragHandle.style.position = 'absolute';
    dragHandle.style.left = '0';
    dragHandle.style.top = '0';
    dragHandle.style.width = '32px';
    dragHandle.style.height = '32px';
    dragHandle.style.cursor = 'move';
    dragHandle.style.borderTopLeftRadius = '16px';
    dragHandle.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08) 60%, transparent 100%)';
    dragHandle.style.zIndex = '100001';
    dragHandle.title = '拖动面板';
    this.container.appendChild(dragHandle);
    this.container.style.userSelect = 'none';
    // 拖动逻辑
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    dragHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isDragging = true;
      // 记录鼠标与面板左上角的偏移
      const rect = this.container.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      document.body.style.cursor = 'move';
    });
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        // 计算新位置
        const left = e.clientX - dragOffsetX;
        const top = e.clientY - dragOffsetY;
        this.container.style.left = `${left + 0.5}px`;
        this.container.style.top = `${top + 0.5}px`;
        this.container.style.transform = 'none';
      }
    });
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
      }
    });
    
    // 添加到文档
    document.body.appendChild(this.container);
  }
    // 创建按钮辅助方法 - 更美观的按钮
  _createButton(text, type, bgColor) {
    const button = document.createElement('button');
    button.className = `layout-btn layout-btn-${type}`;
    button.textContent = text;
    button.title = text;
    
    // 添加更现代的按钮样式
    const isPrimary = type === 'pick';
    const isRainbow = type === 'rainbow';
    
    // 基础样式
    Object.assign(button.style, {
      backgroundColor: bgColor || (isRainbow ? 'rgba(138, 43, 226, 0.75)' : 'rgba(16, 130, 246, 0.75)'),
      border: 'none',
      borderRadius: '10px',
      padding: '10px 16px',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
      minWidth: '120px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      margin: '2px'
    });
    
    // 添加悬停效果
    button.addEventListener('mouseover', () => {
      const baseColor = bgColor || (isRainbow ? 'rgba(138, 43, 226, 0.75)' : 'rgba(16, 130, 246, 0.75)');
      // 提取RGB部分，增加不透明度
      const colorPattern = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/;
      const match = baseColor.match(colorPattern);
      if (match) {
        const r = match[1];
        const g = match[2];
        const b = match[3];
        button.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
      } else {
        button.style.backgroundColor = baseColor;
      }
      button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
      button.style.transform = 'translateY(-2px)';
    });
    
    // 添加离开效果
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = bgColor || (isRainbow ? 'rgba(138, 43, 226, 0.75)' : 'rgba(16, 130, 246, 0.75)');
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      button.style.transform = 'translateY(0)';
    });
    
    // 添加点击效果
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(1px)';
      button.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
    });
    
    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });
    
    return button;
  }
    // 此方法已被移除，使用_showAtMousePosition替代
    // 设置随机节点颜色
  _setRandomNodeColor() {
    try {
      // 获取ComfyUI应用实例
      const app = this._getComfyUIApp();
      if (!app) {
        this._showNotification("无法获取ComfyUI应用实例");
        return;
      }

      // 获取选中的节点和组
      const selectedNodes = this._getSelectedNodes(app);
      const selectedGroups = this._getSelectedGroups(app);
      
      if (selectedNodes.length === 0 && selectedGroups.length === 0) {
        this._showNotification("请先选择要应用颜色的节点或组");
        return;
      }

      // 生成随机颜色函数
      const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      };
        // 根据颜色模式应用颜色
      if (this.colorMode === '统一随机') {
        // 统一随机模式 - 所有节点和组使用同一个随机颜色
        const uniformColor = getRandomColor();
        
        selectedNodes.forEach(node => {
          node.color = uniformColor;
        });
        
        selectedGroups.forEach(group => {
          group.color = uniformColor;
        });
        
        this._showNotification("已应用统一随机颜色", "info");
      } else {
        // 完全随机模式 - 每个节点和组使用不同的随机颜色
        selectedNodes.forEach(node => {
          const randomColor = getRandomColor();
          node.color = randomColor;
        });
        
        selectedGroups.forEach(group => {
          group.color = getRandomColor();
        });
        
        this._showNotification("已应用完全随机颜色", "info");
      }
      app.graph.setDirtyCanvas(true, true);
      // 不再自动关闭面板，面板只通过快捷键 toggle() 控制显示/隐藏
    } catch (error) {
      console.error("设置随机颜色失败:", error);
      this._showNotification(`设置随机颜色失败: ${error.message}`);
    }
  }
  
  // 打开自定义颜色选择器
  _openCustomColorPicker() {
    try {
      // 获取ComfyUI应用实例
      const app = this._getComfyUIApp();
      if (!app) {
        this._showNotification("无法获取ComfyUI应用实例");
        return;
      }

      // 获取选中的节点和组
      const selectedNodes = this._getSelectedNodes(app);
      const selectedGroups = this._getSelectedGroups(app);
      
      if (selectedNodes.length === 0 && selectedGroups.length === 0) {
        this._showNotification("请先选择要应用颜色的节点或组");
        return;
      }

      // 不再自动关闭面板，面板只通过快捷键 toggle() 控制显示/隐藏
      // 创建颜色选择器
      setTimeout(() => {
        const defaultColor = selectedNodes.length > 0 ? 
          (selectedNodes[0].color || '#3355aa') : 
          (selectedGroups.length > 0 ? (selectedGroups[0].color || '#3355aa') : '#3355aa');
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = defaultColor.replace(/rgba?\(.*\)/, '#000000');
        colorInput.style.position = 'absolute';
        colorInput.style.visibility = 'hidden';
        document.body.appendChild(colorInput);

        // 处理颜色变化 -
        colorInput.addEventListener('input', (e) => {
          const color = e.target.value;

          // 应用颜色到节点和组
          selectedNodes.forEach(node => {
            node.color = color;
          });

          selectedGroups.forEach(group => {
            group.color = color;
          });

          app.graph.setDirtyCanvas(true, true);
        });        colorInput.addEventListener('change', (e) => {          this._showNotification("已应用自定义颜色", "info");
          document.body.removeChild(colorInput);
        });
        // 模拟点击打开颜色选择器
        colorInput.click();
      }, 100);
    } catch (error) {
      console.error("打开颜色选择器失败:", error);
      this._showNotification(`打开颜色选择器失败: ${error.message}`);
    }
  }
  
  // 获取ComfyUI应用实例
  _getComfyUIApp() {
    if (window.app?.canvas && window.app?.graph) {
      return window.app;
    }

    if (window.LiteGraph?.LGraphCanvas?.active_canvas) {
      const canvas = LiteGraph.LGraphCanvas.active_canvas;
      if (canvas?.graph) {
        return { canvas, graph: canvas.graph };
      }
    }

    const canvasElement = document.querySelector(".litegraph.litegraph-canvas");
    if (canvasElement?.lgraphcanvas) {
      const canvas = canvasElement.lgraphcanvas;
      if (canvas?.graph) {
        return { canvas, graph: canvas.graph };
      }
    }
    
    return null;
  }
  
  // 获取选中的节点
  _getSelectedNodes(app) {
    if (app.canvas.selected_nodes?.length) {
      return Array.from(app.canvas.selected_nodes);
    }

    const selectedNodes = [];
    if (app.graph?._nodes) {
      for (const node of app.graph._nodes) {
        if (node.is_selected) {
          selectedNodes.push(node);
        }
      }
    }
    
    return selectedNodes;
  }
  
  // 获取选中的组
  _getSelectedGroups(app) {
    const selectedGroups = [];
    
    if (app.canvas?.selected_groups?.length) {
      return Array.from(app.canvas.selected_groups);
    }
    
    if (app.graph?.groups) {
      for (const group of app.graph.groups) {
        if (group.selected) {
          selectedGroups.push(group);
        }
      }
    }
    
    return selectedGroups;
  }
  
  // 显示通知信息 
  _showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    notification.className = 'layout-notification';
    notification.textContent = message;
      // 通知基本样式
    const baseNotificationStyles = {
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
    };
    
    // 应用样式
    Object.assign(notification.style, baseNotificationStyles);
    
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

  // 辅助函数：判断节点排列主方向
  _getMainDirection(centers) {
    let dx = 0, dy = 0;
    for (let i = 1; i < centers.length; i++) {
      dx += Math.abs(centers[i].x - centers[0].x);
      dy += Math.abs(centers[i].y - centers[0].y);
    }
    return dx > dy ? 'horizontal' : 'vertical';
  }

  // 节点同步逻辑
  _syncSelectedNodes(mode) {
    try {
      const app = this._getComfyUIApp();
      if (!app) {
        this._showNotification('无法获取ComfyUI应用实例');
        return;
      }
      const selectedNodes = this._getSelectedNodes(app);
      if (selectedNodes.length < 2) {
        this._showNotification('请至少选择两个节点进行同步');
        return;
      }
      if (mode === 'size') {
        // 大小同步：统一为最大宽高
        let maxW = 0, maxH = 0;
        selectedNodes.forEach(node => {
          if (node.size) {
            maxW = Math.max(maxW, node.size[0]);
            maxH = Math.max(maxH, node.size[1]);
          }
        });
        selectedNodes.forEach(node => {
          if (node.size) {
            node.size[0] = maxW;
            node.size[1] = maxH;
          }
        });
        this._showNotification('已同步为统一大小', 'info');
      } else if (mode === 'wh') {
        // 宽高同步：判断排列方向
        const centers = selectedNodes.map(node => ({
          node,
          x: node.pos ? node.pos[0] + (node.size ? node.size[0] / 2 : 0) : 0,
          y: node.pos ? node.pos[1] + (node.size ? node.size[1] / 2 : 0) : 0
        }));
        const mainDir = this._getMainDirection(centers);
        if (mainDir === 'horizontal') {
          // 横向排列，同步高度
          let maxH = 0;
          selectedNodes.forEach(node => {
            if (node.size) maxH = Math.max(maxH, node.size[1]);
          });
          selectedNodes.forEach(node => {
            if (node.size) node.size[1] = maxH;
          });
          this._showNotification('已同步高度（横向排列）', 'info');
        } else {
          // 纵向排列，同步宽度
          let maxW = 0;
          selectedNodes.forEach(node => {
            if (node.size) maxW = Math.max(maxW, node.size[0]);
          });
          selectedNodes.forEach(node => {
            if (node.size) node.size[0] = maxW;
          });
          this._showNotification('已同步宽度（竖向排列）', 'info');
        }
      } else if (mode === 'align') {
        // 同步对齐：自动排列节点
        const centers = selectedNodes.map(node => ({
          node,
          x: node.pos ? node.pos[0] + (node.size ? node.size[0] / 2 : 0) : 0,
          y: node.pos ? node.pos[1] + (node.size ? node.size[1] / 2 : 0) : 0
        }));
        const mainDir = this._getMainDirection(centers);
        if (mainDir === 'horizontal') {
          // 横向排列，对齐Y轴
          const avgY = centers.reduce((sum, c) => sum + c.y, 0) / centers.length;
          selectedNodes.forEach(node => {
            if (node.pos) node.pos[1] = avgY - (node.size ? node.size[1] / 2 : 0);
          });
          this._showNotification('已横向对齐（Y轴对齐）', 'info');
        } else {
          // 纵向排列，对齐X轴
          const avgX = centers.reduce((sum, c) => sum + c.x, 0) / centers.length;
          selectedNodes.forEach(node => {
            if (node.pos) node.pos[0] = avgX - (node.size ? node.size[0] / 2 : 0);
          });
          this._showNotification('已纵向对齐（X轴对齐）', 'info');
        }
      }
      app.graph.setDirtyCanvas(true, true);
    } catch (e) {
      this._showNotification('节点同步失败: ' + e.message);
    }
  }
}

export const DEFAULT_CONFIG = {
  enabled: true,  // 默认启用
  shortcut: 'alt+x',
  colorMode: '完全随机', // 默认颜色模式
  continueIteration: false // 默认应用颜色后关闭面板
};