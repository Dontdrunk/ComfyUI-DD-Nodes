class DDLatentSwitcher:
    """
    DD 潜空间切换 - 在多个潜空间输入之间选择一个作为输出
    支持最多4个潜空间输入，可以通过选择器指定输出哪一个潜空间
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "潜空间1": ("LATENT",),
                "潜空间2": ("LATENT",),
                "选择输出": ("INT", {"default": 1, "min": 1, "max": 4, "step": 1}),
            },
            "optional": {
                "潜空间3": ("LATENT",),
                "潜空间4": ("LATENT",),
            }
        }

    RETURN_TYPES = ("LATENT",)
    RETURN_NAMES = ("潜空间",)
    FUNCTION = "switch_latent"
    CATEGORY = "🍺DD系列节点"

    def switch_latent(self, 潜空间1, 潜空间2, 选择输出, 潜空间3=None, 潜空间4=None):
        """
        在多个潜空间之间切换，根据选择输出指定的数字返回对应的潜空间
        
        Args:
            潜空间1-4: 输入的潜空间
            选择输出: 选择输出第几个潜空间（1-4）
            
        Returns:
            选定的潜空间
        """
        # 创建潜空间列表
        潜空间列表 = [潜空间1, 潜空间2, 潜空间3, 潜空间4]
        
        # 确定要输出的潜空间索引
        选择索引 = int(选择输出) - 1  # 转换为0-3的索引
        
        # 检查所选索引处是否有潜空间
        if 选择索引 > 1 and 潜空间列表[选择索引] is None:
            print(f"[潜空间切换] 警告：潜空间{选择索引+1}不存在，默认使用潜空间1")
            选择索引 = 0
        
        # 获取要输出的潜空间
        输出潜空间 = 潜空间列表[选择索引]
        
        print(f"[潜空间切换] 已选择输出潜空间{选择索引+1}")
        
        return (输出潜空间,)

# 节点类映射
NODE_CLASS_MAPPINGS = {
    "DD-LatentSwitcher": DDLatentSwitcher
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-LatentSwitcher": "DD Latent Switcher"
}