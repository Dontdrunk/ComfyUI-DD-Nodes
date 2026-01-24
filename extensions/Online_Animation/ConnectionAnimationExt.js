import { app } from "/scripts/app.js";
import { ConnectionAnimation, DEFAULT_CONFIG } from "./ConnectionAnimationCore.js";

function normalizeConnectionEffect(value) {
    if (value === "流动") return "flow";
    if (value === "波浪") return "wave";
    if (value === "律动") return "rhythm";
    if (value === "脉冲") return "pulse";
    return value;
}

function normalizeConnectionRenderStyle(value) {
    if (value === "直线") return "straight";
    if (value === "直角线") return "orthogonal";
    if (value === "曲线") return "curve";
    if (value === "电路板") return "circuit";
    return value;
}

function normalizeConnectionDisplayMode(value) {
    if (value === "全部显示") return "all";
    if (value === "悬停节点") return "hover";
    if (value === "选中节点") return "selected";
    return value;
}

function normalizeConnectionStaticRenderMode(value) {
    if (value === "官方实现") return "official";
    if (value === "独立渲染") return "independent";
    return value;
}

function normalizeAndMigrateSetting(settingId, fallbackValue, normalize) {
    const raw = app.extensionManager.setting.get(settingId);
    const value = raw ?? fallbackValue;
    const normalized = normalize(value);
    if (raw != null && normalized !== value) {
        app.extensionManager.setting.set(settingId, normalized).catch(() => {});
    }
    return normalized;
}

// 确保全局唯一实例
function getOrCreateAnimationInstance() {
    if (!app.canvas._connectionAnimation) {
        app.canvas._connectionAnimation = new ConnectionAnimation();
    }
    return app.canvas._connectionAnimation;
}

// 应用设置配置
function applySettings(connectionAnimation) {
    connectionAnimation.setEnabled(app.extensionManager.setting.get("ConnectionAnimation.enabled") ?? DEFAULT_CONFIG.enabled);
    connectionAnimation.setLineWidth(app.extensionManager.setting.get("ConnectionAnimation.lineWidth") ?? DEFAULT_CONFIG.lineWidth);
    connectionAnimation.setEffect(
        normalizeAndMigrateSetting("ConnectionAnimation.effect", DEFAULT_CONFIG.effect, normalizeConnectionEffect)
    );
    connectionAnimation.setSpeed(app.extensionManager.setting.get("ConnectionAnimation.speed") ?? 2);
    connectionAnimation.setSamplingLevel(app.extensionManager.setting.get("ConnectionAnimation.samplingLevel") ?? 2);
    connectionAnimation.setEffectExtra(app.extensionManager.setting.get("ConnectionAnimation.effectExtra") ?? false);
    connectionAnimation.setRenderStyle(
        normalizeAndMigrateSetting(
            "ConnectionAnimation.renderStyle",
            DEFAULT_CONFIG.renderStyle,
            normalizeConnectionRenderStyle
        )
    );
    connectionAnimation.setUseGradient(app.extensionManager.setting.get("ConnectionAnimation.useGradient") ?? true);
    connectionAnimation.setDisplayMode(
        normalizeAndMigrateSetting("ConnectionAnimation.displayMode", DEFAULT_CONFIG.displayMode, normalizeConnectionDisplayMode)
    );
    connectionAnimation.setStaticRenderMode(
        normalizeAndMigrateSetting(
            "ConnectionAnimation.staticRenderMode",
            DEFAULT_CONFIG.staticRenderMode,
            normalizeConnectionStaticRenderMode
        )
    );
}

