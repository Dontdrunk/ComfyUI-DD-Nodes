// 列表组件 - 负责提示词列表的显示和交互

import { globalTagColorManager } from './TagColorManager.js';

export class PromptList {    constructor(options = {}) {
        this.prompts = [];
        this.filteredPrompts = [];
        this.currentSearchKeyword = ''; // 存储当前搜索关键词
        this.currentSelectedTags = []; // 存储当前选中的标签
        this.onEdit = options.onEdit || null;
        this.onDelete = options.onDelete || null;
        this.onApply = options.onApply || null;
        this.onTagClick = options.onTagClick || null;
        
        this.container = null;
        this.listContainer = null;
        this.headerContainer = null;
        this.createList();
    }

    createList() {
        this.container = document.createElement('div');
        this.container.className = 'prompt-list-section';        this.container.innerHTML = `
            <div class="prompt-list-header">
                <div class="header-title">
                    <h4>提示词列表</h4>
                    <div class="list-stats">
                        <span class="total-count">0 个项目</span>
                    </div>
                </div>
                <div class="header-actions">
                    <div class="action-group primary">
                        <button class="add-prompt-btn primary-btn">
                            <span class="btn-icon">✨</span>
                            <span class="btn-text">添加提示词</span>
                        </button>
                        <button class="tag-manager-btn secondary-btn">
                            <span class="btn-icon">🏷️</span>
                            <span class="btn-text">标签管理</span>
                        </button>
                    </div>
                    <div class="action-group secondary">
                        <button class="import-btn tertiary-btn">
                            <span class="btn-icon">📥</span>
                            <span class="btn-text">导入</span>
                        </button>
                        <button class="export-btn tertiary-btn">
                            <span class="btn-icon">📤</span>
                            <span class="btn-text">导出</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="prompt-list"></div>
        `;

        this.headerContainer = this.container.querySelector('.prompt-list-header');
        this.listContainer = this.container.querySelector('.prompt-list');

        this.bindEvents();
        this.addStyles();
    }

    bindEvents() {
        // 头部操作按钮事件将在主控制器中绑定
        // 这里只处理列表项的交互事件
    }    setPrompts(prompts) {
        this.prompts = Array.isArray(prompts) ? prompts : [];
        // 重新应用当前搜索关键词和标签筛选
        if (this.currentSearchKeyword && this.currentSearchKeyword.trim() !== '') {
            this.filterPrompts(this.currentSearchKeyword, this.currentSelectedTags);
        } else if (this.currentSelectedTags && this.currentSelectedTags.length > 0) {
            this.filterPrompts('', this.currentSelectedTags);
        } else {
            this.filteredPrompts = [...this.prompts];
            this.render();
        }
        this.updateStats();
    }    addPrompt(prompt) {
        if (prompt && typeof prompt === 'object') {
            this.prompts.push(prompt);
            // 重新应用当前搜索关键词和标签筛选
            if (this.currentSearchKeyword && this.currentSearchKeyword.trim() !== '') {
                this.filterPrompts(this.currentSearchKeyword, this.currentSelectedTags);
            } else if (this.currentSelectedTags && this.currentSelectedTags.length > 0) {
                this.filterPrompts('', this.currentSelectedTags);
            } else {
                this.filteredPrompts = [...this.prompts];
                this.render();
            }
            this.updateStats();
        }
    }    updatePrompt(index, prompt) {
        if (index >= 0 && index < this.prompts.length && prompt) {
            this.prompts[index] = prompt;
            // 重新应用当前搜索关键词和标签筛选
            if (this.currentSearchKeyword && this.currentSearchKeyword.trim() !== '') {
                this.filterPrompts(this.currentSearchKeyword, this.currentSelectedTags);
            } else if (this.currentSelectedTags && this.currentSelectedTags.length > 0) {
                this.filterPrompts('', this.currentSelectedTags);
            } else {
                this.filteredPrompts = [...this.prompts];
                this.render();
            }
            this.updateStats();
        }
    }

