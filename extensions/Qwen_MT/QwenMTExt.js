// ComfyUI Qwen-MT Extension - 扩展入口点
import { app } from "/scripts/app.js";
import { QwenMTConfigManager } from "./QwenMTCore.js";

app.registerExtension({
    name: "ComfyUI.QwenMT",
    
    async setup() {
        // 初始化Qwen-MT配置管理器
        const configManager = new QwenMTConfigManager();
        
        // 注册到全局，以便其他组件使用
        window.QwenMTConfigManager = configManager;
    },
    
    async beforeRegisterNodeDef(nodeType, nodeData) {
        // 为DD-QwenMTTranslator节点添加配置功能
        if (nodeData.name === "DD-QwenMTTranslator") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function () {
                const result = onNodeCreated?.apply(this, arguments);
                
                // 添加API配置按钮
                this.addWidget("button", "⚙️ API配置", null, () => {
                    if (window.QwenMTConfigManager) {
                        window.QwenMTConfigManager.showConfigDialog();
                    }
                });
                
                return result;
            };
        }
    }
});
