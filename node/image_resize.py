import torch
import numpy as np
import cv2
import comfy.utils
from typing import List, Dict, Any, Tuple

class DDImageUniformSize:
    """
    DD 图像统一尺寸 - 将输入的图像或视频统一调整为指定分辨率
    支持多输入端口，多种缩放方法和尺寸适配策略
    只有接入内容的输入端口才会生成对应的输出
    """

    @classmethod
    def INPUT_TYPES(cls):
        # 基本配置
        inputs = {
            "required": {
                "缩放方法": (["邻近-精确", "双线性插值", "区域", "双三次插值", "lanczos"], {"default": "双线性插值"}),
                "宽度": ("INT", {"default": 512, "min": 8, "max": 8192, "step": 8}),
                "高度": ("INT", {"default": 512, "min": 8, "max": 8192, "step": 8}),
                "尺寸适配": (["自适应", "拉伸", "裁剪", "填充"], {"default": "自适应"}),
            },
            "optional": {
                # 四个固定的可选输入端口
                "图片A": ("IMAGE",),
                "图片B": ("IMAGE",),
                "图片C": ("IMAGE",),
                "图片D": ("IMAGE",),
            }
        }
        return inputs

    # 默认输出端口设置 - 所有可能的输出
    RETURN_TYPES = ("IMAGE", "IMAGE", "IMAGE", "IMAGE")
    RETURN_NAMES = ("图片A", "图片B", "图片C", "图片D")
    FUNCTION = "resize_images"
    CATEGORY = "🍺DD系列节点"

    # 常量：插值方法映射
    INTERPOLATION_MAP = {
        "邻近-精确": cv2.INTER_NEAREST_EXACT,
        "双线性插值": cv2.INTER_LINEAR,
        "区域": cv2.INTER_AREA,
        "双三次插值": cv2.INTER_CUBIC,
        "lanczos": cv2.INTER_LANCZOS4
    }

    def _resize_batch(self, image_batch, target_size, interpolation_mode, size_adapt):
        """调整一批图像的大小"""
        if image_batch is None:
            return None
            
        # 确保输入为张量
        if not isinstance(image_batch, torch.Tensor):
            return None
            
        # 获取图像尺寸
        if len(image_batch.shape) == 3:  # 单张图片 [H, W, C]
            image_batch = image_batch.unsqueeze(0)  # [1, H, W, C]
        
        batch_size, height, width, channels = image_batch.shape
        target_height, target_width = target_size
        result = None
        
        # 获取插值方法
        interpolation = self.INTERPOLATION_MAP.get(interpolation_mode, cv2.INTER_LINEAR)
        
        # 根据尺寸适配方法调整图像
        if size_adapt == "拉伸":
            # 直接调整到目标尺寸
            result = self._batch_resize(image_batch, target_size, interpolation)
        
        elif size_adapt == "自适应":
            # 保持宽高比缩放
            result = self._batch_adaptive_resize(image_batch, target_size, interpolation)
            
        elif size_adapt == "裁剪":
            # 保持宽高比缩放后居中裁剪
            result = self._batch_center_crop(image_batch, target_size, interpolation)
            
        elif size_adapt == "填充":
            # 保持宽高比缩放后填充
            result = self._batch_pad(image_batch, target_size, interpolation)
            
        else:
            # 默认使用自适应
            result = self._batch_adaptive_resize(image_batch, target_size, interpolation)
        
        return result

    def _batch_resize(self, batch, target_size, interpolation):
        """批量调整尺寸 - 直接拉伸"""
        # 使用PyTorch内置的resize函数
        target_height, target_width = target_size
        # 将图像从BHWC转换为BCHW
        batch_bchw = batch.permute(0, 3, 1, 2) 
        
        resized = torch.nn.functional.interpolate(
            batch_bchw,
            size=(target_height, target_width),
            mode=self._get_torch_mode(interpolation),
            align_corners=False if self._get_torch_mode(interpolation) != 'nearest' else None
        )
        
        # 转回BHWC
        return resized.permute(0, 2, 3, 1)

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

    def _batch_adaptive_resize(self, batch, target_size, interpolation):
        """批量自适应调整尺寸 - 保持宽高比"""
        batch_size, height, width, channels = batch.shape
        target_height, target_width = target_size
        
        # 计算缩放比例
        ratio = min(target_width / width, target_height / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        
        # 先调整大小
        batch_bchw = batch.permute(0, 3, 1, 2)
        resized = torch.nn.functional.interpolate(
            batch_bchw,
            size=(new_height, new_width),
            mode=self._get_torch_mode(interpolation),
            align_corners=False if self._get_torch_mode(interpolation) != 'nearest' else None
        )
        
        # 创建目标大小的空张量
        result = torch.zeros(batch_size, channels, target_height, target_width, device=batch.device)
        
        # 计算偏移量
        y_offset = (target_height - new_height) // 2
        x_offset = (target_width - new_width) // 2
        
        # 将调整后的图像放在中心
        result[:, :, y_offset:y_offset + new_height, x_offset:x_offset + new_width] = resized
        
        # 转回BHWC
        return result.permute(0, 2, 3, 1)

    def _batch_center_crop(self, batch, target_size, interpolation):
        """批量中心裁剪 - 先调整大小然后裁剪"""
        batch_size, height, width, channels = batch.shape
        target_height, target_width = target_size
        
        # 计算缩放比例 - 以较大的比例为准，确保裁剪
        ratio = max(target_width / width, target_height / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        
        # 调整大小
        batch_bchw = batch.permute(0, 3, 1, 2)
        resized = torch.nn.functional.interpolate(
            batch_bchw,
            size=(new_height, new_width),
            mode=self._get_torch_mode(interpolation),
            align_corners=False if self._get_torch_mode(interpolation) != 'nearest' else None
        )
        
        # 计算裁剪区域
        y_start = (new_height - target_height) // 2
        x_start = (new_width - target_width) // 2
        
        # 裁剪中心区域
        cropped = resized[:, :, y_start:y_start + target_height, x_start:x_start + target_width]
        
        # 转回BHWC
        return cropped.permute(0, 2, 3, 1)

    def _batch_pad(self, batch, target_size, interpolation):
        """批量填充 - 保持宽高比并填充"""
        # 这与自适应调整相同，因为我们已经创建了全零背景并居中放置调整后的图像
        return self._batch_adaptive_resize(batch, target_size, interpolation)

    def resize_images(self, 缩放方法, 宽度, 高度, 尺寸适配, 图片A=None, 图片B=None, 图片C=None, 图片D=None):
        """根据指定参数统一调整所有输入图像的大小"""
        target_size = (高度, 宽度)  # (H, W)
        results = []
        
        # 创建输入图像和名称的映射
        input_images = {
            "图片A": 图片A,
            "图片B": 图片B,
            "图片C": 图片C,
            "图片D": 图片D
        }
        
        # 过滤出有内容的输入
        valid_inputs = {name: img for name, img in input_images.items() if img is not None}
        
        # 动态设置输出类型和名称
        if len(valid_inputs) > 0:
            self.RETURN_TYPES = tuple(["IMAGE"] * len(valid_inputs))
            self.RETURN_NAMES = tuple(valid_inputs.keys())
        else:
            # 如果没有有效输入，提供一个默认输出
            self.RETURN_TYPES = ("IMAGE",)
            self.RETURN_NAMES = ("图片A",)
            # 创建默认空图像
            empty_image = torch.zeros(1, 高度, 宽度, 3)
            return (empty_image,)
        
        # 处理每个有效输入
        for img in valid_inputs.values():
            # 调整图像大小
            resized = self._resize_batch(img, target_size, 缩放方法, 尺寸适配)
            results.append(resized)
            
        return tuple(results)

# 节点类映射
NODE_CLASS_MAPPINGS = {
    "DD-ImageUniformSize": DDImageUniformSize
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-ImageUniformSize": "DD 图像统一尺寸"
}
