// 智能布局核心模块

// 导入统一样式模块
import { 
  layoutPanelStyles, 
  injectStyles, 
  removeStyles, 
  createPanelElement, 
  createButtonsContainer, 
  createButton, 
  createModeContainer, 
  createSelectBox, 
  addOptionsToSelect, 
  setPanelBackgroundOpacity,
  setButtonsOpacity,
  showNotification,
  adjustButtonsLayout,
  registerTheme,
  getRegisteredThemes,
  getTheme,
  applyTheme,
  setDefaultTheme,
  getDefaultTheme,
  createCoinElement,
  showAtMousePosition
} from './styles/UIStyles.js';

// 导入通用工具函数 - 修改导入路径为styles文件夹
import {
  getComfyUIApp,
  getSelectedNodes,
  getSelectedGroups,
  getRandomColor,
  syncNodeSize,
  syncNodeWidthHeight,
  alignNodes
} from './styles/UIUtils.js';

// 跟踪鼠标位置
let mousePosition = { x: 0, y: 0 };
document.addEventListener('mousemove', (e) => {
  mousePosition = { x: e.clientX, y: e.clientY };
});

export class LayoutPanel {
  constructor() {
    this.shortcut = 'alt+x';
    this.visible = false;
    this.container = null;
    this.buttonsContainer = null;
    this.colorMode = '完全随机'; // 默认为完全随机模式
    this.currentTheme = null;
    this.coinElement = null;
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
  
  // 设置当前主题
  setTheme(themeId) {
    if (!this.container) {
      this._createPanel();
    }
    
    // 保存当前的透明度设置，以便应用主题后恢复
    const bgOpacity = this.container.dataset.bgOpacity;
    const btnOpacity = this.container.dataset.btnOpacity;
    
    // 应用新主题
    if (applyTheme(themeId, this.container, this.coinElement)) {
      this.currentTheme = themeId;
      
      // 主题应用后，恢复保存的透明度设置
      setTimeout(() => {
        if (bgOpacity) this.setOpacity(parseFloat(bgOpacity) * 100);
        if (btnOpacity) this.setButtonOpacity(parseFloat(btnOpacity) * 100);
      }, 50); // 短延迟确保主题样式完全应用
      
      return true;
    }
    return false;
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
    
    // 使用当前鼠标位置显示面板
    showAtMousePosition(this.container, mousePosition);
    
    this.container.style.display = 'flex';
    this.container.style.pointerEvents = 'auto'; // 显示时允许事件
    
    // 使用动画效果显示 - 修改：使用 opacity 动画，不再修改 transform
    requestAnimationFrame(() => {
      this.container.style.opacity = '1';
    });
    
    this.visible = true;
  }
  
  hide() {
    if (!this.container) return;
    
    // 只淡出，不修改 transform
    this.container.style.opacity = '0';
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
    setPanelBackgroundOpacity(this.container, opacity);
  }
  
  // 添加新方法：设置按钮透明度
  setButtonOpacity(opacity) {
    // opacity: 0~100
    if (!this.container) return;
    setButtonsOpacity(this.container, opacity);
  }
  
  _createPanel() {
    if (this.container) return;
    
    // 使用外部样式模块创建面板
    this.container = createPanelElement(mousePosition);
    
    // 存储初始透明度值到容器数据属性中，便于后续恢复
    this.container.dataset.initialSetup = 'pending';
    
    // 初始化透明度为全局设置值
    let opacity = 85;
    let buttonOpacity = 90; 
    try {
      if (window.app?.extensionManager?.setting) {
        opacity = window.app.extensionManager.setting.get("LayoutPanel.opacity", 85);
        buttonOpacity = window.app.extensionManager.setting.get("LayoutPanel.buttonOpacity", 90);
      }
    } catch(e) {
      console.warn("获取透明度设置失败:", e);
    }
    
    // 将初始透明度值存储到数据属性
    this.container.dataset.initialBgOpacity = opacity / 100;
    this.container.dataset.initialBtnOpacity = buttonOpacity / 100;
    
    // 预先保存透明度值到数据属性，但延迟应用
    // 这样可以确保主题应用后再设置透明度
    this.container.dataset.bgOpacity = opacity / 100;
    this.container.dataset.btnOpacity = buttonOpacity / 100;
    
    // 确保面板存在后才设置透明度
    setTimeout(() => {
      // 确保面板已经完全创建并添加到DOM中
      this.setOpacity(opacity);
      this.setButtonOpacity(buttonOpacity);
    }, 50);
    
    // 监听设置变化
    if (window.app?.extensionManager?.setting?.onChange) {
      window.app.extensionManager.setting.onChange("LayoutPanel.opacity", (val) => {
        this.setOpacity(val);
      });
      
      window.app.extensionManager.setting.onChange("LayoutPanel.buttonOpacity", (val) => {
        this.setButtonOpacity(val);
      });
    }

    // 创建硬币容器 
    this.coinElement = createCoinElement();
    
    // 确保硬币元素添加到面板顶部
    if (this.container.firstChild) {
      this.container.insertBefore(this.coinElement, this.container.firstChild);
    } else {
      this.container.appendChild(this.coinElement);
    }

    // 创建按钮容器
    this.buttonsContainer = createButtonsContainer();
    
    // 所有按钮使用统一的创建和样式方法
    const randomColorBtn = createButton('随机颜色', 'normal');
    randomColorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._setRandomNodeColor();
    });
    
