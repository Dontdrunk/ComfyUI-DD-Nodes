"""
Debug utilities for ComfyUI plugin development.
Provides logging, tensor analysis, and performance profiling tools.
"""

import time
import functools
from typing import Any, Optional
import torch


class DebugUtils:
    """
    Debug utilities for plugin development.
    """
    
    DEBUG_ENABLED = False  # 默认关闭调试模式，保持控制台简洁
    
    @classmethod
    def log(cls, message: str, level: str = "info") -> None:
        """
        Log a debug message.
        
        Args:
            message: Message to log
            level: Log level (info, warning, error)
        """
        if not cls.DEBUG_ENABLED:
            return
            
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        prefix = f"[{timestamp}] [ComfyUI-Qwen-MT] [{level.upper()}]"
        print(f"{prefix} {message}")
    
    @classmethod
    def log_tensor_stats(cls, tensor: torch.Tensor, name: str) -> None:
        """
        Log tensor statistics for debugging.
        
        Args:
            tensor: Tensor to analyze
            name: Name/description of the tensor
        """
        if not cls.DEBUG_ENABLED:
            return
            
        if not isinstance(tensor, torch.Tensor):
            cls.log(f"{name}: Not a tensor, type: {type(tensor)}", "warning")
            return
            
        stats = {
            "shape": list(tensor.shape),
            "dtype": str(tensor.dtype),
            "device": str(tensor.device),
            "min": float(tensor.min()) if tensor.numel() > 0 else "empty",
            "max": float(tensor.max()) if tensor.numel() > 0 else "empty",
            "mean": float(tensor.mean()) if tensor.numel() > 0 else "empty",
            "std": float(tensor.std()) if tensor.numel() > 0 else "empty"
        }
        
        cls.log(f"Tensor {name}: {stats}")
    
    @classmethod 
    def visualize_tensor(cls, tensor: torch.Tensor, filename: str) -> None:
        """
        Save tensor as image for visualization.
        
        Args:
            tensor: Tensor to visualize
            filename: Output filename
        """
        if not cls.DEBUG_ENABLED:
            return
            
        try:
            import torchvision.transforms as transforms
            from PIL import Image
            
            # Convert tensor to PIL Image format
            if tensor.dim() == 4:  # BCHW format
                tensor = tensor[0]  # Take first batch
            elif tensor.dim() == 3 and tensor.shape[0] in [1, 3, 4]:  # CHW format
                pass
            elif tensor.dim() == 3:  # HWC format
                tensor = tensor.permute(2, 0, 1)
            
            # Normalize to [0, 1]
            tensor = (tensor - tensor.min()) / (tensor.max() - tensor.min() + 1e-8)
            
            # Convert to PIL and save
            to_pil = transforms.ToPILImage()
            image = to_pil(tensor)
            image.save(filename)
            
            cls.log(f"Tensor visualization saved to {filename}")
            
        except Exception as e:
            cls.log(f"Failed to visualize tensor: {e}", "error")
    
    @classmethod
    def timeit(cls, func):
        """
        Decorator for timing function execution.
        
        Args:
            func: Function to time
            
        Returns:
            Wrapped function with timing
        """
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if not cls.DEBUG_ENABLED:
                return func(*args, **kwargs)
                
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            
            execution_time = end_time - start_time
            cls.log(f"Function {func.__name__} executed in {execution_time:.4f}s")
            
            return result
        return wrapper
    
    @classmethod
    def memory_usage(cls) -> dict:
        """
        Get current memory usage information.
        
        Returns:
            Dictionary with memory usage stats
        """
        if not torch.cuda.is_available():
            return {"cuda_available": False}
            
        stats = {
            "cuda_available": True,
            "allocated": torch.cuda.memory_allocated(),
            "cached": torch.cuda.memory_reserved(),
            "max_allocated": torch.cuda.max_memory_allocated(),
            "max_cached": torch.cuda.max_memory_reserved()
        }
        
        # Convert to MB
        for key in stats:
            if key != "cuda_available" and isinstance(stats[key], int):
                stats[key] = stats[key] / (1024 * 1024)
                
        return stats
    
    @classmethod
    def log_memory_usage(cls, prefix: str = "") -> None:
        """
        Log current memory usage.
        
        Args:
            prefix: Prefix for log message
        """
        if not cls.DEBUG_ENABLED:
            return
            
        stats = cls.memory_usage()
        if stats["cuda_available"]:
            cls.log(f"{prefix} Memory - Allocated: {stats['allocated']:.1f}MB, "
                   f"Cached: {stats['cached']:.1f}MB")
        else:
            cls.log(f"{prefix} CUDA not available")
    
    @classmethod
    def cleanup_memory(cls) -> None:
        """
        Clean up GPU memory.
        """
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            cls.log("GPU memory cache cleared")
    
    @classmethod
    def enable_debug(cls, enabled: bool = True) -> None:
        """
        Enable or disable debug logging.
        
        Args:
            enabled: Whether to enable debug logging
        """
        cls.DEBUG_ENABLED = enabled
        cls.log(f"Debug logging {'enabled' if enabled else 'disabled'}")
