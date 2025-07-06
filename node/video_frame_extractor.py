import torch

class DDVideoFrameExtractor:
    """
    DD 视频首尾帧输出
    从视频中提取首帧或尾帧图像
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "视频": ("IMAGE",),
                "提取模式": (["首帧", "尾帧"], {"default": "首帧"}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("图像",)
    FUNCTION = "extract_frame"
    CATEGORY = "🍺DD系列节点"

    def extract_frame(self, 视频, 提取模式):
        """
        从视频中提取首帧或尾帧
        
        Args:
            视频: 输入的视频帧序列 (batch, height, width, channels)
            提取模式: "首帧" 或 "尾帧"
            
        Returns:
            提取的单帧图像
        """
        # 确保输入是torch.Tensor
        if not isinstance(视频, torch.Tensor):
            raise ValueError("输入必须是torch.Tensor格式的视频")
        
        # 检查视频是否为空
        if 视频.shape[0] == 0:
            raise ValueError("输入视频为空")
        
        # 根据提取模式选择帧
        if 提取模式 == "首帧":
            # 提取第一帧
            extracted_frame = 视频[0:1]  # 保持batch维度
            print(f"[视频首尾帧输出] 已提取首帧，视频总帧数: {视频.shape[0]}")
        else:  # 尾帧
            # 提取最后一帧
            extracted_frame = 视频[-1:]  # 保持batch维度
            print(f"[视频首尾帧输出] 已提取尾帧，视频总帧数: {视频.shape[0]}")
        
        print(f"[视频首尾帧输出] 提取的帧尺寸: {extracted_frame.shape[1]}x{extracted_frame.shape[2]}")
        
        return (extracted_frame,)

# 节点类映射
NODE_CLASS_MAPPINGS = {
    "DD-VideoFrameExtractor": DDVideoFrameExtractor
}

# 节点显示名称映射 - 使用英文（中文通过locales提供）
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-VideoFrameExtractor": "DD Video Frame Extractor"
}