    removePrompt(index) {
        if (index >= 0 && index < this.prompts.length) {
            this.prompts.splice(index, 1);            // 重新应用当前搜索关键词和标签筛选
            if (this.currentSearchKeyword && this.currentSearchKeyword.trim() !== '') {
                this.filterPrompts(this.currentSearchKeyword, this.currentSelectedTags);
            } else if (this.currentSelectedTags && this.currentSelectedTags.length > 0) {
                this.filterPrompts('', this.currentSelectedTags);
            } else {
                this.filteredPrompts = [...this.prompts];
                this.render();
            }
            this.updateStats();
        }    }filterPrompts(keyword, selectedTags = []) {
        // 存储当前搜索关键词
        this.currentSearchKeyword = keyword || '';
        this.currentSelectedTags = selectedTags || [];
        
        // 应用关键词筛选和标签筛选
        this.filteredPrompts = this.prompts.filter(prompt => {
            let keywordMatch = true;
            let tagMatch = true;
            
            // 关键词筛选
            if (keyword && keyword.trim() !== '') {
                const searchKeyword = keyword.toLowerCase();
                keywordMatch = false;
                
                // 搜索名称
                if (prompt.name && prompt.name.toLowerCase().includes(searchKeyword)) {
                    keywordMatch = true;
                }
                
                // 搜索内容
                if (!keywordMatch && prompt.content && prompt.content.toLowerCase().includes(searchKeyword)) {
                    keywordMatch = true;
                }
                
                // 搜索标签
                if (!keywordMatch && prompt.tags && Array.isArray(prompt.tags)) {
                    keywordMatch = prompt.tags.some(tag => 
                        tag.toLowerCase().includes(searchKeyword)
                    );
                }
            }
              // 标签筛选 - 修复为AND逻辑（必须包含所有选中的标签）
            if (selectedTags && selectedTags.length > 0) {
                tagMatch = false;
                if (prompt.tags && Array.isArray(prompt.tags)) {
                    // 检查是否包含所有选中的标签（AND逻辑）
                    tagMatch = selectedTags.every(selectedTag => 
                        prompt.tags.includes(selectedTag)
                    );
                }
            }
            
            return keywordMatch && tagMatch;
        });
        
        this.render();
        this.updateStats();
        return this.filteredPrompts.length;
    }

    render() {
        if (this.filteredPrompts.length === 0) {
            this.renderEmptyState();
        } else {
            this.renderPrompts();
        }
    }    renderEmptyState() {
        // 判断是否在搜索状态
        const isSearching = this.currentSearchKeyword && this.currentSearchKeyword.trim() !== '';
        const hasPrompts = this.prompts.length > 0;
        
        let emptyIcon, emptyTitle, emptyDescription;
        
        if (isSearching && hasPrompts) {
            // 有提示词但搜索无结果
            emptyIcon = '🔍';
            emptyTitle = '未找到相关内容';
            emptyDescription = `未找到包含"${this.currentSearchKeyword}"的提示词`;
        } else {
            // 没有提示词
            emptyIcon = '📝';
            emptyTitle = '暂无提示词';
            emptyDescription = '点击"+ 添加提示词"开始添加';
        }
        
        this.listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${emptyIcon}</div>
                <p>${emptyTitle}</p>
                <p>${emptyDescription}</p>
            </div>
        `;
    }

    renderPrompts() {
        this.listContainer.innerHTML = this.filteredPrompts.map((prompt, index) => {
            const actualIndex = this.prompts.indexOf(prompt);
            return this.createPromptItemHTML(prompt, actualIndex);
        }).join('');

        // 绑定列表项事件
        this.bindPromptItemEvents();
    }

    createPromptItemHTML(prompt, index) {        const tagsHTML = prompt.tags && prompt.tags.length > 0 
            ? `<div class="prompt-item-tags">
                ${prompt.tags.map(tag => {
                    const color = globalTagColorManager.getTagColor(tag);
                    const colorRGB = globalTagColorManager.getTagColorRGB(tag);
                    return `<span class="tag" data-tag="${this.escapeHtml(tag)}" style="--tag-color: ${color}; --tag-color-rgb: ${colorRGB};">${this.escapeHtml(tag)}</span>`;
                }).join('')}
               </div>`
            : '';

        return `
            <div class="prompt-item" data-index="${index}">
                <div class="prompt-item-header">
                    <div class="prompt-item-title-section">
                        <div class="prompt-item-name">${this.escapeHtml(prompt.name || '')}</div>
                        ${tagsHTML}
                    </div>
                    <div class="prompt-item-actions">
                        <button class="edit-btn" data-index="${index}">编辑</button>
                        <button class="apply-btn" data-index="${index}">应用</button>
                        <button class="delete-btn" data-index="${index}">删除</button>
                    </div>
                </div>
                <div class="prompt-item-content">${this.escapeHtml(prompt.content || '')}</div>
            </div>
        `;
    }

    bindPromptItemEvents() {
        // 编辑按钮
        this.listContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (this.onEdit && index >= 0) {
                    this.onEdit(index, this.prompts[index]);
                }
            });
        });

        // 应用按钮
        this.listContainer.querySelectorAll('.apply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (this.onApply && index >= 0) {
                    this.onApply(index, this.prompts[index]);
                }
            });
        });

        // 删除按钮
        this.listContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (this.onDelete && index >= 0) {
                    this.onDelete(index, this.prompts[index]);
                }
            });
        });

        // 标签点击事件
        this.listContainer.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const tagName = e.target.dataset.tag;
                if (this.onTagClick && tagName) {
                    this.onTagClick(tagName);
                }
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getElement() {
        return this.container;
    }    getHeaderActions() {
        return {
            importBtn: this.container.querySelector('.import-btn'),
            exportBtn: this.container.querySelector('.export-btn'),
            tagManagerBtn: this.container.querySelector('.tag-manager-btn'),
            addBtn: this.container.querySelector('.add-prompt-btn')
        };
    }

    // 设置回调函数
    setOnEdit(callback) {
        this.onEdit = callback;
    }

    setOnDelete(callback) {
        this.onDelete = callback;
    }

    setOnApply(callback) {
        this.onApply = callback;
    }

    setOnTagClick(callback) {
        this.onTagClick = callback;
    }

    addStyles() {
        const style = document.createElement('style');        style.textContent = `
            .prompt-list-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                background: #1e1e1e;
            }            .prompt-list-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px 32px 20px;
                background: linear-gradient(135deg, #2d2d30, #232326);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
                z-index: 2;
                box-sizing: border-box;
            }

