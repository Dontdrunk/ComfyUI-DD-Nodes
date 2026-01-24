// 智能布局扩展
import { app } from "/scripts/app.js";
import { LayoutPanel, DEFAULT_CONFIG } from "./LayoutCore.js";
import { getRegisteredThemes, initDefaultThemes } from "./styles/UIStyles.js";

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

function normalizeLayoutThemeId(themeId) {
  if (themeId === "古神之眼") return "ancient_gods_eye";
  return themeId;
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
        const rawTheme = app.extensionManager?.setting?.get("LayoutPanel.theme") ?? DEFAULT_CONFIG.theme;
        const theme = normalizeLayoutThemeId(rawTheme);
        if (rawTheme !== theme) {
          app.extensionManager?.setting?.set?.("LayoutPanel.theme", theme)?.catch?.(() => {});
        }
        
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
    return themes.map(theme => theme.id);
  } catch (e) {
    console.error("获取主题选项失败:", e);
    return ["ancient_gods_eye"];
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
      const rawTheme = app.extensionManager?.setting?.get("LayoutPanel.theme") ?? DEFAULT_CONFIG.theme;
      const theme = normalizeLayoutThemeId(rawTheme);
      if (rawTheme !== theme) {
        app.extensionManager?.setting?.set?.("LayoutPanel.theme", theme)?.catch?.(() => {});
      }
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
      name: "Shortcut",
      type: "text",
      defaultValue: DEFAULT_CONFIG.shortcut,
      tooltip: "Keyboard shortcut to toggle the UI layout panel (e.g. Alt+X).",
      category: ["DD_UI_LAYOUT", "1_FEATURES", "SHORTCUT"],
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
      name: "Background Opacity",
      type: "slider",
      defaultValue: 85,
      attrs: { min: 0, max: 100, step: 1 },
      tooltip: "Adjust the background opacity of the UI layout panel (0-100%).",
      category: ["DD_UI_LAYOUT", "2_APPEARANCE", "BACKGROUND_OPACITY"],
      onChange(value) {
        const layoutPanel = getOrCreateLayoutInstance();
        if (layoutPanel && typeof layoutPanel.setOpacity === 'function') {
          layoutPanel.setOpacity(value);
        }
      }
    },
    {
      id: "LayoutPanel.buttonOpacity",
      name: "Button Opacity",
      type: "slider",
      defaultValue: 90,
      attrs: { min: 0, max: 100, step: 1 },
      tooltip: "Adjust the button opacity inside the UI layout panel (0-100%).",
      category: ["DD_UI_LAYOUT", "2_APPEARANCE", "BUTTON_OPACITY"],
      onChange(value) {
        const layoutPanel = getOrCreateLayoutInstance();
        if (layoutPanel && typeof layoutPanel.setButtonOpacity === 'function') {
          layoutPanel.setButtonOpacity(value);
        }
      }
    },
    {
      id: "LayoutPanel.theme",
      name: "Panel Theme",
      type: "combo",
      defaultValue: DEFAULT_CONFIG.theme,
      tooltip: "Select a visual theme for the UI layout panel.",
      options: getThemeOptions,
      category: ["DD_UI_LAYOUT", "2_APPEARANCE", "PANEL_THEME"],
      onChange(value) {
        const layoutPanel = getOrCreateLayoutInstance();
        if (layoutPanel && typeof layoutPanel.setTheme === 'function') {
          layoutPanel.setTheme(normalizeLayoutThemeId(value));
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
