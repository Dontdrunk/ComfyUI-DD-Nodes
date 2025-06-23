// 提示词管理器核心模块，只包含业务逻辑和数据管理
import { PromptManagerUI } from './styles/PromptManagerUI.js';
import { globalTagColorManager } from './styles/components/TagColorManager.js';

export class PromptManager {
    constructor() {
        this.prompts = [];
        this.loadPrompts();
    }    async loadPrompts() {
        try {
            // 从后端API加载最新数据
            const response = await fetch('/dd_nodes/load_prompts');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && result.data.prompts) {
                    this.prompts = result.data.prompts;
                    // 确保所有提示词都有标签属性（向后兼容）
                    this.prompts.forEach(prompt => {
                        if (!prompt.tags) {
                            prompt.tags = [];
                        }
                    });
                    
                    // 加载标签颜色数据（如果存在）
                    if (result.data.tags && typeof result.data.tags === 'object') {
                        console.log('从后端加载标签颜色数据:', result.data.tags);
                        // 恢复标签颜色到全局标签颜色管理器
                        Object.entries(result.data.tags).forEach(([tagName, color]) => {
                            globalTagColorManager.setTagColor(tagName, color);
                        });
                    }
                    
                    console.log(`从后端API加载了 ${this.prompts.length} 个提示词`);
                    return;
                }
            }

