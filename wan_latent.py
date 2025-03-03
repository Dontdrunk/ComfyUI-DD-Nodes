import torch
import comfy.model_management
from comfy.latent_formats import Wan21
import nodes
import re

class DDEmptyWan21LatentVideo:
    """为Wan2.1模型创建空Latent视频，支持预设分辨率和标准化处理"""
    
    @classmethod
    def INPUT_TYPES(cls):
        # Wan2.1支持的预设分辨率列表
        wan_resolutions = [
            "832X480 （横屏26 : 15）",
            "544X416 （横屏4 : 3）",
            "640X360 （横屏16 : 9）",
            "1088X832 （横屏4 : 3）",
            "1280X720 （横屏16 : 9）",
            "480X832 （竖屏15 : 26）",
            "416X544 （竖屏3 : 4）",
            "360X640 （竖屏9 : 16）",
            "832X1088 （竖屏3 : 4）",
            "720X1280 （竖屏9 : 16）",
            "480X480 （方屏1 : 1）",
            "624X624 （方屏1 : 1）",
            "960X960 （方屏1 : 1）",
            "1280X1280 （方屏1 : 1）"
        ]
        
        return {
            "required": {
                "使用预设分辨率": ("BOOLEAN", {"default": True}),
                "应用标准化": ("BOOLEAN", {"default": True}),
                "预设分辨率": (wan_resolutions, {"default": "832X480 （横屏26 : 15）"}),
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
                # 使用正则表达式提取分辨率
                resolution_match = re.match(r'(\d+)X(\d+)', 预设分辨率)
                if resolution_match:
                    宽度 = int(resolution_match.group(1))
                    高度 = int(resolution_match.group(2))
            
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
