class DDConditionSwitcher:
    """
    DD 条件切换 - 在多个条件输入之间选择一个作为输出
    支持最多4个条件输入，可以通过选择器指定输出哪一个条件
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "条件1": ("CONDITIONING",),
                "条件2": ("CONDITIONING",),
                "选择输出": ("INT", {"default": 1, "min": 1, "max": 4, "step": 1}),
            },
            "optional": {
                "条件3": ("CONDITIONING",),
                "条件4": ("CONDITIONING",),
            }
        }

    RETURN_TYPES = ("CONDITIONING",)
    RETURN_NAMES = ("条件",)
    FUNCTION = "switch_condition"
    CATEGORY = "🍺DD系列节点"

    def switch_condition(self, 条件1, 条件2, 选择输出, 条件3=None, 条件4=None):
        """
        在多个条件之间切换，根据选择输出指定的数字返回对应的条件
        
        Args:
            条件1-4: 输入的条件
            选择输出: 选择输出第几个条件（1-4）
            
        Returns:
            选定的条件
        """
        # 创建条件列表
        条件列表 = [条件1, 条件2, 条件3, 条件4]
        
        # 确定要输出的条件索引
        选择索引 = int(选择输出) - 1  # 转换为0-3的索引
        
        # 检查所选索引处是否有条件
        if 选择索引 > 1 and 条件列表[选择索引] is None:
            print(f"[条件切换] 警告：条件{选择索引+1}不存在，默认使用条件1")
            选择索引 = 0
        
        # 获取要输出的条件
        输出条件 = 条件列表[选择索引]
        
        print(f"[条件切换] 已选择输出条件{选择索引+1}")
        
        return (输出条件,)

# 节点类映射
NODE_CLASS_MAPPINGS = {
    "DD-ConditionSwitcher": DDConditionSwitcher
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-ConditionSwitcher": "DD Condition Switcher"
}