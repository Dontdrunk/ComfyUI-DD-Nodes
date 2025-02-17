from .color_generator import NODE_CLASS_MAPPINGS as COLOR_NODES
from .dimension_calculator import NODE_CLASS_MAPPINGS as DIMENSION_NODES

NODE_CLASS_MAPPINGS = {
    **COLOR_NODES,
    **DIMENSION_NODES
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-ColorBackgroundGenerator": "DD 颜色背景生成器",
    "DD-DimensionCalculator": "DD 尺寸计算器"
}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
