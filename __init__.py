from .node.color_generator import NODE_CLASS_MAPPINGS as COLOR_NODES
from .node.dimension_calculator import NODE_CLASS_MAPPINGS as DIMENSION_NODES
from .node.image_to_video import NODE_CLASS_MAPPINGS as VIDEO_NODES
from .node.advanced_fusion import NODE_CLASS_MAPPINGS as FUSION_NODES
from .node.simple_latent import NODE_CLASS_MAPPINGS as LATENT_NODES
from .node.model_optimizer import NODE_CLASS_MAPPINGS as OPTIMIZER_NODES
from .node.sampling_optimizer import NODE_CLASS_MAPPINGS as SAMPLING_NODES
from .node.image_resize import NODE_CLASS_MAPPINGS as RESIZE_NODES
from .node.mask_resize import NODE_CLASS_MAPPINGS as MASK_RESIZE_NODES
from .node.image_size_limiter import NODE_CLASS_MAPPINGS as SIZE_LIMITER_NODES
from .node.model_switcher import NODE_CLASS_MAPPINGS as MODEL_SWITCHER_NODES
from .node.condition_switcher import NODE_CLASS_MAPPINGS as CONDITION_SWITCHER_NODES
from .node.latent_switcher import NODE_CLASS_MAPPINGS as LATENT_SWITCHER_NODES

import os
import folder_paths

# 节点类映射
NODE_CLASS_MAPPINGS = {
    **COLOR_NODES,
    **DIMENSION_NODES,
    **VIDEO_NODES,
    **FUSION_NODES,
    **LATENT_NODES,
    **OPTIMIZER_NODES,
    **SAMPLING_NODES,
    **RESIZE_NODES,
    **MASK_RESIZE_NODES,
    **SIZE_LIMITER_NODES,
    **MODEL_SWITCHER_NODES,
    **CONDITION_SWITCHER_NODES,
    **LATENT_SWITCHER_NODES,
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
    "DD-ImageUniformSize": "DD 图像统一尺寸",
    "DD-MaskUniformSize": "DD 遮罩统一尺寸",
    "DD-ImageSizeLimiter": "DD 限制图像大小",
    "DD-ModelSwitcher": "DD 模型切换",
    "DD-ConditionSwitcher": "DD 条件切换",
    "DD-LatentSwitcher": "DD 潜空间切换",
}

# Web扩展目录
WEB_DIRECTORY = os.path.join(os.path.dirname(os.path.realpath(__file__)), "js")

# 注册Node对齐工具的前端扩展
def register_align_web_extensions():
    """注册节点对齐工具的前端扩展"""
    js_path = os.path.join(WEB_DIRECTORY, "align")
    if os.path.exists(js_path):
        return [
            {
                "name": "DD-Nodes-Align", 
                "display_name": "🍺DD-节点对齐工具",
                "author": "Dontdrunk",
                "js": os.path.join("js", "align", "index.js"),
                "description": "节点对齐、调整大小和颜色设置工具，支持Alt+A快捷键呼出"
            }
        ]
    return []

# 导出模块
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']

# 前端扩展注册
WEB_EXTENSIONS = register_align_web_extensions()
