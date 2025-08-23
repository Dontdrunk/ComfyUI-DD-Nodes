// ComfyUI Prompt Manager Extension - 扩展入口点
import { app } from "/scripts/app.js";
import { PromptManager, PromptEmbedder } from "./PromptManagerCore.js";

const CLIP_TEXT_ENCODERS = [
    "CLIPTextEncode",
    "CLIPTextEncodeSDXL",
    "CLIPTextEncodeSDXLRefiner",
    "BNK_CLIPTextEncodeAdvanced",
    "AdvancedCLIPTextEncode",
    "CLIPTextEncodeFlux",
    "easy negative",
    "easy positive",
    "Easy Use",
    "Easy Negative",
    "Easy Positive",
    "CLIPTextEncodeFlux(Advanced)",
    "CLIP Text Encode (Prompt)",
    "WanVideoTextEncode",
    "fast fluxInput",
    "fast sdInput",
    "fast hiDreamInput",
    "fast videoInput",
    "easy cascadeLoader",
    "easy fullLoader",
    "easy a1111Loader",
    "easy comfyLoader",
    "easy svdLoader",
    "easy pixArtLoader",
    "easy kolorsLoader",
    "easy hunyuanDiTLoader",
    "easy fluxLoader",
    "easy mochiLoader",
    "easy promptAwait",
    "TextEncodeQwenImageEdit"
];

// 全局提示词管理器
const promptManager = new PromptManager();

function addPromptEmbedderButton(node) {
    // 创建按钮widget
    const embedButton = node.addWidget("button", "嵌入提示词", null, () => {
        const embedder = new PromptEmbedder(node, promptManager);
        embedder.show();
    });
    
    // 设置按钮属性
    embedButton.serialize = false;
    embedButton.options = { hideOnZoom: false };
    
    // 自定义按钮绘制
    const originalComputeSize = embedButton.computeSize;
    embedButton.computeSize = function(width) {
        return [width, 35];
    };

    // 设置按钮点击区域
    embedButton.mouse = function(event, pos, node) {
        if (event.type === "pointerdown") {
            const embedder = new PromptEmbedder(node, promptManager);
            embedder.show();
            return true;
        }
        return false;
    };

    return embedButton;
}

// 注册扩展
app.registerExtension({
    name: "ComfyUI.PromptManager",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // 检查是否是CLIP文本编码器节点
        if (CLIP_TEXT_ENCODERS.includes(nodeData.name)) {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function() {
                const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                addPromptEmbedderButton(this);
                return result;
            };
        }
    }
});
