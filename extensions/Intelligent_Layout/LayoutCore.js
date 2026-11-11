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
  getTheme,
  applyTheme,
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
  alignNodes,
  applyNodeColor,
  applyGroupColor,
  refreshCanvas
} from './styles/UIUtils.js';

// 导入内嵌颜色选择器组件
import { InlineColorPicker } from './styles/InlineColorPicker.js';

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
    this.inlineColorPicker = null; // 内嵌颜色选择器实例
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

    if (themeId === '古神之眼') {
      themeId = 'ancient_gods_eye';
    }
    
    // 保存当前的透明度设置，以便应用主题后恢复
    const bgOpacity = this.container.dataset.bgOpacity;
    const btnOpacity = this.container.dataset.btnOpacity;
    
    // 应用新主题
    if (applyTheme(themeId, this.container, this.coinElement)) {
      this.currentTheme = themeId;
      
      // *** 关键修改：主题应用后检查并恢复控制区域 ***
      this._ensureControlsExist();
      
      // 主题应用后，恢复保存的透明度设置
      setTimeout(() => {
        if (bgOpacity) this.setOpacity(parseFloat(bgOpacity) * 100);
        if (btnOpacity) this.setButtonOpacity(parseFloat(btnOpacity) * 100);
      }, 50); // 短延迟确保主题样式完全应用
      
      return true;
    }
    return false;
  }

  // 新增方法：确保控制区域存在，如果被主题覆盖则重新创建
  _ensureControlsExist() {
    if (!this.container) return;
    
    // 检查控制区域是否存在
    const existingControls = this.container.querySelector('.layout-controls-container');
    
    // 如果控制区域不存在（或已被主题重建掉），则重新创建
    if (!existingControls || !this.controlsContainer || !this.container.contains(this.controlsContainer)) {
      console.log('🔧 智能布局：检测到控制区域丢失，正在重新创建...');
      this._createControlElements();
      console.log('✅ 智能布局：控制区域已重新创建');
    } else {
      // 确保控制区域可见
      this._showControls();
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
    
    // *** 新增：每次显示时确保控制区域存在 ***
    this._ensureControlsExist();
    
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
    if (!this.container) return;    // 隐藏颜色选择器（如果存在且可见）
    if (this.inlineColorPicker && typeof this.inlineColorPicker.isVisible === 'function' && this.inlineColorPicker.isVisible()) {
      this.inlineColorPicker.hide();
    }
    
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
    
    // 清理历史实例残留的面板节点，避免 Nodes 2.0 切换 / 画布重建后出现重复面板
    try {
      document.querySelectorAll('.layout-panel').forEach((element) => {
        if (element.parentNode) element.parentNode.removeChild(element);
      });
    } catch (e) {
      // 忽略清理失败
    }

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
      // 静默处理设置获取失败
    }
    
    // 将初始透明度值存储到数据属性
    this.container.dataset.initialBgOpacity = opacity / 100;
    this.container.dataset.initialBtnOpacity = buttonOpacity / 100;
    
    // 预先保存透明度值到数据属性，但延迟应用
    // 这样可以确保主题应用后再设置透明度
    this.container.dataset.bgOpacity = opacity / 100;
    this.container.dataset.btnOpacity = buttonOpacity / 100;

    // *** 关键修改：先应用主题，再创建控制元素 ***
    // 应用当前主题或默认主题
    let themeId = null;
    try {
      if (window.app?.extensionManager?.setting) {
        themeId = window.app.extensionManager.setting.get("LayoutPanel.theme");
      }
    } catch(e) {
      // 静默处理主题设置获取失败
    }
    
    if (!themeId) {
      themeId = getDefaultTheme();
    }

    // 创建硬币容器 - 在主题应用前创建
    this.coinElement = createCoinElement();
    
    // 确保硬币元素添加到面板顶部
    if (this.container.firstChild) {
      this.container.insertBefore(this.coinElement, this.container.firstChild);
    } else {
      this.container.appendChild(this.coinElement);
    }

    // 先应用主题（如果有的话）
    if (themeId) {
      this.setTheme(themeId);
    }

    // *** 在主题应用后创建所有控制元素 ***
    this._createControlElements();

    // 监听设置变化
    if (window.app?.extensionManager?.setting?.onChange) {
      window.app.extensionManager.setting.onChange("LayoutPanel.opacity", (val) => {
        this.setOpacity(val);
      });
      
      window.app.extensionManager.setting.onChange("LayoutPanel.buttonOpacity", (val) => {
        this.setButtonOpacity(val);
      });
    }

    // 使用外部样式模块注入样式
    injectStyles('layout-panel-styles', layoutPanelStyles);
    
    // 添加面板点击事件，阻止冒泡
    this.container.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // 添加到文档
    document.body.appendChild(this.container);
    
    // 最后应用透明度设置
    setTimeout(() => {
      this.container.dataset.initialSetup = 'completed';
      this.setOpacity(opacity);
      this.setButtonOpacity(buttonOpacity);
    }, 100);
  }

  // 新增方法：创建所有控制元素（按钮、选择器等）
  // 注意：主题切换 / 重复调用时会重建控制区，这里必须先移除旧节点，
  // 否则会在面板里残留若干空容器，表现为面板底部出现大片空白
  _createControlElements() {
    if (this.container) {
      try {
        this.container.querySelectorAll('.layout-controls-container').forEach((element) => {
          if (element.parentNode) element.parentNode.removeChild(element);
        });
        this.container.querySelectorAll('.layout-inline-color-picker').forEach((element) => {
          if (element.parentNode) element.parentNode.removeChild(element);
        });
      } catch (e) {
        // 忽略清理失败
      }
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
      this._toggleInlineColorPicker();
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
    
    // 创建控制区域容器（包含按钮和下拉框）
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.className = 'layout-controls-container';
    this.controlsContainer.appendChild(this.buttonsContainer);
    this.controlsContainer.appendChild(modeContainer);
    this.controlsContainer.appendChild(syncModeContainer);
    
    // 创建并添加内嵌颜色选择器
    this.inlineColorPicker = new InlineColorPicker({
      title: '选择节点颜色',
      defaultColor: '#3355aa',
      getThemeInfo: () => {
        // 获取当前主题信息
        if (this.currentTheme && typeof getTheme === 'function') {
          const themeModule = getTheme(this.currentTheme);
          if (themeModule && typeof themeModule.getCurrentThemeId === 'function') {
            const themeId = themeModule.getCurrentThemeId();
            return {
              type: themeId === 'blood' ? 'blood' : 'purple'
            };
          }
        }
        return { type: 'purple' }; // 默认紫色主题
      },
      onColorSelect: (color) => {
        // 获取选中的节点和组
        const app = getComfyUIApp();
        if (app) {
          const selectedNodes = getSelectedNodes(app);
          const selectedGroups = getSelectedGroups(app);
          this._applyColorToSelectedNodes(color, selectedNodes, selectedGroups, app);
          // 应用颜色后恢复控制区域
          this._showControls();
        }
      },
      onCancel: () => {
        // 取消时恢复控制区域
        this._showControls();
      }
    });
    
    const colorPickerElement = this.inlineColorPicker.createInlineColorPicker();
    
    // *** 关键：确保控制元素在主题应用后添加到容器 ***
    this.container.appendChild(this.controlsContainer);
    this.container.appendChild(colorPickerElement);
    
    // 确保初始状态：显示控制区域，隐藏颜色选择器
    this._showControls();
    
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

      let applied = 0;

      // 根据颜色模式应用颜色（applyNodeColor/applyGroupColor 内部已兼容 Nodes 2.0）
      if (this.colorMode === '统一随机') {
        // 统一随机模式 - 所有节点和组使用同一个随机颜色
        const uniformColor = getRandomColor();
        selectedNodes.forEach(node => {
          if (applyNodeColor(node, uniformColor)) applied++;
        });
        selectedGroups.forEach(group => {
          if (applyGroupColor(group, uniformColor)) applied++;
        });
      } else {
        // 完全随机模式 - 每个节点和组使用不同的随机颜色
        selectedNodes.forEach(node => {
          if (applyNodeColor(node, getRandomColor())) applied++;
        });
        selectedGroups.forEach(group => {
          if (applyGroupColor(group, getRandomColor())) applied++;
        });
      }

      // 兼容新旧渲染：刷新画布图层（Nodes 2.0 的节点由响应式状态驱动，不会重复绘制）
      refreshCanvas(app);

      if (applied === 0) {
        showNotification("颜色应用失败：没有可着色的对象");
        return;
      }
      const modeName = this.colorMode === '统一随机' ? '统一随机颜色' : '完全随机颜色';
      showNotification("已应用" + modeName + "（" + applied + " 个）", "info");
    } catch (error) {
      showNotification(`设置随机颜色失败: ${error.message}`);
    }
  }

  // 切换内嵌颜色选择器显示/隐藏
  _toggleInlineColorPicker() {
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
      }      // 获取默认颜色
      const defaultColor = selectedNodes.length > 0 ? 
        (selectedNodes[0].color || '#3355aa') : 
        (selectedGroups.length > 0 ? (selectedGroups[0].color || '#3355aa') : '#3355aa');

      // 切换颜色选择器显示状态
      if (this.inlineColorPicker && typeof this.inlineColorPicker.isVisible === 'function') {
        if (this.inlineColorPicker.isVisible()) {
          this._showControls();
        } else {
          this._showColorPicker(defaultColor);
        }
      } else {
        showNotification("颜色选择器未正确初始化");
      }
    } catch (error) {
      showNotification(`切换颜色选择器失败: ${error.message}`);
    }
  }

  // 显示控制区域，隐藏颜色选择器
  _showControls() {
    if (this.controlsContainer) {
      this.controlsContainer.style.display = 'block';
    }
    if (this.inlineColorPicker && typeof this.inlineColorPicker.hide === 'function') {
      this.inlineColorPicker.hide();
    }
  }

  // 显示颜色选择器，隐藏控制区域
  _showColorPicker(defaultColor) {
    if (this.controlsContainer) {
      this.controlsContainer.style.display = 'none';
    }
    if (this.inlineColorPicker && typeof this.inlineColorPicker.show === 'function') {
      // 在显示前更新主题，确保颜色选择器使用正确的主题
      if (typeof this.inlineColorPicker.updateTheme === 'function') {
        this.inlineColorPicker.updateTheme();
      }
      this.inlineColorPicker.show(defaultColor);
    }
  }

  // 应用颜色到选中的节点和组
  _applyColorToSelectedNodes(color, selectedNodes, selectedGroups, app) {
    try {
      // 应用颜色到节点和组（兼容 Nodes 2.0 的响应式节点状态）
      let applied = 0;
      selectedNodes.forEach(node => {
        if (applyNodeColor(node, color)) applied++;
      });

      selectedGroups.forEach(group => {
        if (applyGroupColor(group, color)) applied++;
      });

      refreshCanvas(app);

      if (applied === 0) {
        showNotification("应用颜色失败：没有可着色的对象");
        return;
      }
      showNotification("已应用自定义颜色（" + applied + " 个）", "info");
    } catch (error) {
      showNotification(`应用颜色失败: ${error.message}`);
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
      let message = '';

      if (mode === 'size') {
        // 大小同步：统一为最大宽高
        result = syncNodeSize(selectedNodes);
        message = '已同步为统一大小';
      } else if (mode === 'wh') {
        // 宽高同步：判断排列方向
        result = syncNodeWidthHeight(selectedNodes);
        const direction = result.direction === 'horizontal' ? '横向排列' : '纵向排列';
        const dimension = result.direction === 'horizontal' ? '高度' : '宽度';
        message = "已同步" + dimension + "（" + direction + "）";
      } else if (mode === 'align') {
        // 同步对齐：自动排列节点
        result = alignNodes(selectedNodes);
        const alignment = result.direction === 'horizontal' ? 'Y轴对齐' : 'X轴对齐';
        const direction = result.direction === 'horizontal' ? '横向' : '纵向';
        message = "已" + direction + "对齐（" + alignment + "）";
      }

      // 新旧前端都通过 applied 判断是否真正写入成功，避免“看起来成功但没有任何变化”
      if (result && result.applied === 0) {
        showNotification('节点同步失败：没有可写入的节点');
        return;
      }

      if (message) {
        showNotification(message, 'info');
      }

      refreshCanvas(app);
    } catch (e) {
      showNotification('节点同步失败: ' + e.message);
    }
  }
  
  // 清理资源
  destroy() {
    // 隐藏面板
    if (this.visible) {
      this.hide();
    }
    
    // 销毁颜色选择器
    if (this.inlineColorPicker) {
      this.inlineColorPicker.destroy();
      this.inlineColorPicker = null;
    }
    
    // 移除面板元素
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    // 清理样式
    removeStyles('layout-panel-styles');
    
    // 重置状态
    this.container = null;
    this.buttonsContainer = null;
    this.controlsContainer = null; // 新增：清理控制容器引用
    this.coinElement = null;
    this.visible = false;
    this.currentTheme = null;
  }
}

export const DEFAULT_CONFIG = {
  enabled: true,  // 默认启用
  shortcut: 'alt+x',
  colorMode: '完全随机', // 默认颜色模式
  continueIteration: false, // 默认应用颜色后关闭面板
  theme: 'ancient_gods_eye' // 默认主题
};
