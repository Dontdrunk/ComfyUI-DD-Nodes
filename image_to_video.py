import torch
import numpy as np

class ImageToVideo:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "图片": ("IMAGE",),
                "时长": ("FLOAT", {
                    "default": 5.0, 
                    "min": 0.1, 
                    "max": 300.0, 
                    "step": 0.1
                }),
                "帧率": ("INT", {
                    "default": 30,
                    "min": 1,
                    "max": 120,
                    "step": 1
                }),
                "批处理大小": ("INT", {
                    "default": 30,
                    "min": 1,
                    "max": 120,
                    "step": 1,
                    "description": "每批处理的帧数，较小的值会降低内存使用"
                })
            }
        }
    
    RETURN_TYPES = ("IMAGE", "INT", "FLOAT", "INT")
    RETURN_NAMES = ("视频帧", "总帧数", "实际时长", "帧率")
    FUNCTION = "create_video_frames"
    CATEGORY = "DONTDRUNK"

    def log_progress(self, current, total):
        """输出进度信息"""
        percentage = (current / total) * 100
        print(f"生成进度: {current}/{total} 帧 ({percentage:.1f}%)")

    def create_video_frames(self, 图片, 时长, 帧率, 批处理大小):
        try:
            # 计算需要的总帧数
            total_frames = int(时长 * 帧率)
            actual_duration = total_frames / 帧率  # 实际时长（考虑帧数取整）
            
            # 初始化进度
            frames_processed = 0
            
            # 确保输入图片格式正确
            if isinstance(图片, torch.Tensor):
                if 图片.ndim == 3:
                    图片 = 图片.unsqueeze(0)
            
            # 使用批处理方式生成帧
            batches = []
            while frames_processed < total_frames:
                # 计算当前批次应处理的帧数
                current_batch_size = min(批处理大小, total_frames - frames_processed)
                
                # 为当前批次生成帧
                batch_frames = 图片.repeat(current_batch_size, 1, 1, 1)
                batches.append(batch_frames)
                
                # 更新进度
                frames_processed += current_batch_size
                self.log_progress(frames_processed, total_frames)
            
            # 合并所有批次
            video_frames = torch.cat(batches, dim=0)
            
            print(f"\n视频帧生成完成:")
            print(f"- 总帧数: {total_frames}")
            print(f"- 实际时长: {actual_duration:.3f} 秒")
            print(f"- 帧率: {帧率} FPS")
            print(f"- 帧尺寸: {video_frames.shape[-2]}x{video_frames.shape[-1]}")
            
            return (video_frames, total_frames, actual_duration, 帧率)
            
        except Exception as e:
            print(f"错误: 生成视频帧时发生异常 - {str(e)}")
            raise e

NODE_CLASS_MAPPINGS = {
    "DD-ImageToVideo": ImageToVideo
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-ImageToVideo": "DD 图片转视频帧"
}