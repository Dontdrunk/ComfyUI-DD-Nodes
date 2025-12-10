import torch
import numpy as np
from PIL import Image, ImageOps, ImageFilter, ImageDraw
import cv2

class DDImageStroke:
    """
    DD 图片描边 - 为图片添加描边效果
    支持透明图和普通图片的边缘描边，可自定义颜色、大小、位置和透明度
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "图片": ("IMAGE",),
                "关闭遮罩": ("BOOLEAN", {"default": False}),
                "位置": (["外描边", "内描边", "居中描边"], {"default": "外描边"}),
                "大小": ("INT", {"default": 5, "min": 1, "max": 200, "step": 1}),
                "不透明度": ("INT", {"default": 100, "min": 1, "max": 100, "step": 1}),
                "描边颜色": ("COLOR", {"default": "#000000"}),
            },
            "optional": {
                "遮罩": ("MASK",),
            }
        }
    
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("描边图片",)
    FUNCTION = "add_stroke"
    CATEGORY = "🍺DD系列节点"
    
    def hex_to_rgb(self, hex_color):
        """将十六进制颜色转换为RGB"""
        try:
            hex_color = hex_color.lstrip('#')
            if len(hex_color) == 6:
                return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            elif len(hex_color) == 3:
                # 支持短格式的十六进制颜色，如 #FFF
                return tuple(int(hex_color[i], 16) * 17 for i in range(3))
            else:
                return (255, 255, 255)  # 格式错误时返回白色
        except:
            return (255, 255, 255)  # 解析失败时返回白色
    
    def int_to_rgb(self, color_int):
        """将整数颜色值转换为RGB"""
        try:
            # 确保颜色值在有效范围内
            color_int = max(0, min(0xFFFFFF, int(color_int)))
            
            # 提取RGB分量
            r = (color_int >> 16) & 0xFF
            g = (color_int >> 8) & 0xFF
            b = color_int & 0xFF
            
            return (r, g, b)
        except:
            return (255, 255, 255)  # 解析失败时返回白色
    
    def tensor_to_pil(self, tensor, mask=None):
        """将tensor转换为PIL图像，支持遮罩"""
        # tensor格式: [batch, height, width, channels]
        if len(tensor.shape) == 4:
            tensor = tensor[0]  # 取第一张图片
        
        # 转换为numpy数组并调整范围到0-255
        np_image = (tensor.cpu().numpy() * 255).astype(np.uint8)
        
        # 创建PIL图像
        if np_image.shape[2] == 3:  # RGB
            pil_image = Image.fromarray(np_image, 'RGB')
        elif np_image.shape[2] == 4:  # RGBA
            pil_image = Image.fromarray(np_image, 'RGBA')
        else:  # 灰度图
            pil_image = Image.fromarray(np_image[:, :, 0], 'L')
        
        # 判断图像类型以决定处理方式
        is_transparent_image = False
        
        # 如果提供了遮罩，将RGB转换为RGBA（这是透明图逻辑）
        if mask is not None:
            is_transparent_image = True
            if pil_image.mode == 'RGB':
                # 遮罩格式: [batch, height, width] 或 [height, width]
                if len(mask.shape) == 3:
                    mask = mask[0]  # 取第一个遮罩
                
                # 转换遮罩为numpy数组
                mask_np = (mask.cpu().numpy() * 255).astype(np.uint8)
                
                # 默认反转遮罩（遮罩接入时默认就是反转状态）
                mask_np = 255 - mask_np  # 反转遮罩
                
                # 创建RGBA图像
                pil_image = pil_image.convert('RGBA')
                
                # 应用遮罩作为alpha通道
                pil_image.putalpha(Image.fromarray(mask_np, 'L'))
        elif pil_image.mode == 'RGBA':
            # 原本就是RGBA图像（透明图）
            is_transparent_image = True
        else:
            # 普通RGB图片，保持RGB格式
            is_transparent_image = False
        
        return pil_image, is_transparent_image
    
    def pil_to_tensor(self, pil_image):
        """将PIL图像转换为tensor"""
        # 根据图像模式转换
        if pil_image.mode == 'RGB':
            # 普通图片保持RGB格式，添加alpha通道用于输出
            pil_image = pil_image.convert('RGBA')
        elif pil_image.mode != 'RGBA':
            pil_image = pil_image.convert('RGBA')
        
        # 转换为numpy数组
        np_image = np.array(pil_image).astype(np.float32) / 255.0
        
        # 转换为tensor格式: [1, height, width, channels]
        tensor = torch.from_numpy(np_image).unsqueeze(0)
        
        return tensor
    
    def create_stroke_mask_cv2(self, image, stroke_size, position):
        """使用OpenCV创建描边遮罩，性能更好"""
        height, width = image.size[1], image.size[0]
        
        # 获取alpha通道作为遮罩
        if image.mode == 'RGBA':
            alpha = np.array(image.split()[-1])
            has_transparency = True
        else:
            # 对于普通图片，创建一个全白的遮罩代表整个图像区域
            alpha = np.full((height, width), 255, dtype=np.uint8)
            has_transparency = False
        
        # 创建结构元素
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (stroke_size * 2 + 1, stroke_size * 2 + 1))
        
        if position == "外描边":
            if has_transparency:
                # 透明图：膨胀后减去原图（传统外描边）
                dilated = cv2.dilate(alpha, kernel, iterations=1)
                stroke_mask = cv2.subtract(dilated, alpha)
            else:
                # 普通图片：外描边没有意义，返回空遮罩
                stroke_mask = np.zeros((height, width), dtype=np.uint8)
            
        elif position == "内描边":
            if has_transparency:
                # 透明图：原图减去腐蚀后的结果（传统内描边）
                eroded = cv2.erode(alpha, kernel, iterations=1)
                stroke_mask = cv2.subtract(alpha, eroded)
            else:
                # 普通图片：从边缘向内创建描边区域
                # 创建边缘遮罩：整个图像减去内缩区域
                inner_mask = np.zeros((height, width), dtype=np.uint8)
                margin = stroke_size
                if margin * 2 < min(width, height):  # 确保有足够空间
                    inner_mask[margin:height-margin, margin:width-margin] = 255
                stroke_mask = cv2.subtract(alpha, inner_mask)
            
        else:  # 居中描边
            if has_transparency:
                # 透明图：膨胀后减去腐蚀后的结果（传统居中描边）
                half_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, 
                                                       (max(1, stroke_size) + 1, max(1, stroke_size) + 1))
                dilated = cv2.dilate(alpha, half_kernel, iterations=1)
                eroded = cv2.erode(alpha, half_kernel, iterations=1)
                stroke_mask = cv2.subtract(dilated, eroded)
            else:
                # 普通图片：在边缘位置创建描边
                # 创建两个不同大小的内缩区域，取差值
                outer_mask = np.zeros((height, width), dtype=np.uint8)
                inner_mask = np.zeros((height, width), dtype=np.uint8)
                
                outer_margin = max(1, stroke_size // 2)
                inner_margin = stroke_size
                
                if outer_margin * 2 < min(width, height):
                    outer_mask[outer_margin:height-outer_margin, outer_margin:width-outer_margin] = 255
                if inner_margin * 2 < min(width, height):
                    inner_mask[inner_margin:height-inner_margin, inner_margin:width-inner_margin] = 255
                
                stroke_mask = cv2.subtract(outer_mask, inner_mask)
        
        return Image.fromarray(stroke_mask, 'L')
    
    def create_stroke_for_normal_image(self, image, stroke_size, position, stroke_color):
        """为普通图片（非透明图）创建描边效果"""
        width, height = image.size
        
        # 创建一个新的RGBA图像用于绘制描边
        result = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        
        # 将原图粘贴到结果图像上
        if image.mode == 'RGB':
            # 将RGB图像转换为RGBA并设置为完全不透明
            rgba_image = image.convert('RGBA')
            result.paste(rgba_image, (0, 0))
        else:
            result.paste(image, (0, 0))
        
        # 根据描边位置创建描边
        draw = ImageDraw.Draw(result)
        
        if position == "外描边":
            # 普通图片的外描边：在图像边界外绘制（这里我们扩展画布）
            # 创建扩展的画布
            new_width = width + stroke_size * 2
            new_height = height + stroke_size * 2
            extended_result = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
            
            # 先绘制描边（整个扩展区域）
            extended_draw = ImageDraw.Draw(extended_result)
            extended_draw.rectangle([0, 0, new_width-1, new_height-1], fill=stroke_color)
            
            # 再粘贴原图到中心位置
            extended_result.paste(result, (stroke_size, stroke_size))
            
            return extended_result
            
        elif position == "内描边":
            # 普通图片的内描边：在图像内部边缘绘制描边
            # 绘制描边矩形框
            for i in range(stroke_size):
                draw.rectangle([i, i, width-1-i, height-1-i], outline=stroke_color, width=1)
            
        else:  # 居中描边
            # 普通图片的居中描边：一半在内，一半在外
            half_size = stroke_size // 2
            
            # 创建稍微扩展的画布
            new_width = width + half_size * 2
            new_height = height + half_size * 2
            extended_result = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
            
            # 先粘贴原图到中心
            extended_result.paste(result, (half_size, half_size))
            
            # 绘制描边
            extended_draw = ImageDraw.Draw(extended_result)
            for i in range(stroke_size):
                extended_draw.rectangle([i, i, new_width-1-i, new_height-1-i], outline=stroke_color, width=1)
            
            return extended_result
        
        return result
    
    def add_stroke(self, 图片, 关闭遮罩, 位置, 大小, 不透明度, 描边颜色, 遮罩=None):
        """
        为图片添加描边效果
        
        Args:
            图片: 输入图片tensor
            关闭遮罩: 是否关闭遮罩功能(True时忽略遮罩输入)
            位置: 描边位置("外描边", "内描边", "居中描边")
            大小: 描边大小(像素)
            不透明度: 描边不透明度(1-100)
            描边颜色: 描边颜色(COLOR类型，如"#FFFFFF")
            遮罩: 可选的遮罩tensor，用于定义透明区域
            
        Returns:
            描边后的图片tensor
        """
        try:
            # 批处理
            batch_size = 图片.shape[0]
            results = []
            
            for i in range(batch_size):
                # 获取对应的遮罩（如果有且未关闭遮罩功能）
                current_mask = None
                if not 关闭遮罩 and 遮罩 is not None:
                    if len(遮罩.shape) == 3 and 遮罩.shape[0] > i:
                        current_mask = 遮罩[i:i+1]
                    elif len(遮罩.shape) == 2:
                        current_mask = 遮罩.unsqueeze(0)
                    elif len(遮罩.shape) == 3 and 遮罩.shape[0] == 1:
                        current_mask = 遮罩
                
                # 转换为PIL图像，应用遮罩（默认反转）
                pil_image, is_transparent_image = self.tensor_to_pil(图片[i:i+1], current_mask)
                
                # 解析描边颜色（支持COLOR类型、整数和字符串格式）
                if isinstance(描边颜色, str):
                    # COLOR类型会传入字符串格式的十六进制颜色
                    stroke_rgb = self.hex_to_rgb(描边颜色)
                elif isinstance(描边颜色, (int, float)):
                    # 向后兼容整数格式
                    stroke_rgb = self.int_to_rgb(描边颜色)
                else:
                    # 默认使用白色
                    stroke_rgb = (255, 255, 255)
                
                # 创建描边颜色（包含透明度）
                # 将1-100的不透明度转换为0-255的alpha值
                alpha_value = int((不透明度 / 100.0) * 255)
                stroke_color = stroke_rgb + (alpha_value,)
                
                # 根据图像类型使用不同的描边逻辑
                if is_transparent_image:
                    # 透明图：使用传统的遮罩+合成方法
                    # 确保图像有alpha通道
                    if pil_image.mode != 'RGBA':
                        pil_image = pil_image.convert('RGBA')
                    
                    # 使用OpenCV创建描边遮罩（性能更好）
                    try:
                        stroke_mask = self.create_stroke_mask_cv2(pil_image, 大小, 位置)
                    except:
                        # 如果OpenCV方法失败，使用PIL方法作为后备
                        stroke_mask = self.create_stroke_mask_pil(pil_image, 大小, 位置)
                    
                    # 创建描边图层
                    stroke_layer = Image.new('RGBA', pil_image.size, (0, 0, 0, 0))
                    
                    # 创建纯色图层
                    color_layer = Image.new('RGBA', pil_image.size, stroke_color)
                    
                    # 应用描边遮罩
                    stroke_layer = Image.composite(color_layer, stroke_layer, stroke_mask)
                    
                    # 根据位置决定图层顺序
                    if 位置 == "外描边":
                        # 外描边在底层
                        result = Image.alpha_composite(stroke_layer, pil_image)
                    else:
                        # 内描边和居中描边在顶层
                        result = Image.alpha_composite(pil_image, stroke_layer)
                else:
                    # 普通图片：使用直接绘制方法
                    result = self.create_stroke_for_normal_image(pil_image, 大小, 位置, stroke_color)
                
                # 转换回tensor
                result_tensor = self.pil_to_tensor(result)
                results.append(result_tensor)
            
            # 合并批处理结果
            final_result = torch.cat(results, dim=0)
            
            return (final_result,)
            
        except Exception as e:
            print(f"DD图片描边节点错误: {str(e)}")
            # 出错时返回原图
            return (图片,)
    
    def create_stroke_mask_pil(self, image, stroke_size, position):
        """使用PIL创建描边遮罩（备用方法）"""
        width, height = image.size
        
        # 获取alpha通道作为遮罩
        if image.mode == 'RGBA':
            alpha = image.split()[-1]
            has_transparency = True
        else:
            # 对于普通图片，创建一个全白的遮罩代表整个图像区域
            alpha = Image.new('L', image.size, 255)
            has_transparency = False
        
        # 根据位置类型创建描边遮罩
        if position == "外描边":
            if has_transparency:
                # 透明图：扩展原图像边界
                dilated = alpha.filter(ImageFilter.MaxFilter(stroke_size * 2 + 1))
                stroke_mask = Image.new('L', image.size, 0)
                stroke_mask.paste(dilated, (0, 0))
                # 减去原图像区域
                stroke_mask = Image.composite(Image.new('L', image.size, 0), stroke_mask, alpha)
            else:
                # 普通图片：外描边没有意义，返回空遮罩
                stroke_mask = Image.new('L', image.size, 0)
            
        elif position == "内描边":
            if has_transparency:
                # 透明图：在原图像内部创建描边
                eroded = alpha.filter(ImageFilter.MinFilter(stroke_size * 2 + 1))
                stroke_mask = Image.composite(alpha, Image.new('L', image.size, 0), eroded)
            else:
                # 普通图片：从边缘向内创建描边区域
                # 创建边缘遮罩：整个图像减去内缩区域
                inner_mask = Image.new('L', image.size, 0)
                margin = stroke_size
                if margin * 2 < min(width, height):  # 确保有足够空间
                    bbox = (margin, margin, width - margin, height - margin)
                    inner_mask.paste(255, bbox)
                # 整个图像减去内部区域 = 边缘区域
                stroke_mask = Image.composite(alpha, Image.new('L', image.size, 0), inner_mask)
            
        else:  # 居中描边
            if has_transparency:
                # 透明图：一半在内，一半在外
                half_size = max(1, stroke_size // 2)
                dilated = alpha.filter(ImageFilter.MaxFilter(half_size * 2 + 1))
                eroded = alpha.filter(ImageFilter.MinFilter(half_size * 2 + 1))
                stroke_mask = Image.composite(dilated, Image.new('L', image.size, 0), eroded)
            else:
                # 普通图片：在边缘位置创建描边
                # 创建两个不同大小的内缩区域，取差值
                outer_mask = Image.new('L', image.size, 0)
                inner_mask = Image.new('L', image.size, 0)
                
                outer_margin = max(1, stroke_size // 2)
                inner_margin = stroke_size
                
                if outer_margin * 2 < min(width, height):
                    bbox = (outer_margin, outer_margin, width - outer_margin, height - outer_margin)
                    outer_mask.paste(255, bbox)
                if inner_margin * 2 < min(width, height):
                    bbox = (inner_margin, inner_margin, width - inner_margin, height - inner_margin)
                    inner_mask.paste(255, bbox)
                
                # outer_mask - inner_mask = 边缘环形区域
                stroke_mask = Image.composite(outer_mask, Image.new('L', image.size, 0), inner_mask)
        
        return stroke_mask

# 节点类映射
NODE_CLASS_MAPPINGS = {
    "DD-ImageStroke": DDImageStroke
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-ImageStroke": "DD Image Stroke"
}
