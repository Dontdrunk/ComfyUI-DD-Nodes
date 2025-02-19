import torch
import numpy as np
from enum import Enum

class ColorMode(Enum):
    HSLA = "HSLA颜色"  # 色相-饱和度-亮度-透明度
    HSVA = "HSVA颜色"  # 色相-饱和度-明度-透明度
    CMYK = "CMYK颜色"  # 青-品红-黄-黑

class ColorBackgroundGenerator:
    """Current Date and Time (UTC): 2025-02-19 13:59:10
    Current User's Login: 1761696257"""

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "图层设置": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 1.0}),
                "宽度": ("INT", {"default": 512, "min": 64, "max": 8192}),
                "高度": ("INT", {"default": 512, "min": 64, "max": 8192}),
                "颜色模式": (list(mode.value for mode in ColorMode), {"default": "HSLA颜色"}),
                # 通用透明度
                "透明度": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 1.0, "step": 0.1}),
                # HSLA inputs
                "HSLA色相": ("INT", {"default": 0, "min": 0, "max": 360}),
                "HSLA饱和度": ("FLOAT", {"default": 0.5, "min": 0.0, "max": 1.0, "step": 0.1}),
                "HSLA亮度": ("FLOAT", {"default": 0.5, "min": 0.0, "max": 1.0, "step": 0.1}),
                # HSVA inputs
                "HSVA色相": ("INT", {"default": 0, "min": 0, "max": 360}),
                "HSVA饱和度": ("FLOAT", {"default": 0.5, "min": 0.0, "max": 1.0, "step": 0.1}),
                "HSVA明度": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 1.0, "step": 0.1}),
                # CMYK inputs
                "CMYK青色": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 0.1}),
                "CMYK品红": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 0.1}),
                "CMYK黄色": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 0.1}),
                "CMYK黑色": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 0.1}),
                # 颜色选择器控制
                "使用取色器": ("BOOLEAN", {"default": False}),
                "颜色选择器": ("COLOR", {"default": "#FFFFFF"}),
            },
            "optional": {
                # 图片输入
                "输入图片": ("IMAGE",),
                "遮罩": ("MASK",),
            }
        }

    RETURN_TYPES = ("IMAGE", "INT", "INT", "INT", "FLOAT")
    RETURN_NAMES = ("图像", "红", "绿", "蓝", "透明度")
    FUNCTION = "generate_background"
    CATEGORY = "DONTDRUNK"

    def hex_to_rgba(self, hex_color):
        """将十六进制颜色转换为RGBA，忽略原始透明度"""
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 8:
            r, g, b, _ = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4, 6))
            return r, g, b
        else:
            r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            return r, g, b

    def hsla_to_rgba(self, h, s, l, a=1.0):
        h = h/360
        def hue_to_rgb(p, q, t):
            if t < 0: t += 1
            if t > 1: t -= 1
            if t < 1/6: return p + (q - p) * 6 * t
            if t < 1/2: return q
            if t < 2/3: return p + (q - p) * (2/3 - t) * 6
            return p

        if s == 0:
            r = g = b = l
        else:
            q = l * (1 + s) if l < 0.5 else l + s - l * s
            p = 2 * l - q
            r = hue_to_rgb(p, q, h + 1/3)
            g = hue_to_rgb(p, q, h)
            b = hue_to_rgb(p, q, h - 1/3)

        return int(r * 255), int(g * 255), int(b * 255), a

    def hsva_to_rgba(self, h, s, v, a=1.0):
        h = h/360
        i = int(h*6)
        f = h*6 - i
        p = v * (1-s)
        q = v * (1-f*s)
        t = v * (1-(1-f)*s)

        if i % 6 == 0:
            r, g, b = v, t, p
        elif i % 6 == 1:
            r, g, b = q, v, p
        elif i % 6 == 2:
            r, g, b = p, v, t
        elif i % 6 == 3:
            r, g, b = p, q, v
        elif i % 6 == 4:
            r, g, b = t, p, v
        else:
            r, g, b = v, p, q

        return int(r * 255), int(g * 255), int(b * 255), a

    def cmyk_to_rgba(self, c, m, y, k, a=1.0):
        r = int(255 * (1-c) * (1-k))
        g = int(255 * (1-m) * (1-k))
        b = int(255 * (1-y) * (1-k))
        return r, g, b, a

    def ensure_rgba(self, image):
        """确保图像为RGBA格式"""
        if image.shape[-1] == 3:  # RGB格式
            # 添加alpha通道（完全不透明）
            alpha = torch.ones((*image.shape[:-1], 1), device=image.device)
            return torch.cat([image, alpha], dim=-1)
        return image

    def adjust_mask_size(self, mask, height, width):
        """调整遮罩大小的辅助函数"""
        if mask.shape[-2:] != (height, width):  # 使用最后两个维度比较尺寸
            # ComfyUI中的MASK通常是2D或3D的，需要正确处理维度
            if len(mask.shape) == 2:
                mask = mask.unsqueeze(0).unsqueeze(0)  # (H,W) -> (1,1,H,W)
            elif len(mask.shape) == 3:
                mask = mask.unsqueeze(1)  # (B,H,W) -> (B,1,H,W)

            # 调整大小
            mask = torch.nn.functional.interpolate(
                mask,
                size=(height, width),
                mode='nearest'
            )

            # 恢复原始维度
            if len(mask.shape) == 4:
                mask = mask.squeeze(0).squeeze(0)  # (1,1,H,W) -> (H,W)
        return mask

    def get_output_size(self, 宽度, 高度, 输入图片=None):
        """确定输出尺寸"""
        output_height, output_width = 高度, 宽度
        
        # 如果有输入图片，使用输入图片的尺寸
        if 输入图片 is not None:
            if len(输入图片.shape) == 4:  # BCHW或BHWC格式
                if 输入图片.shape[1] == 3 or 输入图片.shape[1] == 4:  # BCHW格式
                    output_height = 输入图片.shape[2]
                    output_width = 输入图片.shape[3]
                else:  # BHWC格式
                    output_height = 输入图片.shape[1]
                    output_width = 输入图片.shape[2]
                
        return output_height, output_width

    def generate_background(self, 图层设置, 宽度, 高度, 颜色模式,
                          透明度, HSLA色相, HSLA饱和度, HSLA亮度,
                          HSVA色相, HSVA饱和度, HSVA明度,
                          CMYK青色, CMYK品红, CMYK黄色, CMYK黑色,
                          使用取色器, 颜色选择器,
                          输入图片=None, 遮罩=None):
        
        # 确定输出尺寸
        output_height, output_width = self.get_output_size(宽度, 高度, 输入图片)
        
        # 生成颜色值
        if 使用取色器:
            r, g, b = self.hex_to_rgba(颜色选择器)
            a = 透明度
        else:
            if 颜色模式 == "HSLA颜色":
                r, g, b, a = self.hsla_to_rgba(HSLA色相, HSLA饱和度, HSLA亮度, 透明度)
            elif 颜色模式 == "HSVA颜色":
                r, g, b, a = self.hsva_to_rgba(HSVA色相, HSVA饱和度, HSVA明度, 透明度)
            elif 颜色模式 == "CMYK颜色":
                r, g, b, a = self.cmyk_to_rgba(CMYK青色, CMYK品红, CMYK黄色, CMYK黑色, 透明度)

        # 确保颜色值在有效范围内
        r = max(0, min(255, r))
        g = max(0, min(255, g))
        b = max(0, min(255, b))
        a = max(0.0, min(1.0, a))

        # 创建颜色图层 (BHWC格式)
        color = np.array([r, g, b, int(a * 255)]) / 255.0
        color_image = np.ones((1, output_height, output_width, 4)) * color
        color_image = torch.from_numpy(color_image).float()

        # 如果没有输入图片，直接返回颜色图层
        if 输入图片 is None:
            return (color_image, r, g, b, a)

        # 处理输入图片
        if 输入图片.shape[1] == 3 or 输入图片.shape[1] == 4:  # 如果是BCHW格式
            输入图片 = 输入图片.permute(0, 2, 3, 1)
        输入图片 = self.ensure_rgba(输入图片)

        # 调整输入图片大小
        if 输入图片.shape[1:3] != (output_height, output_width):
            输入图片 = torch.nn.functional.interpolate(
                输入图片.permute(0, 3, 1, 2),
                size=(output_height, output_width),
                mode='bilinear',
                align_corners=False
            ).permute(0, 2, 3, 1)

        # 处理遮罩
        if 遮罩 is not None:
            遮罩 = self.adjust_mask_size(遮罩, output_height, output_width)
            遮罩 = 遮罩.view(1, output_height, output_width, 1).expand(-1, -1, -1, 4)

            # 根据图层设置决定混合方式
            if 图层设置 == 0:  # 输入图片在底层
                # 遮罩区域显示颜色图层，非遮罩区域显示输入图片
                result = 输入图片 * (1 - 遮罩) + color_image * 遮罩
            else:  # 输入图片在顶层
                # 遮罩区域显示输入图片，非遮罩区域显示颜色图层
                result = color_image * (1 - 遮罩) + 输入图片 * 遮罩
        else:
            # 如果没有遮罩，根据图层设置决定叠加顺序
            if 图层设置 == 0:  # 输入图片在底层
                alpha = 输入图片[..., 3:4]
                result = color_image * alpha + 输入图片 * (1 - alpha)
            else:  # 输入图片在顶层
                alpha = color_image[..., 3:4]
                result = 输入图片 * alpha + color_image * (1 - alpha)

        return (result, r, g, b, a)

NODE_CLASS_MAPPINGS = {
    "DD-ColorBackgroundGenerator": ColorBackgroundGenerator
}
