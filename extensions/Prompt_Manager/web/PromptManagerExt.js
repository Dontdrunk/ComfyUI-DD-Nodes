// ComfyUI Prompt Manager Extension
import { app } from "/scripts/app.js";

const CLIP_TEXT_ENCODERS = [
    "CLIPTextEncode",
    "CLIPTextEncodeSDXL",
    "CLIPTextEncodeSDXLRefiner",
    "BNK_CLIPTextEncodeAdvanced",
    "AdvancedCLIPTextEncode",
    "CLIPTextEncodeFlux",
    "easy negative",
    "easy positive",
    "Easy Use",
    "Easy Negative",
    "Easy Positive",
    "CLIPTextEncodeFlux(Advanced)",
    "CLIP Text Encode (Prompt)"
    // 添加更多CLIP文本编码器节点类型
];

class PromptManager {
    constructor() {
        this.prompts = [];
        this.loadPrompts();
    }

    async loadPrompts() {
        try {
            // 首先尝试从本地存储加载
            const localData = localStorage.getItem('comfyui_dd_prompts');
            if (localData) {
                this.prompts = JSON.parse(localData);
                return;
            }

            // 如果本地存储没有数据，尝试从 JSON 文件加载
            const response = await fetch('./extensions/Prompt_Manager/prompts.json');
            if (response.ok) {
                this.prompts = await response.json();
                // 将数据保存到本地存储
                this.savePrompts();
            }
        } catch (error) {
            console.log('加载提示词失败，使用空列表:', error);
            this.prompts = [];
        }
    }

    savePrompts() {
        try {
            // 保存到本地存储
            localStorage.setItem('comfyui_dd_prompts', JSON.stringify(this.prompts));
            console.log('提示词已保存到本地存储');
        } catch (error) {
            console.error('保存提示词失败:', error);
        }
    }

    addPrompt(name, content) {
        const prompt = {
            id: Date.now(),
            name: name,
            content: content,
            createdAt: new Date().toISOString()
        };
        this.prompts.push(prompt);
        this.savePrompts();
        return prompt;
    }

    updatePrompt(id, name, content) {
        const index = this.prompts.findIndex(p => p.id === id);
        if (index !== -1) {
            this.prompts[index].name = name;
            this.prompts[index].content = content;
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

    // 导出提示词到 JSON 格式
    exportPrompts() {
        const dataStr = JSON.stringify(this.prompts, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'comfyui_prompts.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    // 从 JSON 文件导入提示词
    importPrompts(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (Array.isArray(imported)) {
                        // 合并导入的提示词，避免ID冲突
                        const maxId = Math.max(...this.prompts.map(p => p.id), 0);
                        imported.forEach((prompt, index) => {
                            prompt.id = maxId + index + 1;
                            this.prompts.push(prompt);
                        });
                        this.savePrompts();
                        resolve(imported.length);
                    } else {
                        reject('无效的JSON格式');
                    }
                } catch (error) {
                    reject('解析JSON文件失败');
                }
            };
            reader.readAsText(file);
        });
    }
}

class PromptEmbedderUI {
    constructor(node, promptManager) {
        this.node = node;
        this.promptManager = promptManager;
        this.isVisible = false;
        this.editingPrompt = null;
        this.createModal();
    }

    createModal() {
        // 创建模态框HTML结构
        this.modal = document.createElement('div');
        this.modal.className = 'prompt-embedder-modal';
        this.modal.innerHTML = `
            <div class="prompt-embedder-overlay">
                <div class="prompt-embedder-container">
                    <div class="prompt-embedder-header">
                        <h3>嵌入提示词管理</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="prompt-embedder-content">                        <div class="prompt-list-section">
                            <div class="prompt-list-header">
                                <h4>提示词列表</h4>
                                <div class="header-actions">
                                    <button class="import-btn">导入</button>
                                    <button class="export-btn">导出</button>
                                    <button class="add-prompt-btn">+ 添加提示词</button>
                                </div>
                            </div>
                            <div class="prompt-list"></div>
                        </div>
                        <div class="prompt-form-section" style="display: none;">
                            <h4 class="form-title">添加提示词</h4>
                            <form class="prompt-form">
                                <div class="form-group">
                                    <label>提示词名称:</label>
                                    <input type="text" name="name" placeholder="输入提示词名称" required>
                                </div>
                                <div class="form-group">
                                    <label>提示词内容:</label>
                                    <textarea name="content" placeholder="输入提示词内容" rows="4" required></textarea>
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="save-btn">保存</button>
                                    <button type="button" class="cancel-btn">取消</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        this.addStyles();
        
        // 绑定事件
        this.bindEvents();
        
        document.body.appendChild(this.modal);
    }

    addStyles() {
        if (document.getElementById('prompt-embedder-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'prompt-embedder-styles';
        styles.textContent = `
            .prompt-embedder-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
            }

