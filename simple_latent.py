import torch

class DDSimpleLatent:
    """
    极简 Latent 生成器
    生成指定尺寸的空 Latent
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "宽度": ("INT", {
                    "default": 512,
                    "min": 64,
                    "max": 8192,
                    "step": 8,
                    "display": "number"
                }),
                "高度": ("INT", {
                    "default": 512,
                    "min": 64,
                    "max": 8192,
                    "step": 8,
                    "display": "number"
                }),
            }
        }

    RETURN_TYPES = ("LATENT",)
    RETURN_NAMES = ("潜空间",)
    FUNCTION = "generate"
    CATEGORY = "🍺DD系列节点"

    def generate(self, 宽度, 高度):
        # 确保尺寸是 8 的倍数
        width = (宽度 // 8) * 8
        height = (高度 // 8) * 8
        
        # 创建一个填充零的 Latent
        latent = torch.zeros([1, 4, height // 8, width // 8])
        
        return ({"samples": latent}, )

# 节点映射
NODE_CLASS_MAPPINGS = {
    "DD-SimpleLatent": DDSimpleLatent
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-SimpleLatent": "DD 极简Latent"
}
