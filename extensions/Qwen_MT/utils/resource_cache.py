"""
Resource caching utilities for ComfyUI plugin.
Provides caching for expensive operations like API clients and model loading.
"""

import time
import threading
from typing import Dict, Any, Optional, Callable
from openai import OpenAI
from .debug_utils import DebugUtils


class ResourceCache:
    """
    Thread-safe resource cache for expensive operations.
    """
    
    _cache: Dict[str, Any] = {}
    _cache_timestamps: Dict[str, float] = {}
    _cache_lock = threading.Lock()
    _cache_ttl = 3600  # 1 hour default TTL
    
    @classmethod
    def get(cls, key: str, factory: Callable[[], Any], ttl: Optional[int] = None) -> Any:
        """
        Get a cached resource or create it if not exists.
        
        Args:
            key: Cache key
            factory: Function to create the resource if not cached
            ttl: Time to live in seconds
            
        Returns:
            Cached or newly created resource
        """
        with cls._cache_lock:
            current_time = time.time()
            cache_ttl = ttl or cls._cache_ttl
            
            # Check if cache exists and is not expired
            if (key in cls._cache and 
                key in cls._cache_timestamps and
                current_time - cls._cache_timestamps[key] < cache_ttl):
                
                # DebugUtils.log(f"Cache hit for key: {key}")
                return cls._cache[key]
            
            # Create new resource
            # DebugUtils.log(f"Cache miss for key: {key}, creating new resource")
            resource = factory()
            
            # Store in cache
            cls._cache[key] = resource
            cls._cache_timestamps[key] = current_time
            
            return resource
    
    @classmethod
    def set(cls, key: str, value: Any) -> None:
        """
        Manually set a cache entry.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        with cls._cache_lock:
            cls._cache[key] = value
            cls._cache_timestamps[key] = time.time()
            # DebugUtils.log(f"Manually cached resource with key: {key}")
    
    @classmethod
    def invalidate(cls, key: str) -> bool:
        """
        Invalidate a cache entry.
        
        Args:
            key: Cache key to invalidate
            
        Returns:
            True if key was found and removed, False otherwise
        """
        with cls._cache_lock:
            removed = False
            if key in cls._cache:
                del cls._cache[key]
                removed = True
            if key in cls._cache_timestamps:
                del cls._cache_timestamps[key]
                
            if removed:
                pass
                # DebugUtils.log(f"Invalidated cache key: {key}")
            
            return removed
    
    @classmethod
    def clear(cls) -> None:
        """
        Clear all cache entries.
        """
        with cls._cache_lock:
            count = len(cls._cache)
            cls._cache.clear()
            cls._cache_timestamps.clear()
            DebugUtils.log(f"Cleared {count} cache entries")
    
    @classmethod
    def cleanup_expired(cls) -> int:
        """
        Remove expired cache entries.
        
        Returns:
            Number of expired entries removed
        """
        with cls._cache_lock:
            current_time = time.time()
            expired_keys = []
            
            for key, timestamp in cls._cache_timestamps.items():
                if current_time - timestamp >= cls._cache_ttl:
                    expired_keys.append(key)
            
            for key in expired_keys:
                if key in cls._cache:
                    del cls._cache[key]
                del cls._cache_timestamps[key]
            
            if expired_keys:
                DebugUtils.log(f"Cleaned up {len(expired_keys)} expired cache entries")
            
            return len(expired_keys)
    
    @classmethod
    def get_stats(cls) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        with cls._cache_lock:
            current_time = time.time()
            expired_count = 0
            
            for timestamp in cls._cache_timestamps.values():
                if current_time - timestamp >= cls._cache_ttl:
                    expired_count += 1
            
            return {
                "total_entries": len(cls._cache),
                "expired_entries": expired_count,
                "active_entries": len(cls._cache) - expired_count,
                "cache_ttl": cls._cache_ttl
            }
    
    @classmethod
    def cached(cls, ttl: Optional[int] = None):
        """
        Decorator for caching function results.
        
        Args:
            ttl: Time to live in seconds
            
        Returns:
            Decorator function
        """
        def decorator(func: Callable) -> Callable:
            def wrapper(*args, **kwargs):
                # Create cache key from function name and arguments
                key = f"{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
                
                def factory():
                    return func(*args, **kwargs)
                
                return cls.get(key, factory, ttl)
            
            return wrapper
        return decorator
    
    @classmethod
    def get_api_client(cls, api_key: str, base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1") -> OpenAI:
        """
        Get or create a cached API client.
        
        Args:
            api_key: API key for authentication
            base_url: Base URL for the API
            
        Returns:
            OpenAI client instance
        """
        # Create cache key based on api_key hash and base_url
        key = f"api_client:{hash(api_key)}:{base_url}"
        
        def factory():
            # DebugUtils.log("Creating new API client")
            # 禁用OpenAI客户端的HTTP日志记录
            import logging
            logging.getLogger("openai").setLevel(logging.WARNING)
            logging.getLogger("httpx").setLevel(logging.WARNING)
            logging.getLogger("httpcore").setLevel(logging.WARNING)
            
            return OpenAI(
                api_key=api_key,
                base_url=base_url
            )
        
        return cls.get(key, factory, ttl=1800)  # 30 minutes TTL for API clients
    
    @classmethod
    def set_cache_ttl(cls, ttl: int) -> None:
        """
        Set default cache TTL.
        
        Args:
            ttl: Time to live in seconds
        """
        cls._cache_ttl = ttl
        # DebugUtils.log(f"Cache TTL set to {ttl} seconds")
