import torch
import folder_paths
import comfy.sd
import comfy.utils
import comfy.model_management as model_management
import sys
import gc
import psutil
from datetime import datetime
import time
from pathlib import Path

class DDModelOptimizer:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "模型文件": (folder_paths.get_filename_list("diffusion_models"), ),
                "智能模式": ("BOOLEAN", {"default": False}),
                "加载模式": ([
                    "标准加载",
                    "分步加载",
                ],),
                "优化模式": ([
                    "禁用优化",             # 改为更直观的名称
                    "FP8基础内存优化",      # fp8_e4m3fn
                    "FP8高速性能优化",      # fp8_e4m3fn_fast
                    "FP8稳定质量优化"       # fp8_e5m2
                ],),
            }
        }
    
    RETURN_TYPES = ("MODEL",)
    RETURN_NAMES = ("优化模型",)
    FUNCTION = "optimize_model"
    CATEGORY = "🍺DD系列节点"

    def get_system_info(self):
        """获取系统配置信息"""
        system_info = {
            "total_memory": psutil.virtual_memory().total / (1024**3),  # GB
            "available_memory": psutil.virtual_memory().available / (1024**3),  # GB
            "cpu_count": psutil.cpu_count(logical=False),
            "gpu_info": None,
        }
        
        if torch.cuda.is_available():
            system_info["gpu_info"] = {
                "name": torch.cuda.get_device_name(),
                "total_memory": torch.cuda.get_device_properties(0).total_memory / (1024**3),  # GB
                "free_memory": torch.cuda.memory_allocated(0) / (1024**3),  # GB
            }
        return system_info

    def determine_smart_options(self, system_info, model_path):
        """根据系统配置和模型智能确定最佳选项
        
        Args:
            system_info: 系统信息
            model_path: 模型路径
        """
        try:
            # 将字符串路径转换为Path对象
            path_obj = Path(model_path)
            # 安全获取文件大小
            if path_obj.exists():
                model_size = path_obj.stat().st_size / (1024**3)  # GB
                print(f"\n模型文件大小: {model_size:.2f}GB")
            else:
                print(f"警告: 模型文件不存在: {model_path}")
                model_size = 0
                
        except Exception as e:
            print(f"警告: 无法获取模型文件信息: {str(e)}")
            model_size = 0
        
        options = {
            "加载模式": "标准加载",
            "优化模式": "禁用优化"
        }
        
        # 获取显存和内存信息
        vram = 0
        ram = system_info["total_memory"]
        
        if system_info["gpu_info"]:
            vram = system_info["gpu_info"]["total_memory"]
            print(f"GPU总显存: {vram:.2f}GB")
            print(f"系统总内存: {ram:.2f}GB")
        
        # 设置缓冲系数
        vram_scale_factor = 1.5
        ram_scale_factor = 1.5
        
        # 决定加载模式
        # 如果模型大小大于可用显存的70%或大于显存总量，使用分步加载
        if model_size > vram * 0.7:
            options["加载模式"] = "分步加载"
            print("由于模型大小超过可用显存的70%，选择分步加载模式")
        
        # 应用新的优化规则
        if model_size <= vram:
            options["优化模式"] = "禁用优化"
            print("模型完全适配显存，获得最佳质量")
            
        elif model_size <= vram * vram_scale_factor and model_size <= ram:
            options["优化模式"] = "禁用优化"
            print("模型可通过显存+虚拟内存加载，保持最佳质量")
            
        elif model_size > vram * vram_scale_factor and model_size <= ram:
            options["优化模式"] = "FP8稳定质量优化"
            print("模型显著超出显存但适配内存，启动质量优先优化")
            
        elif model_size > ram and model_size <= ram * ram_scale_factor:
            options["优化模式"] = "FP8基础内存优化"
            print("模型超出物理内存，启动内存优化")
            
        else:  # model_size > ram * ram_scale_factor
            options["优化模式"] = "FP8高速性能优化"
            print("模型严重超出物理内存，启动性能优先优化")
        
        return options

    def show_step_progress(self, step_name, progress=0):
        """显示步骤进度
        Args:
            step_name: 步骤名称
            progress: 进度值(0-100)
        """
        bar_width = 30
        filled = int(bar_width * progress / 100)
        bar = '#' * filled + '-' * (bar_width - filled)
        sys.stdout.write(f'\r{step_name} [{bar}] {progress}%')
        sys.stdout.flush()
        if progress >= 100:
            print()

    def optimize_model(self, 模型文件, 智能模式, 加载模式, 优化模式):
        """
        模型优化加载主函数
        Args:
            模型文件: 要加载的模型文件名
            智能模式: 是否启用智能模式
            加载模式: 标准加载或分步加载
            优化模式: 禁用优化/FP8基础内存优化/FP8高速性能优化/FP8稳定质量优化
        Returns:
            优化后的模型
        """
        start_time = time.time()
        print(f"\n开始处理模型: {模型文件}")
        print(f"处理时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # 获取模型路径
            model_path = folder_paths.get_full_path_or_raise("diffusion_models", 模型文件)

            # 如果启用智能模式，重新确定加载模式和优化模式
            if 智能模式:
                system_info = self.get_system_info()
                smart_options = self.determine_smart_options(system_info, model_path)
                加载模式 = smart_options["加载模式"]
                优化模式 = smart_options["优化模式"]
                print("\n智能模式已启用:")
                print(f"系统配置: {'GPU: ' + system_info['gpu_info']['name'] if system_info['gpu_info'] else 'CPU'}")
                print(f"自动选择 - 加载模式: {加载模式}")
                print(f"自动选择 - 优化模式: {优化模式}")

            # 设置优化选项
            model_options = {}
            needs_optimization = True  # 是否需要进行优化处理

            if 优化模式 == "FP8基础内存优化":
                print("使用 FP8 基础内存优化模式")
                model_options["dtype"] = torch.float8_e4m3fn
            elif 优化模式 == "FP8高速性能优化":
                print("使用 FP8 高速性能优化模式")
                model_options["dtype"] = torch.float8_e4m3fn
                model_options["fp8_optimizations"] = True
            elif 优化模式 == "FP8稳定质量优化":
                print("使用 FP8 稳定质量优化模式")
                model_options["dtype"] = torch.float8_e5m2
            else:
                print("优化已禁用，使用原始加载模式")
                needs_optimization = False

            if 加载模式 == "标准加载":
                print("使用标准加载模式...")
                self.show_step_progress("加载模型", 0)
                model = comfy.sd.load_diffusion_model(model_path, model_options=model_options)
                self.show_step_progress("加载模型", 100)
                
            else:
                print("使用分步加载模式...")
                
                # 第一步：加载模型文件
                print("步骤1: 加载模型文件")
                self.show_step_progress("加载文件", 0)
                state_dict = comfy.utils.load_torch_file(model_path)
                self.show_step_progress("加载文件", 100)
                
                # 第二步：预处理权重
                print("\n步骤2: 预处理权重")
                total_keys = len(state_dict)
                processed = 0
                update_interval = max(1, total_keys // 100)  # 确保至少显示100个更新点

                if needs_optimization:  # 只在需要优化时进行处理
                    for key, value in state_dict.items():
                        if torch.is_tensor(value):
                            state_dict[key] = value.to(model_options["dtype"])
                        processed += 1
                        if processed % update_interval == 0:
                            progress = int(processed / total_keys * 100)
                            self.show_step_progress("处理权重", progress)
                self.show_step_progress("处理权重", 100)
                
                # 第三步：创建模型
                print("\n步骤3: 构建模型")
                self.show_step_progress("构建模型", 0)
                model = comfy.sd.load_diffusion_model_state_dict(state_dict, model_options)
                self.show_step_progress("构建模型", 100)

            # 清理内存
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            end_time = time.time()
            duration = end_time - start_time
            print(f"\n模型加载完成！用时: {duration:.2f}秒")
            return (model,)
            
        except Exception as e:
            print(f"\n模型加载失败: {str(e)}")
            raise e

NODE_CLASS_MAPPINGS = {
    "DD-ModelOptimizer": DDModelOptimizer
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-ModelOptimizer": "DD 模型优化加载"
}
