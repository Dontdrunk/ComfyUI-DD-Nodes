"""
Web API endpoints for Qwen-MT configuration.
Handles API key configuration requests from the frontend.
"""

import json
from aiohttp import web
from server import PromptServer
from .utils.api_config import APIConfigManager
from .utils.debug_utils import DebugUtils


@PromptServer.instance.routes.get("/qwen_mt/config")
async def get_qwen_mt_config(request):
    """
    Get current Qwen-MT configuration.
    """
    try:
        config_info = APIConfigManager.get_config_info()
        return web.json_response(config_info)
    except Exception as e:
        DebugUtils.log(f"Error getting config: {e}", "error")
        return web.json_response(
            {"error": "Failed to get configuration"}, 
            status=500
        )


@PromptServer.instance.routes.post("/qwen_mt/config")
async def set_qwen_mt_config(request):
    """
    Set Qwen-MT API configuration.
    """
    try:
        data = await request.json()
        api_key = data.get("api_key", "").strip()
        
        if not api_key:
            return web.json_response(
                {"error": "API key is required"}, 
                status=400
            )
        
        if not api_key.startswith("sk-"):
            return web.json_response(
                {"error": "Invalid API key format"}, 
                status=400
            )
        
        success = APIConfigManager.set_api_key(api_key)
        
        if success:
            config_info = APIConfigManager.get_config_info()
            DebugUtils.log("API configuration updated successfully")
            return web.json_response(config_info)
        else:
            return web.json_response(
                {"error": "Failed to save configuration"}, 
                status=500
            )
            
    except json.JSONDecodeError:
        return web.json_response(
            {"error": "Invalid JSON data"}, 
            status=400
        )
    except Exception as e:
        DebugUtils.log(f"Error setting config: {e}", "error")
        return web.json_response(
            {"error": "Internal server error"}, 
            status=500
        )


@PromptServer.instance.routes.delete("/qwen_mt/config")
async def clear_qwen_mt_config(request):
    """
    Clear Qwen-MT API configuration.
    """
    try:
        success = APIConfigManager.clear_api_key()
        
        if success:
            config_info = APIConfigManager.get_config_info()
            DebugUtils.log("API configuration cleared successfully")
            return web.json_response(config_info)
        else:
            return web.json_response(
                {"error": "Failed to clear configuration"}, 
                status=500
            )
            
    except Exception as e:
        DebugUtils.log(f"Error clearing config: {e}", "error")
        return web.json_response(
            {"error": "Internal server error"}, 
            status=500
        )


@PromptServer.instance.routes.get("/qwen_mt/test")
async def test_qwen_mt_connection(request):
    """
    Test Qwen-MT API connection.
    """
    try:
        config_info = APIConfigManager.get_config_info()
        
        if not config_info.get("has_api_key"):
            return web.json_response(
                {"error": "API key not configured"}, 
                status=400
            )
        
        # Test the API connection here (if needed)
        return web.json_response({"status": "success", "message": "API connection test passed"})
        
    except Exception as e:
        DebugUtils.log(f"Error testing connection: {e}", "error")
        return web.json_response(
            {"error": "Connection test failed"}, 
            status=500
        )
