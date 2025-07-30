"""
Qwen-MT Translation Nodes for ComfyUI
Implements machine translation using Alibaba Cloud's Qwen-MT model.
"""

import os
import json
import torch
import logging
from typing import Dict, List, Any, Tuple, Optional
from openai import OpenAI

# 修改导入路径以适配DD-NODES项目结构
from ..extensions.Qwen_MT.utils.language_utils import SUPPORTED_LANGUAGES
from ..extensions.Qwen_MT.utils.debug_utils import DebugUtils
from ..extensions.Qwen_MT.utils.resource_cache import ResourceCache
from ..extensions.Qwen_MT.utils.api_config import APIConfigManager

# 禁用HTTP相关的详细日志记录，保持控制台简洁
logging.getLogger("openai").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)


class QwenMTTranslatorNode:
    """
    通义千问翻译节点 - 支持多种翻译模式
    """
    
    CATEGORY = "🍺DD系列节点/🌐翻译"
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "文本": ("STRING", {
                    "multiline": True,
                    "dynamicPrompts": True,
                    "default": "请输入要翻译的文本"
                }),
                "源语言": (list(SUPPORTED_LANGUAGES.keys()) + ["自动"], {
                    "default": "自动"
                }),
                "目标语言": (list(SUPPORTED_LANGUAGES.keys()), {
                    "default": "英语"
                }),
                "翻译模式": (["通用翻译", "术语翻译", "领域翻译"], {
                    "default": "通用翻译"
                }),
                "模型": (["qwen-mt-plus", "qwen-mt-turbo"], {
                    "default": "qwen-mt-turbo"
                })
            },
            "optional": {
                "模式配置": ("STRING", {
                    "multiline": True,
                    "default": "根据翻译模式自动调整：\n\n通用翻译：无需额外配置\n\n术语翻译：请输入JSON格式的术语词典\n[\n  {\n    \"source\": \"术语\",\n    \"target\": \"terminology\"\n  }\n]\n\n领域翻译：请输入领域提示文本\n例如：The text is from IT domain. Pay attention to technical terminologies when translating."
                })
            },
            "hidden": {
                "unique_id": "UNIQUE_ID"
            }
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("翻译结果",)
    FUNCTION = "translate_text"
    
    @classmethod
    def IS_CHANGED(cls, **kwargs):
        # Force re-evaluation when API config changes
        config_info = APIConfigManager.get_config_info()
        return config_info["api_key_preview"]
    
    @classmethod
    def VALIDATE_INPUTS(cls, **kwargs):
        # 简化验证逻辑，主要检查API配置
        # 其他验证在运行时进行，避免节点连接时的验证问题
        
        # 检查API配置
        if not APIConfigManager.is_configured():
            return "API密钥未配置，请点击节点底部的配置按钮设置API密钥"
        
        # 对于术语翻译的特殊验证
        translation_mode = kwargs.get("翻译模式", "通用翻译")
        mode_config = kwargs.get("模式配置", "")
        
        if isinstance(translation_mode, str) and translation_mode == "术语翻译":
            if isinstance(mode_config, str) and mode_config.strip():
                try:
                    term_list = json.loads(mode_config)
                    if not isinstance(term_list, list):
                        return "术语翻译模式下，模式配置必须是JSON数组格式"
                    
                    for term in term_list:
                        if not isinstance(term, dict):
                            return "每个术语必须是JSON对象"
                        if "source" not in term or "target" not in term:
                            return "每个术语必须包含'source'和'target'字段"
                            
                except json.JSONDecodeError:
                    return "术语翻译模式下，模式配置必须是有效的JSON格式"
            
        return True
    
    def translate_text(self, **kwargs) -> Tuple[str]:
        """
        翻译文本使用通义千问MT模型。
        """
        try:
            # 获取参数值并处理中文参数名
            text = kwargs.get("文本", "")
            source_lang = kwargs.get("源语言", "auto")
            target_lang = kwargs.get("目标语言", "英语")
            translation_mode = kwargs.get("翻译模式", "通用翻译")
            model = kwargs.get("模型", "qwen-mt-turbo")
            
            # 运行时验证输入
            if not isinstance(text, str):
                return (f"错误：输入文本类型不正确，期望字符串，得到 {type(text)}",)
            
            if not text or text.strip() == "":
                return ("错误：输入文本不能为空",)
            
            if len(text) > 10000:
                return ("错误：文本长度不能超过10,000个字符",)
            
            # 验证语言选择
            if source_lang == target_lang and source_lang != "自动":
                return ("错误：源语言和目标语言不能相同",)
            
            # 从配置管理器获取API配置
            api_key = APIConfigManager.get_api_key()
            base_url = APIConfigManager.get_base_url()
            
            if not api_key:
                return ("API密钥未配置，请点击节点底部的配置按钮设置API密钥",)
                
        except Exception as e:
            return (f"参数验证错误：{str(e)}",)
        
        # 获取模式配置参数
        mode_config = kwargs.get("模式配置", "")
        
        # 处理语言名称映射
        if source_lang == "自动":
            source_lang = "auto"
        else:
            # 将中文语言名称转换为API需要的英文名称
            source_lang = self._convert_to_api_language(source_lang)
        
        # 将目标语言转换为API需要的英文名称
        target_lang = self._convert_to_api_language(target_lang)
        
        try:
            # Use cached API client
            client = ResourceCache.get_api_client(api_key, base_url)
            
            # Prepare basic translation options
            translation_options = {
                "source_lang": source_lang,
                "target_lang": target_lang
            }
            
            # 根据翻译模式添加特定选项
            if translation_mode == "术语翻译" and mode_config.strip():
                try:
                    term_list = json.loads(mode_config)
                    translation_options["terms"] = term_list
                    # DebugUtils.log(f"使用术语翻译模式，包含 {len(term_list)} 个术语")
                except json.JSONDecodeError:
                    # DebugUtils.log("术语配置格式错误，使用通用翻译模式", level="warning")
                    pass
            
            elif translation_mode == "领域翻译" and mode_config.strip():
                translation_options["domains"] = mode_config.strip()
                # DebugUtils.log(f"使用领域翻译模式: {mode_config[:50]}...")
            
            else:
                # DebugUtils.log("使用通用翻译模式")
                pass
            
            # Prepare messages
            messages = [{"role": "user", "content": text}]
            
            # DebugUtils.log(f"从 {source_lang} 翻译到 {target_lang}")
            
            # Non-stream translation
            completion = client.chat.completions.create(
                model=model,
                messages=messages,
                extra_body={"translation_options": translation_options}
            )
            translated_text = completion.choices[0].message.content
            
            # DebugUtils.log(f"翻译完成: {len(translated_text)} 个字符")
            
            return (translated_text,)
            
        except Exception as e:
            error_msg = f"翻译失败: {str(e)}"
            # DebugUtils.log(error_msg, level="error")
            return (error_msg,)
    
    def _convert_to_api_language(self, lang_name: str) -> str:
        """
        将界面显示的语言名称转换为API需要的英文名称
        """
        # 中文到英文的语言名称映射（基于官方文档）
        lang_mapping = {
            "英语": "English",
            "简体中文": "Chinese", 
            "繁体中文": "Traditional Chinese",
            "俄语": "Russian",
            "日语": "Japanese",
            "韩语": "Korean",
            "西班牙语": "Spanish",
            "法语": "French",
            "葡萄牙语": "Portuguese",
            "德语": "German",
            "意大利语": "Italian",
            "泰语": "Thai",
            "越南语": "Vietnamese",
            "印度尼西亚语": "Indonesian",
            "马来语": "Malay",
            "阿拉伯语": "Arabic",
            "印地语": "Hindi",
            "希伯来语": "Hebrew",
            "缅甸语": "Burmese",
            "泰米尔语": "Tamil",
            "乌尔都语": "Urdu",
            "孟加拉语": "Bengali",
            "波兰语": "Polish",
            "荷兰语": "Dutch",
            "罗马尼亚语": "Romanian",
            "土耳其语": "Turkish",
            "高棉语": "Khmer",
            "老挝语": "Lao",
            "粤语": "Cantonese",
            "捷克语": "Czech",
            "希腊语": "Greek",
            "瑞典语": "Swedish",
            "匈牙利语": "Hungarian",
            "丹麦语": "Danish",
            "芬兰语": "Finnish",
            "乌克兰语": "Ukrainian",
            "保加利亚语": "Bulgarian",
            "塞尔维亚语": "Serbian",
            "泰卢固语": "Telugu",
            "南非荷兰语": "Afrikaans",
            "亚美尼亚语": "Armenian",
            "阿萨姆语": "Assamese",
            "阿斯图里亚斯语": "Asturian",
            "巴斯克语": "Basque",
            "白俄罗斯语": "Belarusian",
            "波斯尼亚语": "Bosnian",
            "加泰罗尼亚语": "Catalan",
            "宿务语": "Cebuano",
            "克罗地亚语": "Croatian",
            "埃及阿拉伯语": "Egyptian Arabic",
            "爱沙尼亚语": "Estonian",
            "加利西亚语": "Galician",
            "格鲁吉亚语": "Georgian",
            "古吉拉特语": "Gujarati",
            "冰岛语": "Icelandic",
            "爪哇语": "Javanese",
            "卡纳达语": "Kannada",
            "哈萨克语": "Kazakh",
            "拉脱维亚语": "Latvian",
            "立陶宛语": "Lithuanian",
            "卢森堡语": "Luxembourgish",
            "马其顿语": "Macedonian",
            "马加希语": "Maithili",
            "马耳他语": "Maltese",
            "马拉地语": "Marathi",
            "美索不达米亚阿拉伯语": "Mesopotamian Arabic",
            "摩洛哥阿拉伯语": "Moroccan Arabic",
            "内志阿拉伯语": "Najdi Arabic",
            "尼泊尔语": "Nepali",
            "北阿塞拜疆语": "North Azerbaijani",
            "北黎凡特阿拉伯语": "North Levantine Arabic",
            "北乌兹别克语": "Northern Uzbek",
            "书面语挪威语": "Norwegian Bokmål",
            "新挪威语": "Norwegian Nynorsk",
            "奥克语": "Occitan",
            "奥里亚语": "Odia",
            "邦阿西楠语": "Pangasinan",
            "西西里语": "Sicilian",
            "信德语": "Sindhi",
            "僧伽罗语": "Sinhala",
            "斯洛伐克语": "Slovak",
            "斯洛文尼亚语": "Slovenian",
            "南黎凡特阿拉伯语": "South Levantine Arabic",
            "斯瓦希里语": "Swahili",
            "他加禄语": "Tagalog",
            "塔伊兹-亚丁阿拉伯语": "Ta'izzi-Adeni Arabic",
            "托斯克阿尔巴尼亚语": "Tosk Albanian",
            "突尼斯阿拉伯语": "Tunisian Arabic",
            "威尼斯语": "Venetian",
            "瓦莱语": "Waray",
            "威尔士语": "Welsh",
            "西波斯语": "Western Persian"
        }
        
        # 返回对应的英文名称，如果找不到就返回原名称（可能本身就是英文）
        return lang_mapping.get(lang_name, lang_name)


# ComfyUI节点映射
NODE_CLASS_MAPPINGS = {
    "DD-QwenMTTranslator": QwenMTTranslatorNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DD-QwenMTTranslator": "DD Qwen-MT翻译"
}
