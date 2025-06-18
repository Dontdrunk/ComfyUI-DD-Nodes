// 智能布局扩展
import { app } from "/scripts/app.js";
import { LayoutPanel, DEFAULT_CONFIG } from "./LayoutCore.js";
import { registerTheme, getRegisteredThemes, setDefaultTheme, initDefaultThemes } from "./styles/UIStyles.js";

// 初始化默认主题
try {
  // 调用主题初始化函数
  if (initDefaultThemes()) {
    console.log("主题系统已成功初始化");
  } else {
    console.warn("主题系统初始化返回失败");
  }
} catch (error) {
  console.error("主题系统初始化失败:", error);
}

// 确保全局唯一实例
function getOrCreateLayoutInstance() {
  if (!app.canvas) {
    console.warn("界面布局：app.canvas未初始化");
    return null;
  }
  
  if (!app.canvas._layoutPanel) {
    app.canvas._layoutPanel = new LayoutPanel();
  }
  return app.canvas._layoutPanel;
}

// 处理快捷键
function handleShortcut(e) {
  // 确保app.canvas已初始化
  if (!app.canvas) return;
  
  const layoutPanel = getOrCreateLayoutInstance();
  if (!layoutPanel) return;
  
  const shortcut = layoutPanel.shortcut;
  const [mod, key] = shortcut.split('+');
  
  if ((mod === 'alt' && e.altKey || 
       mod === 'ctrl' && (e.ctrlKey || e.metaKey) || 
       mod === 'shift' && e.shiftKey) && 
      e.key.toLowerCase() === key) {
    e.preventDefault();
    layoutPanel.toggle();
  }
}

// 注册全局快捷键监听
document.addEventListener('keydown', handleShortcut, true);

// 主扩展导出
export const layoutExt = {
  name: "layout-panel",
  init() {
    // 确保app.canvas已初始化再进行操作
    if (!app.canvas) {
      console.warn("智能布局：初始化时app.canvas未准备好");
      // 延迟初始化
      setTimeout(() => {
        if (app.canvas) {
          this.initLayoutPanel();
        } else {
          console.error("智能布局：无法获取app.canvas，初始化失败");
        }
      }, 1000);
      return;
    }
    
    this.initLayoutPanel();
  },
  initLayoutPanel() {
    // 初始化布局面板
    const layoutPanel = getOrCreateLayoutInstance();
    if (!layoutPanel) return;
    
    // 应用所有初始设置 - 确保所有参数都在初始化时应用
    const applySettings = () => {
      try {
        // 主要设置
        const shortcut = app.extensionManager?.setting?.get("LayoutPanel.shortcut") ?? DEFAULT_CONFIG.shortcut;
        const theme = app.extensionManager?.setting?.get("LayoutPanel.theme") ?? DEFAULT_CONFIG.theme;
        
        // 透明度设置
        const opacity = app.extensionManager?.setting?.get("LayoutPanel.opacity") ?? 85;
        const buttonOpacity = app.extensionManager?.setting?.get("LayoutPanel.buttonOpacity") ?? 90;
        
        // 启用面板（始终启用）
        layoutPanel.setEnabled(true);
        
        // 应用所有设置 - 顺序很重要
        layoutPanel.setShortcut(shortcut);
        layoutPanel.setTheme(theme);
        
        // 确保透明度设置最后应用，这样不会被主题初始化覆盖
        setTimeout(() => {
          layoutPanel.setOpacity(opacity);
          layoutPanel.setButtonOpacity(buttonOpacity);
        }, 100);
        
        console.log("布局面板初始设置已加载:", { shortcut, theme, opacity, buttonOpacity });
      } catch (e) {
        console.warn("应用设置时出错:", e);
        // 应用默认设置作为回退
        layoutPanel.setShortcut(DEFAULT_CONFIG.shortcut);
        layoutPanel.setTheme(DEFAULT_CONFIG.theme);
        layoutPanel.setOpacity(85);
        layoutPanel.setButtonOpacity(90);
      }
    };
    
    applySettings();
  }
};

// 获取所有注册主题用于设置选择
function getThemeOptions() {
  try {
    const themes = getRegisteredThemes();
    return themes.map(theme => ({ 
      text: theme.name, 
      value: theme.id 
    }));
  } catch (e) {
    console.error("获取主题选项失败:", e);
    return [{ text: '古神之眼', value: '古神之眼' }];
  }
}

