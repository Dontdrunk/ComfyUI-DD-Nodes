from .color_generator import NODE_CLASS_MAPPINGS as COLOR_NODES
from .dimension_calculator import NODE_CLASS_MAPPINGS as DIMENSION_NODES
from .image_to_video import NODE_CLASS_MAPPINGS as VIDEO_NODES
from .advanced_fusion import NODE_CLASS_MAPPINGS as FUSION_NODES  # 更新导入路径

NODE_CLASS_MAPPINGS = {
    **COLOR_NODES,
    **DIMENSION_NODES,
    **VIDEO_NODES,
    **FUSION_NODES
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-ColorBackgroundGenerator": "DD 颜色背景生成器",
    "DD-DimensionCalculator": "DD 尺寸计算器",
    "DD-ImageToVideo": "DD 图片转视频",
    "DD-AdvancedFusion": "DD 高级融合"
}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
