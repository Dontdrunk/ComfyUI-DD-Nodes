import torch
import numpy as np
from PIL import Image

class DDImageSplitter:
    """
    DD 图像切分器
    支持按比例切分图像并选择输出指定部分
    """
    
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "图像": ("IMAGE",),
                "切分方向": (["左右", "上下"], {"default": "左右"}),
                "切分份数": ("INT", {"default": 2, "min": 2, "max": 10, "step": 1}),
                "输出位置": ("INT", {"default": 1, "min": 1, "max": 10, "step": 1}),
                "切分比例": ("STRING", {"default": "1:1", "multiline": False}),
            }
        }
    
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("图像",)
    FUNCTION = "split_image"
    CATEGORY = "🍺DD系列节点"
    
    def split_image(self, 图像, 切分方向, 切分份数, 输出位置, 切分比例):
        """
        切分图像并返回指定位置的部分
        """
        # 确保输出位置在有效范围内
        if 输出位置 > 切分份数:
            输出位置 = 切分份数
        
        # 转换tensor到PIL Image
        image_tensor = 图像[0] if len(图像.shape) == 4 else 图像
        image_np = (image_tensor.cpu().numpy() * 255).astype(np.uint8)
        image_pil = Image.fromarray(image_np)
        
        width, height = image_pil.size
        
        # 解析切分比例
        ratios = self.parse_ratios(切分比例, 切分份数)
        
        if 切分方向 == "左右":
            # 左右切分
            split_image = self.split_horizontal(image_pil, ratios, 输出位置)
        else:
            # 上下切分
            split_image = self.split_vertical(image_pil, ratios, 输出位置)
        
        # 转换回tensor
        result_np = np.array(split_image).astype(np.float32) / 255.0
        result_tensor = torch.from_numpy(result_np).unsqueeze(0)
        
        return (result_tensor,)
    
    def parse_ratios(self, 切分比例, 切分份数):
        """
        解析切分比例字符串
        """
        try:
            # 解析比例字符串，如 "1:1" 或 "2:1:3"
            parts = 切分比例.strip().split(':')
            if len(parts) == 切分份数:
                ratios = [float(p) for p in parts]
            elif len(parts) == 2 and 切分份数 == 2:
                ratios = [float(parts[0]), float(parts[1])]
            else:
                # 如果比例数量不匹配，使用均等比例
                ratios = [1.0] * 切分份数
        except:
            # 解析失败时使用均等比例
            ratios = [1.0] * 切分份数
        
        # 标准化比例
        total = sum(ratios)
        return [r / total for r in ratios]
    
    def split_horizontal(self, image, ratios, 输出位置):
        """
        水平切分（左右切分）
        """
        width, height = image.size
        
        # 计算每部分的宽度
        widths = [int(width * ratio) for ratio in ratios]
        
        # 调整最后一个宽度以确保总和等于原宽度
        widths[-1] = width - sum(widths[:-1])
        
        # 计算切分位置的起始x坐标
        start_x = sum(widths[:输出位置-1])
        end_x = start_x + widths[输出位置-1]
        
        # 裁剪图像
        cropped_image = image.crop((start_x, 0, end_x, height))
        
        return cropped_image
    
    def split_vertical(self, image, ratios, 输出位置):
        """
        垂直切分（上下切分）
        """
        width, height = image.size
        
        # 计算每部分的高度
        heights = [int(height * ratio) for ratio in ratios]
        
        # 调整最后一个高度以确保总和等于原高度
        heights[-1] = height - sum(heights[:-1])
        
        # 计算切分位置的起始y坐标
        start_y = sum(heights[:输出位置-1])
        end_y = start_y + heights[输出位置-1]
        
        # 裁剪图像
        cropped_image = image.crop((0, start_y, width, end_y))
        
        return cropped_image


# 节点类映射
NODE_CLASS_MAPPINGS = {
    "DD-ImageSplitter": DDImageSplitter
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-ImageSplitter": "DD Image Splitter"
}
