"""
高级融合节点
@author: DontDrunk
支持多种融合模式
"""

import torch
import numpy as np
import cv2

class DDAdvancedFusion:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "输入A": ("IMAGE",),
                "输入B": ("IMAGE",),
                "融合类型": (["单线融合", "多边形融合"],),  # 改名：分割->融合
                "融合角度": ("INT", {  # 改名：分割->融合
                    "default": 0,
                    "min": 1,
                    "max": 360,
                    "step": 1,
                    "display": "slider"
                }),
                "融合比例": ("FLOAT", {  # 改名：分割->融合
                    "default": 0.5,
                    "min": 0.0,
                    "max": 1.0,
                    "step": 0.01,
                    "display": "slider"
                }),
                "边缘模糊": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": 50,
                    "step": 1,
                    "display": "slider"
                }),
                "多边形边数": ("INT", {
                    "default": 6,
                    "min": 3,
                    "max": 12,
                    "step": 1,
                    "display": "slider"
                }),
                "尺寸适配": (["自适应", "拉伸", "裁剪", "填充"],),
                "帧数适配": (["较短", "较长", "平均"],),
            }
        }

    CATEGORY = "DD高级处理"
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("融合结果",)
    FUNCTION = "fusion_process"

    def fusion_process(self, 输入A, 输入B, 融合类型="单线融合",  # 改名：分割->融合
                      融合角度=0, 融合比例=0.5, 边缘模糊=0,  # 改名：分割->融合
                      多边形边数=6, 尺寸适配="自适应", 帧数适配="较短"):
        # 转换为numpy数组
        if isinstance(输入A, torch.Tensor):
            输入A = 输入A.cpu().numpy()
        if isinstance(输入B, torch.Tensor):
            输入B = 输入B.cpu().numpy()
            
        # 保证输入为4D
        if len(输入A.shape) == 3:
            输入A = 输入A[None, ...]
        if len(输入B.shape) == 3:
            输入B = 输入B[None, ...]

        # 处理帧数
        frames_A = 输入A.shape[0]
        frames_B = 输入B.shape[0]
        
        # 确定目标帧数
        if 帧数适配 == "较短":
            target_frames = min(frames_A, frames_B)
        elif 帧数适配 == "较长":
            target_frames = max(frames_A, frames_B)
        else:  # "平均"
            target_frames = (frames_A + frames_B) // 2

        # 调整帧数
        if frames_A != target_frames:
            输入A = self._adjust_frames(输入A, target_frames)
        if frames_B != target_frames:
            输入B = self._adjust_frames(输入B, target_frames)

        # 处理尺寸
        if 尺寸适配 == "拉伸":
            输入B = self._batch_resize(输入B, (输入A.shape[1], 输入A.shape[2]))
        elif 尺寸适配 == "自适应":
            输入B = self._batch_adaptive_resize(输入B, (输入A.shape[1], 输入A.shape[2]))
        elif 尺寸适配 == "裁剪":
            输入B = self._batch_center_crop(输入B, (输入A.shape[1], 输入A.shape[2]))
        else:  # 填充
            输入B = self._batch_pad(输入B, (输入A.shape[1], 输入A.shape[2]))

        # 创建融合掩码  # 改名：分割->融合
        mask = self._create_fusion_mask(输入A.shape[1:3], 融合类型, 融合角度, 
                                    融合比例, 多边形边数)

        # 应用边缘模糊
        if 边缘模糊 > 0:
            mask = cv2.GaussianBlur(mask, (边缘模糊*2+1, 边缘模糊*2+1), 0)

        # 扩展掩码维度
        mask = mask[None, ..., None]  # 添加批次和通道维度
        mask = np.repeat(mask, 3, axis=3)  # 复制到三个通道
        mask = np.repeat(mask, target_frames, axis=0)  # 扩展到目标帧数

        # 融合图像
        result = 输入A * mask + 输入B * (1 - mask)
        
        return (torch.from_numpy(result),)

    def _adjust_frames(self, video, target_frames):
        """调整视频帧数"""
        if video.shape[0] == target_frames:
            return video
        
        # 计算帧索引
        orig_indices = np.arange(video.shape[0])
        target_indices = np.linspace(0, video.shape[0] - 1, target_frames)
        
        # 创建结果数组
        result = np.zeros((target_frames, *video.shape[1:]), dtype=video.dtype)
        
        # 对每个目标帧进行插值
        for i, target_idx in enumerate(target_indices):
            if target_idx.is_integer():
                result[i] = video[int(target_idx)]
            else:
                # 线性插值
                idx_floor = int(np.floor(target_idx))
                idx_ceil = int(np.ceil(target_idx))
                weight_ceil = target_idx - idx_floor
                weight_floor = 1 - weight_ceil
                result[i] = video[idx_floor] * weight_floor + video[idx_ceil] * weight_ceil
                
        return result

    def _batch_resize(self, batch, target_size):
        """批量调整尺寸"""
        resized = np.zeros((batch.shape[0], target_size[0], target_size[1], batch.shape[3]), dtype=batch.dtype)
        for i in range(batch.shape[0]):
            resized[i] = cv2.resize(batch[i], (target_size[1], target_size[0]))
        return resized

    def _batch_adaptive_resize(self, batch, target_size):
        """批量自适应调整尺寸"""
        h, w = batch.shape[1:3]
        ratio = min(target_size[1]/w, target_size[0]/h)
        new_w = int(w * ratio)
        new_h = int(h * ratio)
        
        resized = np.zeros((batch.shape[0], target_size[0], target_size[1], batch.shape[3]), dtype=batch.dtype)
        for i in range(batch.shape[0]):
            temp = cv2.resize(batch[i], (new_w, new_h))
            y_offset = (target_size[0] - new_h) // 2
            x_offset = (target_size[1] - new_w) // 2
            resized[i, y_offset:y_offset+new_h, x_offset:x_offset+new_w] = temp
            
        return resized

    def _batch_center_crop(self, batch, target_size):
        """批量中心裁剪"""
        h, w = batch.shape[1:3]
        start_y = max(0, (h - target_size[0]) // 2)
        start_x = max(0, (w - target_size[1]) // 2)
        return batch[:, start_y:start_y+target_size[0], start_x:start_x+target_size[1]]

    def _batch_pad(self, batch, target_size):
        """批量填充"""
        h, w = batch.shape[1:3]
        ratio = min(target_size[1]/w, target_size[0]/h)
        new_w = int(w * ratio)
        new_h = int(h * ratio)
        
        resized = np.zeros((batch.shape[0], target_size[0], target_size[1], batch.shape[3]), dtype=batch.dtype)
        for i in range(batch.shape[0]):
            temp = cv2.resize(batch[i], (new_w, new_h))
            y_offset = (target_size[0] - new_h) // 2
            x_offset = (target_size[1] - new_w) // 2
            resized[i, y_offset:y_offset+new_h, x_offset:x_offset+new_w] = temp
            
        return resized

    def _create_fusion_mask(self, shape, mode, angle, ratio, polygon_sides):  # 改名：分割->融合
        """创建融合掩码"""  # 改名：分割->融合
        height, width = shape
        
        if mode == "单线融合":  # 改名：分割->融合
            return self._create_angle_mask(height, width, angle, ratio)
        else:  # 多边形融合  # 改名：分割->融合
            return self._create_polygon_mask(height, width, polygon_sides, ratio, angle)

    def _create_angle_mask(self, height, width, angle, ratio):
        """创建角度掩码"""
        mask = np.zeros((height, width), dtype=np.float32)
        center_y, center_x = height / 2, width / 2
        theta = np.radians(angle)
        
        y, x = np.ogrid[:height, :width]
        y = y - center_y
        x = x - center_x
        
        x_rot = x * np.cos(theta) + y * np.sin(theta)
        split_point = width * (ratio - 0.5)
        
        mask = x_rot < split_point
        return mask.astype(np.float32)

    def _create_polygon_mask(self, height, width, sides, ratio, angle):
        """创建多边形掩码"""
        mask = np.zeros((height, width), dtype=np.float32)
        center = (width/2, height/2)
        radius = min(width, height) * ratio
        
        # 添加旋转角度
        base_angle = np.radians(angle)
        angles = np.linspace(base_angle, base_angle + 2*np.pi, sides+1)[:-1]
        
        points = []
        for angle in angles:
            x = center[0] + radius * np.cos(angle)
            y = center[1] + radius * np.sin(angle)
            points.append([int(x), int(y)])
            
        points = np.array(points)
        cv2.fillPoly(mask, [points.astype(np.int32)], 1)
        return mask

# 节点映射
NODE_CLASS_MAPPINGS = {
    "DD-AdvancedFusion": DDAdvancedFusion
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-AdvancedFusion": "DD 高级融合"
}