            .prompt-embedder-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .prompt-embedder-container {
                background: #1a1a1a;
                border-radius: 8px;
                border: 1px solid #3d3d3d;
                width: 90%;
                max-width: 800px;
                max-height: 90%;
                overflow: hidden;
                color: #ffffff;
            }

            .prompt-embedder-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid #3d3d3d;
                background: #262626;
            }

            .prompt-embedder-header h3 {
                margin: 0;
                color: #ffffff;
            }

            .close-btn {
                background: none;
                border: none;
                color: #ffffff;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .close-btn:hover {
                background: #ff5733;
                border-radius: 50%;
            }

            .prompt-embedder-content {
                padding: 20px;
                max-height: 600px;
                overflow-y: auto;
            }            .prompt-list-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .prompt-list-header h4 {
                margin: 0;
                color: #ffffff;
            }

            .header-actions {
                display: flex;
                gap: 8px;
            }

            .add-prompt-btn, .import-btn, .export-btn {
                background: #2a82e4;
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
                transition: background 0.2s;
            }

            .add-prompt-btn:hover {
                background: #1f6bb8;
            }

            .import-btn {
                background: #43cf7c;
            }

            .import-btn:hover {
                background: #38b569;
            }

            .export-btn {
                background: #ffc300;
                color: #000;
            }

            .export-btn:hover {
                background: #e6af00;
            }

            .prompt-list {
                min-height: 200px;
            }

            .prompt-item {
                background: #262626;
                border: 1px solid #3d3d3d;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 10px;
                transition: all 0.2s;
            }

            .prompt-item:hover {
                border-color: #2a82e4;
            }

            .prompt-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .prompt-item-name {
                font-weight: bold;
                color: #ffffff;
                font-size: 16px;
            }

            .prompt-item-actions {
                display: flex;
                gap: 8px;
            }            .edit-btn, .apply-btn, .delete-btn {
                background: #383838;
                border: none;
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s;
            }

            .edit-btn:hover {
                background: #ffc300;
                color: #000;
            }

            .apply-btn:hover {
                background: #43cf7c;
            }

            .delete-btn {
                background: #8b3a3a;
            }

            .delete-btn:hover {
                background: #ff5733;
            }

            .prompt-item-content {
                color: #c4c4c4;
                line-height: 1.4;
                background: #1a1a1a;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #3d3d3d;
                white-space: pre-wrap;
            }

            .prompt-form-section {
                border-top: 1px solid #3d3d3d;
                padding-top: 20px;
                margin-top: 20px;
            }

            .form-title {
                margin: 0 0 15px 0;
                color: #ffffff;
            }

            .form-group {
                margin-bottom: 15px;
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                color: #ffffff;
                font-weight: bold;
            }

            .form-group input,
            .form-group textarea {
                width: 100%;
                padding: 10px;
                background: #262626;
                border: 1px solid #3d3d3d;
                border-radius: 4px;
                color: #ffffff;
                font-size: 14px;
                resize: vertical;
            }

            .form-group input:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: #2a82e4;
            }

            .form-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }

            .save-btn {
                background: #43cf7c;
                border: none;
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            }

            .save-btn:hover {
                background: #38b569;
            }

            .cancel-btn {
                background: #ff5733;
                border: none;
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            }

            .cancel-btn:hover {
                background: #e04929;
            }

            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: #888;
            }

            .empty-state-icon {
                font-size: 48px;
                margin-bottom: 15px;
                opacity: 0.5;
            }

            .widget-selector-modal {
                display: block;
                position: fixed;
                z-index: 10001;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
            }
            
            .widget-selector-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .widget-selector-container {
                background: #2a2a2a;
                border-radius: 8px;
                min-width: 400px;
                max-width: 500px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            
            .widget-selector-header {
                background: #1a1a1a;
                padding: 15px 20px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .widget-selector-content {
                padding: 20px;
            }
            
            .widget-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 15px;
            }
            
            .widget-option {
                background: #3a3a3a;
                border: 1px solid #555;
                color: white;
                padding: 12px 16px;
                border-radius: 4px;
                cursor: pointer;
                text-align: left;
                transition: background 0.2s;
            }
            
            .widget-option:hover {
                background: #4a4a4a;
            }
        `;
        document.head.appendChild(styles);
    }

    bindEvents() {
        // 关闭按钮
        this.modal.querySelector('.close-btn').addEventListener('click', () => {
            this.hide();
        });

        // 点击遮罩层关闭
        this.modal.querySelector('.prompt-embedder-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hide();
            }
        });        // 添加提示词按钮
        this.modal.querySelector('.add-prompt-btn').addEventListener('click', () => {
            this.showForm();
        });

        // 导出按钮
        this.modal.querySelector('.export-btn').addEventListener('click', () => {
            this.promptManager.exportPrompts();
        });

        // 导入按钮
        this.modal.querySelector('.import-btn').addEventListener('click', () => {
            this.showImportDialog();
        });

        // 表单提交
        this.modal.querySelector('.prompt-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // 取消按钮
        this.modal.querySelector('.cancel-btn').addEventListener('click', () => {
            this.hideForm();
        });
    }

    show() {
        this.isVisible = true;
        this.modal.style.display = 'block';
        this.renderPromptList();
    }

    hide() {
        this.isVisible = false;
        this.modal.style.display = 'none';
        this.hideForm();
    }

    showForm(prompt = null) {
        this.editingPrompt = prompt;
        const formSection = this.modal.querySelector('.prompt-form-section');
        const form = this.modal.querySelector('.prompt-form');
        const title = this.modal.querySelector('.form-title');
        
        if (prompt) {
            title.textContent = '编辑提示词';
            form.name.value = prompt.name;
            form.content.value = prompt.content;
        } else {
            title.textContent = '添加提示词';
            form.reset();
        }
        
        formSection.style.display = 'block';
        form.name.focus();
    }

    hideForm() {
        this.editingPrompt = null;
        this.modal.querySelector('.prompt-form-section').style.display = 'none';
        this.modal.querySelector('.prompt-form').reset();
    }

    handleFormSubmit() {
        const form = this.modal.querySelector('.prompt-form');
        const name = form.name.value.trim();
        const content = form.content.value.trim();

        if (!name || !content) {
            alert('请填写完整的提示词名称和内容');
            return;
        }

        if (this.editingPrompt) {
            this.promptManager.updatePrompt(this.editingPrompt.id, name, content);
        } else {
            this.promptManager.addPrompt(name, content);
        }

        this.hideForm();
        this.renderPromptList();
    }

    renderPromptList() {
        const listContainer = this.modal.querySelector('.prompt-list');
        const prompts = this.promptManager.getPrompts();

        if (prompts.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div>暂无提示词，点击上方"+ 添加提示词"按钮来添加第一个提示词</div>
                </div>
            `;
            return;
        }        listContainer.innerHTML = prompts.map(prompt => `
            <div class="prompt-item" data-id="${prompt.id}">
                <div class="prompt-item-header">
                    <div class="prompt-item-name">${this.escapeHtml(prompt.name)}</div>
                    <div class="prompt-item-actions">
                        <button class="edit-btn" data-action="edit" title="编辑提示词">编辑</button>
                        <button class="apply-btn" data-action="apply" title="应用提示词">应用</button>
                        <button class="delete-btn" data-action="delete" title="删除提示词">删除</button>
                    </div>
                </div>
                <div class="prompt-item-content">${this.escapeHtml(prompt.content)}</div>
            </div>
        `).join('');

        // 绑定按钮事件
        listContainer.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            const promptItem = e.target.closest('.prompt-item');
            const promptId = parseInt(promptItem.getAttribute('data-id'));
            const prompt = prompts.find(p => p.id === promptId);            if (action === 'edit') {
                this.showForm(prompt);
            } else if (action === 'apply') {
                this.applyPrompt(prompt);
            } else if (action === 'delete') {
                this.deletePrompt(prompt);
            }
        });
    }

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
            this.showTextWidgetSelector(prompt);
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
    }
    
    findTextWidget(node) {
        // 常见的文本widget名称
        const textWidgetNames = [
            'text', 'prompt', 'positive', 'negative', 
            'text_g', 'text_l', // SDXL的两个文本输入
            'clip_l', 'clip_g', // FLUX的文本输入
            't5xxl' // FLUX的T5编码器
        ];
        
        // 首先尝试精确匹配常见名称
        for (const name of textWidgetNames) {
            const widget = node.widgets.find(w => w.name === name);
            if (widget && this.isTextWidget(widget)) {
                return widget;
            }
        }
        
        // 如果没找到，查找所有文本类型的widget
        const textWidgets = node.widgets.filter(w => this.isTextWidget(w));
        
        if (textWidgets.length === 1) {
            return textWidgets[0];
        } else if (textWidgets.length > 1) {
            // 如果有多个文本widget，优先选择第一个可见的
            const visibleWidget = textWidgets.find(w => 
                !w.hidden && (!w.options || !w.options.hidden)
            );
            return visibleWidget || textWidgets[0];
        }
        
        return null;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTextWidgetSelector(prompt) {
        const textWidgets = this.node.widgets.filter(w => this.isTextWidget(w));
        
        if (textWidgets.length <= 1) {
            return false; // 不需要显示选择器
        }
        
        // 创建选择器模态框
        const selectorModal = document.createElement('div');
        selectorModal.className = 'widget-selector-modal';
        selectorModal.innerHTML = `
            <div class="widget-selector-overlay">
                <div class="widget-selector-container">
                    <div class="widget-selector-header">
                        <h4>选择文本输入框</h4>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="widget-selector-content">
                        <p>该节点有多个文本输入框，请选择要应用提示词的输入框：</p>
                        <div class="widget-list">
                            ${textWidgets.map((widget, index) => `
                                <button class="widget-option" data-index="${index}">
                                    ${this.getWidgetDisplayName(widget)} 
                                    ${widget.value ? `(当前: ${widget.value.substring(0, 30)}...)` : '(空)'}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 绑定事件
        selectorModal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(selectorModal);
        });
        
        selectorModal.querySelector('.widget-selector-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.body.removeChild(selectorModal);
            }
        });
        
        selectorModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('widget-option')) {
                const index = parseInt(e.target.getAttribute('data-index'));
                const selectedWidget = textWidgets[index];
                this.applyPromptToWidget(prompt, selectedWidget);
                document.body.removeChild(selectorModal);
            }
        });
        
        document.body.appendChild(selectorModal);
        return true;
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
    }    applyPromptToWidget(prompt, widget) {
        if (!widget) return;
        
        // 检查是否需要追加到现有内容
        const currentValue = widget.value || '';
        const shouldAppend = currentValue.trim().length > 0;
        
        if (shouldAppend) {
            // 显示自定义确认对话框
            this.showConfirmDialog(
                '当前输入框已有内容', 
                '是否追加提示词？',
                (confirmed) => {
                    let newValue;
                    if (confirmed) {
                        newValue = currentValue + (currentValue.endsWith(',') || currentValue.endsWith(', ') ? ' ' : ', ') + prompt.content;
                    } else {
                        newValue = prompt.content;
                    }
                    this.setWidgetValue(widget, newValue);
                }
            );
        } else {
            this.setWidgetValue(widget, prompt.content);
        }
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

    deletePrompt(prompt) {
        // 显示确认删除对话框
        this.showDeleteConfirmDialog(prompt.name, () => {
            this.promptManager.deletePrompt(prompt.id);
            this.renderPromptList();
        });
    }

    showDeleteConfirmDialog(promptName, callback) {
        const confirmModal = document.createElement('div');
        confirmModal.className = 'delete-confirm-modal';
        confirmModal.innerHTML = `
            <div class="confirm-dialog-overlay">
                <div class="confirm-dialog-container">
                    <div class="confirm-dialog-header">
                        <h4>确认删除</h4>
                        <button class="dialog-close-btn">&times;</button>
                    </div>
                    <div class="confirm-dialog-content">
                        <p>确定要删除提示词 "<strong>${this.escapeHtml(promptName)}</strong>" 吗？</p>
                        <p class="warning-text">此操作不可撤销！</p>
                        <div class="delete-confirm-actions">
                            <button class="delete-confirm-btn">确定删除</button>
                            <button class="delete-cancel-btn">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addDeleteConfirmStyles();

        confirmModal.querySelector('.dialog-close-btn').addEventListener('click', () => {
            document.body.removeChild(confirmModal);
        });

        confirmModal.querySelector('.delete-confirm-btn').addEventListener('click', () => {
            callback();
            document.body.removeChild(confirmModal);
        });

        confirmModal.querySelector('.delete-cancel-btn').addEventListener('click', () => {
            document.body.removeChild(confirmModal);
        });

        confirmModal.querySelector('.confirm-dialog-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.body.removeChild(confirmModal);
            }
        });

        document.body.appendChild(confirmModal);
    }

    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const count = await this.promptManager.importPrompts(file);
                    alert(`成功导入 ${count} 个提示词！`);
                    this.renderPromptList();
                } catch (error) {
                    alert(`导入失败: ${error}`);
                }
            }
        });
        input.click();
    }showConfirmDialog(title, message, callback) {
        const confirmModal = document.createElement('div');
        confirmModal.className = 'confirm-dialog-modal';
        confirmModal.innerHTML = `
            <div class="confirm-dialog-overlay">
                <div class="confirm-dialog-container">
                    <div class="confirm-dialog-header">
                        <h4>${title}</h4>
                        <button class="dialog-close-btn">&times;</button>
                    </div>
                    <div class="confirm-dialog-content">
                        <p>${message}</p>
                        <div class="confirm-dialog-options">
                            <div class="option-card" data-action="append">
                                <div class="option-title">确定 - 追加到现有内容后面</div>
                                <div class="option-description">保留原有内容，将新提示词添加到后面</div>
                            </div>
                            <div class="option-card" data-action="replace">
                                <div class="option-title">取消 - 替换全部内容</div>
                                <div class="option-description">删除原有内容，使用新提示词替换</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加确认对话框样式
        this.addConfirmDialogStyles();

        // 绑定事件
        confirmModal.querySelector('.dialog-close-btn').addEventListener('click', () => {
            document.body.removeChild(confirmModal);
        });

        confirmModal.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', () => {
                const action = card.getAttribute('data-action');
                callback(action === 'append');
                document.body.removeChild(confirmModal);
            });
        });

        confirmModal.querySelector('.confirm-dialog-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.body.removeChild(confirmModal);
            }
        });

        document.body.appendChild(confirmModal);
    }

    addConfirmDialogStyles() {
        if (document.getElementById('confirm-dialog-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'confirm-dialog-styles';
        styles.textContent = `
            .confirm-dialog-modal {
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10002;
            }

            .confirm-dialog-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .confirm-dialog-container {
                background: linear-gradient(145deg, #2a2a2a, #1f1f1f);
                border: 1px solid #404040;
                border-radius: 12px;
                min-width: 400px;
                max-width: 500px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
                animation: confirmDialogFadeIn 0.3s ease-out;
            }

            @keyframes confirmDialogFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }            .confirm-dialog-header {
                background: linear-gradient(145deg, #333333, #2a2a2a);
                padding: 16px 20px;
                border-radius: 12px 12px 0 0;
                border-bottom: 1px solid #404040;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .confirm-dialog-header h4 {
                margin: 0;
                color: #ffffff;
                font-size: 16px;
                font-weight: 600;
            }

            .dialog-close-btn {
                background: none;
                border: none;
                color: #999999;
                font-size: 20px;
                cursor: pointer;
                padding: 4px;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .dialog-close-btn:hover {
                background: #ff5733;
                color: #ffffff;
                transform: scale(1.1);
            }

            .confirm-dialog-content {
                padding: 20px;
                color: #e0e0e0;
            }            .confirm-dialog-content p {
                margin: 0 0 15px 0;
                font-size: 14px;
                line-height: 1.5;
            }

            .confirm-dialog-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 15px;
            }

            .option-card {
                background: linear-gradient(145deg, #2a2a2a, #1f1f1f);
                border: 2px solid #404040;
                border-radius: 8px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .option-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                transition: left 0.5s ease;
            }

            .option-card:hover {
                border-color: #2a82e4;
                background: linear-gradient(145deg, #333333, #2a2a2a);
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(42, 130, 228, 0.2);
            }

            .option-card:hover::before {
                left: 100%;
            }

            .option-card:active {
                transform: translateY(0);
                box-shadow: 0 4px 8px rgba(42, 130, 228, 0.3);
            }

            .option-title {
                font-size: 14px;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 6px;
            }

            .option-description {
                font-size: 12px;
                color: #c0c0c0;
                line-height: 1.4;
            }

            .option-card[data-action="append"] .option-title {
                color: #2ea043;
            }.confirm-dialog-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 15px;
            }

            .option-card {
                background: linear-gradient(145deg, #2a2a2a, #1f1f1f);
                border: 2px solid #404040;
                border-radius: 8px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .option-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                transition: left 0.5s ease;
            }

            .option-card:hover {
                border-color: #2a82e4;
                background: linear-gradient(145deg, #333333, #2a2a2a);
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(42, 130, 228, 0.2);
            }

            .option-card:hover::before {
                left: 100%;
            }

            .option-card:active {
                transform: translateY(0);
                box-shadow: 0 4px 8px rgba(42, 130, 228, 0.3);
            }

            .option-title {
                font-size: 14px;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 6px;
            }

            .option-description {
                font-size: 12px;
                color: #c0c0c0;
                line-height: 1.4;
            }

            .option-card[data-action="append"] .option-title {
                color: #2ea043;
            }            .option-card[data-action="replace"] .option-title {
                color: #f85149;
            }
        `;
        document.head.appendChild(styles);
    }

    addDeleteConfirmStyles() {
        if (document.getElementById('delete-confirm-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'delete-confirm-styles';
        styles.textContent = `
            .delete-confirm-modal {
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10003;
            }

            .warning-text {
                color: #ff9999;
                font-size: 12px;
                margin-top: 10px;
                margin-bottom: 0;
            }

            .delete-confirm-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 20px;
            }

            .delete-confirm-btn {
                background: linear-gradient(145deg, #dc3545, #c82333);
                border: none;
                color: white;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.2s ease;
            }

            .delete-confirm-btn:hover {
                background: linear-gradient(145deg, #e74c3c, #dc3545);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4);
            }

            .delete-cancel-btn {
                background: linear-gradient(145deg, #6c757d, #5a6268);
                border: none;
                color: white;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.2s ease;
            }

            .delete-cancel-btn:hover {
                background: linear-gradient(145deg, #7c8590, #6c757d);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(108, 117, 125, 0.4);
            }
        `;
        document.head.appendChild(styles);
    }
}

// 全局提示词管理器
const promptManager = new PromptManager();

function addPromptEmbedderButton(node) {
    // 创建按钮widget
    const embedButton = node.addWidget("button", "嵌入提示词", null, () => {
        const ui = new PromptEmbedderUI(node, promptManager);
        ui.show();
    });
    
    // 设置按钮属性
    embedButton.serialize = false;
    embedButton.options = { hideOnZoom: false };
    
    // 自定义按钮绘制
    const originalComputeSize = embedButton.computeSize;
    embedButton.computeSize = function(width) {
        return [width, 35];
    };

    // 设置按钮点击区域
    embedButton.mouse = function(event, pos, node) {
        if (event.type === "pointerdown") {
            const ui = new PromptEmbedderUI(node, promptManager);
            ui.show();
            return true;
        }
        return false;
    };

    return embedButton;
}

// 注册扩展
app.registerExtension({
    name: "ComfyUI.PromptManager",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // 检查是否是CLIP文本编码器节点
        if (CLIP_TEXT_ENCODERS.includes(nodeData.name)) {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function() {
                const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                addPromptEmbedderButton(this);
                return result;
            };
        }
    }
});
