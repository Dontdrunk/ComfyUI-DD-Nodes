// ComfyUI 比例选择器扩展
import { app } from "/scripts/app.js";
import { AspectRatioSelectorCore } from "./AspectRatioSelectorCore.js";

// 创建核心实例
const aspectRatioCore = new AspectRatioSelectorCore();

app.registerExtension({
    name: "ComfyUI.AspectRatioSelector",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // 只处理我们的比例选择器节点
        if (nodeData.name === "DD-AspectRatioSelector") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function() {
                const result = onNodeCreated?.apply(this, arguments);
                
                // 设置widget回调
                this.setupWidgetCallbacks = () => {
                    const modelWidget = this.widgets.find(w => w.name === "🤖 选择模型");
                    const aspectWidget = this.widgets.find(w => w.name === "📐 选择比例");
                    const ratioWidget = this.widgets.find(w => w.name === "📏 选择宽高");
                    
                    // 模型选择变化时更新比例选项
                    if (modelWidget) {
                        const originalCallback = modelWidget.callback;
                        modelWidget.callback = (value) => {
                            const aspectCategory = aspectWidget?.value || "横屏";
                            aspectRatioCore.updateRatioOptions(this, value, aspectCategory);
                            
                            // 调用原始回调
                            if (originalCallback) {
                                originalCallback.call(this, value);
                            }
                        };
                    }
                    
                    // 比例类别变化时更新比例选项
                    if (aspectWidget) {
                        const originalCallback = aspectWidget.callback;
                        aspectWidget.callback = (value) => {
                            const model = modelWidget?.value || "Qwen-image";
                            aspectRatioCore.updateRatioOptions(this, model, value);
                            
                            // 调用原始回调
                            if (originalCallback) {
                                originalCallback.call(this, value);
                            }
                        };
                    }
                    
                    // 具体比例变化时的回调（保留原始回调功能）
                    if (ratioWidget) {
                        const originalCallback = ratioWidget.callback;
                        ratioWidget.callback = (value) => {
                            // 调用原始回调
                            if (originalCallback) {
                                originalCallback.call(this, value);
                            }
                        };
                    }
                };
                
                // 初始化设置
                setTimeout(() => {
                    this.setupWidgetCallbacks();
                    
                    // 初始化比例选项
                    const modelWidget = this.widgets.find(w => w.name === "🤖 选择模型");
                    const aspectWidget = this.widgets.find(w => w.name === "📐 选择比例");
                    
                    if (modelWidget && aspectWidget) {
                        aspectRatioCore.updateRatioOptions(this, modelWidget.value, aspectWidget.value);
                    }
                }, 100);
                
                return result;
            };
        }
    }
});
