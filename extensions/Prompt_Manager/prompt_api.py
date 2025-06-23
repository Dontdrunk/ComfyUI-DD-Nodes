"""
ComfyUI-DD-Nodes 提示词管理器 API
处理提示词数据的服务器端操作，包括保存、读取和同步JSON文件
"""

import os
import json
import asyncio
from datetime import datetime
from aiohttp import web
import logging

# 尝试导入ComfyUI的PromptServer，如果失败则使用备用方案
try:
    from server import PromptServer
    COMFYUI_AVAILABLE = True
except ImportError:
    print("警告: 无法导入ComfyUI的PromptServer，API功能将不可用")
    COMFYUI_AVAILABLE = False
    PromptServer = None

# 异步文件操作的备用实现
try:
    import aiofiles
    AIOFILES_AVAILABLE = True
except ImportError:
    print("警告: aiofiles不可用，将使用同步文件操作")
    AIOFILES_AVAILABLE = False

# 设置日志
logger = logging.getLogger(__name__)

class PromptManagerAPI:
    def __init__(self):
        self.prompts_file = os.path.join(os.path.dirname(__file__), "prompts.json")
        if COMFYUI_AVAILABLE:
            self.setup_routes()
        else:
            logger.warning("ComfyUI不可用，API路由未注册")
    
    def setup_routes(self):
        """设置API路由"""
        if not COMFYUI_AVAILABLE or not PromptServer.instance:
            logger.error("PromptServer实例不可用")
            return
            
        @PromptServer.instance.routes.post("/dd_nodes/save_prompts")
        async def save_prompts(request):
            try:
                data = await request.json()
                prompts = data.get('prompts', [])
                
                # 获取标签数据（如果有的话）
                tags = data.get('tags', {})
                
                # 准备要保存的数据
                prompts_data = {
                    "version": "2.4.0",
                    "exportTime": datetime.now().isoformat(),
                    "description": "ComfyUI-DD-Nodes 提示词管理器数据文件 - 自动同步",
                    "totalCount": len(prompts),
                    "prompts": prompts,
                    "tags": tags  # 添加标签数据
                }
                
                # 写入JSON文件
                success = await self.write_prompts_file(prompts_data)
                
                if success:
                    logger.info(f"成功保存 {len(prompts)} 个提示词到JSON文件")
                    return web.json_response({
                        "success": True, 
                        "message": f"成功保存 {len(prompts)} 个提示词",
                        "count": len(prompts)
                    })
                else:
                    return web.json_response({
                        "success": False, 
                        "error": "写入文件失败"
                    }, status=500)
                
            except Exception as e:
                logger.error(f"保存提示词失败: {e}")
                return web.json_response({
                    "success": False, 
                    "error": str(e)
                }, status=500)
        
        @PromptServer.instance.routes.get("/dd_nodes/load_prompts")
        async def load_prompts(request):
            try:
                prompts_data = await self.read_prompts_file()
                
                if prompts_data:
                    prompts = prompts_data.get('prompts', [])
                    tags = prompts_data.get('tags', {})  # 获取标签数据
                    logger.info(f"成功加载 {len(prompts)} 个提示词从JSON文件")
                    return web.json_response({
                        "success": True,
                        "data": prompts_data,
                        "prompts": prompts,
                        "tags": tags,  # 返回标签数据
                        "count": len(prompts)
                    })
                else:
                    return web.json_response({
                        "success": True,
                        "data": None,
                        "prompts": [],
                        "tags": {},  # 空标签数据
                        "count": 0
                    })
                    
            except Exception as e:
                logger.error(f"加载提示词失败: {e}")
                return web.json_response({
                    "success": False, 
                    "error": str(e)
                }, status=500)
        
        @PromptServer.instance.routes.post("/dd_nodes/sync_prompts")
        async def sync_prompts(request):
            """同步提示词数据（增量更新）"""
            try:
                data = await request.json()
                prompts = data.get('prompts', [])
                tags = data.get('tags', {})
                operation = data.get('operation', 'full_sync')  # full_sync, add, update, delete
                
                if operation == 'full_sync':
                    # 全量同步
                    prompts_data = {
                        "version": "2.4.0",
                        "exportTime": datetime.now().isoformat(),
                        "description": "ComfyUI-DD-Nodes 提示词管理器数据文件 - 自动同步",
                        "totalCount": len(prompts),
                        "prompts": prompts,
                        "tags": tags
                    }
                    success = await self.write_prompts_file(prompts_data)
                    message = f"全量同步 {len(prompts)} 个提示词和 {len(tags)} 个标签"
                
                else:
                    # 增量更新（预留接口）
                    current_data = await self.read_prompts_file()
                    if current_data:
                        # 这里可以实现增量更新逻辑
                        success = await self.write_prompts_file(current_data)
                        message = "增量同步完成"
                    else:
                        success = False
                        message = "增量同步失败：无现有数据"
                
                if success:
                    logger.info(message)
                    return web.json_response({
                        "success": True,
                        "message": message
                    })
                else:
                    return web.json_response({
                        "success": False,
                        "error": message
                    }, status=500)
                
            except Exception as e:
                logger.error(f"同步提示词失败: {e}")
                return web.json_response({
                    "success": False,
                    "error": str(e)
                }, status=500)
        
        @PromptServer.instance.routes.post("/dd_nodes/save_tags")
        async def save_tags(request):
            """保存标签数据到JSON文件"""
            try:
                data = await request.json()
                tags = data.get('tags', {})
                
                # 读取现有的数据
                current_data = await self.read_prompts_file()
                if current_data:
                    # 更新标签数据，保留现有提示词
                    current_data['tags'] = tags
                    current_data['exportTime'] = datetime.now().isoformat()
                else:
                    # 创建新的数据结构
                    current_data = {
                        "version": "2.4.0",
                        "exportTime": datetime.now().isoformat(),
                        "description": "ComfyUI-DD-Nodes 提示词管理器数据文件 - 标签更新",
                        "totalCount": 0,
                        "prompts": [],
                        "tags": tags
                    }
                
                # 写入JSON文件
                success = await self.write_prompts_file(current_data)
                
                if success:
                    logger.info(f"成功保存 {len(tags)} 个标签到JSON文件")
                    return web.json_response({
                        "success": True,
                        "message": f"成功保存 {len(tags)} 个标签",
                        "count": len(tags)
                    })
                else:
                    return web.json_response({
                        "success": False,
                        "error": "写入文件失败"
                    }, status=500)
                    
            except Exception as e:
                logger.error(f"保存标签失败: {e}")
                return web.json_response({
                    "success": False,
                    "error": str(e)
                }, status=500)
        
        @PromptServer.instance.routes.get("/dd_nodes/load_tags")
        async def load_tags(request):
            """从JSON文件加载标签数据"""
            try:
                prompts_data = await self.read_prompts_file()
                
                if prompts_data:
                    tags = prompts_data.get('tags', {})
                    logger.info(f"成功加载 {len(tags)} 个标签从JSON文件")
                    return web.json_response({
                        "success": True,
                        "tags": tags,
                        "count": len(tags)
                    })
                else:
                    return web.json_response({
                        "success": True,
                        "tags": {},
                        "count": 0
                    })
                    
            except Exception as e:
                logger.error(f"加载标签失败: {e}")
                return web.json_response({
                    "success": False,
                    "error": str(e)
                }, status=500)
    
    async def read_prompts_file(self):
        """读取提示词JSON文件"""
        try:
            if os.path.exists(self.prompts_file):
                if AIOFILES_AVAILABLE:
                    # 使用异步文件操作
                    async with aiofiles.open(self.prompts_file, 'r', encoding='utf-8') as f:
                        content = await f.read()
                        return json.loads(content)
                else:
                    # 使用同步文件操作作为备用
                    with open(self.prompts_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        return json.loads(content)
            return None
        except Exception as e:
            logger.error(f"读取提示词文件失败: {e}")
            return None
    
    async def write_prompts_file(self, data):
        """写入提示词JSON文件"""
        try:
            # 确保目录存在
            os.makedirs(os.path.dirname(self.prompts_file), exist_ok=True)
            
            if AIOFILES_AVAILABLE:
                # 使用异步文件操作
                async with aiofiles.open(self.prompts_file, 'w', encoding='utf-8') as f:
                    await f.write(json.dumps(data, indent=2, ensure_ascii=False))
            else:
                # 使用同步文件操作作为备用
                with open(self.prompts_file, 'w', encoding='utf-8') as f:
                    f.write(json.dumps(data, indent=2, ensure_ascii=False))
            
            logger.info(f"提示词文件已更新: {self.prompts_file}")
            return True
        except Exception as e:
            logger.error(f"写入提示词文件失败: {e}")
            return False
    
    def get_prompts_file_path(self):
        """获取提示词文件路径"""
        return self.prompts_file

# 安全地创建API实例
prompt_manager_api = None
try:
    prompt_manager_api = PromptManagerAPI()
    print("PromptManagerAPI 已成功初始化")
except Exception as e:
    print(f"初始化PromptManagerAPI失败: {e}")

# 导出供__init__.py使用
__all__ = ['prompt_manager_api', 'PromptManagerAPI']
