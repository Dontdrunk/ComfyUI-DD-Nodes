from .node.dimension_calculator import NODE_CLASS_MAPPINGS as DIMENSION_NODES
from .node.image_to_video import NODE_CLASS_MAPPINGS as VIDEO_NODES
from .node.video_frame_extractor import NODE_CLASS_MAPPINGS as VIDEO_FRAME_EXTRACTOR_NODES
from .node.advanced_fusion import NODE_CLASS_MAPPINGS as FUSION_NODES
from .node.simple_latent import NODE_CLASS_MAPPINGS as LATENT_NODES
from .node.model_optimizer import NODE_CLASS_MAPPINGS as OPTIMIZER_NODES
from .node.image_resize import NODE_CLASS_MAPPINGS as RESIZE_NODES
from .node.mask_resize import NODE_CLASS_MAPPINGS as MASK_RESIZE_NODES
from .node.image_size_limiter import NODE_CLASS_MAPPINGS as SIZE_LIMITER_NODES
from .node.model_switcher import NODE_CLASS_MAPPINGS as MODEL_SWITCHER_NODES
from .node.condition_switcher import NODE_CLASS_MAPPINGS as CONDITION_SWITCHER_NODES
from .node.latent_switcher import NODE_CLASS_MAPPINGS as LATENT_SWITCHER_NODES
from .node.image_stroke import NODE_CLASS_MAPPINGS as IMAGE_STROKE_NODES

# 导入Qwen-MT翻译节点
from .extensions.Qwen_MT.nodes import NODE_CLASS_MAPPINGS as QWEN_MT_NODES

# 导入比例选择器节点
from .extensions.Aspect_Ratio_Selector.nodes import NODE_CLASS_MAPPINGS as ASPECT_RATIO_NODES

# 导入扩展功能API
from .extensions.Prompt_Manager.prompt_api import prompt_manager_api
from .extensions.Qwen_MT import api_routes

# 节点类映射
NODE_CLASS_MAPPINGS = {
    **DIMENSION_NODES,
    **VIDEO_NODES,
    **VIDEO_FRAME_EXTRACTOR_NODES,
    **FUSION_NODES,
    **LATENT_NODES,
    **OPTIMIZER_NODES,
    **RESIZE_NODES,
    **MASK_RESIZE_NODES,
    **SIZE_LIMITER_NODES,
    **MODEL_SWITCHER_NODES,
    **CONDITION_SWITCHER_NODES,
    **LATENT_SWITCHER_NODES,
    **IMAGE_STROKE_NODES,
    **QWEN_MT_NODES,
    **ASPECT_RATIO_NODES,
}

# 节点显示名称映射（使用英文作为默认，中文通过locales提供）
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-DimensionCalculator": "DD Dimension Calculator",
    "DD-ImageToVideo": "DD Image To Video",
    "DD-VideoFrameExtractor": "DD Video Frame Extractor",
    "DD-AdvancedFusion": "DD Advanced Fusion",
    "DD-SimpleLatent": "DD Simple Latent",
    "DD-ModelOptimizer": "DD Model Optimizer",
    "DD-ImageUniformSize": "DD Image Uniform Size",
    "DD-MaskUniformSize": "DD Mask Uniform Size",
    "DD-ImageSizeLimiter": "DD Image Size Limiter",
    "DD-ModelSwitcher": "DD Model Switcher",
    "DD-ConditionSwitcher": "DD Condition Switcher",
    "DD-LatentSwitcher": "DD Latent Switcher",
    "DD-ImageStroke": "DD Image Stroke",
    "DD-QwenMTTranslator": "DD Qwen-MT",
    "DD-AspectRatioSelector": "DD Aspect Ratio Selector",
}

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'prompt_manager_api']

WEB_DIRECTORY =  "extensions"