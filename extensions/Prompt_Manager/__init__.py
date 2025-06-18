# ComfyUI Prompt Manager Extension
# This extension adds prompt embedding functionality to CLIP text encoder nodes

# 导入API处理程序
from .api.prompt_api import prompt_api

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

WEB_DIRECTORY = "./web"

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']
