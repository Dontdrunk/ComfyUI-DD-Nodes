// 智能布局扩展
import { app } from "/scripts/app.js";
import { LayoutPanel, DEFAULT_CONFIG } from "./LayoutCore.js";

// 确保全局唯一实例
function getOrCreateLayoutInstance() {
  if (!app.canvas) {
    console.warn("智能布局：app.canvas未初始化");
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
    
    // 应用初始设置 - 功能始终启用
    const applySettings = () => {
      // 默认始终启用，不再依赖设置
      layoutPanel.setEnabled(true);
      const shortcut = app.extensionManager.setting.get("LayoutPanel.shortcut", DEFAULT_CONFIG.shortcut);
      layoutPanel.setShortcut(shortcut);
    };
    
    applySettings();
  }
};

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
    
    // 始终启用布局功能，不再依赖设置
    layoutPanel.setEnabled(true);
    layoutPanel.setShortcut(app.extensionManager.setting.get("LayoutPanel.shortcut") ?? DEFAULT_CONFIG.shortcut);
  },
  settings: [
    // 移除启用/禁用设置选项
    {
      id: "LayoutPanel.shortcut",
      name: "开关快捷键",
      type: "text",
      defaultValue: DEFAULT_CONFIG.shortcut,
      tooltip: "弹出智能布局硬币动画面板的快捷键（如alt+l）",
      category: ["🍺智能布局", "1·功能", "快捷键"],
      onChange(value) {
        if (typeof value === 'string' && value.includes('+')) {
          const layoutPanel = getOrCreateLayoutInstance();
          if (layoutPanel) {
            layoutPanel.setShortcut(value);
          }
        }
      }
    }
  ]
});

app.registerExtension({
  name: "ComfyUI.LayoutPanel",
  init() {
    setTimeout(() => {
      if (app.canvas) {
        layoutExt.init();
      } else {
        console.error("智能布局：延迟初始化失败，app.canvas仍未准备好");
      }
    }, 500);
  }
});