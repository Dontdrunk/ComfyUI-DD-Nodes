import torch
import numpy as np
import cv2
import comfy.utils
from typing import List, Dict, Any, Tuple

class DDMaskUniformSize:
    """
    DD 遮罩统一尺寸 - 将输入的遮罩统一调整为指定分辨率
    支持多输入端口，多种缩放方法和尺寸适配策略
    只有接入内容的输入端口才会生成对应的输出
    """

    @classmethod
    def INPUT_TYPES(cls):
        # 基本配置
        inputs = {
            "required": {
                "缩放方法": (["邻近-精确", "双线性插值", "区域", "双三次插值", "lanczos"], {"default": "邻近-精确"}),
                "宽度": ("INT", {"default": 512, "min": 8, "max": 8192, "step": 8}),
                "高度": ("INT", {"default": 512, "min": 8, "max": 8192, "step": 8}),
                "尺寸适配": (["自适应", "拉伸", "裁剪", "填充"], {"default": "自适应"}),
                "阈值处理": ("BOOLEAN", {"default": False, "label": "启用阈值处理"}),
                "阈值值": ("FLOAT", {"default": 0.5, "min": 0.0, "max": 1.0, "step": 0.05, "display": "slider"}),
            },
            "optional": {
                # 四个固定的可选输入端口
                "遮罩A": ("MASK",),
                "遮罩B": ("MASK",),
                "遮罩C": ("MASK",),
                "遮罩D": ("MASK",),
            }
        }
        return inputs

    # 默认输出端口设置 - 所有可能的输出
    RETURN_TYPES = ("MASK", "MASK", "MASK", "MASK")
    RETURN_NAMES = ("遮罩A", "遮罩B", "遮罩C", "遮罩D")
    FUNCTION = "resize_masks"
    CATEGORY = "🍺DD系列节点"

    # 常量：插值方法映射
    INTERPOLATION_MAP = {
        "邻近-精确": cv2.INTER_NEAREST_EXACT,
        "双线性插值": cv2.INTER_LINEAR,
        "区域": cv2.INTER_AREA,
        "双三次插值": cv2.INTER_CUBIC,
        "lanczos": cv2.INTER_LANCZOS4
    }

    def _resize_batch(self, mask_batch, target_size, interpolation_mode, size_adapt):
        """调整一批遮罩的大小"""
        if mask_batch is None:
            return None
            
        # 确保输入为张量
        if not isinstance(mask_batch, torch.Tensor):
            return None
        
        # 遮罩格式处理：确保是批次形式[B,H,W]
        if len(mask_batch.shape) == 2:  # 单个遮罩 [H, W]
            mask_batch = mask_batch.unsqueeze(0)  # [1, H, W]
        
        # 获取插值方法
        interpolation = self.INTERPOLATION_MAP.get(interpolation_mode, cv2.INTER_NEAREST_EXACT)
        
        # 根据尺寸适配方法调整遮罩
        if size_adapt == "拉伸":
            # 直接调整到目标尺寸
            result = self._batch_resize(mask_batch, target_size, interpolation)
        
        elif size_adapt == "自适应":
            # 保持宽高比缩放
            result = self._batch_adaptive_resize(mask_batch, target_size, interpolation)
            
        elif size_adapt == "裁剪":
            # 保持宽高比缩放后居中裁剪
            result = self._batch_center_crop(mask_batch, target_size, interpolation)
            
        elif size_adapt == "填充":
            # 保持宽高比缩放后填充
            result = self._batch_pad(mask_batch, target_size, interpolation)
            
        else:
            # 默认使用自适应
            result = self._batch_adaptive_resize(mask_batch, target_size, interpolation)
        
        return result

    def _batch_resize(self, batch, target_size, interpolation):
        """批量调整尺寸 - 直接拉伸"""
        target_height, target_width = target_size
        # 将遮罩从[B,H,W]转换为[B,1,H,W]用于插值
        batch_b1hw = batch.unsqueeze(1) if len(batch.shape) == 3 else batch
        
        torch_mode = self._get_torch_mode(interpolation)
        # 只在适当的模式下使用align_corners参数
        if torch_mode in ['bilinear', 'bicubic']:
            resized = torch.nn.functional.interpolate(
                batch_b1hw,
                size=(target_height, target_width),
                mode=torch_mode,
                align_corners=False
            )
        else:
            # 对于'nearest'和'area'模式不使用align_corners参数
            resized = torch.nn.functional.interpolate(
                batch_b1hw,
                size=(target_height, target_width),
                mode=torch_mode
            )
        
        # 移除额外的维度，返回[B,H,W]
        return resized.squeeze(1) if len(batch.shape) == 3 else resized

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
            return 'nearest'  # 遮罩默认返回最邻近

    def _batch_adaptive_resize(self, batch, target_size, interpolation):
        """批量自适应调整尺寸 - 保持宽高比"""
        # 获取尺寸信息
        if len(batch.shape) == 3:  # [B,H,W]
            batch_size, height, width = batch.shape
        elif len(batch.shape) == 4:  # [B,1,H,W]
            batch_size, _, height, width = batch.shape
        
        target_height, target_width = target_size
        
        # 计算缩放比例
        ratio = min(target_width / width, target_height / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        
        # 先调整大小
        if len(batch.shape) == 3:
            batch_b1hw = batch.unsqueeze(1)
        else:
            batch_b1hw = batch
        
        torch_mode = self._get_torch_mode(interpolation)
        # 只在适当的模式下使用align_corners参数
        if torch_mode in ['bilinear', 'bicubic']:
            resized = torch.nn.functional.interpolate(
                batch_b1hw,
                size=(new_height, new_width),
                mode=torch_mode,
                align_corners=False
            )
        else:
            # 对于'nearest'和'area'模式不使用align_corners参数
            resized = torch.nn.functional.interpolate(
                batch_b1hw,
                size=(new_height, new_width),
                mode=torch_mode
            )
        
        # 创建目标大小的空张量
        if len(batch.shape) == 3:
            result = torch.zeros(batch_size, target_height, target_width, device=batch.device)
        else:
            result = torch.zeros(batch_size, 1, target_height, target_width, device=batch.device)
        
        # 计算偏移量
        y_offset = (target_height - new_height) // 2
        x_offset = (target_width - new_width) // 2
        
        # 将调整后的遮罩放在中心
        if len(batch.shape) == 3:
            result[:, y_offset:y_offset + new_height, x_offset:x_offset + new_width] = resized.squeeze(1)
        else:
            result[:, :, y_offset:y_offset + new_height, x_offset:x_offset + new_width] = resized
        
        return result.squeeze(1) if len(batch.shape) == 3 else result

    def _batch_center_crop(self, batch, target_size, interpolation):
        """批量中心裁剪 - 先调整大小然后裁剪"""
        # 获取尺寸信息
        if len(batch.shape) == 3:  # [B,H,W]
            batch_size, height, width = batch.shape
            batch_b1hw = batch.unsqueeze(1)
        elif len(batch.shape) == 4:  # [B,1,H,W]
            batch_size, _, height, width = batch.shape
            batch_b1hw = batch
            
        target_height, target_width = target_size
        
        # 计算缩放比例 - 以较大的比例为准，确保裁剪
        ratio = max(target_width / width, target_height / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        
        # 调整大小
        torch_mode = self._get_torch_mode(interpolation)
        # 只在适当的模式下使用align_corners参数
        if torch_mode in ['bilinear', 'bicubic']:
            resized = torch.nn.functional.interpolate(
                batch_b1hw,
                size=(new_height, new_width),
                mode=torch_mode,
                align_corners=False
            )
        else:
            # 对于'nearest'和'area'模式不使用align_corners参数
            resized = torch.nn.functional.interpolate(
                batch_b1hw,
                size=(new_height, new_width),
                mode=torch_mode
            )
        
        # 计算裁剪区域
        y_start = (new_height - target_height) // 2
        x_start = (new_width - target_width) // 2
        
        # 裁剪中心区域
        cropped = resized[:, :, y_start:y_start + target_height, x_start:x_start + target_width]
        
        # 返回正确的维度
        return cropped.squeeze(1) if len(batch.shape) == 3 else cropped

    def _batch_pad(self, batch, target_size, interpolation):
        """批量填充 - 保持宽高比并填充"""
        # 这与自适应调整相同，因为我们已经创建了全零背景并居中放置调整后的遮罩
        return self._batch_adaptive_resize(batch, target_size, interpolation)

    def _apply_threshold(self, mask, threshold_value):
        """应用阈值处理"""
        return (mask > threshold_value).float()

    def resize_masks(self, 缩放方法, 宽度, 高度, 尺寸适配, 阈值处理, 阈值值, 
                     遮罩A=None, 遮罩B=None, 遮罩C=None, 遮罩D=None):
        """根据指定参数统一调整所有输入遮罩的大小"""
        target_size = (高度, 宽度)  # (H, W)
        results = []
        
        # 创建输入遮罩和名称的映射
        input_masks = {
            "遮罩A": 遮罩A,
            "遮罩B": 遮罩B,
            "遮罩C": 遮罩C,
            "遮罩D": 遮罩D
        }
        
        # 过滤出有内容的输入
        valid_inputs = {name: mask for name, mask in input_masks.items() if mask is not None}
        
        # 动态设置输出类型和名称
        if len(valid_inputs) > 0:
            self.RETURN_TYPES = tuple(["MASK"] * len(valid_inputs))
            self.RETURN_NAMES = tuple(valid_inputs.keys())
        else:
            # 如果没有有效输入，提供一个默认输出
            self.RETURN_TYPES = ("MASK",)
            self.RETURN_NAMES = ("遮罩A",)
            # 创建默认空遮罩
            empty_mask = torch.zeros(1, 高度, 宽度)
            return (empty_mask,)
        
        # 处理每个有效输入
        for mask in valid_inputs.values():
            # 调整遮罩大小
            resized = self._resize_batch(mask, target_size, 缩放方法, 尺寸适配)
            
            # 如果启用了阈值处理
            if 阈值处理:
                resized = self._apply_threshold(resized, 阈值值)
                
            results.append(resized)
            
        return tuple(results)

# 节点类映射
NODE_CLASS_MAPPINGS = {
    "DD-MaskUniformSize": DDMaskUniformSize
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-MaskUniformSize": "DD 遮罩统一尺寸"
}
