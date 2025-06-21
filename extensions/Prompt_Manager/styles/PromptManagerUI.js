// 提示词管理器 UI 模块，包含所有界面相关的逻辑和样式

export class PromptManagerUI {
    constructor(embedder) {
        this.embedder = embedder;
        this.promptManager = embedder.promptManager;
        this.node = embedder.node;
        this.isVisible = false;
        this.editingPrompt = null;
        this.currentSearchKeyword = '';
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
                    <div class="prompt-embedder-content">
                        <div class="prompt-list-section">
                            <div class="prompt-list-header">
                                <h4>提示词列表</h4>
                                <div class="header-actions">
                                    <button class="import-btn">导入</button>
                                    <button class="export-btn">导出</button>
                                    <button class="add-prompt-btn">+ 添加提示词</button>
                                </div>
                            </div>
                            <div class="search-section">
                                <div class="search-container">
                                    <input type="text" class="search-input" placeholder="搜索提示词名称、内容或标签（多标签用逗号分隔）..." />
                                    <div class="search-icon">🔍</div>
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
                                <div class="form-group">
                                    <label>标签 (最多4个，用逗号分隔):</label>
                                    <input type="text" name="tags" placeholder="例如: 人物, 风景, 高质量, 写实" maxlength="200">
                                    <small style="color: #888; font-size: 12px;">标签用于快速分类和搜索提示词，每个标签用逗号分隔</small>
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
            }

            .prompt-list-header {
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

            .search-section {
                margin-bottom: 15px;
            }

            .search-container {
                position: relative;
                display: flex;
                align-items: center;
            }

            .search-input {
                width: 100%;
                padding: 10px 40px 10px 12px;
                background: #262626;
                border: 1px solid #3d3d3d;
                border-radius: 6px;
                color: #ffffff;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }

            .search-input:focus {
                border-color: #2a82e4;
            }

            .search-input::placeholder {
                color: #888;
            }

            .search-icon {
                position: absolute;
                right: 12px;
                color: #888;
                pointer-events: none;
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
                align-items: flex-start;
                margin-bottom: 8px;
            }

            .prompt-item-title-section {
                flex: 1;
                min-width: 0;
            }

            .prompt-item-name {
                font-weight: bold;
                color: #ffffff;
                font-size: 16px;
                margin-bottom: 4px;
            }

            .prompt-item-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 4px;
            }

            .tag {
                display: inline-block;
                background: #2a82e4;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                line-height: 1.2;
                white-space: nowrap;
                max-width: 100px;
                overflow: hidden;
                text-overflow: ellipsis;
                cursor: pointer;
                transition: all 0.2s ease;
                user-select: none;
            }

            .tag:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(42, 130, 228, 0.3);
                filter: brightness(1.1);
            }

            .tag:nth-child(even) {
                background: #43cf7c;
            }

            .tag:nth-child(even):hover {
                box-shadow: 0 2px 8px rgba(67, 207, 124, 0.3);
            }

            .tag:nth-child(3n) {
                background: #ff8c42;
            }

            .tag:nth-child(3n):hover {
                box-shadow: 0 2px 8px rgba(255, 140, 66, 0.3);
            }

            .tag:nth-child(4n) {
                background: #9b59b6;
            }

            .tag:nth-child(4n):hover {
                box-shadow: 0 2px 8px rgba(155, 89, 182, 0.3);
            }

            .prompt-item-actions {
                display: flex;
                gap: 8px;
            }

            .edit-btn, .apply-btn, .delete-btn {
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

            .search-highlight {
                background-color: #ffc300;
                color: #000;
                padding: 1px 2px;
                border-radius: 2px;
                font-weight: bold;
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
        });

        // 添加提示词按钮
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

        // 搜索框事件监听
        const searchInput = this.modal.querySelector('.search-input');
        
        // 输入事件 - 实时搜索
        searchInput.addEventListener('input', (e) => {
            this.currentSearchKeyword = e.target.value;
            this.renderPromptList();
        });