            // 如果API失败，使用空列表
            this.prompts = [];
            console.log('初始化空的提示词列表');
        } catch (error) {
            console.error('加载提示词失败:', error);
            this.prompts = [];
        }
    }savePrompts() {
        try {
            // 直接同步到后端API
            this.syncToBackend();
            console.log('提示词已自动同步到后端');
        } catch (error) {
            console.error('保存提示词失败:', error);
        }
    }    // 同步数据到后端API
    async syncToBackend() {
        try {
            // 获取标签数据 - 直接从标签颜色管理器获取最新数据
            const tagsData = Object.fromEntries(globalTagColorManager.colorMap);
            
            console.log('同步标签数据到后端:', tagsData);
            
            const response = await fetch('/dd_nodes/save_prompts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompts: this.prompts,
                    tags: tagsData  // 包含标签数据
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log(`成功同步 ${result.count} 个提示词和 ${Object.keys(tagsData).length} 个标签到后端`);
                } else {
                    console.error('后端同步失败:', result.error);
                }
            } else {
                console.error('后端同步请求失败:', response.status);
            }
        } catch (error) {
            console.error('后端同步失败:', error);
        }
    }// 已弃用：自动同步功能已转移到后端API
    // 保留此方法仅为向后兼容
    autoSyncToJsonFile() {
        // 现在通过syncToBackend()方法同步到后端
        console.log('已转为使用后端API同步');
    }// 保存提示词到插件目录的JSON文件
    async saveToJsonFile() {
        try {
            const promptsData = {
                version: "2.4.0",
                exportTime: new Date().toISOString(),
                description: "ComfyUI-DD-Nodes 提示词管理器自动生成的提示词数据文件",
                totalCount: this.prompts.length,
                prompts: this.prompts
            };

            const dataStr = JSON.stringify(promptsData, null, 2);
            
            // 由于浏览器安全限制，无法直接写入本地文件
            // 但我们可以通过定期提醒用户备份的方式来实现数据持久化
            
            // 检查是否需要提醒用户备份
            this.checkBackupReminder();
            
            // 将数据存储在内存中，供导出使用
            this._lastSavedData = promptsData;
            
            console.log('提示词数据已准备好，建议定期导出备份');
        } catch (error) {
            console.warn('准备备份数据失败:', error);
        }
    }

    // 检查备份提醒
    checkBackupReminder() {
        const lastBackupTime = localStorage.getItem('comfyui_dd_last_backup_time');
        const currentTime = Date.now();
        const backupInterval = 24 * 60 * 60 * 1000; // 24小时

        if (!lastBackupTime || (currentTime - parseInt(lastBackupTime)) > backupInterval) {
            // 显示备份提醒
            this.showBackupNotification();
            localStorage.setItem('comfyui_dd_last_backup_time', currentTime.toString());
        }
    }

    // 显示备份通知
    showBackupNotification() {
        if (this.prompts.length > 0) {
            console.log(`🔔 备份提醒: 您有 ${this.prompts.length} 个提示词，建议导出备份以防数据丢失`);
            
            // 如果有UI实例，可以显示更友好的提醒
            if (typeof window !== 'undefined' && this.prompts.length >= 5) {
                setTimeout(() => {
                    if (confirm(`您已创建了 ${this.prompts.length} 个提示词，建议现在导出备份文件吗？\n\n备份文件可以在更新插件或更换设备时恢复您的提示词。`)) {
                        this.exportPrompts();
                    }
                }, 1000);
            }
        }
    }

    // 自动创建本地备份文件（供开发者在插件更新时使用）
    createLocalBackup() {
        try {
            const promptsData = {
                version: "2.4.0",
                exportTime: new Date().toISOString(),
                description: "ComfyUI-DD-Nodes 提示词管理器自动备份",
                totalCount: this.prompts.length,
                prompts: this.prompts
            };

            // 将备份数据存储到特殊的localStorage键中
            localStorage.setItem('comfyui_dd_prompts_backup', JSON.stringify(promptsData));
            localStorage.setItem('comfyui_dd_backup_timestamp', Date.now().toString());
            
            console.log('已创建本地备份');
        } catch (error) {
            console.error('创建本地备份失败:', error);
        }
    }

    addPrompt(name, content, tags = []) {
        const prompt = {
            id: Date.now(),
            name: name,
            content: content,
            tags: tags || [],
            createdAt: new Date().toISOString()
        };
        this.prompts.push(prompt);
        this.savePrompts();
        return prompt;
    }

    updatePrompt(id, name, content, tags = []) {
        const index = this.prompts.findIndex(p => p.id === id);
        if (index !== -1) {
            this.prompts[index].name = name;
            this.prompts[index].content = content;
            this.prompts[index].tags = tags || [];
            this.prompts[index].updatedAt = new Date().toISOString();
            this.savePrompts();
            return this.prompts[index];
        }
        return null;
    }

    deletePrompt(id) {
        const index = this.prompts.findIndex(p => p.id === id);
        if (index !== -1) {
            this.prompts.splice(index, 1);
            this.savePrompts();
            return true;
        }
        return false;
    }

    getPrompts() {
        return this.prompts;
    }

    // 搜索提示词
    searchPrompts(keyword) {
        if (!keyword || keyword.trim() === '') {
            return this.prompts;
        }

        const searchTerm = keyword.trim().toLowerCase();
        
        // 检查是否是多标签搜索（以逗号分隔）
        const isMultiTagSearch = searchTerm.includes(',');
        const searchTags = isMultiTagSearch 
            ? searchTerm.split(',').map(tag => tag.trim()).filter(tag => tag)
            : [];
        
        // 按相关性排序搜索结果
        const searchResults = this.prompts.map(prompt => {
            const name = prompt.name.toLowerCase();
            const content = prompt.content.toLowerCase();
            const tags = (prompt.tags || []).map(tag => tag.toLowerCase());
            
            let score = 0;
            
            // 如果是多标签搜索
            if (isMultiTagSearch && searchTags.length > 0) {
                const matchedTags = searchTags.filter(searchTag => 
                    tags.some(tag => tag.includes(searchTag))
                );
                
                if (matchedTags.length > 0) {
                    // 根据匹配的标签数量给分
                    score = 1000 + (matchedTags.length * 100);
                    
                    // 如果所有搜索的标签都匹配，额外加分
                    if (matchedTags.length === searchTags.length) {
                        score += 500;
                    }
                }
            } else {
                // 单关键词搜索
                
                // 标签完全匹配得分最高
                const exactTagMatch = tags.find(tag => tag === searchTerm);
                if (exactTagMatch) {
                    score = 1100;
                }
                // 标签包含搜索词
                else if (tags.some(tag => tag.includes(searchTerm))) {
                    score = 1000;
                }
                // 名称完全匹配得分次高
                else if (name === searchTerm) {
                    score = 900;
                }
                // 名称开头匹配得分次高
                else if (name.startsWith(searchTerm)) {
                    score = 800;
                }
                // 名称包含搜索词
                else if (name.includes(searchTerm)) {
                    score = 700;
                }
                // 内容开头匹配
                else if (content.startsWith(searchTerm)) {
                    score = 600;
                }
                // 内容包含搜索词
                else if (content.includes(searchTerm)) {
                    score = 500;
                }
                
                // 根据匹配位置调整分数（越靠前分数越高）
                if (score > 0 && score < 1000) { // 不调整标签匹配的分数
                    const nameIndex = name.indexOf(searchTerm);
                    const contentIndex = content.indexOf(searchTerm);
                    
                    if (nameIndex >= 0) {
                        score += (100 - nameIndex); // 名称中越靠前分数越高
                    } else if (contentIndex >= 0) {
                        score += (50 - Math.min(contentIndex, 50)); // 内容中越靠前分数越高
                    }
                }
            }
            
            return { prompt, score };
        })
        .filter(item => item.score > 0) // 只返回有匹配的结果
        .sort((a, b) => b.score - a.score) // 按分数降序排列
        .map(item => item.prompt); // 提取提示词对象
        
        return searchResults;
    }    // 导出提示词到 JSON 格式
    exportPrompts() {
        // 获取标签颜色数据
        const tagsData = Object.fromEntries(globalTagColorManager.colorMap);
        
        // 使用当前最新的提示词数据
        const promptsData = {
            version: "2.4.0",
            exportTime: new Date().toISOString(),
            description: "ComfyUI-DD-Nodes 提示词管理器导出的提示词数据",
            totalCount: this.prompts.length,
            prompts: this.prompts,
            tags: tagsData  // 添加标签颜色数据
        };

        const dataStr = JSON.stringify(promptsData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        // 使用时间戳生成文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.download = `comfyui_prompts_${timestamp}.json`;
        
        link.click();
        URL.revokeObjectURL(url);
    }// 从 JSON 文件导入提示词（兼容新旧格式）
    importPrompts(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {                try {
                    const imported = JSON.parse(e.target.result);
                    let promptsToImport = [];

                    // 检查是否是新格式（包含metadata）
                    if (imported.prompts && Array.isArray(imported.prompts)) {
                        promptsToImport = imported.prompts;
                        
                        // 导入标签颜色数据（如果存在）
                        if (imported.tags && typeof imported.tags === 'object') {
                            console.log('导入标签颜色数据:', imported.tags);
                            // 合并标签颜色到全局标签颜色管理器
                            Object.entries(imported.tags).forEach(([tagName, color]) => {
                                globalTagColorManager.setTagColor(tagName, color);
                            });
                        }
                    } 
                    // 兼容旧格式（直接是数组）
                    else if (Array.isArray(imported)) {
                        promptsToImport = imported;
                    } 
                    else {
                        reject('无效的JSON格式：文件必须包含提示词数组');
                        return;
                    }

                    if (promptsToImport.length === 0) {
                        reject('文件中没有找到提示词数据');
                        return;
                    }

                    // 合并导入的提示词，避免ID冲突
                    const maxId = this.prompts.length > 0 ? Math.max(...this.prompts.map(p => p.id)) : 0;
                    let importedCount = 0;

                    promptsToImport.forEach((prompt, index) => {
                        // 验证提示词数据完整性
                        if (!prompt.name || !prompt.content) {
                            console.warn(`跳过无效提示词 #${index + 1}:`, prompt);
                            return;
                        }

                        // 检查是否已存在相同名称的提示词
                        const existingPrompt = this.prompts.find(p => p.name === prompt.name);
                        if (existingPrompt) {
                            console.warn(`跳过重复提示词: ${prompt.name}`);
                            return;
                        }

                        // 分配新ID并添加到列表
                        prompt.id = maxId + importedCount + 1;
                        // 确保标签属性存在（向后兼容）
                        if (!prompt.tags) {
                            prompt.tags = [];
                        }
                        // 添加导入时间标记
                        prompt.importedAt = new Date().toISOString();
                        
                        this.prompts.push(prompt);
                        importedCount++;
                    });

                    if (importedCount === 0) {
                        reject('没有导入任何新的提示词（可能都已存在）');
                        return;
                    }

                    // 导入完成后自动保存
                    this.savePrompts();
                    resolve(importedCount);
                } catch (error) {
                    reject('解析JSON文件失败: ' + error.message);
                }
            };
            reader.readAsText(file);
        });
    }
}

