class DDAspectRatioSelector:
    """
    DD 比例选择器 - 根据不同模型和比例提供推荐分辨率
    支持Qwen-image和Wan2.2模型的推荐分辨率，也支持自定义分辨率
    """
    
    # 不同模型的推荐分辨率
    MODEL_RESOLUTIONS = {
        "Qwen-image": {
            "1:1": (1328, 1328),
            "16:9": (1664, 928),
            "9:16": (928, 1664),
            "4:3": (1472, 1140),
            "3:4": (1140, 1472),
            "3:2": (1584, 1056),
            "2:3": (1056, 1584),
        },
        "Wan2.2": {
            "1:1": (960, 960),
            "4:3": (960, 720),
            "3:4": (720, 960),
            "16:9": (832, 480),
            "9:16": (480, 832),
            "16:9_HD": (1280, 720),
            "9:16_HD": (720, 1280),
        }
    }
    
    # 比例类别映射
    ASPECT_CATEGORIES = {
        "横屏": ["16:9", "4:3", "16:9_HD"],
        "竖屏": ["9:16", "3:4", "9:16_HD"],
        "方形": ["1:1"]
    }
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "🤖 选择模型": (list(cls.MODEL_RESOLUTIONS.keys()), {"default": "Qwen-image"}),
                "📐 选择比例": (["横屏", "竖屏", "方形"], {"default": "横屏"}),
                "📏 选择宽高": (["16:9", "4:3", "3:2"], {"default": "16:9"}),  # 会被前端动态更新
            }
        }
    
    RETURN_TYPES = ("INT", "INT")
    RETURN_NAMES = ("宽度", "高度")
    FUNCTION = "get_resolution"
    CATEGORY = "🍺DD系列节点"
    
    def get_resolution(self, **kwargs):
        """
        根据选择的模型、比例和设置返回对应的分辨率
        """
        # 获取带图标的参数
        选择模型 = kwargs.get("🤖 选择模型", "Qwen-image")
        选择比例 = kwargs.get("📐 选择比例", "横屏") 
        选择宽高 = kwargs.get("📏 选择宽高", "16:9")
        
        # 从前端传来的可能是 "1280×720 (16:9)" 格式，需要提取比例部分
        actual_ratio = 选择宽高
        if " (" in 选择宽高:
            # 从 "1280×720 (16:9)" 中提取 "16:9"
            ratio_part = 选择宽高.split(" (")[1].rstrip(")")
            actual_ratio = ratio_part
        elif "×" in 选择宽高:
            # 如果只是分辨率格式，尝试从分辨率反推比例
            try:
                width_str, height_str = 选择宽高.split("×")
                width, height = int(width_str), int(height_str)
                # 直接返回解析出的分辨率
                return (width, height)
            except:
                actual_ratio = "16:9"  # 默认比例
        
        # 使用预设分辨率
        if 选择模型 in self.MODEL_RESOLUTIONS and actual_ratio in self.MODEL_RESOLUTIONS[选择模型]:
            width, height = self.MODEL_RESOLUTIONS[选择模型][actual_ratio]
            return (width, height)
        
        # 默认返回第一个可用分辨率
        first_model = list(self.MODEL_RESOLUTIONS.keys())[0]
        first_ratio = list(self.MODEL_RESOLUTIONS[first_model].keys())[0]
        width, height = self.MODEL_RESOLUTIONS[first_model][first_ratio]
        return (width, height)
    
    @classmethod
    def VALIDATE_INPUTS(cls, **kwargs):
        """验证输入参数"""
        return True


NODE_CLASS_MAPPINGS = {
    "DD-AspectRatioSelector": DDAspectRatioSelector
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-AspectRatioSelector": "DD Aspect Ratio Selector"
}