        // 清空搜索框快捷键 (Escape)
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.target.value = '';
                this.currentSearchKeyword = '';
                this.renderPromptList();
            }
        });
    }

    show() {
        this.isVisible = true;
        this.modal.style.display = 'block';
        
        // 重置搜索状态
        this.currentSearchKeyword = '';
        const searchInput = this.modal.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
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
            form.tags.value = (prompt.tags || []).join(', ');
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
        const tagsInput = form.tags.value.trim();

        if (!name || !content) {
            alert('请填写完整的提示词名称和内容');
            return;
        }

        // 处理标签输入
        let tags = [];
        if (tagsInput) {
            tags = tagsInput.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
                .slice(0, 4); // 限制最多4个标签
        }

        if (this.editingPrompt) {
            this.promptManager.updatePrompt(this.editingPrompt.id, name, content, tags);
        } else {
            this.promptManager.addPrompt(name, content, tags);
        }

        this.hideForm();
        this.renderPromptList();
    }

    renderPromptList() {
        const listContainer = this.modal.querySelector('.prompt-list');
        
        // 使用搜索功能获取提示词列表
        const prompts = this.currentSearchKeyword 
            ? this.promptManager.searchPrompts(this.currentSearchKeyword)
            : this.promptManager.getPrompts();

        // 如果搜索无结果，显示相应提示
        if (this.currentSearchKeyword && prompts.length === 0) {
            const isMultiTagSearch = this.currentSearchKeyword.includes(',');
            const helpText = isMultiTagSearch 
                ? '尝试减少标签数量或使用不同的标签组合'
                : '尝试使用其他关键词、标签名称或用逗号分隔多个标签搜索';
                
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div>未找到匹配"${this.escapeHtml(this.currentSearchKeyword)}"的提示词</div>
                    <div style="font-size: 12px; color: #888; margin-top: 5px;">${helpText}</div>
                </div>
            `;
            return;
        }

        // 如果没有提示词，显示空状态
        if (prompts.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div>暂无提示词，点击上方"+ 添加提示词"按钮来添加第一个提示词</div>
                </div>
            `;
            return;
        }

        // 渲染提示词列表，如果是搜索结果，高亮显示匹配的关键词
        listContainer.innerHTML = prompts.map(prompt => {
            let displayName = this.escapeHtml(prompt.name);
            let displayContent = this.escapeHtml(prompt.content);
            let displayTags = (prompt.tags || []).map(tag => this.escapeHtml(tag));
            
            // 如果有搜索关键词，高亮显示匹配的部分
            if (this.currentSearchKeyword) {
                const keyword = this.escapeHtml(this.currentSearchKeyword);
                const highlightClass = 'search-highlight';
                
                // 处理多标签搜索的高亮
                const isMultiTagSearch = keyword.includes(',');
                if (isMultiTagSearch) {
                    const searchTags = keyword.split(',').map(tag => tag.trim()).filter(tag => tag);
                    
                    // 高亮匹配的标签
                    displayTags = displayTags.map(tag => {
                        const tagLower = tag.toLowerCase();
                        const matchedSearchTag = searchTags.find(searchTag => 
                            tagLower.includes(searchTag.toLowerCase())
                        );
                        if (matchedSearchTag) {
                            const tagRegex = new RegExp(`(${matchedSearchTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                            return tag.replace(tagRegex, `<span class="${highlightClass}">$1</span>`);
                        }
                        return tag;
                    });
                } else {
                    // 单关键词搜索的高亮
                    const nameRegex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    displayName = displayName.replace(nameRegex, `<span class="${highlightClass}">$1</span>`);
                    
                    const contentRegex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    displayContent = displayContent.replace(contentRegex, `<span class="${highlightClass}">$1</span>`);
                    
                    // 高亮标签中的匹配文本
                    displayTags = displayTags.map(tag => {
                        return tag.replace(nameRegex, `<span class="${highlightClass}">$1</span>`);
                    });
                }
            }
            
            // 生成标签HTML
            const tagsHtml = displayTags.length > 0 
                ? `<div class="prompt-item-tags">${displayTags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
                : '';
            
            return `
                <div class="prompt-item" data-id="${prompt.id}">
                    <div class="prompt-item-header">
                        <div class="prompt-item-title-section">
                            <div class="prompt-item-name">${displayName}</div>
                            ${tagsHtml}
                        </div>
                        <div class="prompt-item-actions">
                            <button class="edit-btn" data-action="edit" title="编辑提示词">编辑</button>
                            <button class="apply-btn" data-action="apply" title="应用提示词">应用</button>
                            <button class="delete-btn" data-action="delete" title="删除提示词">删除</button>
                        </div>
                    </div>
                    <div class="prompt-item-content">${displayContent}</div>
                </div>
            `;
        }).join('');

        // 移除之前的事件监听器（如果存在）
        const existingListener = this._listClickHandler;
        if (existingListener) {
            listContainer.removeEventListener('click', existingListener);
        }

        // 创建新的事件处理器
        this._listClickHandler = (e) => {
            const action = e.target.getAttribute('data-action');
            if (!action) return; // 如果没有action属性，则不处理

            const promptItem = e.target.closest('.prompt-item');
            if (!promptItem) return; // 如果找不到对应的提示词项，则不处理

            const promptId = parseInt(promptItem.getAttribute('data-id'));
            const prompt = prompts.find(p => p.id === promptId);
            
            if (!prompt) {
                console.error('找不到对应的提示词:', promptId);
                return;
            }

            // 防止事件冒泡
            e.stopPropagation();
            e.preventDefault();

            try {
                if (action === 'edit') {
                    this.showForm(prompt);
                } else if (action === 'apply') {
                    this.embedder.applyPrompt(prompt);
                } else if (action === 'delete') {
                    this.deletePrompt(prompt);
                }
            } catch (error) {
                console.error('操作失败:', error);
                alert('操作失败: ' + error.message);
            }
        };

        // 绑定新的事件监听器
        listContainer.addEventListener('click', this._listClickHandler);

        // 添加标签点击事件处理
        const tagElements = listContainer.querySelectorAll('.tag');
        tagElements.forEach(tagElement => {
            tagElement.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // 获取标签文本（去除HTML高亮标记）
                const tagText = tagElement.textContent.trim();
                
                // 在搜索框中设置标签文本并执行搜索
                const searchInput = this.modal.querySelector('.search-input');
                searchInput.value = tagText;
                this.currentSearchKeyword = tagText;
                this.renderPromptList();
                
                // 聚焦到搜索框
                searchInput.focus();
            });
            
            // 添加标签悬停提示
            tagElement.title = `点击搜索标签: ${tagElement.textContent.trim()}`;
        });
    }

    deletePrompt(prompt) {
        // 显示确认删除对话框
        this.showDeleteConfirmDialog(prompt.name, () => {
            this.promptManager.deletePrompt(prompt.id);
            this.renderPromptList();
        });
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
    }

    showTextWidgetSelector(prompt) {
        const textWidgets = this.embedder.getAllTextWidgets();
        
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
                                    ${this.embedder.getWidgetDisplayName(widget)} 
                                    ${widget.value ? `(当前: ${widget.value.substring(0, 30)}...)` : '(空)'}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加选择器样式
        this.addWidgetSelectorStyles();
        
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
                this.embedder.applyPromptToWidget(prompt, selectedWidget);
                document.body.removeChild(selectorModal);
            }
        });
        
        document.body.appendChild(selectorModal);
        return true;
    }

    showInsertDialog(title, message, callback) {
        const insertModal = document.createElement('div');
        insertModal.className = 'confirm-dialog-modal';
        insertModal.innerHTML = `
            <div class="confirm-dialog-overlay">
                <div class="confirm-dialog-container">
                    <div class="confirm-dialog-header">
                        <h4>${title}</h4>
                        <button class="dialog-close-btn">&times;</button>
                    </div>
                    <div class="confirm-dialog-content">
                        <p>${message}</p>
                        <div class="confirm-dialog-options">
                            <div class="option-card" data-action="insert">
                                <div class="option-title">插入 - 在光标位置插入</div>
                                <div class="option-description">在当前光标位置或文本开头插入提示词</div>
                            </div>
                            <div class="option-card" data-action="replace">
                                <div class="option-title">替换 - 替换全部内容</div>
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
        insertModal.querySelector('.dialog-close-btn').addEventListener('click', () => {
            document.body.removeChild(insertModal);
        });

        insertModal.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', () => {
                const action = card.getAttribute('data-action');
                callback(action);
                document.body.removeChild(insertModal);
            });
        });

        insertModal.querySelector('.confirm-dialog-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.body.removeChild(insertModal);
            }
        });

        document.body.appendChild(insertModal);
    }

    showConfirmDialog(title, message, callback) {
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

    showDeleteConfirmDialog(promptName, callback) {
        // 移除已存在的删除确认对话框
        const existingModal = document.querySelector('.delete-confirm-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const confirmModal = document.createElement('div');
        confirmModal.className = 'delete-confirm-modal';
        confirmModal.innerHTML = `
            <div class="delete-confirm-overlay">
                <div class="delete-confirm-container">
                    <div class="delete-confirm-header">
                        <h4>确认删除</h4>
                        <button class="delete-close-btn">&times;</button>
                    </div>
                    <div class="delete-confirm-content">
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

        // 安全的事件绑定
        const closeBtn = confirmModal.querySelector('.delete-close-btn');
        const confirmBtn = confirmModal.querySelector('.delete-confirm-btn');
        const cancelBtn = confirmModal.querySelector('.delete-cancel-btn');
        const overlay = confirmModal.querySelector('.delete-confirm-overlay');

        const removeModal = () => {
            if (confirmModal.parentNode) {
                confirmModal.parentNode.removeChild(confirmModal);
            }
        };

        closeBtn.addEventListener('click', removeModal);
        cancelBtn.addEventListener('click', removeModal);
        
        confirmBtn.addEventListener('click', () => {
            try {
                callback();
            } catch (error) {
                console.error('删除操作失败:', error);
            } finally {
                removeModal();
            }
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                removeModal();
            }
        });

        document.body.appendChild(confirmModal);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    addWidgetSelectorStyles() {
        if (document.getElementById('widget-selector-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'widget-selector-styles';
        styles.textContent = `
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
            }

            .confirm-dialog-header {
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
            }

            .confirm-dialog-content p {
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
            }

            .option-card[data-action="replace"] .option-title {
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

            .delete-confirm-overlay {
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

            .delete-confirm-container {
                background: linear-gradient(145deg, #2a2a2a, #1f1f1f);
                border: 1px solid #404040;
                border-radius: 12px;
                min-width: 400px;
                max-width: 500px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
                animation: deleteConfirmFadeIn 0.3s ease-out;
            }

            @keyframes deleteConfirmFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            .delete-confirm-header {
                background: linear-gradient(145deg, #333333, #2a2a2a);
                padding: 16px 20px;
                border-radius: 12px 12px 0 0;
                border-bottom: 1px solid #404040;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .delete-confirm-header h4 {
                margin: 0;
                color: #ffffff;
                font-size: 16px;
                font-weight: 600;
            }

            .delete-close-btn {
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

            .delete-close-btn:hover {
                background: #ff5733;
                color: #ffffff;
                transform: scale(1.1);
            }

            .delete-confirm-content {
                padding: 20px;
                color: #e0e0e0;
            }

            .delete-confirm-content p {
                margin: 0 0 15px 0;
                font-size: 14px;
                line-height: 1.5;
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
