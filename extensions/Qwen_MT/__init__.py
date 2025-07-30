"""
ComfyUI-Qwen-MT Plugin
A ComfyUI custom node plugin for machine translation using Alibaba Cloud's Qwen-MT model.
"""

import logging

# 配置日志级别，减少控制台输出，保持简洁
logging.getLogger("openai").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING) 
logging.getLogger("httpcore").setLevel(logging.WARNING)

from .nodes import QwenMTTranslatorNode

# Import API routes to register them
try:
    from . import api_routes
except ImportError:
    # API routes are optional, may not be available in all environments
    pass

# Node class mappings for ComfyUI registration
NODE_CLASS_MAPPINGS = {
    "DD-QwenMTTranslator": QwenMTTranslatorNode
}

# Display name mappings for different languages
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-QwenMTTranslator": "DD Qwen-MT翻译"
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
