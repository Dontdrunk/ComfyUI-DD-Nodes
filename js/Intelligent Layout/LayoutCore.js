// 智能布局核心模块
import { RetroCoin } from "./coin.js";
import { layoutPanelStyles, injectStyles } from "./styles.js";
import { AutoLayoutEngine, LayoutTools } from "./layoutAlgorithms.js";

// 跟踪鼠标位置
let mousePosition = { x: 0, y: 0 };
document.addEventListener('mousemove', (e) => {
  mousePosition = { x: e.clientX, y: e.clientY };
});

export class LayoutPanel {
  constructor() {
    // 默认启用功能，但UI面板不可见
    this.enabled = true;
    this.shortcut = 'alt+l';
    this.position = { left: 32, top: 120 }; // 默认位置，将被鼠标位置覆盖
    this.visible = false;
    this.coin = null;
    this.container = null;
    this.buttonsContainer = null;
    this.layoutButtonsContainer = null; // 自动排布按钮容器
  }
  
  setEnabled(enabled) {
    // 始终保持功能启用
    this.enabled = true;
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
  
  _createPanel() {
    if (this.container) return;
    
    // 创建容器
    this.container = document.createElement('div');
    this.container.className = 'layout-coin-panel';
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
    this.container.style.backgroundColor = 'rgba(30, 30, 40, 0.85)';
    this.container.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.gap = '16px';
    
    // 创建硬币
    this.coin = new RetroCoin({
      onFlip: (side) => {
        console.log(`硬币翻转到: ${side}`);
        // 这里可以添加翻转后的回调，如执行布局操作
      }
    });
    
    this.container.appendChild(this.coin.element);
    
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
    
    // 添加按钮到容器
    this.buttonsContainer.appendChild(randomColorBtn);
    this.buttonsContainer.appendChild(customColorBtn);
    
    // 添加按钮容器到主容器
    this.container.appendChild(this.buttonsContainer);
    
    // 创建自动排布按钮容器
    this.layoutButtonsContainer = document.createElement('div');
    this.layoutButtonsContainer.className = 'layout-auto-buttons-container';
    this.layoutButtonsContainer.style.display = 'flex';
    this.layoutButtonsContainer.style.justifyContent = 'center';
    this.layoutButtonsContainer.style.width = '100%';
    this.layoutButtonsContainer.style.gap = '8px';
    this.layoutButtonsContainer.style.flexWrap = 'wrap';
    
    // 只保留模块排布按钮
    const moduleBtn = this._createButton('模块排布', 'layout', '#FF9800');
    moduleBtn.style.flex = '1 1 auto';
    moduleBtn.style.minWidth = '200px'; // 增加宽度，使单个按钮更加突出
    moduleBtn.title = '按功能模块整齐排布节点';
    moduleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._applyModuleLayout();
    });
    
    // 添加按钮到自动排布容器
    this.layoutButtonsContainer.appendChild(moduleBtn);
    
    // 添加自动排布按钮容器到主容器
    this.container.appendChild(this.layoutButtonsContainer);
    
    // 使用外部样式模块注入样式
    injectStyles('layout-panel-styles', layoutPanelStyles);
    
    // 添加面板点击事件，阻止冒泡
    this.container.addEventListener('click', (e) => {
      e.stopPropagation();
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
    const isLayout = type === 'layout';
    
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
      minWidth: isLayout ? '100px' : '120px',
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
  
  // 不再需要此方法，因为我们总是使用鼠标位置
  _updatePosition() {
    // 已弃用：彻底移除
  }
  
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
      
      // 为每个选中的节点或组应用不同的随机颜色
      selectedNodes.forEach(node => {
        const randomColor = getRandomColor();
        node.color = randomColor;
      });
      
      selectedGroups.forEach(group => {
        group.color = getRandomColor();
      });

      app.graph.setDirtyCanvas(true, true);
      this._showNotification("已应用随机颜色", "info");
      
      // 应用了颜色后隐藏面板
      setTimeout(() => this.hide(), 300);
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

      // 隐藏当前面板
      this.hide();

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
        });

        colorInput.addEventListener('change', (e) => {
          this._showNotification("已应用自定义颜色", "info");
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
  
  // 应用模块排布布局
  _applyModuleLayout() {
    try {
      const app = this._getComfyUIApp();
      if (!app) {
        this._showNotification("无法获取ComfyUI应用实例", "error");
        return;
      }
      
      // 创建布局引擎并应用模块排布
      const layoutEngine = new AutoLayoutEngine(app);
      const result = layoutEngine.applyModuleLayout();
      
      if (result) {
        this._showNotification("已应用模块排布，节点按功能分组排列", "info");
      } else {
        this._showNotification("无法应用模块排布，请至少选择两个节点", "warn");
      }
      
      // 应用后隐藏面板
      setTimeout(() => this.hide(), 300);
    } catch (error) {
      console.error("应用模块排布失败:", error);
      this._showNotification("应用模块排布失败: " + error.message, "error");
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
    
    // 添加更现代的通知样式
    Object.assign(notification.style, {
      position: 'fixed',
      top: '24px', 
      left: '50%',
      transform: 'translateX(-50%)',
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
      opacity: '0',
      transform: 'translateX(-50%) translateY(-20px)' 
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
}

export const DEFAULT_CONFIG = {
  enabled: true,  // 默认启用
  shortcut: 'alt+l'
};