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
    CATEGORY = "DONTDRUNK"

    def calculate_dimensions(self, 宽度, 高度):
        pixels = 宽度 * 高度
        return (宽度, 高度, pixels)

NODE_CLASS_MAPPINGS = {
    "DD-DimensionCalculator": DimensionCalculator
}