    // 创建自定义颜色按钮
    const customColorBtn = createButton('自定义颜色', 'normal');
    customColorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._openCustomColorPicker();
    });
    
    // 创建节点同步按钮
    const syncBtn = createButton('节点同步', 'normal');
    
    // 节点同步模式选择器
    const { modeContainer: syncModeContainer, modeLabel: syncModeLabel } = createModeContainer('节点同步模式：');
    const syncModeSelect = createSelectBox();
    addOptionsToSelect(syncModeSelect, [
      { value: 'size', text: '同步大小' },
      { value: 'wh', text: '同步宽高' },
      { value: 'align', text: '同步对齐' }
    ]);
    syncModeContainer.appendChild(syncModeSelect);
    syncBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._syncSelectedNodes(syncModeSelect.value);
    });
    
    // 创建颜色模式选择器
    const { modeContainer, modeLabel } = createModeContainer('随机颜色模式：');
    const modeSelect = createSelectBox();
    addOptionsToSelect(modeSelect, [
      { value: '完全随机', text: '完全随机（每个节点不同颜色）' },
      { value: '统一随机', text: '统一随机（所有节点相同颜色）' }
    ]);
    
    // 设置默认选中项
    Array.from(modeSelect.options).forEach(option => {
      if (option.value === this.colorMode) {
        option.selected = true;
      }
    });
    
    // 监听选择变化
    modeSelect.addEventListener('change', (e) => {
      this.colorMode = e.target.value;
    });
    modeContainer.appendChild(modeSelect);
    
    // 添加按钮到容器
    this.buttonsContainer.appendChild(randomColorBtn);
    this.buttonsContainer.appendChild(customColorBtn);
    this.buttonsContainer.appendChild(syncBtn);
    
    // 添加按钮容器和模式选择器到主容器
    this.container.appendChild(this.buttonsContainer);
    this.container.appendChild(modeContainer);
    this.container.appendChild(syncModeContainer);
    
    // 添加面板调整大小时重新调整按钮文字大小的功能
    const resizeObserver = new ResizeObserver(() => {
      if (this.buttonsContainer) {
        const buttons = this.buttonsContainer.querySelectorAll('.layout-btn');
        buttons.forEach(button => {
          // 检查是否有adjustTextFontSize函数
          if (typeof adjustTextFontSize === 'function') {
            adjustTextFontSize(button);
          } else if (window.adjustTextFontSize) {
            window.adjustTextFontSize(button);
          }
        });
      }
    });
    
    // 观察容器大小变化
    resizeObserver.observe(this.container);
    
    // 调整按钮布局
    adjustButtonsLayout(this.buttonsContainer);
    
    // 强制触发一次字体调整，确保初始状态正确
    setTimeout(() => {
      const buttons = this.buttonsContainer.querySelectorAll('.layout-btn');
      buttons.forEach(button => {
        if (typeof adjustTextFontSize === 'function') {
          adjustTextFontSize(button);
        } else if (window.adjustTextFontSize) {
          window.adjustTextFontSize(button);
        } else {
          // 如果没有找到调整函数，则确保基本字体大小
          button.style.fontSize = '15px';
        }
      });
    }, 200);
    
    // 使用外部样式模块注入样式
    injectStyles('layout-panel-styles', layoutPanelStyles);
    
    // 添加面板点击事件，阻止冒泡
    this.container.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // 添加到文档
    document.body.appendChild(this.container);
    
    // 应用当前主题或默认主题
    setTimeout(() => {
      let themeId = null;
      try {
        if (window.app?.extensionManager?.setting) {
          themeId = window.app.extensionManager.setting.get("LayoutPanel.theme");
        }
      } catch(e) {
        console.warn("获取主题设置失败:", e);
      }
      
      if (!themeId) {
        themeId = getDefaultTheme();
      }
      
      if (themeId) {
        this.setTheme(themeId);
        
        // 最后应用透明度，确保不被主题覆盖
        setTimeout(() => {
          this.container.dataset.initialSetup = 'completed';
          this.setOpacity(opacity);
          this.setButtonOpacity(buttonOpacity);
        }, 150);
      }
    }, 100);
  }
  
  // 设置随机节点颜色
  _setRandomNodeColor() {
    try {
      // 获取ComfyUI应用实例
      const app = getComfyUIApp();
      if (!app) {
        showNotification("无法获取ComfyUI应用实例");
        return;
      }

      // 获取选中的节点和组
      const selectedNodes = getSelectedNodes(app);
      const selectedGroups = getSelectedGroups(app);
      
      if (selectedNodes.length === 0 && selectedGroups.length === 0) {
        showNotification("请先选择要应用颜色的节点或组");
        return;
      }

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
        
        showNotification("已应用统一随机颜色", "info");
      } else {
        // 完全随机模式 - 每个节点和组使用不同的随机颜色
        selectedNodes.forEach(node => {
          const randomColor = getRandomColor();
          node.color = randomColor;
        });
        
        selectedGroups.forEach(group => {
          group.color = getRandomColor();
        });
        
        showNotification("已应用完全随机颜色", "info");
      }
      app.graph.setDirtyCanvas(true, true);
    } catch (error) {
      console.error("设置随机颜色失败:", error);
      showNotification(`设置随机颜色失败: ${error.message}`);
    }
  }
  
  // 打开自定义颜色选择器
  _openCustomColorPicker() {
    try {
      // 获取ComfyUI应用实例
      const app = getComfyUIApp();
      if (!app) {
        showNotification("无法获取ComfyUI应用实例");
        return;
      }

      // 获取选中的节点和组
      const selectedNodes = getSelectedNodes(app);
      const selectedGroups = getSelectedGroups(app);
      
      if (selectedNodes.length === 0 && selectedGroups.length === 0) {
        showNotification("请先选择要应用颜色的节点或组");
        return;
      }

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

        // 处理颜色变化
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
          showNotification("已应用自定义颜色", "info");
          document.body.removeChild(colorInput);
        });
        
        // 模拟点击打开颜色选择器
        colorInput.click();
      }, 100);
    } catch (error) {
      console.error("打开颜色选择器失败:", error);
      showNotification(`打开颜色选择器失败: ${error.message}`);
    }
  }
  
  // 节点同步逻辑
  _syncSelectedNodes(mode) {
    try {
      const app = getComfyUIApp();
      if (!app) {
        showNotification('无法获取ComfyUI应用实例');
        return;
      }
      
      const selectedNodes = getSelectedNodes(app);
      if (selectedNodes.length < 2) {
        showNotification('请至少选择两个节点进行同步');
        return;
      }
      
      let result;
      
      if (mode === 'size') {
        // 大小同步：统一为最大宽高
        result = syncNodeSize(selectedNodes);
        showNotification('已同步为统一大小', 'info');
      } else if (mode === 'wh') {
        // 宽高同步：判断排列方向
        result = syncNodeWidthHeight(selectedNodes);
        const direction = result.direction === 'horizontal' ? '横向排列' : '纵向排列';
        const dimension = result.direction === 'horizontal' ? '高度' : '宽度';
        showNotification(`已同步${dimension}（${direction}）`, 'info');
      } else if (mode === 'align') {
        // 同步对齐：自动排列节点
        result = alignNodes(selectedNodes);
        const alignment = result.direction === 'horizontal' ? 'Y轴对齐' : 'X轴对齐';
        const direction = result.direction === 'horizontal' ? '横向' : '纵向';
        showNotification(`已${direction}对齐（${alignment}）`, 'info');
      }
      
      app.graph.setDirtyCanvas(true, true);
    } catch (e) {
      showNotification('节点同步失败: ' + e.message);
    }
  }
}

export const DEFAULT_CONFIG = {
  enabled: true,  // 默认启用
  shortcut: 'alt+x',
  colorMode: '完全随机', // 默认颜色模式
  continueIteration: false, // 默认应用颜色后关闭面板
  theme: '古神之眼' // 默认主题
};