export class PromptEmbedder {
    constructor(node, promptManager) {
        this.node = node;
        this.promptManager = promptManager;
        this.ui = new PromptManagerUI(this);
    }

    show() {
        this.ui.show();
    }

    hide() {
        this.ui.hide();
    }

    // 应用提示词到节点
    applyPrompt(prompt) {
        // 查找所有文本widget
        const textWidgets = this.node.widgets.filter(w => this.isTextWidget(w));
        
        if (textWidgets.length === 0) {
            alert('未找到可用的文本输入框');
            return;
        }
        
        // 如果有多个文本输入框，显示选择器
        if (textWidgets.length > 1) {
            // 首先检查是否有当前聚焦的widget
            const focusedWidget = textWidgets.find(w => 
                w.element && w.element === document.activeElement
            );
            
            if (focusedWidget) {
                // 如果有聚焦的widget，直接应用到该widget
                this.applyPromptToWidget(prompt, focusedWidget);
                return;
            }
            
            // 否则显示选择器
            this.ui.showTextWidgetSelector(prompt);
            return;
        }
        
        // 如果只有一个文本输入框，直接应用
        this.applyPromptToWidget(prompt, textWidgets[0]);
    }

    isTextWidget(widget) {
        if (!widget) return false;
        
        // 检查widget类型
        if (widget.type === 'text' || 
            widget.type === 'string' ||
            widget.type === 'customtext') {
            return true;
        }
        
        // 检查widget名称
        const textWidgetNames = [
            'text', 'prompt', 'positive', 'negative', 
            'text_g', 'text_l', 'clip_l', 'clip_g', 't5xxl',
            'input', 'content', 'description'
        ];
        
        if (textWidgetNames.includes(widget.name)) {
            return true;
        }
        
        // 检查DOM元素
        if (widget.element) {
            const tagName = widget.element.tagName;
            if (tagName === 'TEXTAREA') {
                return true;
            }
            if (tagName === 'INPUT' && 
                (widget.element.type === 'text' || widget.element.type === 'textarea')) {
                return true;
            }
        }
        
        // 检查是否是ComfyUI的多行文本输入
        if (widget.inputEl && widget.inputEl.tagName === 'TEXTAREA') {
            return true;
        }
        
        // 检查ComfyUI特殊情况
        if (widget.options && widget.options.multiline) {
            return true;
        }
        
        return false;
    }    applyPromptToWidget(prompt, widget, insertMode = null) {
        if (!widget) return;
        
        const currentValue = widget.value || '';
        const hasContent = currentValue.trim().length > 0;
        
        // 如果指定了插入模式，直接使用
        if (insertMode) {
            let newValue;
            if (insertMode === 'insert') {
                // 插入到选中位置或开头
                newValue = this.insertPromptAtCursor(widget, prompt.content);
            } else if (insertMode === 'append') {
                // 追加到内容末尾
                newValue = currentValue + (currentValue ? ', ' : '') + prompt.content;
            } else if (insertMode === 'replace') {
                // 替换全部内容
                newValue = prompt.content;
            }
            
            if (newValue !== undefined) {
                this.setWidgetValue(widget, newValue);
            }
            return;
        }
        
        // 如果没有指定插入模式且有内容，显示对话框
        if (hasContent) {
            // 显示自定义确认对话框
            this.ui.showInsertDialog(
                '当前输入框已有内容', 
                '是否插入提示词？',
                (action) => {
                    let newValue;
                    if (action === 'insert') {
                        // 插入到选中位置或开头
                        newValue = this.insertPromptAtCursor(widget, prompt.content);
                    } else if (action === 'append') {
                        // 追加到内容末尾
                        newValue = currentValue + (currentValue ? ', ' : '') + prompt.content;
                    } else if (action === 'replace') {
                        // 替换全部内容
                        newValue = prompt.content;
                    }
                    if (newValue !== undefined) {
                        this.setWidgetValue(widget, newValue);
                    }
                }
            );
        } else {
            this.setWidgetValue(widget, prompt.content);
        }
    }insertPromptAtCursor(widget, promptText) {
        const currentValue = widget.value || '';
        let cursorPosition = 0;
        
        // 尝试获取文本框的选择位置
        if (widget.inputEl && typeof widget.inputEl.selectionStart === 'number') {
            // ComfyUI多行文本框
            cursorPosition = widget.inputEl.selectionStart;
        } else if (widget.element && typeof widget.element.selectionStart === 'number') {
            // 普通输入框
            cursorPosition = widget.element.selectionStart;
        } else {
            // 无法获取光标位置，默认插入到开头
            cursorPosition = 0;
        }
        
        // 在光标位置插入提示词
        const beforeCursor = currentValue.substring(0, cursorPosition);
        const afterCursor = currentValue.substring(cursorPosition);
        
        // 智能添加分隔符
        let insertText = promptText;
        
        // 检查光标前的情况
        if (beforeCursor.length > 0) {
            // 获取光标前最后一个字符
            const lastChar = beforeCursor.charAt(beforeCursor.length - 1);
            
            // 如果前面是换行符，不需要添加逗号
            if (lastChar === '\n' || lastChar === '\r') {
                // 在新行开始，不添加分隔符
            } else {
                // 检查是否需要添加逗号分隔符
                const beforeTrim = beforeCursor.trimEnd();
                if (beforeTrim.length > 0 && !beforeTrim.endsWith(',')) {
                    insertText = ', ' + insertText;
                } else if (beforeCursor.endsWith(' ') && beforeTrim.endsWith(',')) {
                    // 如果前面已经有逗号和空格，直接插入
                    insertText = insertText;
                } else if (beforeTrim.endsWith(',')) {
                    // 如果前面有逗号但没有空格
                    insertText = ' ' + insertText;
                }
            }
        }
        
        // 检查光标后的情况
        if (afterCursor.length > 0) {
            // 获取光标后第一个字符
            const firstChar = afterCursor.charAt(0);
            
            // 如果后面是换行符，不需要添加逗号
            if (firstChar === '\n' || firstChar === '\r') {
                // 后面是新行，不添加分隔符
            } else {
                // 检查是否需要添加逗号分隔符
                const afterTrim = afterCursor.trimStart();
                if (afterTrim.length > 0 && !afterTrim.startsWith(',')) {
                    insertText = insertText + ', ';
                }
            }
        }
        
        const newValue = beforeCursor + insertText + afterCursor;
        
        // 设置新的光标位置（在插入文本之后）
        const newCursorPosition = beforeCursor.length + insertText.length;
        
        // 延迟设置光标位置
        setTimeout(() => {
            if (widget.inputEl && typeof widget.inputEl.setSelectionRange === 'function') {
                widget.inputEl.focus();
                widget.inputEl.setSelectionRange(newCursorPosition, newCursorPosition);
            } else if (widget.element && typeof widget.element.setSelectionRange === 'function') {
                widget.element.focus();
                widget.element.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        }, 50);
        
        return newValue;
    }

    setWidgetValue(widget, newValue) {
        // 设置新值
        widget.value = newValue;
        
        // 尝试多种方式触发更新
        
        // 1. 触发widget的回调
        if (widget.callback) {
            widget.callback(newValue);
        }
        
        // 2. 如果有DOM元素，更新DOM并触发事件
        if (widget.element) {
            widget.element.value = newValue;
            widget.element.dispatchEvent(new Event('input', { bubbles: true }));
            widget.element.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // 3. 如果有inputEl（ComfyUI的多行文本输入）
        if (widget.inputEl) {
            widget.inputEl.value = newValue;
            widget.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            widget.inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // 4. 强制触发ComfyUI的更新机制
        if (this.node.onWidgetChanged) {
            this.node.onWidgetChanged(widget.name, newValue, null, widget);
        }
        
        // 5. 标记节点为脏状态，强制重绘
        if (this.node.setDirtyCanvas) {
            this.node.setDirtyCanvas(true, true);
        }
        
        // 6. 触发图形更新
        if (this.node.graph && this.node.graph.change) {
            this.node.graph.change();
        }
        
        console.log(`已将提示词应用到 ${widget.name}: ${newValue}`);
        this.hide();
    }

    getWidgetDisplayName(widget) {
        const nameMap = {
            'text': '文本',
            'prompt': '提示词',
            'positive': '正面提示词',
            'negative': '负面提示词',
            'text_g': '全局文本',
            'text_l': '局部文本',
            'clip_l': 'CLIP-L',
            'clip_g': 'CLIP-G',
            't5xxl': 'T5-XXL'
        };
        
        return nameMap[widget.name] || widget.name || '文本输入';
    }

    getAllTextWidgets() {
        return this.node.widgets.filter(w => this.isTextWidget(w));
    }
}

export const DEFAULT_CONFIG = {
    autoSave: true,
    maxPrompts: 1000,
    searchDelay: 300
};