// 注册设置面板
app.registerExtension({
  name: "ComfyUI.LayoutPanel.Settings",
  setup() {
    // 确保app.canvas已初始化
    if (!app.canvas) {
      console.warn("智能布局设置：app.canvas未准备好");
      return;
    }
    
    // 初始化布局面板
    const layoutPanel = getOrCreateLayoutInstance();
    if (!layoutPanel) return;
    
    // 确保显式加载和应用所有设置，与init方法保持一致
    try {
      // 先启用面板
      layoutPanel.setEnabled(true);
      
      // 然后应用所有保存的设置
      const shortcut = app.extensionManager?.setting?.get("LayoutPanel.shortcut") ?? DEFAULT_CONFIG.shortcut;
      const theme = app.extensionManager?.setting?.get("LayoutPanel.theme") ?? DEFAULT_CONFIG.theme;
      const opacity = app.extensionManager?.setting?.get("LayoutPanel.opacity") ?? 85;
      const buttonOpacity = app.extensionManager?.setting?.get("LayoutPanel.buttonOpacity") ?? 90;
      
      // 应用设置 - 注意顺序
      layoutPanel.setShortcut(shortcut);
      layoutPanel.setTheme(theme);
      
      // 确保透明度在主题后设置
      setTimeout(() => {
        layoutPanel.setOpacity(opacity);
        layoutPanel.setButtonOpacity(buttonOpacity);
      }, 100);
    } catch (e) {
      console.warn("应用设置时出错:", e);
      // 应用默认设置
      layoutPanel.setShortcut(DEFAULT_CONFIG.shortcut);
      layoutPanel.setTheme(DEFAULT_CONFIG.theme);
      layoutPanel.setOpacity(85);
      layoutPanel.setButtonOpacity(90);
    }
  },
  settings: [
    // 移除启用/禁用设置选项
    {      
      id: "LayoutPanel.shortcut",
      name: "快捷呼出",
      type: "text",
      defaultValue: DEFAULT_CONFIG.shortcut,
      tooltip: "弹出界面布局工具面板的快捷键（如alt+x）",
      category: ["🍺界面布局", "1·功能", "快捷呼出"],
      onChange(value) {
        if (typeof value === 'string' && value.includes('+')) {
          const layoutPanel = getOrCreateLayoutInstance();
          if (layoutPanel) {
            layoutPanel.setShortcut(value);
          }
        }
      }    
    },
    {
      id: "LayoutPanel.opacity",
      name: "背景透明",
      type: "slider",
      defaultValue: 85,
      attrs: { min: 0, max: 100, step: 1 },
      tooltip: "设置界面布局主面板背景的透明度（0~100%）",
      category: ["🍺界面布局", "2·外观", "背景透明"],
      onChange(value) {
        const layoutPanel = getOrCreateLayoutInstance();
        if (layoutPanel && typeof layoutPanel.setOpacity === 'function') {
          layoutPanel.setOpacity(value);
        }
      }
    },
    {
      id: "LayoutPanel.buttonOpacity",
      name: "按钮透明",
      type: "slider",
      defaultValue: 90,
      attrs: { min: 0, max: 100, step: 1 },
      tooltip: "设置界面布局面板中按钮的透明度（0~100%）",
      category: ["🍺界面布局", "2·外观", "按钮透明"],
      onChange(value) {
        const layoutPanel = getOrCreateLayoutInstance();
        if (layoutPanel && typeof layoutPanel.setButtonOpacity === 'function') {
          layoutPanel.setButtonOpacity(value);
        }
      }
    },
    {
      id: "LayoutPanel.theme",
      name: "界面主题",
      type: "combo",
      defaultValue: DEFAULT_CONFIG.theme,
      tooltip: "选择界面布局面板的视觉主题",
      options: getThemeOptions,
      category: ["🍺界面布局", "2·外观", "界面主题"],
      onChange(value) {
        const layoutPanel = getOrCreateLayoutInstance();
        if (layoutPanel && typeof layoutPanel.setTheme === 'function') {
          layoutPanel.setTheme(value);
        }
      }
    }
  ]
});

// 主扩展注册
app.registerExtension({
  name: "ComfyUI.LayoutPanel",
  init() {
    try {
      console.log("正在初始化智能布局面板...");
      // 延迟初始化，确保其他扩展已经加载
      setTimeout(() => {
        if (app.canvas) {
          layoutExt.init();
          console.log("智能布局面板初始化完成");
        } else {
          console.error("智能布局：延迟初始化失败，app.canvas仍未准备好");
        }
      }, 1000);
    } catch (e) {
      console.error("初始化智能布局面板时出错:", e);
    }
  }
});