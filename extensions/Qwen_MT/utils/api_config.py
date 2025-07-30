"""
API Configuration Manager for Qwen-MT plugin.
Handles secure storage and retrieval of API keys.
"""

import os
import json
from typing import Optional, Dict
from .debug_utils import DebugUtils


class APIConfigManager:
    """
    Manages API configuration for Qwen-MT plugin.
    """
    
    CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "qwen_mt_config.json")
    DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    
    @classmethod
    def get_api_key(cls) -> Optional[str]:
        """
        Get the stored API key.
        
        Returns:
            API key if exists, None otherwise
        """
        try:
            if os.path.exists(cls.CONFIG_FILE):
                with open(cls.CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    return config.get('api_key')
        except Exception as e:
            DebugUtils.log(f"Failed to read API config: {e}", "error")
        return None
    
    @classmethod
    def set_api_key(cls, api_key: str) -> bool:
        """
        Store the API key securely.
        
        Args:
            api_key: API key to store
            
        Returns:
            True if successful, False otherwise
        """
        try:
            config = {}
            if os.path.exists(cls.CONFIG_FILE):
                with open(cls.CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            
            config['api_key'] = api_key
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(cls.CONFIG_FILE), exist_ok=True)
            
            with open(cls.CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            DebugUtils.log("API key saved successfully")
            return True
            
        except Exception as e:
            DebugUtils.log(f"Failed to save API config: {e}", "error")
            return False
    
    @classmethod
    def clear_api_key(cls) -> bool:
        """
        Clear the stored API key.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            if os.path.exists(cls.CONFIG_FILE):
                with open(cls.CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                
                if 'api_key' in config:
                    del config['api_key']
                    
                    with open(cls.CONFIG_FILE, 'w', encoding='utf-8') as f:
                        json.dump(config, f, ensure_ascii=False, indent=2)
            
            DebugUtils.log("API key cleared successfully")
            return True
            
        except Exception as e:
            DebugUtils.log(f"Failed to clear API config: {e}", "error")
            return False
    
    @classmethod
    def get_base_url(cls) -> str:
        """
        Get the base URL for API requests.
        
        Returns:
            Base URL string
        """
        return cls.DEFAULT_BASE_URL
    
    @classmethod
    def is_configured(cls) -> bool:
        """
        Check if API is properly configured.
        
        Returns:
            True if configured, False otherwise
        """
        api_key = cls.get_api_key()
        return api_key is not None and api_key.strip() != ""
    
    @classmethod
    def get_config_info(cls) -> Dict[str, str]:
        """
        Get configuration information for display.
        
        Returns:
            Dictionary with config info
        """
        api_key = cls.get_api_key()
        is_configured = cls.is_configured()
        
        return {
            "configured": is_configured,
            "has_api_key": is_configured,
            "api_key_preview": f"sk-***{api_key[-6:]}" if api_key and len(api_key) > 6 else "未配置",
            "base_url": cls.get_base_url(),
            "console_url": "https://bailian.console.aliyun.com/?tab=home#/home"
        }