// 设置节点悬停监听
function setupNodeHoverListeners(connectionAnimation) {
    // 设置节点悬停和选择监听
    const originalOnNodeMouseEnter = app.canvas.onNodeMouseEnter;
    if (originalOnNodeMouseEnter) {
        app.canvas.onNodeMouseEnter = function(node, e) {
            try {
                connectionAnimation.setHoveredNode(node);
            } catch (e) {
                console.warn("Connection Animation: Error setting hovered node:", e);
            }
            return originalOnNodeMouseEnter?.call(this, node, e);
        };
    }
    
    const originalOnNodeMouseLeave = app.canvas.onNodeMouseLeave;
    if (originalOnNodeMouseLeave) {
        app.canvas.onNodeMouseLeave = function(node, e) {
            try {
                connectionAnimation.setHoveredNode(null);
            } catch (e) {
                console.warn("Connection Animation: Error clearing hovered node:", e);
            }
            return originalOnNodeMouseLeave?.call(this, node, e);
        };
    }
    
    // 重写 node_over 属性以捕获节点悬停
    if (app.canvas && !app.canvas._connectionAnimationNodeOverPatched) {
        let _node_over = app.canvas.node_over;
        Object.defineProperty(app.canvas, 'node_over', {
            get: () => _node_over,
            set: (value) => {
                _node_over = value;
                try {
                    connectionAnimation.setHoveredNode(value);
                } catch (e) {
                    console.warn("Connection Animation: Error setting hovered node:", e);
                }
            }
        });
        app.canvas._connectionAnimationNodeOverPatched = true;
    }
}

// 设置节点选择监听
function setupNodeSelectionListeners(connectionAnimation) {
    if (!app.canvas) return;

    // 监听选择变化
    const originalOnSelectionChange = app.canvas.onSelectionChange;
    app.canvas.onSelectionChange = function(nodes) {
        try {
            if (connectionAnimation.notifySelectionChanged) {
                connectionAnimation.notifySelectionChanged();
            }
        } catch (e) {
            console.warn("Connection Animation: Error handling selection change:", e);
        }
        return originalOnSelectionChange?.call(this, nodes);
    };

    // 某些情况下 onSelectionChange 可能不会被触发（取决于 LiteGraph 版本），
    // 所以我们也 hook selectNode 和 deselectNode 作为备份
    const originalSelectNode = app.canvas.selectNode;
    app.canvas.selectNode = function(node, addToSelection) {
        const result = originalSelectNode?.call(this, node, addToSelection);
        try {
            if (connectionAnimation.notifySelectionChanged) {
                connectionAnimation.notifySelectionChanged();
            }
        } catch (e) {
            console.warn("Connection Animation: Error handling selectNode:", e);
        }
        return result;
    };

    const originalDeselectNode = app.canvas.deselectNode;
    app.canvas.deselectNode = function(node) {
        const result = originalDeselectNode?.call(this, node);
        try {
            if (connectionAnimation.notifySelectionChanged) {
                connectionAnimation.notifySelectionChanged();
            }
        } catch (e) {
            console.warn("Connection Animation: Error handling deselectNode:", e);
        }
        return result;
    };
    
    // 同时也监听 processMouseUp 以处理框选
    const originalProcessMouseUp = app.canvas.processMouseUp;
    app.canvas.processMouseUp = function(e) {
        const result = originalProcessMouseUp?.call(this, e);
        try {
            // 延迟一下以确保选择状态已更新
            setTimeout(() => {
                if (connectionAnimation.notifySelectionChanged) {
                    connectionAnimation.notifySelectionChanged();
                }
            }, 0);
        } catch (e) {
            console.warn("Connection Animation: Error handling processMouseUp:", e);
        }
        return result;
    };
}

