import { app } from "/scripts/app.js";
import { ConnectionAnimation, DEFAULT_CONFIG } from "./ConnectionAnimationCore.js";

// 确保全局唯一实例
function getOrCreateAnimationInstance() {
    if (!app.canvas._connectionAnimation) {
        app.canvas._connectionAnimation = new ConnectionAnimation();
    }
    return app.canvas._connectionAnimation;
}

export const connectionAnimationExt = {
    name: "connection-animation",
    init() {
        const connectionAnimation = getOrCreateAnimationInstance();
        connectionAnimation.initOverrides(app.canvas);
        const applySettings = () => {
            const enabled = app.extensionManager.setting.get("ConnectionAnimation.enabled", DEFAULT_CONFIG.enabled);
            const lineWidth = app.extensionManager.setting.get("ConnectionAnimation.lineWidth", DEFAULT_CONFIG.lineWidth);
            const effect = app.extensionManager.setting.get("ConnectionAnimation.effect", DEFAULT_CONFIG.effect);
            const effectExtra = app.extensionManager.setting.get("ConnectionAnimation.effectExtra", true);
            connectionAnimation.setEnabled(enabled);
            connectionAnimation.setLineWidth(lineWidth);
            connectionAnimation.setEffect(effect);
            connectionAnimation.setEffectExtra(effectExtra);
            app.graph.setDirtyCanvas(true, true);
        };
        applySettings();
    }
};

app.registerExtension({
    name: "ComfyUI.ConnectionAnimation.Settings",
    setup() {
        const connectionAnimation = getOrCreateAnimationInstance();
        connectionAnimation.initOverrides(app.canvas);
        connectionAnimation.setEnabled(app.extensionManager.setting.get("ConnectionAnimation.enabled") ?? DEFAULT_CONFIG.enabled);
        connectionAnimation.setLineWidth(app.extensionManager.setting.get("ConnectionAnimation.lineWidth") ?? DEFAULT_CONFIG.lineWidth);
        connectionAnimation.setEffect(app.extensionManager.setting.get("ConnectionAnimation.effect") ?? DEFAULT_CONFIG.effect);
        connectionAnimation.setEffectExtra(app.extensionManager.setting.get("ConnectionAnimation.effectExtra") ?? true);
        connectionAnimation.setRenderStyle(app.extensionManager.setting.get("ConnectionAnimation.renderStyle") ?? "曲线");
        connectionAnimation.setUseGradient(app.extensionManager.setting.get("ConnectionAnimation.useGradient") ?? true);
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
            options: ["直线", "直角线", "曲线", "电路板1", "电路板2"],
            defaultValue: "曲线",
            tooltip: "改变连线动画的渲染路径样式（直线/直角线/曲线/电路板1/电路板2）",
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
        }
    ]
});

app.registerExtension(connectionAnimationExt);
