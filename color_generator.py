import torch
import numpy as np
from enum import Enum

class ColorMode(Enum):
    HSLA = "HSLA颜色"  # 色相-饱和度-亮度-透明度
    HSVA = "HSVA颜色"  # 色相-饱和度-明度-透明度
    CMYK = "CMYK颜色"  # 青-品红-黄-黑

class ColorBackgroundGenerator:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
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

    def generate_background(self, 宽度, 高度, 颜色模式,
                          透明度, HSLA色相, HSLA饱和度, HSLA亮度,
                          HSVA色相, HSVA饱和度, HSVA明度,
                          CMYK青色, CMYK品红, CMYK黄色, CMYK黑色,
                          使用取色器, 颜色选择器):
        
        if 使用取色器:
            # 修改：使用hex_to_rgba只获取RGB值，透明度使用透明度参数
            r, g, b = self.hex_to_rgba(颜色选择器)
            a = 透明度  # 使用透明度参数
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

        color = np.array([r, g, b, int(a * 255)]) / 255.0
        image = np.ones((高度, 宽度, 4)) * color
        image = torch.from_numpy(image).unsqueeze(0).float()

        return (image, r, g, b, a)

NODE_CLASS_MAPPINGS = {
    "DD-ColorBackgroundGenerator": ColorBackgroundGenerator
}