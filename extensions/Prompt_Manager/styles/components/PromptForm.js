// 表单组件 - 负责添加/编辑提示词的表单

import { globalTagColorManager } from './TagColorManager.js';

export class PromptForm {
    constructor(options = {}) {
        this.onSubmit = options.onSubmit || null;
        this.onCancel = options.onCancel || null;
        this.getPrompts = options.getPrompts || null; // 新增：获取提示词数据的回调
        this.isEditing = false;
        this.editingPrompt = null;
        
        this.container = null;
        this.form = null;
        this.titleElement = null;
        this.createForm();
    }    createForm() {        this.container = document.createElement('div');
        this.container.className = 'prompt-form-section';
        // 初始状态：隐藏表单内容
        this.container.style.visibility = 'hidden';
        this.container.innerHTML = `
            <h4 class="form-title">添加提示词</h4>
            <form class="prompt-form">
                <div class="form-group">
                    <label for="prompt-name">提示词名称:</label>
                    <input type="text" id="prompt-name" name="name" placeholder="输入提示词名称" required>
                    <small class="form-hint">建议使用简洁明了的名称，便于快速识别</small>
                </div>
                <div class="form-group">
                    <label for="prompt-content">提示词内容:</label>
                    <textarea id="prompt-content" name="content" placeholder="输入提示词内容" rows="6" required></textarea>
                    <small class="form-hint">输入详细的提示词内容，支持多行文本</small>
                </div>                <div class="form-group">
                    <label for="prompt-tags">标签 (用逗号分隔):</label>
                    <div class="tags-input-wrapper">
                        <input type="text" id="prompt-tags" name="tags" placeholder="例如: 人物, 风景, 高质量, 写实" maxlength="200">
                        <button type="button" class="tags-selector-btn" title="从已有标签中选择">🏷️</button>
                    </div>                    <small class="form-hint">标签用于快速分类和搜索提示词，每个标签用逗号分隔</small>
                    
                    <div class="available-tags" style="display: none;">
                        <!-- 可选标签将在这里显示 -->
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="save-btn">
                        <span class="btn-icon">💾</span>
                        <span class="btn-text">保存</span>
                    </button>
                    <button type="button" class="cancel-btn">
                        <span class="btn-icon">✖</span>
                        <span class="btn-text">取消</span>
                    </button>
                </div>
            </form>
        `;

        this.form = this.container.querySelector('.prompt-form');
        this.titleElement = this.container.querySelector('.form-title');        this.bindEvents();
        this.addStyles();
    }

    bindEvents() {
        // 表单提交
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // 取消按钮
        const cancelBtn = this.container.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => {
            this.handleCancel();
        });

        // 输入验证
        this.bindValidationEvents();

        // 标签输入处理
        this.bindTagsInput();

