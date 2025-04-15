from .node.color_generator import NODE_CLASS_MAPPINGS as COLOR_NODES
from .node.dimension_calculator import NODE_CLASS_MAPPINGS as DIMENSION_NODES
from .node.image_to_video import NODE_CLASS_MAPPINGS as VIDEO_NODES
from .node.advanced_fusion import NODE_CLASS_MAPPINGS as FUSION_NODES
from .node.simple_latent import NODE_CLASS_MAPPINGS as LATENT_NODES
from .node.model_optimizer import NODE_CLASS_MAPPINGS as OPTIMIZER_NODES
from .node.sampling_optimizer import NODE_CLASS_MAPPINGS as SAMPLING_NODES
from .node.image_resize import NODE_CLASS_MAPPINGS as RESIZE_NODES

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
    **RESIZE_NODES,
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
    "DD-ImageUniformSize": "DD 图像统一尺寸"
}

# 导出模块
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