app.registerExtension({
    name: "ComfyUI.ConnectionAnimation",
    setup() {
        const connectionAnimation = getOrCreateAnimationInstance();
        connectionAnimation.initOverrides(app.canvas);
        
        // 应用所有设置
        applySettings(connectionAnimation);
        
        // 设置节点悬停监听
        setupNodeHoverListeners(connectionAnimation);

        // 设置节点选择监听
        setupNodeSelectionListeners(connectionAnimation);
    },
    settings: [
        {
            id: "ConnectionAnimation.enabled",
            name: "Enable Animation",
            type: "boolean",
            defaultValue: true,
            tooltip: "Enable or disable connection animation.",
            category: ["DD_CONNECTION_ANIMATION", "1_FEATURES", "ENABLE_ANIMATION"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setEnabled(value);
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        },
        {
            id: "ConnectionAnimation.lineWidth",
            name: "Line Width",
            type: "slider",
            defaultValue: 2,
            attrs: { min: 1, max: 3, step: 1 },
            tooltip: "Adjust the animated connection thickness (1-3).",
            category: ["DD_CONNECTION_ANIMATION", "3_SETTINGS", "ANIMATION_SIZE"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setLineWidth(value);
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        },
        {
            id: "ConnectionAnimation.effect",
            name: "Effect",
            type: "combo",
            options: ["flow", "wave", "rhythm", "pulse"],
            defaultValue: DEFAULT_CONFIG.effect,
            tooltip: "Choose the animation effect style.",
            category: ["DD_CONNECTION_ANIMATION", "2_STYLE", "ANIMATION_EFFECT"],
            onChange(value) {
                if (!value) return;
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setEffect(normalizeConnectionEffect(value));
                    app.graph.setDirtyCanvas(true, true);
                }
            }
        },
        {
            id: "ConnectionAnimation.speed",
            name: "Speed",
            type: "slider",
            defaultValue: 2,
            attrs: { min: 0.5, max: 3, step: 0.5 },
            tooltip: "Adjust the animation speed (0.5-3). Higher is faster.",
            category: ["DD_CONNECTION_ANIMATION", "3_SETTINGS", "ANIMATION_SPEED"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setSpeed(value);
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        },
        {
            id: "ConnectionAnimation.samplingLevel",
            name: "Sampling",
            type: "slider",
            defaultValue: 2,
            attrs: { min: 1, max: 3, step: 1 },
            tooltip: "Control sampling density for all effects. Lower is faster, higher is smoother (1-3).",
            category: ["DD_CONNECTION_ANIMATION", "3_SETTINGS", "SAMPLING_LEVEL"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setSamplingLevel(value);
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        },
        {
            id: "ConnectionAnimation.effectExtra",
            name: "Extra Effects",
            type: "boolean",
            defaultValue: false,
            tooltip: "Enable extra visual effects (glow, trails, etc.). May reduce performance on low-end hardware.",
            category: ["DD_CONNECTION_ANIMATION", "1_FEATURES", "EXTRA_EFFECTS"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setEffectExtra(value);
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        },
        {
            id: "ConnectionAnimation.renderStyle",
            name: "Render Style",
            type: "combo",
            options: ["straight", "orthogonal", "curve", "circuit"],
            defaultValue: DEFAULT_CONFIG.renderStyle,
            tooltip: "Choose how the connection path is rendered.",
            category: ["DD_CONNECTION_ANIMATION", "2_STYLE", "RENDER_STYLE"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setRenderStyle(normalizeConnectionRenderStyle(value));
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        },
        {
            id: "ConnectionAnimation.useGradient",
            name: "Gradient",
            type: "boolean",
            defaultValue: true,
            tooltip: "Use gradient colors for connections. Turn off to use a solid base color.",
            category: ["DD_CONNECTION_ANIMATION", "1_FEATURES", "USE_GRADIENT"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setUseGradient(value);
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        },        {
            id: "ConnectionAnimation.displayMode",
            name: "Display Mode",
            type: "combo",
            options: ["all", "hover", "selected"],
            defaultValue: DEFAULT_CONFIG.displayMode,
            tooltip: "Control when animated connections are shown.",
            category: ["DD_CONNECTION_ANIMATION", "2_STYLE", "DISPLAY_MODE"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setDisplayMode(normalizeConnectionDisplayMode(value));
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        },
        {
            id: "ConnectionAnimation.staticRenderMode",
            name: "Static Render",
            type: "combo",
            options: ["official", "independent"],
            defaultValue: DEFAULT_CONFIG.staticRenderMode,
            tooltip: "Choose how static connections are rendered in hover/selected modes.",
            category: ["DD_CONNECTION_ANIMATION", "2_STYLE", "STATIC_RENDER_MODE"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setStaticRenderMode(normalizeConnectionStaticRenderMode(value));
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        }
    ]
});
