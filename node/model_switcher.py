class DDModelSwitcher:
    """
    DD 模型切换 - 在多个模型输入之间选择一个作为输出
    支持最多4个模型输入，可以通过选择器指定输出哪一个模型
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "模型1": ("MODEL",),
                "模型2": ("MODEL",),
                "选择输出": ("INT", {"default": 1, "min": 1, "max": 4, "step": 1}),
            },
            "optional": {
                "模型3": ("MODEL",),
                "模型4": ("MODEL",),
            }
        }

    RETURN_TYPES = ("MODEL",)
    RETURN_NAMES = ("模型",)
    FUNCTION = "switch_model"
    CATEGORY = "🍺DD系列节点"

    def switch_model(self, 模型1, 模型2, 选择输出, 模型3=None, 模型4=None):
        """
        在多个模型之间切换，根据选择输出指定的数字返回对应的模型
        
        Args:
            模型1-4: 输入的模型
            选择输出: 选择输出第几个模型（1-4）
            
        Returns:
            选定的模型
        """
        # 创建模型列表
        模型列表 = [模型1, 模型2, 模型3, 模型4]
        
        # 确定要输出的模型索引
        选择索引 = int(选择输出) - 1  # 转换为0-3的索引
        
        # 检查所选索引处是否有模型
        if 选择索引 > 1 and 模型列表[选择索引] is None:
            print(f"[模型切换] 警告：模型{选择索引+1}不存在，默认使用模型1")
            选择索引 = 0
        
        # 获取要输出的模型
        输出模型 = 模型列表[选择索引]
        
        print(f"[模型切换] 已选择输出模型{选择索引+1}")
        
        return (输出模型,)

# 节点类映射
NODE_CLASS_MAPPINGS = {
    "DD-ModelSwitcher": DDModelSwitcher
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-ModelSwitcher": "DD Model Switcher"
}