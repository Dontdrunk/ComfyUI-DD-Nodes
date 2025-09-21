import os
from pathlib import Path


class DDTxtFileMerger:
    """
    DD TXT文件合并器
    将指定文件夹及其子文件夹中的所有TXT文件合并成一个文本内容
    """
    
    def __init__(self):
        pass
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "input_folder": ("STRING", {
                    "default": "",
                    "multiline": False,
                    "placeholder": "输入文件夹路径，例如: C:\\texts"
                }),
            }
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("merged_text",)
    FUNCTION = "merge_txt_files"
    CATEGORY = "🍺DD系列节点/文本处理"
    
    def merge_txt_files(self, input_folder):
        """
        合并文件夹中的所有TXT文件，返回合并后的文本内容
        """
        try:
            # 验证输入文件夹
            if not input_folder or not os.path.exists(input_folder):
                return (f"错误：输入文件夹不存在: {input_folder}",)
            
            # 递归查找所有txt文件
            txt_files = []
            for root, dirs, files in os.walk(input_folder):
                for file in files:
                    if file.lower().endswith('.txt'):
                        txt_files.append(os.path.join(root, file))
            
            if not txt_files:
                return (f"警告：在文件夹 {input_folder} 中未找到任何TXT文件",)
            
            # 按路径排序，确保合并顺序一致
            txt_files.sort()
            
            # 合并文件内容
            merged_content = []
            processed_files = 0
            
            for txt_file in txt_files:
                try:
                    # 尝试以UTF-8编码读取文件，失败时尝试其他编码
                    content = None
                    for encoding in ['utf-8', 'gbk', 'gb2312', 'utf-8-sig']:
                        try:
                            with open(txt_file, 'r', encoding=encoding, errors='ignore') as f:
                                content = f.read().strip()
                            break
                        except UnicodeDecodeError:
                            continue
                    
                    if content:  # 只处理非空文件
                        # 获取相对于输入文件夹的相对路径
                        relative_path = os.path.relpath(txt_file, input_folder)
                        merged_content.append(f"=== {relative_path} ===")
                        merged_content.append(content)
                        merged_content.append("")  # 空行分隔
                        processed_files += 1
                
                except Exception as e:
                    print(f"警告：无法读取文件 {txt_file}: {str(e)}")
                    continue
            
            if not merged_content:
                return (f"错误：所有TXT文件都为空或无法读取",)
            
            # 合并所有内容为一个字符串
            final_text = '\n'.join(merged_content)
            
            success_msg = f"成功合并 {processed_files} 个TXT文件"
            print(success_msg)
            
            return (final_text,)
                
        except Exception as e:
            return (f"错误：处理过程中发生异常: {str(e)}",)


# 导出节点映射
NODE_CLASS_MAPPINGS = {
    "DD-TxtFileMerger": DDTxtFileMerger,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-TxtFileMerger": "DD TXT File Merger",
}