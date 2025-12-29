import { app } from "/scripts/app.js";
import { ConnectionAnimation, DEFAULT_CONFIG } from "./ConnectionAnimationCore.js";

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
    connectionAnimation.setEffect(app.extensionManager.setting.get("ConnectionAnimation.effect") ?? DEFAULT_CONFIG.effect);
    connectionAnimation.setSpeed(app.extensionManager.setting.get("ConnectionAnimation.speed") ?? 2);
    connectionAnimation.setSamplingLevel(app.extensionManager.setting.get("ConnectionAnimation.samplingLevel") ?? 2);
    connectionAnimation.setEffectExtra(app.extensionManager.setting.get("ConnectionAnimation.effectExtra") ?? false);
    connectionAnimation.setRenderStyle(app.extensionManager.setting.get("ConnectionAnimation.renderStyle") ?? "曲线");
    connectionAnimation.setUseGradient(app.extensionManager.setting.get("ConnectionAnimation.useGradient") ?? true);
    connectionAnimation.setDisplayMode(app.extensionManager.setting.get("ConnectionAnimation.displayMode") ?? DEFAULT_CONFIG.displayMode);
    connectionAnimation.setStaticRenderMode(app.extensionManager.setting.get("ConnectionAnimation.staticRenderMode") ?? "独立渲染");
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
function setupSelectionListeners(connectionAnimation) {
    // 监听选择变化事件
    const originalOnSelectionChange = app.canvas.onSelectionChange;
    app.canvas.onSelectionChange = function(nodes) {
        try {
            // nodes 是 {node_id: node} 的对象，转为数组
            const selectedNodes = nodes ? Object.values(nodes) : [];
            connectionAnimation.setSelectedNodes(selectedNodes);
        } catch (e) {
            console.warn("Connection Animation: Error handling selection change:", e);
        }
        
        if (originalOnSelectionChange) {
            return originalOnSelectionChange.apply(this, arguments);
        }
    };

    // 监听鼠标释放，处理框选等可能未触发 onSelectionChange 的情况
    const originalOnMouseUp = app.canvas.onMouseUp;
    app.canvas.onMouseUp = function(e) {
        const result = originalOnMouseUp ? originalOnMouseUp.apply(this, arguments) : undefined;
        
        try {
            // 延迟微小时间确保 LiteGraph 内部状态已更新
            setTimeout(() => {
                if (app.canvas.selected_nodes) {
                    const selectedNodes = Object.values(app.canvas.selected_nodes);
                    connectionAnimation.setSelectedNodes(selectedNodes);
                } else {
                    connectionAnimation.setSelectedNodes([]);
                }
            }, 10);
        } catch (e) {
            console.warn("Connection Animation: Error checking selection on mouse up:", e);
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
        setupSelectionListeners(connectionAnimation);
    },
    settings: [
        {
            id: "ConnectionAnimation.enabled",
            name: "动画开关",
            type: "boolean",
            defaultValue: true,
            tooltip: "开启或关闭连线动画效果",
            category: ["🍺连线动画", "1·功能", "动画开关"],
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
            name: "动画大小",
            type: "slider",
            defaultValue: 2,
            attrs: { min: 1, max: 3, step: 1 },
            tooltip: "设置连线动画的粗细大小（1~3）",
            category: ["🍺连线动画", "3·设置", "动画大小"],
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
            name: "动画效果",
            type: "combo",
            options: ["流动", "波浪", "律动", "脉冲"],
            defaultValue: "律动",
            tooltip: "选择连线动画的视觉样式（流动/波浪/律动）",
            category: ["🍺连线动画", "2·样式", "动画效果"],
            onChange(value) {
                if (!value) return;
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setEffect(value);
                    app.graph.setDirtyCanvas(true, true);
                }
            }
        },
        {
            id: "ConnectionAnimation.speed",
            name: "动画速度",
            type: "slider",
            defaultValue: 2,
            attrs: { min: 1, max: 3, step: 1 },
            tooltip: "设置连线动画的速度（1~3，数值越大越快）",
            category: ["🍺连线动画", "3·设置", "动画速度"],
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
            name: "采样强度",
            type: "slider",
            defaultValue: 2,
            attrs: { min: 1, max: 3, step: 1 },
            tooltip: "控制所有动画效果的采样点数量，1=极致性能，3=极致流畅。采样点越少性能越高，采样点越多动画越细腻。",
            category: ["🍺连线动画", "3·设置", "采样强度"],
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
            name: "动效开关",
            type: "boolean",
            defaultValue: false,
            tooltip: "是否启用额外的动画特效（如发光、尾迹等）【注意！开启后会有更大的性能开销可能会导致工作流卡顿，低配置电脑谨慎开启！】",
            category: ["🍺连线动画", "1·功能", "动效开关"],
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
            name: "渲染样式",
            type: "combo",
            options: ["直线", "直角线", "曲线", "电路板"],
            defaultValue: "曲线",
            tooltip: "改变连线动画的渲染路径样式（直线/直角线/曲线/电路板）",
            category: ["🍺连线动画", "2·样式", "动画渲染"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setRenderStyle(value);
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        },
        {
            id: "ConnectionAnimation.useGradient",
            name: "连线渐变",
            type: "boolean",
            defaultValue: true,
            tooltip: "开启后连线将使用渐变色彩，关闭则为纯主色。",
            category: ["🍺连线动画", "1·功能", "连线渐变"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setUseGradient(value);
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        },        {
            id: "ConnectionAnimation.displayMode",
            name: "动画显示",
            type: "combo",
            options: ["全部显示", "悬停节点", "选中节点"],
            defaultValue: "全部显示",
            tooltip: "控制动画连线的显示方式：全部显示=所有连线都显示动画；悬停节点=只有鼠标悬停节点的连线显示动画；选中节点=只有选中节点的连线显示动画",
            category: ["🍺连线动画", "2·样式", "动画显示"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setDisplayMode(value);
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        },
        {
            id: "ConnectionAnimation.staticRenderMode",
            name: "静态渲染",
            type: "combo",
            options: ["官方实现", "独立渲染"],
            defaultValue: "独立渲染",
            tooltip: "控制悬停模式下的静态连线渲染方式：官方实现=使用ComfyUI官方默认连线渲染；独立渲染=使用独立静态+动态混合渲染",
            category: ["🍺连线动画", "2·样式", "静态渲染"],
            onChange(value) {
                const connectionAnim = app.canvas?._connectionAnimation;
                if (connectionAnim) {
                    connectionAnim.setStaticRenderMode(value);
                    app.graph.setDirtyCanvas(true, true);
                }
            },
        }
    ]
});
