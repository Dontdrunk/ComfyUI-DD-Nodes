import torch
import comfy.model_management
import nodes
import re

class DDEmptyWan21LatentVideo:
    """为Wan2.1模型创建空Latent视频，支持推荐分辨率"""
    
    @classmethod
    def INPUT_TYPES(cls):
        # Wan2.1支持的推荐分辨率列表，使用Unicode符号增强视觉效果
        wan_resolutions = [
            "🖥️ 横屏 832×480  (26:15)",
            "🖥️ 横屏 1088×832 (4:3)",
            "🖥️ 横屏 1280×720 (16:9)",
            "📱 竖屏 480×832  (15:26)",
            "📱 竖屏 832×1088 (3:4)",
            "📱 竖屏 720×1280 (9:16)",
            "⬛ 方屏 624×624  (1:1)",
            "⬛ 方屏 960×960  (1:1)",
            "⬛ 方屏 1280×1280 (1:1)"
        ]
        
        return {
            "required": {
                "使用推荐分辨率": ("BOOLEAN", {"default": True}),
                "推荐分辨率": (wan_resolutions, {"default": "🖥️ 横屏 832×480  (26:15)"}),
                "宽度": ("INT", {"default": 832, "min": 16, "max": nodes.MAX_RESOLUTION, "step": 16}),
                "高度": ("INT", {"default": 480, "min": 16, "max": nodes.MAX_RESOLUTION, "step": 16}),
                "帧数": ("INT", {"default": 81, "min": 1, "max": nodes.MAX_RESOLUTION, "step": 4}),
                "批次大小": ("INT", {"default": 1, "min": 1, "max": 4096}),
            }
        }
    
    RETURN_TYPES = ("LATENT",)
    RETURN_NAMES = ("潜空间",)
    FUNCTION = "generate_latent"
    CATEGORY = "🍺DD系列节点"

    def generate_latent(self, 使用推荐分辨率, 推荐分辨率, 宽度, 高度, 帧数, 批次大小=1):
        """生成Wan2.1空Latent视频 - 移除了标准化处理，效果更好"""
        try:
            # 如果使用推荐分辨率，则解析推荐的宽高
            if 使用推荐分辨率:
                # 使用正则表达式提取分辨率，适应新格式
                resolution_match = re.search(r'(\d+)×(\d+)', 推荐分辨率)
                if resolution_match:
                    宽度 = int(resolution_match.group(1))
                    高度 = int(resolution_match.group(2))
            
            # 确保宽高是8的倍数
            宽度 = (宽度 // 8) * 8
            高度 = (高度 // 8) * 8
            
            # 计算正确的时间维度
            time_dim = ((帧数 - 1) // 4) + 1
            
            # 创建空的latent - 直接生成零张量，不应用标准化处理（与官方EmptyHunyuanLatentVideo一致）
            latent = torch.zeros(
                [批次大小, 16, time_dim, 高度 // 8, 宽度 // 8], 
                device=comfy.model_management.intermediate_device()
            )
            
            return ({"samples": latent},)
        
        except Exception as e:
            print(f"[DD空Latent视频(Wan2.1)] 错误: {str(e)}")
            # 在出错的情况下仍然返回一个基本的latent
            basic_latent = torch.zeros(
                [批次大小, 16, ((帧数 - 1) // 4) + 1, 高度 // 8, 宽度 // 8], 
                device=comfy.model_management.intermediate_device()
            )
            return ({"samples": basic_latent},)

# 节点注册
NODE_CLASS_MAPPINGS = {
    "DDEmptyWan21LatentVideo": DDEmptyWan21LatentVideo,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DDEmptyWan21LatentVideo": "DD空Latent视频(Wan2.1)",
}
