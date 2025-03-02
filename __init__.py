from .color_generator import NODE_CLASS_MAPPINGS as COLOR_NODES
from .dimension_calculator import NODE_CLASS_MAPPINGS as DIMENSION_NODES
from .image_to_video import NODE_CLASS_MAPPINGS as VIDEO_NODES
from .advanced_fusion import NODE_CLASS_MAPPINGS as FUSION_NODES
from .simple_latent import NODE_CLASS_MAPPINGS as LATENT_NODES
from .model_optimizer import NODE_CLASS_MAPPINGS as OPTIMIZER_NODES
from .sampling_optimizer import NODE_CLASS_MAPPINGS as SAMPLING_NODES
from .wan_latent import NODE_CLASS_MAPPINGS as WAN_NODES

# 节点类映射
NODE_CLASS_MAPPINGS = {
    **COLOR_NODES,
    **DIMENSION_NODES,
    **VIDEO_NODES,
    **FUSION_NODES,
    **LATENT_NODES,
    **OPTIMIZER_NODES,
    **SAMPLING_NODES,
    **WAN_NODES,
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-ColorBackgroundGenerator": "DD 颜色背景生成器",
    "DD-DimensionCalculator": "DD 尺寸计算器",
    "DD-ImageToVideo": "DD 图片转视频",
    "DD-AdvancedFusion": "DD 高级融合",
    "DD-SimpleLatent": "DD 极简Latent",
    "DD-ModelOptimizer": "DD 模型优化加载",
    "DD-SamplingOptimizer": "DD 采样优化器",
    "DDEmptyWan21LatentVideo": "DD空Latent视频(Wan2.1)"
}

# 导出模块
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