            .prompt-list-header::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            }

            .header-title {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .header-title h4 {
                margin: 0;
                color: #ffffff;
                font-size: 18px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }

            .list-stats {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .total-count {
                color: #999;
                font-size: 12px;
                font-weight: 400;
                letter-spacing: 0.25px;
            }

            .header-actions {
                display: flex;
                gap: 16px;
                align-items: center;
            }

            .action-group {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .action-group.primary {
                order: 1;
            }

            .action-group.secondary {
                order: 2;
                position: relative;
            }

            .action-group.secondary::before {
                content: '';
                position: absolute;
                left: -8px;
                top: 50%;
                transform: translateY(-50%);
                width: 1px;
                height: 24px;
                background: rgba(255, 255, 255, 0.1);
            }

            /* 按钮基础样式 */
            .prompt-list-header button {
                display: flex;
                align-items: center;
                gap: 6px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                position: relative;
                overflow: hidden;
                letter-spacing: 0.25px;
            }

            .prompt-list-header button::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: all 0.3s ease;
                z-index: -1;
            }

            .prompt-list-header button:hover::before {
                width: 200%;
                height: 200%;
            }

            .btn-icon {
                font-size: 14px;
                line-height: 1;
            }

            .btn-text {
                white-space: nowrap;
            }            /* 主要按钮样式 */
            .primary-btn {
                background: linear-gradient(135deg, #0078d4, #106ebe);
                color: white;
                padding: 10px 20px;
                min-height: 40px;
                box-shadow: 0 2px 8px rgba(0, 120, 212, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .primary-btn:hover {
                background: linear-gradient(135deg, #106ebe, #005a9e);
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(0, 120, 212, 0.4);
            }

            .primary-btn:active {
                transform: translateY(0);
                box-shadow: 0 2px 8px rgba(0, 120, 212, 0.3);
            }

            /* 次要按钮样式 */
            .secondary-btn {
                background: linear-gradient(135deg, #404044, #35353a);
                color: #e0e0e0;
                padding: 10px 16px;
                min-height: 40px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .secondary-btn:hover {
                background: linear-gradient(135deg, #4a4a4e, #3f3f44);
                color: #ffffff;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            /* 三级按钮样式 */
            .tertiary-btn {
                background: rgba(255, 255, 255, 0.05);
                color: #ccc;
                padding: 10px 14px;
                min-height: 40px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .tertiary-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                border-color: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
            }.tertiary-btn:active {
                transform: translateY(0);
            }            /* 列表区域样式 */
            .prompt-list {
                flex: 1;
                overflow-y: auto;
                padding: 24px 32px 24px 40px;
                background: #1e1e1e;
                position: relative;
                box-sizing: border-box;
            }            .prompt-list::before {
                content: '';
                position: absolute;
                top: 0;
                left: 32px;
                right: 32px;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            }

            .empty-state {
                text-align: center;
                padding: 80px 20px;
                color: #888;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.02), transparent);
                border-radius: 12px;
                border: 1px dashed rgba(255, 255, 255, 0.1);
                margin: 40px 0;
            }

            .empty-state-icon {
                font-size: 64px;
                margin-bottom: 20px;
                opacity: 0.6;
                filter: grayscale(1);
            }

            .empty-state p {
                margin: 12px 0;
                font-size: 14px;
                line-height: 1.5;
            }

            .empty-state p:first-of-type {
                font-size: 16px;
                font-weight: 500;
                color: #aaa;
            }

            .prompt-item {
                background: linear-gradient(145deg, #2a2a2a, #232323);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 16px;
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }

            .prompt-item::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .prompt-item:hover {
                border-color: rgba(0, 120, 212, 0.4);
                transform: translateY(-2px);
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    0 2px 8px rgba(0, 120, 212, 0.1);
                background: linear-gradient(145deg, #2e2e2e, #272727);
            }

            .prompt-item:hover::before {
                opacity: 1;
            }

            .prompt-item-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 16px;
                gap: 16px;
            }

            .prompt-item-title-section {
                flex: 1;
                min-width: 0;
            }

            .prompt-item-name {
                font-weight: 600;
                color: #ffffff;
                font-size: 16px;
                margin-bottom: 10px;
                word-break: break-word;
                line-height: 1.4;
                letter-spacing: 0.25px;
            }

            .prompt-item-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 8px;
            }            .tag {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: var(--tag-color, #2a82e4);
                color: white;
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 11px;
                font-weight: 500;
                line-height: 1.2;
                white-space: nowrap;
                min-width: 60px;
                max-width: 90px;
                height: 28px;
                overflow: hidden;
                text-overflow: ellipsis;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                user-select: none;
                position: relative;
                letter-spacing: 0.25px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transform: scale(1);
                text-shadow: 
                    -1px -1px 0 #000,
                    1px -1px 0 #000,
                    -1px 1px 0 #000,
                    1px 1px 0 #000,
                    0 -1px 0 #000,
                    0 1px 0 #000,
                    -1px 0 0 #000,
                    1px 0 0 #000;
            }.tag::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
                border-radius: inherit;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }            .tag:hover {
                box-shadow: 
                    0 0 10px rgba(var(--tag-color-rgb), 0.3),
                    0 4px 15px rgba(0, 0, 0, 0.2);
                transform: scale(1.05);
                border-color: rgba(var(--tag-color-rgb), 0.4);
                filter: brightness(1.1) saturate(1.05);
            }.tag:hover::before {
                opacity: 1;
            }

            .prompt-item-actions {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }

            .edit-btn, .apply-btn, .delete-btn {
                background: #383838;
                border: none;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s ease;
                white-space: nowrap;
            }

            .edit-btn:hover {
                background: #ffc300;
                color: #000;
                transform: translateY(-1px);
            }

            .apply-btn:hover {
                background: #43cf7c;
                transform: translateY(-1px);
            }

            .delete-btn {
                background: #8b3a3a;
            }

            .delete-btn:hover {
                background: #ff5733;
                transform: translateY(-1px);
            }            .prompt-item-content {
                color: #c4c4c4;
                line-height: 1.5;
                background: linear-gradient(145deg, #1a1a1a, #232323);
                padding: 16px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                white-space: pre-wrap;
                word-break: break-word;
                max-height: 200px;
                overflow-y: auto;
                margin: 0 auto;
                text-align: left;
                font-size: 14px;
                box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
                width: 100%;
                max-width: 100%;
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .prompt-list-header {
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                }

                .header-actions {
                    justify-content: space-between;
                }

                .prompt-item {
                    padding: 12px;
                }

                .prompt-item-header {
                    flex-direction: column;
                    gap: 12px;
                }

                .prompt-item-actions {
                    justify-content: flex-end;
                }
            }
        `;
        
        if (!document.head.querySelector('style[data-component="prompt-list"]')) {
            style.setAttribute('data-component', 'prompt-list');
            document.head.appendChild(style);
        }
    }

    updateStats() {
        const totalElement = this.container.querySelector('.total-count');
        if (totalElement) {
            totalElement.textContent = `${this.filteredPrompts.length} 个项目`;
        }
    }    // 新增：刷新所有标签的颜色
    refreshTagColors() {
        console.log('PromptList: 刷新标签颜色和删除无效标签...');
        
        // 重新渲染整个列表以确保已删除的标签被正确移除
        // 这比仅仅更新颜色更可靠，能够处理标签删除的情况
        this.render();
        
        console.log('PromptList: 标签颜色刷新和无效标签清理完成');
    }

    // 新增：完全重新渲染列表（保持当前筛选状态）
    forceRefresh() {
        this.render();
    }

    // 清除所有筛选条件
    clearFilters() {
        this.currentSearchKeyword = '';
        this.currentSelectedTags = [];
        this.filteredPrompts = [...this.prompts];
        this.render();
        this.updateStats();
    }

    // 获取当前筛选状态
    getFilterState() {
        return {
            keyword: this.currentSearchKeyword,
            selectedTags: this.currentSelectedTags
        };
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // 移除样式
        const style = document.head.querySelector('style[data-component="prompt-list"]');
        if (style) {
            style.remove();
        }
    }
}
