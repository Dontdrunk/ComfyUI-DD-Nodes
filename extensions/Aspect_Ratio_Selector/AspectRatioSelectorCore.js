// ComfyUI 比例选择器核心模块

export class AspectRatioSelectorCore {
    constructor() {
        // 模型分辨率配置 - 与Python端保持一致
        this.MODEL_RESOLUTIONS = {
            "Qwen-image": {
                "1:1": [1328, 1328],
                "16:9": [1664, 928],
                "9:16": [928, 1664],
                "4:3": [1472, 1140],
                "3:4": [1140, 1472],
                "3:2": [1584, 1056],
                "2:3": [1056, 1584],
            },
            "Wan2.2": {
                "1:1": [960, 960],
                "4:3": [960, 720],
                "3:4": [720, 960],
                "16:9": [832, 480],
                "9:16": [480, 832],
                "16:9_HD": [1280, 720],
                "9:16_HD": [720, 1280],
            }
        };
        
        // 比例类别映射
        this.ASPECT_CATEGORIES = {
            "横屏": ["16:9", "4:3", "16:9_HD"],
            "竖屏": ["9:16", "3:4", "9:16_HD"],
            "方形": ["1:1"]
        };
    }
    
    /**
     * 根据模型和比例类别获取可用的宽高比选项（包含分辨率信息）
     */
    getAvailableRatiosWithResolution(model, aspectCategory) {
        if (!this.MODEL_RESOLUTIONS[model]) {
            return ["1:1 (1280×1280)"];
        }
        
        const categoryRatios = this.ASPECT_CATEGORIES[aspectCategory] || ["1:1"];
        const modelResolutions = this.MODEL_RESOLUTIONS[model];
        
        // 返回包含分辨率信息的选项，过滤掉分割线和null值
        const ratiosWithRes = categoryRatios
            .filter(ratio => modelResolutions[ratio] && modelResolutions[ratio] !== null)
            .map(ratio => {
                const [width, height] = modelResolutions[ratio];
                return {
                    ratio: ratio,
                    width: width,
                    height: height
                };
            });
        
        // 按分辨率大小排序
        ratiosWithRes.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        
        return ratiosWithRes.map(item => {
            // 创建整齐对齐的格式
            const resolution = `${item.width}×${item.height}`;
            const displayRatio = item.ratio;
            
            // 使用固定宽度格式，确保对齐
            if (resolution.length < 9) {
                const padding = ' '.repeat(9 - resolution.length);
                return `${resolution}${padding} (${displayRatio})`;
            } else {
                return `${resolution} (${displayRatio})`;
            }
        });
    }
    
    /**
     * 从带分辨率的字符串中提取比例部分
     */
    extractRatioFromDisplayText(displayText) {
        // 从 "1280×720      (16:9)" 中提取 "16:9"
        const match = displayText.match(/\(([^)]+)\)$/);
        if (match) {
            return match[1].trim();
        }
        // 如果没有括号，可能是纯比例格式
        return displayText.trim();
    }
    
    /**
     * 根据模型和比例类别获取可用的宽高比选项
     */
    getAvailableRatios(model, aspectCategory) {
        if (!this.MODEL_RESOLUTIONS[model]) {
            return ["1:1"];
        }
        
        const categoryRatios = this.ASPECT_CATEGORIES[aspectCategory] || ["1:1"];
        const modelRatios = Object.keys(this.MODEL_RESOLUTIONS[model]);
        
        // 返回交集，过滤掉分割线
        return categoryRatios.filter(ratio => modelRatios.includes(ratio) && this.MODEL_RESOLUTIONS[model][ratio] !== null);
    }
    
    /**
     * 获取指定模型和比例的分辨率
     */
    getResolution(model, ratioOrDisplayText) {
        // 提取纯比例部分（处理 "16:9 (1664×928)" 格式）
        const ratio = this.extractRatioFromDisplayText(ratioOrDisplayText);
        
        if (this.MODEL_RESOLUTIONS[model] && this.MODEL_RESOLUTIONS[model][ratio]) {
            return this.MODEL_RESOLUTIONS[model][ratio];
        }
        return [1280, 720]; // 默认分辨率
    }
    
    /**
     * 更新节点的宽高比选择器选项
     */
    updateRatioOptions(node, model, aspectCategory) {
        const availableRatiosWithRes = this.getAvailableRatiosWithResolution(model, aspectCategory);
        
        // 找到宽高比选择器widget
        const ratioWidget = node.widgets.find(w => w.name === "📏 选择宽高");
        if (ratioWidget) {
            // 保存当前的纯比例值
            const currentRatio = this.extractRatioFromDisplayText(ratioWidget.value);
            
            // 更新选项为包含分辨率的格式
            ratioWidget.options.values = availableRatiosWithRes;
            
            // 尝试匹配当前比例到新的带分辨率格式
            const matchingOption = availableRatiosWithRes.find(option => 
                this.extractRatioFromDisplayText(option) === currentRatio
            );
            
            if (matchingOption) {
                ratioWidget.value = matchingOption;
            } else {
                ratioWidget.value = availableRatiosWithRes[0];
            }
            
            // 触发重绘
            if (node.onResize) {
                node.onResize();
            }
        }
    }
}
