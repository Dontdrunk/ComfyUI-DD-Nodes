import torch
import comfy.model_management
from comfy.latent_formats import Wan21
import nodes

class DDEmptyWan21LatentVideo:
    """为Wan2.1模型创建空Latent视频，支持预设分辨率和标准化处理"""
    
    @classmethod
    def INPUT_TYPES(cls):
        # Wan2.1支持的预设分辨率列表
        wan_resolutions = [
            "832×480 (横屏)",
            "480×832 (竖屏)",
            "714×544 (横屏)",
            "544×714 (竖屏)",
            "720×1280 (竖屏)",
            "1280×720 (横屏)",
            "624×624 (正方形)",
            "480×480 (正方形)",
            "720×720 (正方形)",
            "1280×1280 (正方形)"
        ]
        
        return {
            "required": {
                "使用预设分辨率": ("BOOLEAN", {"default": True}),
                "应用标准化": ("BOOLEAN", {"default": True}),
                "预设分辨率": (wan_resolutions, {"default": "832×480 (横屏)"}),
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

    def generate_latent(self, 使用预设分辨率, 应用标准化, 预设分辨率, 宽度, 高度, 帧数, 批次大小=1):
        """生成Wan2.1空Latent视频"""
        try:
            # 如果使用预设分辨率，则解析预设的宽高
            if 使用预设分辨率:
                # 从预设字符串中提取宽度和高度
                dimensions = 预设分辨率.split(" ")[0]
                # 处理可能的不同分隔符
                if "×" in dimensions:
                    宽度, 高度 = map(int, dimensions.split("×"))
                elif "X" in dimensions:
                    宽度, 高度 = map(int, dimensions.split("X"))
                elif "x" in dimensions:
                    宽度, 高度 = map(int, dimensions.split("x"))
            
            # 确保宽高是8的倍数
            宽度 = (宽度 // 8) * 8
            高度 = (高度 // 8) * 8
            
            # 计算正确的时间维度
            time_dim = ((帧数 - 1) // 4) + 1
            
            # 创建空的latent
            latent = torch.zeros(
                [批次大小, 16, time_dim, 高度 // 8, 宽度 // 8], 
                device=comfy.model_management.intermediate_device()
            )
            
            # 如果需要归一化，应用Wan21格式的均值和标准差
            if 应用标准化:
                # 初始化Wan21格式以获取均值和标准差
                wan_format = Wan21()
                
                # 获取正确设备和dtype的均值和标准差
                latents_mean = wan_format.latents_mean.to(latent.device, latent.dtype)
                latents_std = wan_format.latents_std.to(latent.device, latent.dtype)
                
                # 应用归一化: (latent - mean) / std
                latent = (latent - latents_mean) * wan_format.scale_factor / latents_std
            
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
