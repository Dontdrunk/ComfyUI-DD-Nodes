import os
import json
from aiohttp import web
import aiohttp
from server import PromptServer

# 提示词数据存储路径
PROMPTS_FILE = os.path.join(os.path.dirname(__file__), "prompts.json")

class PromptEmbedderAPI:
    def __init__(self):
        self.prompts = self.load_prompts()
    
    def load_prompts(self):
        """从JSON文件加载提示词"""
        if os.path.exists(PROMPTS_FILE):
            try:
                with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading prompts: {e}")
                return []
        return []
    
    def save_prompts(self):
        """保存提示词到JSON文件"""
        try:
            os.makedirs(os.path.dirname(PROMPTS_FILE), exist_ok=True)
            with open(PROMPTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.prompts, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error saving prompts: {e}")
            return False
    
    async def get_prompts(self, request):
        """获取所有提示词"""
        return web.json_response(self.prompts)
    
    async def save_prompts_api(self, request):
        """保存提示词列表"""
        try:
            data = await request.json()
            self.prompts = data
            success = self.save_prompts()
            if success:
                return web.json_response({"status": "success"})
            else:
                return web.json_response({"status": "error", "message": "Failed to save prompts"}, status=500)
        except Exception as e:
            return web.json_response({"status": "error", "message": str(e)}, status=400)

# 创建API实例
prompt_api = PromptEmbedderAPI()

# 注册路由
PromptServer.instance.routes.get("/prompt_embedder/prompts")(prompt_api.get_prompts)
PromptServer.instance.routes.post("/prompt_embedder/prompts")(prompt_api.save_prompts_api)
