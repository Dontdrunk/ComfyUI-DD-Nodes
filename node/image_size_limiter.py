import torch
import numpy as np
import cv2
from typing import List, Dict, Any, Tuple, Union, Optional

class DDImageSizeLimiter:
    """
    DD 限制图像大小 - 确保图像和遮罩的尺寸在指定的最大和最小范围内
    当图像尺寸超出限制时自动调整，保持原始宽高比
    支持多个图像和遮罩输入，可选择输出其中一对
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "图像1": ("IMAGE",),
                "最大长宽": ("INT", {"default": 2048, "min": 64, "max": 8192, "step": 8}),
                "最小长宽": ("INT", {"default": 256, "min": 8, "max": 4096, "step": 8}),
                "缩放方法": (["双线性插值", "邻近-精确", "区域", "双三次插值", "lanczos"], {"default": "双线性插值"}),
                "选择输出": ("INT", {"default": 1, "min": 1, "max": 4, "step": 1}),
            },
            "optional": {
                "遮罩1": ("MASK",),
                "图像2": ("IMAGE",),
                "遮罩2": ("MASK",),
                "图像3": ("IMAGE",),
                "遮罩3": ("MASK",),
                "图像4": ("IMAGE",),
                "遮罩4": ("MASK",),
            }
        }

    RETURN_TYPES = ("IMAGE", "MASK", "INT", "INT", "INT", "INT")
    RETURN_NAMES = ("图像", "遮罩", "原始宽度", "原始高度", "新宽度", "新高度")
    FUNCTION = "limit_image_size"
    CATEGORY = "🍺DD系列节点"

    # 常量：插值方法映射
    INTERPOLATION_MAP = {
        "邻近-精确": cv2.INTER_NEAREST_EXACT,
        "双线性插值": cv2.INTER_LINEAR,
        "区域": cv2.INTER_AREA,
        "双三次插值": cv2.INTER_CUBIC,
        "lanczos": cv2.INTER_LANCZOS4
    }

    def _get_torch_mode(self, cv2_interpolation):
        """将OpenCV插值模式转换为PyTorch模式"""
        if cv2_interpolation in [cv2.INTER_NEAREST, cv2.INTER_NEAREST_EXACT]:
            return 'nearest'
        elif cv2_interpolation == cv2.INTER_LINEAR:
            return 'bilinear'
        elif cv2_interpolation == cv2.INTER_CUBIC:
            return 'bicubic'
        elif cv2_interpolation == cv2.INTER_AREA:
            return 'area'
        else:
            return 'bilinear'  # 默认返回双线性

    def _resize_batch(self, tensor, new_size, interpolation):
        """调整批量张量大小"""
        if tensor is None:
            return None
            
        # 确认输入张量的形状是[B,H,W,C]或[B,H,W]
        is_image = len(tensor.shape) == 4
        is_mask = len(tensor.shape) == 3
        
        if not (is_image or is_mask):
            raise ValueError(f"不支持的张量形状: {tensor.shape}")
        
        # 获取新的高度和宽度
        new_height, new_width = new_size
        torch_mode = self._get_torch_mode(interpolation)
        
        # 处理图像张量 [B,H,W,C]
        if is_image:
            # 转换为[B,C,H,W]用于插值
            tensor_bchw = tensor.permute(0, 3, 1, 2)
            
            # 只在适当的模式下使用align_corners参数
            if torch_mode in ['bilinear', 'bicubic']:
                resized = torch.nn.functional.interpolate(
                    tensor_bchw,
                    size=(new_height, new_width),
                    mode=torch_mode,
                    align_corners=False
                )
            else:
                # 对于'nearest'和'area'模式不使用align_corners参数
                resized = torch.nn.functional.interpolate(
                    tensor_bchw,
                    size=(new_height, new_width),
                    mode=torch_mode
                )
            
            # 转回[B,H,W,C]
            return resized.permute(0, 2, 3, 1)
        
        # 处理遮罩张量 [B,H,W]
        else:
            # 增加一个通道维度[B,1,H,W]用于插值
            tensor_b1hw = tensor.unsqueeze(1)
            
            # 只在适当的模式下使用align_corners参数
            if torch_mode in ['bilinear', 'bicubic']:
                resized = torch.nn.functional.interpolate(
                    tensor_b1hw,
                    size=(new_height, new_width),
                    mode=torch_mode,
                    align_corners=False
                )
            else:
                # 对于'nearest'和'area'模式不使用align_corners参数
                resized = torch.nn.functional.interpolate(
                    tensor_b1hw,
                    size=(new_height, new_width),
                    mode=torch_mode
                )
            
            # 移除添加的通道维度，返回[B,H,W]
            return resized.squeeze(1)

    def _calculate_new_dimensions(self, width, height, max_size, min_size):
        """
        计算新的图像尺寸，确保在最大和最小限制内，保持宽高比
        
        逻辑：
        1. 如果长边超过max_size，按长边缩放到max_size
        2. 如果长边小于min_size，按长边放大到min_size
        3. 否则保持原尺寸
        
        注意：这里的逻辑是基于长边来控制图像尺寸
        """
        # 获取原始宽高比
        aspect_ratio = width / height
        
        # 确定长边和短边
        long_side = max(width, height)
        short_side = min(width, height)
        
        new_width = width
        new_height = height
        
        # 检查长边是否超过最大限制
        if long_side > max_size:
            # 按长边缩放到max_size
            if width >= height:
                # 宽度是长边
                new_width = max_size
                new_height = int(new_width / aspect_ratio)
            else:
                # 高度是长边
                new_height = max_size
                new_width = int(new_height * aspect_ratio)
        
        # 检查长边是否小于最小限制
        elif long_side < min_size:
            # 按长边放大到min_size
            if width >= height:
                # 宽度是长边
                new_width = min_size
                new_height = int(new_width / aspect_ratio)
            else:
                # 高度是长边
                new_height = min_size
                new_width = int(new_height * aspect_ratio)
            
        # 确保尺寸总是8的倍数
        new_width = ((new_width + 7) // 8) * 8
        new_height = ((new_height + 7) // 8) * 8
            
        return new_width, new_height

    def limit_image_size(self, 图像1, 最大长宽, 最小长宽, 缩放方法, 选择输出, 
                  遮罩1=None, 图像2=None, 遮罩2=None, 图像3=None, 遮罩3=None, 图像4=None, 遮罩4=None):
        """
        限制多组图像和遮罩的尺寸，使其在指定的最大和最小范围内，并选择输出其中一组
        
        Args:
            图像1-4: 输入的图像组，形状为[B,H,W,C]
            遮罩1-4: 可选的输入遮罩组，形状为[B,H,W]
            最大长宽: 图像尺寸的最大限制
            最小长宽: 图像尺寸的最小限制
            缩放方法: 用于调整大小的插值方法
            选择输出: 选择输出第几组图像和遮罩（1-4）
            
        Returns:
            选定的调整大小后的图像和遮罩，以及原始和新的尺寸信息
        """
        # 创建图像和遮罩的列表
        图像列表 = [图像1, 图像2, 图像3, 图像4]
        遮罩列表 = [遮罩1, 遮罩2, 遮罩3, 遮罩4]
        
        # 确定要处理的图像和遮罩索引
        选择索引 = int(选择输出) - 1  # 转换为0-3的索引
        
        # 检查所选索引处是否有图像
        if 选择索引 > 0 and 图像列表[选择索引] is None:
            print(f"[限制图像大小] 警告：图像{选择索引+1}不存在，默认使用图像1")
            选择索引 = 0
        
        # 获取要处理的图像和遮罩
        当前图像 = 图像列表[选择索引]
        当前遮罩 = 遮罩列表[选择索引]
        
        # 对单张图像进行处理
        if len(当前图像.shape) == 3:  # [H,W,C]
            当前图像 = 当前图像.unsqueeze(0)  # 添加批次维度 [1,H,W,C]
        
        # 处理遮罩
        if 当前遮罩 is not None and len(当前遮罩.shape) == 2:  # [H,W]
            当前遮罩 = 当前遮罩.unsqueeze(0)  # 添加批次维度 [1,H,W]
        
        # 获取原始尺寸
        batch_size, height, width, channels = 当前图像.shape
        原始宽度, 原始高度 = width, height
        
        # 计算新尺寸
        新宽度, 新高度 = self._calculate_new_dimensions(width, height, 最大长宽, 最小长宽)
        
        # 检查是否需要调整大小
        if 新宽度 != 原始宽度 or 新高度 != 原始高度:
            print(f"[限制图像大小] 调整图像{选择索引+1}尺寸: {原始宽度}x{原始高度} -> {新宽度}x{新高度}")
            
            # 获取插值方法
            interpolation = self.INTERPOLATION_MAP.get(缩放方法, cv2.INTER_LINEAR)
            
            # 调整图像大小
            调整后图像 = self._resize_batch(当前图像, (新高度, 新宽度), interpolation)
            
            # 如果有遮罩，也调整遮罩大小
            调整后遮罩 = None
            if 当前遮罩 is not None:
                # 对遮罩使用邻近插值以保持边缘清晰
                mask_interpolation = cv2.INTER_NEAREST_EXACT
                调整后遮罩 = self._resize_batch(当前遮罩, (新高度, 新宽度), mask_interpolation)
        else:
            print(f"[限制图像大小] 图像{选择索引+1}尺寸已在范围内 {原始宽度}x{原始高度}，无需调整")
            调整后图像 = 当前图像
            调整后遮罩 = 当前遮罩
            
        # 处理空遮罩情况
        if 调整后遮罩 is None:
            # 创建一个空遮罩
            调整后遮罩 = torch.ones((batch_size, 新高度, 新宽度), device=当前图像.device)
            
        return (调整后图像, 调整后遮罩, 原始宽度, 原始高度, 新宽度, 新高度)

# 节点类映射
NODE_CLASS_MAPPINGS = {
    "DD-ImageSizeLimiter": DDImageSizeLimiter
}

# 节点显示名称映射 - 使用英文（中文通过locales提供）
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-ImageSizeLimiter": "DD Image Size Limiter"
}