        // ESC键取消
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleCancel();
            }
        });
    }

    bindValidationEvents() {
        const nameInput = this.form.querySelector('input[name="name"]');
        const contentInput = this.form.querySelector('textarea[name="content"]');

        // 实时验证
        nameInput.addEventListener('input', () => this.validateInput(nameInput));
        contentInput.addEventListener('input', () => this.validateInput(contentInput));
        
        // 失焦验证
        nameInput.addEventListener('blur', () => this.validateInput(nameInput));
        contentInput.addEventListener('blur', () => this.validateInput(contentInput));
    }    bindTagsInput() {
        const tagsInput = this.form.querySelector('input[name="tags"]');
        const tagsSelectorBtn = this.form.querySelector('.tags-selector-btn');
        const availableTagsContainer = this.form.querySelector('.available-tags');
        
        tagsInput.addEventListener('input', (e) => {
            const value = e.target.value;
            const tags = this.parseTags(value);
            
            e.target.classList.remove('error');
            this.hideInputError(e.target);
            
            // 实时更新标签预览
            this.updateTagsPreview();
        });

        // 标签选择按钮
        tagsSelectorBtn.addEventListener('click', () => {
            this.toggleAvailableTags();
        });    }

    // 辅助方法：将十六进制颜色转换为RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    validateInput(input) {
        const value = input.value.trim();
        
        if (input.hasAttribute('required') && !value) {
            input.classList.add('error');
            this.showInputError(input, '此字段为必填项');
            return false;
        } else {
            input.classList.remove('error');
            this.hideInputError(input);
            return true;
        }
    }

    showInputError(input, message) {
        let errorElement = input.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('small');
            errorElement.className = 'error-message';
            input.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    hideInputError(input) {
        const errorElement = input.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }    updateTagsPreview() {
        const tagsInput = this.form.querySelector('input[name="tags"]');
        const tags = this.parseTags(tagsInput.value);
        
        // 找到标签输入框所在的form-group容器
        const tagsFormGroup = tagsInput.closest('.form-group');
        
        let previewElement = tagsFormGroup.querySelector('.tags-preview');
        if (!previewElement) {
            previewElement = document.createElement('div');
            previewElement.className = 'tags-preview';
            // 将预览元素添加到form-group的末尾
            tagsFormGroup.appendChild(previewElement);
        }if (tags.length > 0) {
            previewElement.innerHTML = `
                <div class="tags-preview-label">标签预览:</div>
                <div class="tags-preview-list">
                    ${tags.map(tag => {
                        const color = globalTagColorManager.getTagColor(tag);
                        const colorRGB = globalTagColorManager.getTagColorRGB(tag);
                        return `<span class="tag-preview" style="--tag-color: ${color}; --tag-color-rgb: ${colorRGB};">${this.escapeHtml(tag)}</span>`;
                    }).join('')}
                </div>
            `;
            previewElement.style.display = 'block';
        } else {
            previewElement.style.display = 'none';
        }
    }

    handleSubmit() {
        const formData = this.getFormData();
        
        // 验证表单
        if (!this.validateForm(formData)) {
            return;
        }

        if (this.onSubmit) {
            this.onSubmit(formData, this.isEditing, this.editingPrompt);
        }
    }

    handleCancel() {
        if (this.onCancel) {
            this.onCancel();
        }
        this.hide();
    }

    validateForm(formData) {
        let isValid = true;

        // 验证名称
        if (!formData.name.trim()) {
            const nameInput = this.form.querySelector('input[name="name"]');
            this.showInputError(nameInput, '请输入提示词名称');
            nameInput.classList.add('error');
            isValid = false;
        }

        // 验证内容
        if (!formData.content.trim()) {
            const contentInput = this.form.querySelector('textarea[name="content"]');
            this.showInputError(contentInput, '请输入提示词内容');
            contentInput.classList.add('error');
            isValid = false;
        }        // 验证标签数量 - 已移除限制，允许任意数量的标签

        return isValid;
    }

    getFormData() {
        const formData = new FormData(this.form);
        const tagsValue = formData.get('tags') || '';
        
        return {
            name: formData.get('name').trim(),
            content: formData.get('content').trim(),
            tags: this.parseTags(tagsValue)
        };
    }    parseTags(tagsString) {
        if (!tagsString) return [];
        
        return tagsString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0 && tag.length <= 20); // 只限制单个标签长度，不限制标签数量
    }    show(mode = 'add', prompt = null) {
        this.isEditing = mode === 'edit';
        this.editingPrompt = prompt;
        
        if (this.isEditing && prompt) {
            this.titleElement.textContent = '编辑提示词';
            this.populateForm(prompt);
        } else {
            this.titleElement.textContent = '添加提示词';
            this.clearForm();
        }
        
        // 确保"从已有标签中选择"界面是隐藏的
        const availableTagsContainer = this.form.querySelector('.available-tags');
        if (availableTagsContainer) {
            availableTagsContainer.style.display = 'none';
        }
        
        // 显示表单容器
        this.container.style.visibility = 'visible';
        
        // 查找布局容器
        const layoutContainer = this.container.closest('.prompt-manager-layout');
        if (layoutContainer) {
            // 添加展开类以触发布局动画
            layoutContainer.classList.add('form-expanded');
        }
        
        // 等待下一帧确保DOM更新
        requestAnimationFrame(() => {
            // 聚焦到第一个输入框
            setTimeout(() => {
                const firstInput = this.form.querySelector('input[name="name"]');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        });
    }    hide() {
        // 隐藏表单容器
        this.container.style.visibility = 'hidden';
        this.clearForm();
        this.isEditing = false;
        this.editingPrompt = null;
        
        // 确保"从已有标签中选择"界面被隐藏
        const availableTagsContainer = this.form.querySelector('.available-tags');
        if (availableTagsContainer) {
            availableTagsContainer.style.display = 'none';
        }
        
        // 查找布局容器，检查是否还有其他内容需要显示
        const layoutContainer = this.container.closest('.prompt-manager-layout');
        if (layoutContainer) {
            // 检查是否还有其他组件在显示（比如 TagManager）
            const tagManager = layoutContainer.querySelector('.tag-manager-section');
            const isTagManagerVisible = tagManager && tagManager.classList.contains('active');
            
            // 只有当没有其他内容显示时才移除展开类
            if (!isTagManagerVisible) {
                layoutContainer.classList.remove('form-expanded');
            }
        }
    }

    isVisible() {
        return this.container.style.visibility !== 'hidden';
    }    populateForm(prompt) {
        this.form.querySelector('input[name="name"]').value = prompt.name || '';
        this.form.querySelector('textarea[name="content"]').value = prompt.content || '';
        this.form.querySelector('input[name="tags"]').value = (prompt.tags || []).join(', ');
        
        // 确保"从已有标签中选择"界面是隐藏的
        const availableTagsContainer = this.form.querySelector('.available-tags');
        if (availableTagsContainer) {
            availableTagsContainer.style.display = 'none';
        }
        
        this.updateTagsPreview();
    }clearForm() {
        this.form.reset();
        
        // 清除错误状态
        this.form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        this.form.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // 隐藏标签预览
        const previewElement = this.container.querySelector('.tags-preview');
        if (previewElement) {
            previewElement.style.display = 'none';
        }
        
        // 隐藏"从已有标签中选择"界面
        const availableTagsContainer = this.form.querySelector('.available-tags');
        if (availableTagsContainer) {
            availableTagsContainer.style.display = 'none';
        }
    }

    getElement() {
        return this.container;
    }

    setOnSubmit(callback) {
        this.onSubmit = callback;
    }

    setOnCancel(callback) {
        this.onCancel = callback;
    }

    // 添加一个公开方法供外部调用清理
    setGetPrompts(getPromptsCallback) {
        this.getPrompts = getPromptsCallback;
    }

    // 手动清理未使用的标签
    cleanupUnusedTags() {
        if (this.getPrompts && typeof this.getPrompts === 'function') {
            const prompts = this.getPrompts();
            globalTagColorManager.cleanupUnusedTags(prompts);
        }
    }

    // 工具函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }    addStyles() {
        const style = document.createElement('style');
        style.textContent = `            .prompt-form-section {
                width: 100%;
                padding: 24px;
                background: transparent;
                border-left: none;
                display: flex;
                flex-direction: column;
                height: 100%;
                position: relative;
                overflow-y: auto;
                opacity: 0;
                visibility: visible;
                transition: opacity 0.3s ease-out 0.1s;
            }

            /* 当父容器展开时，表单内容同步显示 */
            .prompt-manager-layout.form-expanded .prompt-form-section {
                opacity: 1;
            }

            .prompt-form-section::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 1px;
                height: 100%;
                background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            }

            .form-title {
                margin: 0 0 24px 0;
                color: #ffffff;
                font-size: 18px;
                font-weight: 600;
                letter-spacing: 0.5px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
            }

            .form-title::after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 0;
                width: 60px;
                height: 2px;
                background: linear-gradient(90deg, #0078d4, transparent);
                border-radius: 1px;
            }

            .prompt-form {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .form-group label {
                color: #e0e0e0;
                font-weight: 500;
                font-size: 14px;
                letter-spacing: 0.25px;
                margin-bottom: 4px;
            }            .form-group input,
            .form-group textarea {
                background: linear-gradient(145deg, #1a1a1a, #232323);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #ffffff;
                padding: 14px 16px;
                font-size: 14px;
                font-family: inherit;
                transition: all 0.3s ease-out;
                resize: vertical;
                position: relative;
                box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
            }

            .form-group input:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: rgba(0, 120, 212, 0.6);
                box-shadow: 
                    0 0 0 3px rgba(0, 120, 212, 0.15),
                    inset 0 1px 3px rgba(0, 0, 0, 0.2);
                background: linear-gradient(145deg, #1e1e1e, #272727);
                transform: translateY(-1px);
            }

            .form-group input::placeholder,
            .form-group textarea::placeholder {
                color: #666;
                font-weight: 300;
            }

            .form-hint {
                color: #888;
                font-size: 12px;
                font-weight: 400;
                line-height: 1.4;
                margin-top: 4px;
                opacity: 0.8;
            }

            .tags-input-wrapper {
                display: flex;
                gap: 8px;
                align-items: stretch;
            }

            .tags-input-wrapper input {
                flex: 1;
            }            .tags-selector-btn {
                background: linear-gradient(145deg, #404044, #35353a);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #e0e0e0;
                padding: 0 16px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease-out;
                white-space: nowrap;
                display: flex;
                align-items: center;
                position: relative;
                overflow: hidden;
            }            .tags-selector-btn::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: all 0.3s ease-out;
                z-index: -1;
            }

            .tags-selector-btn:hover {
                background: linear-gradient(145deg, #4a4a4e, #3f3f44);
                color: #ffffff;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .tags-selector-btn:hover::before {
                width: 200%;
                height: 200%;
            }            .tags-selector-btn:active {
                transform: translateY(0);
            }            /* 标签预览区域样式 */
            .tags-preview {
                display: none;
                margin-top: 16px;
                padding: 12px;
                background: linear-gradient(145deg, #1a1a1a, #252525);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
            }

            .tags-preview-label {
                color: #e0e0e0;
                font-size: 12px;
                margin-bottom: 8px;
                font-weight: 500;
            }

            .tags-preview-list {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }

            .tag-preview {
                display: inline-block;
                background: var(--tag-color, #2a82e4);
                color: white;
                padding: 4px 10px;
                border-radius: 16px;
                font-size: 11px;
                font-weight: 500;
                line-height: 1.2;
                white-space: nowrap;
                max-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease-out;
                position: relative;
                text-shadow: 
                    -1px -1px 0 #000,
                    1px -1px 0 #000,
                    -1px 1px 0 #000,
                    1px 1px 0 #000,
                    0 -1px 0 #000,
                    0 1px 0 #000,
                    -1px 0 0 #000,
                    1px 0 0 #000;
            }

            .tags-preview-section {
                margin-top: 12px;
                padding: 12px;
                background: linear-gradient(145deg, #1a1a1a, #252525);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.05);
                min-height: 60px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .tags-preview-label {
                color: #ccc;
                font-size: 12px;
                font-weight: 500;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .tags-preview-label::before {
                content: '👁️';
                font-size: 11px;
            }

            .tags-preview-container {
                flex: 1;
                min-height: 36px;
                display: flex;
                align-items: center;
            }

            .tags-preview-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                width: 100%;
                min-height: 36px;
                align-items: center;
            }

            .tags-preview-list:empty::after {
                content: '暂无标签预览';
                color: #666;
                font-size: 12px;
                font-style: italic;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 36px;
                border: 1px dashed rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                background: rgba(0, 0, 0, 0.2);
            }

            .preview-tag {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: var(--tag-color, #2a82e4);
                color: white;
                padding: 6px 12px;
                border-radius: 14px;
                font-size: 11px;
                font-weight: 500;
                line-height: 1.2;
                white-space: nowrap;
                min-width: 60px;
                max-width: 90px;
                height: 26px;
                overflow: hidden;
                text-overflow: ellipsis;
                position: relative;
                letter-spacing: 0.25px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                text-align: center;
                transition: all 0.2s ease;
                animation: tagFadeIn 0.3s ease-out;
            }

            .preview-tag:hover {
                transform: scale(1.05);
                filter: brightness(1.1);
            }

            @keyframes tagFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.8) translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            /* 可选标签区域样式 */
            .available-tags {
                margin-top: 12px;
                padding: 16px;
                background: linear-gradient(145deg, #1a1a1a, #252525);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                max-height: 200px;
                overflow-y: auto;
            }            .available-tags.show {
                display: block !important;
                animation: slideDown 0.3s ease-out;
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }            .available-tags h5 {
                margin: 0 0 12px 0;
                color: #e0e0e0;
                font-size: 13px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .available-tags h5::before {
                content: '🏷️';
                font-size: 12px;
            }

            .available-tags-header {
                margin: 0 0 12px 0;
            }

            .available-tags-header span {
                color: #ccc;
                font-size: 12px;
                font-weight: 500;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .available-tags-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }            .available-tag {
                display: inline-flex;
                align-items: center;
                background: var(--tag-color, #2a82e4);
                color: white;
                padding: 6px 12px;
                border-radius: 14px;
                font-size: 11px;
                font-weight: 500;
                line-height: 1.2;
                white-space: nowrap;
                min-width: 60px;
                max-width: 90px;
                height: 26px;
                overflow: hidden;
                text-overflow: ellipsis;
                position: relative;
                letter-spacing: 0.25px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                text-align: center;
                transition: all 0.2s ease;
                cursor: pointer;
                user-select: none;
                transform: scale(1);
                justify-content: center;
                text-shadow: 
                    -1px -1px 0 #000,
                    1px -1px 0 #000,
                    -1px 1px 0 #000,
                    1px 1px 0 #000,
                    0 -1px 0 #000,
                    0 1px 0 #000,
                    -1px 0 0 #000,
                    1px 0 0 #000;
            }.available-tag:hover {
                transform: scale(1.05);
                filter: brightness(1.1);
            }

            .available-tag.selected {
                background: #666;
                color: #999;
                filter: grayscale(1);
            }

            .available-tag.selected:hover {
                transform: scale(1.05);
                filter: grayscale(1) brightness(1.1);
            }            /* 表单操作按钮样式 */
            .form-actions {
                display: flex;
                gap: 12px;
                margin-top: 24px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }            .form-actions button {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease-out;
                position: relative;
                overflow: hidden;
                letter-spacing: 0.25px;
                padding: 12px 20px;
                white-space: nowrap;
                text-align: center;
            }.form-actions button::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: all 0.3s ease-out;
                z-index: -1;
            }

            .form-actions button:hover::before {
                width: 200%;
                height: 200%;
            }

            .btn-icon {
                font-size: 16px;
                line-height: 1;
            }

            .btn-text {
                white-space: nowrap;
            }

            .save-btn {
                background: linear-gradient(135deg, #28a745, #20873a);
                color: white;
                box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .save-btn:hover {
                background: linear-gradient(135deg, #20873a, #1e7e34);
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(40, 167, 69, 0.4);
            }

            .save-btn:active {
                transform: translateY(0);
            }

            .cancel-btn {
                background: linear-gradient(145deg, #404044, #35353a);
                color: #e0e0e0;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .cancel-btn:hover {
                background: linear-gradient(145deg, #4a4a4e, #3f3f44);
                color: #ffffff;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .cancel-btn:active {
                transform: translateY(0);
            }

            /* 输入验证样式 */
            .form-group.error input,
            .form-group.error textarea {
                border-color: #dc3545;
                box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15);
            }

            .form-group.error .form-hint {
                color: #dc3545;
                font-weight: 500;
            }

            .form-group.success input,
            .form-group.success textarea {
                border-color: #28a745;
                box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.15);
            }

            /* 滚动条样式 */
            .available-tags::-webkit-scrollbar,
            .prompt-form-section::-webkit-scrollbar {
                width: 6px;
            }

            .available-tags::-webkit-scrollbar-track,
            .prompt-form-section::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
            }

            .available-tags::-webkit-scrollbar-thumb,
            .prompt-form-section::-webkit-scrollbar-thumb {
                background: linear-gradient(145deg, #3a3a3a, #2a2a2a);
                border-radius: 3px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }            .available-tags::-webkit-scrollbar-thumb:hover,
            .prompt-form-section::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(145deg, #4a4a4a, #3a3a3a);
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .prompt-form-section {
                    padding: 16px;
                }

                .form-actions {
                    flex-direction: column;
                }

                .save-btn, .cancel-btn {
                    width: 100%;
                }
            }
        `;
        
        if (!document.head.querySelector('style[data-component="prompt-form"]')) {
            style.setAttribute('data-component', 'prompt-form');
            document.head.appendChild(style);
        }
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // 移除样式
        const style = document.head.querySelector('style[data-component="prompt-form"]');
        if (style) {
            style.remove();
        }
    }

    toggleAvailableTags() {
        const availableTagsContainer = this.form.querySelector('.available-tags');
        const isVisible = availableTagsContainer.style.display !== 'none';
        
        if (isVisible) {
            availableTagsContainer.style.display = 'none';
        } else {
            this.renderAvailableTags();
            availableTagsContainer.style.display = 'block';
        }
    }    renderAvailableTags() {
        const availableTagsContainer = this.form.querySelector('.available-tags');
        
        // 获取所有可用标签（包括手动创建的和提示词中的）
        const allTags = globalTagColorManager.getAllTags();
        
        const currentTags = this.getCurrentSelectedTags();
        
        if (allTags.length === 0) {
            availableTagsContainer.innerHTML = `
                <div class="no-available-tags">
                    <span>暂无可选标签</span>
                    <small>先在标签管理中添加标签</small>
                </div>
            `;
            return;
        }availableTagsContainer.innerHTML = `
            <div class="available-tags-header">
                <span>🏷️ 可选标签:</span>
            </div>
            <div class="available-tags-list">                ${allTags.map(tag => {
                    const color = globalTagColorManager.getTagColor(tag);
                    const colorRGB = globalTagColorManager.getTagColorRGB(tag);
                    const isSelected = currentTags.includes(tag);
                    return `
                        <span class="available-tag ${isSelected ? 'selected' : ''}" 
                              data-tag="${this.escapeHtml(tag)}" 
                              style="--tag-color: ${color}; --tag-color-rgb: ${colorRGB};"
                              title="${isSelected ? '点击移除' : '点击添加'}">
                            ${this.escapeHtml(tag)}
                        </span>
                    `;
                }).join('')}
            </div>
        `;

        this.bindAvailableTagsEvents();
    }    bindAvailableTagsEvents() {
        const availableTagsContainer = this.form.querySelector('.available-tags');
        
        // 标签点击事件
        availableTagsContainer.querySelectorAll('.available-tag').forEach(tagElement => {
            tagElement.addEventListener('click', () => {
                const tagName = tagElement.dataset.tag;
                this.toggleTagSelection(tagName);
            });
        });
    }    toggleTagSelection(tagName) {
        const tagsInput = this.form.querySelector('input[name="tags"]');
        const currentTags = this.getCurrentSelectedTags();
        
        if (currentTags.includes(tagName)) {
            // 移除标签
            const newTags = currentTags.filter(tag => tag !== tagName);
            tagsInput.value = newTags.join(', ');
        } else {
            // 添加标签
            const newTags = [...currentTags, tagName];
            tagsInput.value = newTags.join(', ');
        }
        
        // 触发input事件来更新预览
        tagsInput.dispatchEvent(new Event('input'));
        
        // 重新渲染可选标签以更新选中状态
        this.renderAvailableTags();
    }

    getCurrentSelectedTags() {
        const tagsInput = this.form.querySelector('input[name="tags"]');
        return this.parseTags(tagsInput.value);
    }

    // 新增：刷新所有标签的颜色
    refreshTagColors() {
        // 刷新标签预览的颜色
        const previewTags = this.container.querySelectorAll('.tag-preview');
        previewTags.forEach(tagElement => {
            const tagName = tagElement.textContent;
            if (tagName) {
                const color = globalTagColorManager.getTagColor(tagName);
                const colorRGB = globalTagColorManager.getTagColorRGB(tagName);
                tagElement.style.setProperty('--tag-color', color);
                tagElement.style.setProperty('--tag-color-rgb', colorRGB);
            }
        });

        // 刷新可选标签的颜色
        const availableTags = this.container.querySelectorAll('.available-tag');
        availableTags.forEach(tagElement => {
            const tagName = tagElement.dataset.tag;
            if (tagName) {
                const color = globalTagColorManager.getTagColor(tagName);                const colorRGB = globalTagColorManager.getTagColorRGB(tagName);
                tagElement.style.setProperty('--tag-color', color);
                tagElement.style.setProperty('--tag-color-rgb', colorRGB);
            }
        });
    }
}
