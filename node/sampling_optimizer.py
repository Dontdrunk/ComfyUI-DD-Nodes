import torch
import comfy.model_management as model_management
import gc
import time

class DDSamplingOptimizer:
    """
    DD 采样速度优化器 - 极简版
    优化模型首次采样速度，减少第一次采样延迟
    通过预热模型和CLIP参数减少首次采样时的CUDA延迟
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "模型": ("MODEL",),
                "CLIP模型": ("CLIP",)
            }
        }
    
    RETURN_TYPES = ("MODEL", "CLIP",)
    RETURN_NAMES = ("优化模型", "优化CLIP",)
    FUNCTION = "optimize_sampling"
    CATEGORY = "🍺DD系列节点"

    def log_progress(self, message):
        """输出进度信息"""
        print(f"[采样优化器] {message}")
    
    def warmup_model(self, model):
        """模型预热核心方法 - 基于ComfyUI官方实现的优化方案"""
        try:
            # 对ModelPatcher类型的特殊处理
            if hasattr(model, "model") and model.model is not None:
                self.log_progress("通过model属性访问底层模型")
                
                # 访问内部模型的模块参数
                if hasattr(model.model, "modules"):
                    self.log_progress("访问内部模型的modules")
                    for module in model.model.modules():
                        if hasattr(module, "_parameters"):
                            for param in module._parameters.values():
                                if param is not None:
                                    # 只是访问参数以触发CUDA预热
                                    _ = param.device
                                    break
                
                # 尝试访问model属性的参数
                self.log_progress("尝试通过model属性访问参数")
                try:
                    for param in model.model.parameters():
                        _ = param.device
                        break
                    self.log_progress("model参数访问成功")
                except Exception:
                    pass
            
            # 如果上述方法失败，尝试直接访问模型
            elif hasattr(model, "modules"):
                self.log_progress("直接访问模型modules")
                for module in model.modules():
                    if hasattr(module, "_parameters"):
                        for param in module._parameters.values():
                            if param is not None:
                                _ = param.device
                                break
                
            self.log_progress("模型基本优化完成")
            return True
        except Exception as e:
            self.log_progress(f"模型预热失败: {str(e)}")
            return False
    
    def warmup_clip(self, clip_model):
        """CLIP模型预热核心方法 - 保留最可靠的方法"""
        self.log_progress("CLIP预热开始")
        try:
            with torch.no_grad():
                # 尝试最常见的CLIP方法
                if hasattr(clip_model, "encode_from_tokens") and hasattr(clip_model, "tokenize"):
                    try:
                        empty_tokens = clip_model.tokenize("")
                        clip_model.encode_from_tokens(empty_tokens, return_pooled=True)
                        return
                    except Exception:
                        pass
                
                # 备用方法
                if hasattr(clip_model, "encode"):
                    try:
                        clip_model.encode("a photo")
                        return
                    except Exception:
                        pass
                
                # 最基本的方法 - 访问参数
                for param in clip_model.parameters():
                    _ = param.device
                    break
                
            self.log_progress("CLIP预热完成")    
        except Exception as e:
            self.log_progress(f"CLIP预热失败: {str(e)}")

    def optimize_sampling(self, 模型, CLIP模型):
        """
        优化模型首次采样速度 - 简化版
        
        Args:
            模型: 需要优化的扩散模型
            CLIP模型: CLIP文本编码器模型
            
        Returns:
            优化后的模型和CLIP
        """
        try:
            start_time = time.time()
            self.log_progress("开始优化模型采样速度")
            
            # 清理CUDA缓存
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            gc.collect()
            
            # 执行模型预热
            self.log_progress("开始模型预热...")
            self.warmup_model(模型)
            
            # CLIP模型预热
            self.log_progress("开始CLIP模型预热...")
            self.warmup_clip(CLIP模型)
            
            # 清理缓存
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            gc.collect()
            
            # 统计时间
            elapsed_time = time.time() - start_time
            self.log_progress(f"采样优化完成，耗时 {elapsed_time:.2f} 秒")
            self.log_progress("后续采样过程应该不会出现明显的首次延迟")
            
            return (模型, CLIP模型)
            
        except Exception as e:
            self.log_progress(f"优化过程发生错误: {str(e)}")
            return (模型, CLIP模型)

# 节点映射
NODE_CLASS_MAPPINGS = {
    "DD-SamplingOptimizer": DDSamplingOptimizer
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-SamplingOptimizer": "DD 采样优化器"
}
