class DimensionCalculator:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "宽度": ("INT", {"default": 512, "min": 1, "max": 8192}),
                "高度": ("INT", {"default": 512, "min": 1, "max": 8192}),
            }
        }

    RETURN_TYPES = ("INT", "INT", "INT")
    RETURN_NAMES = ("宽度", "高度", "总像素")
    FUNCTION = "calculate_dimensions"
    CATEGORY = "🍺DD系列节点"

    def calculate_dimensions(self, 宽度, 高度):
        pixels = 宽度 * 高度
        return (宽度, 高度, pixels)

NODE_CLASS_MAPPINGS = {
    "DD-DimensionCalculator": DimensionCalculator
}

# 节点显示名称映射 - 使用英文（中文通过locales提供）
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-DimensionCalculator": "DD Dimension Calculator"
}
