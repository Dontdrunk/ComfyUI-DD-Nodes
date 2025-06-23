// 标签管理组件 - 新的气泡交互设计
// 支持标签气泡点击选择、批量操作等功能

import { globalTagColorManager } from './TagColorManager.js';

export class TagManager {
    constructor(options = {}) {
        this.onClose = options.onClose || null;
        this.promptManager = options.promptManager || null;
        this.onTagColorChange = options.onTagColorChange || null;
        
        this.container = null;
        this.selectedTags = new Set(); // 存储选中的标签名称
        this.createTagManager();
    }

    createTagManager() {
        this.container = document.createElement('div');
        this.container.className = 'tag-manager-section';
        // 初始状态：完全隐藏
        this.container.style.display = 'none';
        this.container.innerHTML = `
            <div class="tag-manager-header">
                <h4 class="tag-manager-title">
                    <span class="title-icon">🏷️</span>
                    <span class="title-text">标签管理</span>
                </h4>
                <button class="tag-manager-close-btn" title="关闭标签管理">
                    <span>✕</span>
                </button>
            </div>
            
            <div class="tag-manager-body">
                <!-- 操作按钮区域 -->                <div class="tag-actions-section">
                    <div class="action-buttons">
                        <button class="add-tag-btn action-btn" title="添加新标签">
                            <span class="btn-icon">➕</span>
                            <span class="btn-text">添加</span>
                        </button>
                        <button class="edit-color-btn action-btn" title="修改选中标签颜色" disabled>
                            <span class="btn-icon">🎨</span>
                            <span class="btn-text">颜色</span>
                        </button>
                        <button class="delete-selected-btn action-btn" title="删除选中标签" disabled>
                            <span class="btn-icon">🗑️</span>
                            <span class="btn-text">删除</span>
                        </button>
                    </div>
                    <div class="selection-info">
                        <span class="selected-count">已选择 0 个标签</span>
                    </div>
                </div>
                
                <!-- 标签气泡区域 -->
                <div class="tags-bubbles-section">
                    <div class="section-header">
                        <h5 class="section-title">
                            <span class="section-icon">📋</span>
                            标签列表
                            <span class="tags-count">（0）</span>
                        </h5>                        <div class="section-actions">
                            <button class="select-all-btn" title="全选标签">全选标签</button>
                            <button class="clear-selection-btn" title="取消全选">取消全选</button>
                        </div>
                    </div>
                    <div class="tags-bubbles-container">
                        <div class="no-tags-message">
                            <span class="empty-icon">🏷️</span>
                            <p>暂无标签</p>
                            <small>点击"添加标签"按钮来创建您的第一个标签</small>
                        </div>
                    </div>
                </div>
            </div>
              <!-- 添加标签弹窗 -->
            <div class="add-tag-modal" style="display: none;">
                <div class="modal-overlay">
                    <div class="modal-content">
                        <h5 class="modal-title">添加新标签</h5>
                        <form class="add-tag-form">
                            <div class="form-group">
                                <label for="new-tag-name">标签名称:</label>
                                <input type="text" id="new-tag-name" class="tag-name-input" placeholder="输入标签名称" maxlength="20" required>
                            </div>                            <div class="form-group">
                                <label>标签颜色:</label>
                                <div class="color-palette-container">
                                    <div class="preset-colors">
                                        <div class="color-option" data-color="#2a82e4" style="background: #2a82e4"></div>
                                        <div class="color-option" data-color="#e74c3c" style="background: #e74c3c"></div>
                                        <div class="color-option" data-color="#27ae60" style="background: #27ae60"></div>
                                        <div class="color-option" data-color="#f39c12" style="background: #f39c12"></div>
                                        <div class="color-option" data-color="#9b59b6" style="background: #9b59b6"></div>
                                        <div class="color-option" data-color="#1abc9c" style="background: #1abc9c"></div>
                                        <div class="color-option" data-color="#e67e22" style="background: #e67e22"></div>
                                        <div class="color-option" data-color="#34495e" style="background: #34495e"></div>
                                        <div class="color-option" data-color="#e91e63" style="background: #e91e63"></div>
                                        <div class="color-option" data-color="#00bcd4" style="background: #00bcd4"></div>
                                        <div class="color-option" data-color="#ff5722" style="background: #ff5722"></div>
                                        <div class="color-option" data-color="#607d8b" style="background: #607d8b"></div>
                                    </div>
                                    <div class="custom-color-section">
                                        <label>自定义颜色:</label>
                                        <input type="color" id="new-tag-color" class="tag-color-input" value="#2a82e4">
                                    </div>
                                    <div class="color-preview">
                                        <div class="preview-tag" id="add-preview-tag">预览</div>
                                    </div>
                                </div>
                            </div>                            <div class="form-actions">
                                <button type="submit" class="confirm-btn">确认添加</button>
                                <button type="button" class="cancel-btn">取消添加</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <!-- 修改颜色弹窗 -->
            <div class="edit-color-modal" style="display: none;">
                <div class="modal-overlay">
                    <div class="modal-content">
                        <h5 class="modal-title">修改标签颜色</h5>
                        <div class="selected-tags-preview">
                            <!-- 选中的标签预览 -->
                        </div>                        <form class="edit-color-form">
                            <div class="form-group">
                                <label>新颜色:</label>
                                <div class="color-palette-container">
                                    <div class="preset-colors">
                                        <div class="color-option" data-color="#2a82e4" style="background: #2a82e4"></div>
                                        <div class="color-option" data-color="#e74c3c" style="background: #e74c3c"></div>
                                        <div class="color-option" data-color="#27ae60" style="background: #27ae60"></div>
                                        <div class="color-option" data-color="#f39c12" style="background: #f39c12"></div>
                                        <div class="color-option" data-color="#9b59b6" style="background: #9b59b6"></div>
                                        <div class="color-option" data-color="#1abc9c" style="background: #1abc9c"></div>
                                        <div class="color-option" data-color="#e67e22" style="background: #e67e22"></div>
                                        <div class="color-option" data-color="#34495e" style="background: #34495e"></div>
                                        <div class="color-option" data-color="#e91e63" style="background: #e91e63"></div>
                                        <div class="color-option" data-color="#00bcd4" style="background: #00bcd4"></div>
                                        <div class="color-option" data-color="#ff5722" style="background: #ff5722"></div>
                                        <div class="color-option" data-color="#607d8b" style="background: #607d8b"></div>
                                    </div>
                                    <div class="custom-color-section">
                                        <label>自定义颜色:</label>
                                        <input type="color" id="edit-tag-color" class="tag-color-input" value="#2a82e4">
                                    </div>
                                    <div class="color-preview">
                                        <div class="preview-tag" id="edit-preview-tag">预览</div>
                                    </div>
                                </div>
                            </div>                            <div class="form-actions">
                                <button type="submit" class="confirm-btn">确认修改</button>
                                <button type="button" class="cancel-btn">取消修改</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.addStyles();
    }

    bindEvents() {
        // 关闭按钮
        const closeBtn = this.container.querySelector('.tag-manager-close-btn');
        closeBtn.addEventListener('click', () => this.hide());

        // ESC键关闭
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        // 操作按钮
        const addBtn = this.container.querySelector('.add-tag-btn');
        const editColorBtn = this.container.querySelector('.edit-color-btn');
        const deleteBtn = this.container.querySelector('.delete-selected-btn');

        addBtn.addEventListener('click', () => this.showAddModal());
        editColorBtn.addEventListener('click', () => this.showEditColorModal());
        deleteBtn.addEventListener('click', () => this.handleDeleteSelected());

        // 选择控制按钮
        const selectAllBtn = this.container.querySelector('.select-all-btn');
        const clearSelectionBtn = this.container.querySelector('.clear-selection-btn');

        selectAllBtn.addEventListener('click', () => this.selectAllTags());
        clearSelectionBtn.addEventListener('click', () => this.clearSelection());

        // 添加标签弹窗
        this.bindAddModalEvents();
        
        // 修改颜色弹窗
        this.bindEditColorModalEvents();
    }    bindAddModalEvents() {
        const modal = this.container.querySelector('.add-tag-modal');
        const form = modal.querySelector('.add-tag-form');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const overlay = modal.querySelector('.modal-overlay');
        const colorInput = modal.querySelector('.tag-color-input');
        const previewTag = modal.querySelector('#add-preview-tag');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTag();
        });

        cancelBtn.addEventListener('click', () => this.hideAddModal());
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideAddModal();
            }
        });

        // 绑定颜色选项点击事件
        const colorOptions = modal.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 移除其他选项的选中状态
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                // 添加当前选项的选中状态
                option.classList.add('selected');
                
                const color = option.dataset.color;
                colorInput.value = color;
                previewTag.style.background = color;
                previewTag.style.setProperty('--tag-color', color);
            });
        });

        // 绑定自定义颜色输入变化事件
        colorInput.addEventListener('input', (e) => {
            // 移除所有预设颜色的选中状态
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            
            const color = e.target.value;
            previewTag.style.background = color;
            previewTag.style.setProperty('--tag-color', color);
        });

        // 初始化预览标签颜色
        previewTag.style.background = colorInput.value;
        previewTag.style.setProperty('--tag-color', colorInput.value);
        
        // 默认选中第一个颜色选项
        if (colorOptions.length > 0) {
            colorOptions[0].classList.add('selected');
        }
    }    bindEditColorModalEvents() {
        const modal = this.container.querySelector('.edit-color-modal');
        const form = modal.querySelector('.edit-color-form');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const overlay = modal.querySelector('.modal-overlay');
        const colorInput = modal.querySelector('#edit-tag-color');
        const previewTag = modal.querySelector('#edit-preview-tag');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditColor();
        });

        cancelBtn.addEventListener('click', () => this.hideEditColorModal());
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideEditColorModal();
            }
        });

        // 绑定颜色选项点击事件
        const colorOptions = modal.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 移除其他选项的选中状态
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                // 添加当前选项的选中状态
                option.classList.add('selected');
                
                const color = option.dataset.color;
                colorInput.value = color;
                previewTag.style.background = color;
                previewTag.style.setProperty('--tag-color', color);
                
                // 更新所有选中标签的预览
                this.updateSelectedTagsPreview(color);
            });
        });

        // 绑定自定义颜色输入变化事件
        colorInput.addEventListener('input', (e) => {
            // 移除所有预设颜色的选中状态
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            
            const color = e.target.value;
            previewTag.style.background = color;
            previewTag.style.setProperty('--tag-color', color);
            
            // 更新所有选中标签的预览
            this.updateSelectedTagsPreview(color);
        });

        // 初始化预览标签颜色
        previewTag.style.background = colorInput.value;
        previewTag.style.setProperty('--tag-color', colorInput.value);
        
        // 默认选中第一个颜色选项
        if (colorOptions.length > 0) {
            colorOptions[0].classList.add('selected');
        }
    }

    handleKeydown(e) {
        if (e.key === 'Escape' && this.isVisible()) {
            e.preventDefault();
            e.stopPropagation();
            
            // 如果有弹窗开启，先关闭弹窗
            const addModal = this.container.querySelector('.add-tag-modal');
            const editModal = this.container.querySelector('.edit-color-modal');
            
            if (addModal.style.display !== 'none') {
                this.hideAddModal();
            } else if (editModal.style.display !== 'none') {
                this.hideEditColorModal();
            } else {
                this.hide();
            }
        }
    }    // 显示添加标签弹窗
    showAddModal() {
        const modal = this.container.querySelector('.add-tag-modal');
        const nameInput = modal.querySelector('.tag-name-input');
        const colorInput = modal.querySelector('.tag-color-input');
        const previewTag = modal.querySelector('#add-preview-tag');
        const colorOptions = modal.querySelectorAll('.color-option');
        
        // 重置表单
        nameInput.value = '';
        const randomColor = this.generateRandomHex();
        colorInput.value = randomColor;
        
        // 更新预览标签颜色
        previewTag.style.background = randomColor;
        previewTag.style.setProperty('--tag-color', randomColor);
        
        // 清除所有颜色选项的选中状态
        colorOptions.forEach(option => option.classList.remove('selected'));
        
        // 检查是否有匹配的预设颜色并设置选中状态
        const matchingOption = Array.from(colorOptions).find(option => 
            option.dataset.color.toLowerCase() === randomColor.toLowerCase()
        );
        if (matchingOption) {
            matchingOption.classList.add('selected');
        }
          modal.style.display = 'block';
        
        // 确保预览标签正确显示 - 在下一帧执行以确保DOM已更新
        requestAnimationFrame(() => {
            previewTag.style.background = randomColor;
            previewTag.style.setProperty('--tag-color', randomColor);
            previewTag.style.visibility = 'visible';
            previewTag.style.opacity = '1';
            nameInput.focus();
        });
    }hideAddModal() {
        const modal = this.container.querySelector('.add-tag-modal');
        modal.style.display = 'none';
    }

    // 显示修改颜色弹窗
    showEditColorModal() {
        if (this.selectedTags.size === 0) return;

        const modal = this.container.querySelector('.edit-color-modal');
        const preview = modal.querySelector('.selected-tags-preview');
        const colorInput = modal.querySelector('#edit-tag-color');
        const previewTag = modal.querySelector('#edit-preview-tag');
        const colorOptions = modal.querySelectorAll('.color-option');

        // 显示选中的标签预览
        preview.innerHTML = '';
        this.selectedTags.forEach(tagName => {
            const color = globalTagColorManager.getTagColor(tagName);
            const tagBubble = document.createElement('div');
            tagBubble.className = 'preview-tag-bubble';
            tagBubble.style.setProperty('--tag-color', color);
            tagBubble.textContent = tagName;
            preview.appendChild(tagBubble);
        });

        // 设置当前颜色（使用第一个选中标签的颜色）
        const firstTag = Array.from(this.selectedTags)[0];
        const currentColor = globalTagColorManager.getTagColor(firstTag);
        colorInput.value = currentColor;
        
        // 更新预览标签颜色
        previewTag.style.background = currentColor;
        previewTag.style.setProperty('--tag-color', currentColor);
        
        // 检查是否有匹配的预设颜色并设置选中状态
        colorOptions.forEach(option => option.classList.remove('selected'));
        const matchingOption = Array.from(colorOptions).find(option => 
            option.dataset.color.toLowerCase() === currentColor.toLowerCase()
        );        if (matchingOption) {
            matchingOption.classList.add('selected');
        }

        modal.style.display = 'block';
        
        // 确保预览标签正确显示 - 在下一帧执行以确保DOM已更新
        requestAnimationFrame(() => {
            previewTag.style.background = currentColor;
            previewTag.style.setProperty('--tag-color', currentColor);
            previewTag.style.visibility = 'visible';
            previewTag.style.opacity = '1';
        });
    }

    hideEditColorModal() {
        const modal = this.container.querySelector('.edit-color-modal');
        modal.style.display = 'none';
    }

    // 处理添加标签
    handleAddTag() {
        const modal = this.container.querySelector('.add-tag-modal');
        const nameInput = modal.querySelector('.tag-name-input');
        const colorInput = modal.querySelector('.tag-color-input');
        
        const tagName = nameInput.value.trim();
        const tagColor = colorInput.value;

        if (!tagName) {
            alert('请输入标签名称');
            nameInput.focus();
            return;
        }

        // 检查标签是否已存在
        if (globalTagColorManager.getAllTags().includes(tagName)) {
            alert('标签已存在');
            nameInput.focus();
            return;
        }        try {
            // 添加标签
            globalTagColorManager.setTagColor(tagName, tagColor);
            
            // 使用统一的提示词管理器进行同步
            if (this.promptManager && this.promptManager.savePrompts) {
                this.promptManager.savePrompts();
            }
            
            // 刷新标签列表
            this.refreshTagsBubbles();
            
            // 关闭弹窗
            this.hideAddModal();
            
            // 通知颜色变更
            this.notifyTagColorChange();
            
        } catch (error) {
            console.error('添加标签失败:', error);
            alert('添加标签失败: ' + error.message);
        }
    }

    // 处理修改颜色
    handleEditColor() {
        const modal = this.container.querySelector('.edit-color-modal');
        const colorInput = modal.querySelector('#edit-tag-color');
        const newColor = colorInput.value;        try {
            // 批量修改选中标签的颜色
            this.selectedTags.forEach(tagName => {
                globalTagColorManager.setTagColor(tagName, newColor);
            });
            
            // 使用统一的提示词管理器进行同步
            if (this.promptManager && this.promptManager.savePrompts) {
                this.promptManager.savePrompts();
            }
            
            // 刷新标签列表
            this.refreshTagsBubbles();
            
            // 关闭弹窗
            this.hideEditColorModal();
            
            // 通知颜色变更
            this.notifyTagColorChange();
            
        } catch (error) {
            console.error('修改标签颜色失败:', error);
            alert('修改标签颜色失败: ' + error.message);
        }
    }    // 处理删除选中标签
    async handleDeleteSelected() {
        if (this.selectedTags.size === 0) return;

        const tagNames = Array.from(this.selectedTags).join('、');
        if (confirm(`确定要删除以下标签吗？\n${tagNames}\n\n注意：这些标签将从所有提示词中移除。`)) {
            try {
                // 从所有提示词中移除这些标签
                if (this.promptManager && this.promptManager.getPrompts) {
                    const prompts = this.promptManager.getPrompts();
                    let hasChanges = false;
                    
                    prompts.forEach(prompt => {
                        if (prompt.tags && Array.isArray(prompt.tags)) {
                            const originalLength = prompt.tags.length;
                            prompt.tags = prompt.tags.filter(tag => !this.selectedTags.has(tag));
                            if (prompt.tags.length !== originalLength) {
                                hasChanges = true;
                            }
                        }
                    });
                    
                    // 如果有更改，保存提示词数据
                    if (hasChanges) {
                        this.promptManager.savePrompts();
                        console.log('已从提示词中移除删除的标签');
                    }
                }                // 从标签颜色管理器中删除标签
                console.log('准备删除的标签:', Array.from(this.selectedTags));
                this.selectedTags.forEach(tagName => {
                    console.log(`删除标签: ${tagName}`);
                    const result = globalTagColorManager.deleteTag(tagName);
                    console.log(`删除结果: ${result}`);
                });
                
                // 立即同步标签数据到后端
                console.log('立即同步标签删除到后端...');
                await globalTagColorManager.saveToBackend();
                
                // 使用统一的提示词管理器进行同步（与提示词操作保持一致）
                if (this.promptManager && this.promptManager.savePrompts) {
                    console.log('通过提示词管理器同步所有数据到后端...');
                    this.promptManager.savePrompts();
                } else {
                    console.error('提示词管理器不可用，无法同步到后端');
                }
                
                this.selectedTags.clear();
                this.refreshTagsBubbles();
                this.updateButtonStates();
                
                // 通知标签变更，触发所有UI组件刷新
                console.log('通知标签变更，刷新所有UI组件...');
                this.notifyTagColorChange();
                
            } catch (error) {
                console.error('删除标签失败:', error);
                alert('删除标签失败: ' + error.message);
            }
        }
    }

    // 标签气泡点击处理
    handleTagBubbleClick(tagName) {
        if (this.selectedTags.has(tagName)) {
            // 取消选择
            this.selectedTags.delete(tagName);
        } else {
            // 选择
            this.selectedTags.add(tagName);
        }
        
        this.updateTagBubbleState(tagName);
        this.updateButtonStates();
        this.updateSelectionInfo();
    }

    // 更新标签气泡状态
    updateTagBubbleState(tagName) {
        const bubble = this.container.querySelector(`[data-tag="${tagName}"]`);
        if (bubble) {
            if (this.selectedTags.has(tagName)) {
                bubble.classList.add('selected');
            } else {
                bubble.classList.remove('selected');
            }
        }
    }

    // 更新选中标签的预览颜色
    updateSelectedTagsPreview(color) {
        const preview = this.container.querySelector('.selected-tags-preview');
        if (preview) {
            const tagBubbles = preview.querySelectorAll('.preview-tag-bubble');
            tagBubbles.forEach(bubble => {
                bubble.style.background = color;
                bubble.style.setProperty('--tag-color', color);
            });
        }
    }

    // 全选标签
    selectAllTags() {
        const allTags = globalTagColorManager.getAllTags();
        allTags.forEach(tagName => {
            this.selectedTags.add(tagName);
            this.updateTagBubbleState(tagName);
        });
        
        this.updateButtonStates();
        this.updateSelectionInfo();
    }    // 清空选择
    clearSelection() {
        // 先清空所有选中状态的视觉反馈
        this.selectedTags.forEach(tagName => {
            const bubble = this.container.querySelector(`[data-tag="${tagName}"]`);
            if (bubble) {
                bubble.classList.remove('selected');
            }
        });
        
        // 然后清空选中标签集合
        this.selectedTags.clear();
        this.updateButtonStates();
        this.updateSelectionInfo();
    }

    // 更新按钮状态
    updateButtonStates() {
        const editColorBtn = this.container.querySelector('.edit-color-btn');
        const deleteBtn = this.container.querySelector('.delete-selected-btn');
        
        const hasSelection = this.selectedTags.size > 0;
        
        editColorBtn.disabled = !hasSelection;
        deleteBtn.disabled = !hasSelection;
    }

    // 更新选择信息
    updateSelectionInfo() {
        const selectedCount = this.container.querySelector('.selected-count');
        selectedCount.textContent = `已选择 ${this.selectedTags.size} 个标签`;
    }    // 刷新标签气泡列表
    refreshTagsBubbles() {
        console.log('TagManager: 开始刷新标签气泡列表...');
        
        const container = this.container.querySelector('.tags-bubbles-container');
        const tagsCount = this.container.querySelector('.tags-count');
        const allTags = globalTagColorManager.getAllTags();
        
        console.log('TagManager: 从TagColorManager获取到的标签:', allTags);
        
        // 更新标签计数
        tagsCount.textContent = `（${allTags.length}）`;
        
        if (allTags.length === 0) {
            console.log('TagManager: 无标签，显示空状态...');
            container.innerHTML = `
                <div class="no-tags-message">
                    <span class="empty-icon">🏷️</span>
                    <p>暂无标签</p>
                    <small>点击"添加标签"按钮来创建您的第一个标签</small>
                </div>
            `;
            return;
        }
        
        // 清理已删除标签的选择状态
        const deletedTags = [];
        this.selectedTags.forEach(selectedTag => {
            if (!allTags.includes(selectedTag)) {
                deletedTags.push(selectedTag);
            }
        });
        
        deletedTags.forEach(tag => {
            console.log(`TagManager: 清理已删除标签的选择状态: ${tag}`);
            this.selectedTags.delete(tag);
        });
        
        // 生成标签气泡
        console.log('TagManager: 生成标签气泡...');
        container.innerHTML = '';
        allTags.forEach(tagName => {
            const color = globalTagColorManager.getTagColor(tagName);
            const bubble = document.createElement('div');
            bubble.className = 'tag-bubble';
            bubble.dataset.tag = tagName;
            bubble.style.setProperty('--tag-color', color);
            bubble.textContent = tagName;
            
            // 恢复选中状态
            if (this.selectedTags.has(tagName)) {
                bubble.classList.add('selected');
            }
            
            // 绑定点击事件
            bubble.addEventListener('click', () => {
                this.handleTagBubbleClick(tagName);
            });
            
            container.appendChild(bubble);
        });
          // 更新按钮状态和选择信息
        this.updateButtonStates();
        this.updateSelectionInfo();
        
        console.log('TagManager: 标签气泡列表刷新完成');
    }

    // 显示/隐藏/可见性检查方法
    show() {
        // 查找布局容器
        let layoutContainer = this.container.closest('.prompt-manager-layout');
        if (!layoutContainer) {
            const formSection = this.container.parentNode?.closest('.prompt-manager-form');
            if (formSection) {
                layoutContainer = formSection.closest('.prompt-manager-layout');
            }
        }
        
        if (layoutContainer) {
            layoutContainer.classList.add('form-expanded');
        }
        
        // 显示标签管理器容器
        this.container.style.display = 'flex';
        this.container.classList.add('active');
        
        // 等待下一帧确保DOM更新
        requestAnimationFrame(() => {
            // 刷新标签列表
            this.refreshTagsBubbles();
            this.updateButtonStates();
            this.updateSelectionInfo();
        });
    }

    hide() {
        // 隐藏标签管理器容器
        this.container.classList.remove('active');
        this.container.style.display = 'none';
        
        // 清空选择
        this.selectedTags.clear();
        
        // 查找布局容器，检查是否还有其他内容需要显示
        const layoutContainer = this.container.closest('.prompt-manager-layout');
        if (layoutContainer) {
            const formSection = layoutContainer.querySelector('.prompt-manager-form');
            const promptForm = formSection?.querySelector('.prompt-form-section');
            const isPromptFormVisible = promptForm && promptForm.style.visibility !== 'hidden';
            
            // 只有当没有其他内容显示时才移除展开类
            if (!isPromptFormVisible) {
                layoutContainer.classList.remove('form-expanded');
            }
        }
          // 调用关闭回调
        if (this.onClose) {
            this.onClose();
        }
        
        // 通知标签变更（确保搜索栏能获取到最新的标签列表）
        this.notifyTagColorChange();
    }

    isVisible() {
        return this.container.classList.contains('active') && 
               this.container.style.display !== 'none';
    }

    getElement() {
        return this.container;
    }

    destroy() {
        if (this.isVisible()) {
            this.hide();
        }
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // 移除事件监听器
        document.removeEventListener('keydown', this.handleKeydown.bind(this));
    }

    // 工具方法
    generateRandomHex() {
        const hue = Math.random() * 360;
        const saturation = 0.6 + Math.random() * 0.3; // 60%-90%
        const lightness = 0.4 + Math.random() * 0.2;  // 40%-60%
        
        const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
        const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
        const m = lightness - c / 2;
        
        let r, g, b;
        
        if (hue < 60) {
            r = c; g = x; b = 0;
        } else if (hue < 120) {
            r = x; g = c; b = 0;
        } else if (hue < 180) {
            r = 0; g = c; b = x;
        } else if (hue < 240) {
            r = 0; g = x; b = c;
        } else if (hue < 300) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }
        
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    }

    notifyTagColorChange() {
        if (this.onTagColorChange) {
            this.onTagColorChange();
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* ========== 标签管理器主容器 ========== */
            .tag-manager-section {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                display: none;
                flex-direction: column;
                overflow: hidden;
                z-index: 2;
            }

            .tag-manager-section.active {
                display: flex;
            }

            /* ========== 标签管理器头部 ========== */
            .tag-manager-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                background: linear-gradient(135deg, #2a2a2d, #232326);
                position: relative;
                flex-shrink: 0;
            }

            .tag-manager-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            }

            .tag-manager-title {
                margin: 0;
                color: #ffffff;
                font-size: 18px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
                letter-spacing: 0.5px;
            }

            .title-icon {
                font-size: 20px;
                opacity: 0.9;
            }

            .tag-manager-close-btn {
                background: none;
                border: none;
                color: #888;
                font-size: 18px;
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
            }

            .tag-manager-close-btn:hover {
                color: #fff;
                background: rgba(255, 255, 255, 0.1);
            }            /* ========== 标签管理器主体 ========== */
            .tag-manager-body {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                padding: 20px;
                gap: 20px;
                min-height: 0; /* 确保flex子项能正确收缩 */
            }            /* ========== 操作按钮区域 ========== */
            .tag-actions-section {
                background: linear-gradient(145deg, #1e1e21, #2a2a2d);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 12px;
                flex-shrink: 0;
            }.action-buttons {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
                flex-wrap: wrap;
            }

            .action-btn {
                background: linear-gradient(145deg, #3a3a3d, #2d2d30);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                color: #ffffff;
                padding: 8px 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                font-weight: 500;
                flex: 1;
                justify-content: center;
                min-width: 0;
                white-space: nowrap;
            }

            .action-btn:hover:not(:disabled) {
                background: linear-gradient(145deg, #4a4a4d, #3d3d40);
                border-color: rgba(255, 255, 255, 0.25);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .action-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: linear-gradient(145deg, #2a2a2d, #1e1e21);
                border-color: rgba(255, 255, 255, 0.05);
            }            .action-btn .btn-icon {
                font-size: 14px;
                flex-shrink: 0;
            }

            .action-btn .btn-text {
                flex-shrink: 1;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .selection-info {
                text-align: center;
                color: #ccc;
                font-size: 13px;
            }            /* ========== 标签气泡区域 ========== */
            .tags-bubbles-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                background: linear-gradient(145deg, #1e1e21, #2a2a2d);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                min-height: 0; /* 确保flex子项能正确收缩 */
            }            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
                min-height: 56px; /* 确保有足够的高度避免按钮重叠 */
            }

            .section-title {
                margin: 0;
                color: #e0e0e0;
                font-size: 15px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }            .section-actions {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
                align-items: center;
            }            .select-all-btn, .clear-selection-btn {
                background: linear-gradient(145deg, #3a3a3d, #2d2d30);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 6px;
                color: #ffffff;
                padding: 6px 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 12px;
                white-space: nowrap;
                min-width: 80px;
                text-align: center;
            }

            .select-all-btn:hover, .clear-selection-btn:hover {
                background: linear-gradient(145deg, #4a4a4d, #3d3d40);
                border-color: rgba(255, 255, 255, 0.25);
            }            .tags-bubbles-container {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-content: flex-start;
                align-items: flex-start;
                justify-content: flex-start;
                min-height: 0;
            }.tag-bubble {
                background: var(--tag-color, #2a82e4);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                user-select: none;
                position: relative;
                overflow: hidden;
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
            }            .tag-bubble::before {
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
            }

            .tag-bubble:hover {
                box-shadow: 
                    0 0 10px rgba(255, 255, 255, 0.3),
                    0 4px 15px rgba(0, 0, 0, 0.2);
                transform: scale(1.05);
                border-color: rgba(255, 255, 255, 0.4);
                filter: brightness(1.1) saturate(1.05);
            }

            .tag-bubble:hover::before {
                opacity: 1;
            }            .tag-bubble.selected {
                border-color: #ffffff;
                box-shadow: 
                    0 0 0 2px rgba(255, 255, 255, 0.6),
                    0 0 15px rgba(255, 255, 255, 0.4),
                    0 4px 20px rgba(0, 0, 0, 0.3);
                transform: scale(1.02);
                filter: brightness(1.15) saturate(1.1);
            }

            .tag-bubble.selected::before {
                opacity: 1;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
            }

            .no-tags-message {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                width: 100%;
                height: 100%;
                color: #888;
                gap: 12px;
            }

            .empty-icon {
                font-size: 48px;
                opacity: 0.6;
            }

            .no-tags-message p {
                margin: 0;
                font-size: 16px;
                font-weight: 500;
            }

            .no-tags-message small {
                font-size: 13px;
                opacity: 0.8;
            }

            /* ========== 弹窗样式 ========== */
            .add-tag-modal, .edit-color-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: none;
            }

            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(4px);
            }

            .modal-content {
                background: linear-gradient(145deg, #2d2d30, #252528);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
            }

            .modal-title {
                margin: 0 0 20px 0;
                color: #ffffff;
                font-size: 18px;
                font-weight: 600;
                text-align: center;
            }

            .form-group {
                margin-bottom: 16px;
            }

            .form-group label {
                display: block;
                color: #e0e0e0;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 8px;
            }

            .form-group input {
                width: 100%;
                background: linear-gradient(145deg, #141417, #1a1a1d);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                color: #ffffff;
                padding: 12px 16px;
                font-size: 14px;
                transition: all 0.3s ease;
                box-sizing: border-box;
            }

            .form-group input:focus {
                outline: none;
                border-color: #2a82e4;
                box-shadow: 0 0 0 2px rgba(42, 130, 228, 0.2);
            }            .form-actions {
                display: flex;
                gap: 12px;
                margin-top: 24px;
            }.confirm-btn, .cancel-btn {
                flex: 1;
                padding: 12px 20px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
                text-align: center;
            }

            .confirm-btn {
                background: linear-gradient(145deg, #2a82e4, #1e5fb8);
                color: white;
            }

            .confirm-btn:hover {
                background: linear-gradient(145deg, #3a92f4, #2e6fc8);
                transform: translateY(-1px);
            }

            .cancel-btn {
                background: linear-gradient(145deg, #3a3a3d, #2d2d30);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.15);
            }

            .cancel-btn:hover {
                background: linear-gradient(145deg, #4a4a4d, #3d3d40);
                border-color: rgba(255, 255, 255, 0.25);
            }

            .selected-tags-preview {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 16px;
                padding: 12px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
            }            .preview-tag-bubble {
                background: var(--tag-color, #2a82e4);
                color: white;
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 500;
                letter-spacing: 0.25px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
                text-shadow: 
                    -1px -1px 0 #000,
                    1px -1px 0 #000,
                    -1px 1px 0 #000,
                    1px 1px 0 #000,
                    0 -1px 0 #000,
                    0 1px 0 #000,
                    -1px 0 0 #000,
                    1px 0 0 #000;
            }            /* ========== 调色板样式 ========== */
            .color-palette-container {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .preset-colors {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 8px;
                padding: 12px;
                background: linear-gradient(145deg, #1a1a1a, #252525);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .color-option {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                position: relative;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            }

            .color-option:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            }

            .color-option.selected {
                border-color: #ffffff;
                box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }

            .color-option.selected::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ffffff;
                font-size: 14px;
                font-weight: bold;
                text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
            }

            .custom-color-section {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 12px;
                background: linear-gradient(145deg, #1a1a1a, #252525);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .custom-color-section label {
                margin: 0 !important;
                font-size: 13px;
                color: #ccc;
                white-space: nowrap;
            }

            .custom-color-section .tag-color-input {
                width: 40px !important;
                height: 32px !important;
                padding: 0 !important;
                border: 2px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 6px !important;
                cursor: pointer;
                background: none !important;
            }

            .custom-color-section .tag-color-input:hover {
                border-color: rgba(255, 255, 255, 0.4) !important;
                transform: scale(1.05);
            }            .color-preview {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 12px;
                background: linear-gradient(145deg, #1a1a1a, #252525);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                min-height: 60px;
                width: 100%;
                box-sizing: border-box;
            }            .preview-tag {
                background: var(--tag-color, #2a82e4) !important;
                color: white !important;
                padding: 8px 16px !important;
                border-radius: 16px !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                letter-spacing: 0.25px !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
                text-align: center !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                text-shadow: 
                    -1px -1px 0 #000,
                    1px -1px 0 #000,
                    -1px 1px 0 #000,
                    1px 1px 0 #000,
                    0 -1px 0 #000,
                    0 1px 0 #000,
                    -1px 0 0 #000,
                    1px 0 0 #000 !important;
                transition: all 0.3s ease !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                white-space: nowrap !important;
                margin: 0 !important;
                position: relative !important;
                z-index: 1 !important;
                opacity: 1 !important;
                visibility: visible !important;
                line-height: 1 !important;
                vertical-align: middle !important;
            }

            /* ========== 滚动条样式 ========== */
            .tags-bubbles-container::-webkit-scrollbar {
                width: 6px;
            }

            .tags-bubbles-container::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 3px;
            }

            .tags-bubbles-container::-webkit-scrollbar-thumb {
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
                border-radius: 3px;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }

            .tags-bubbles-container::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
            }
        `;
        
        if (!document.head.querySelector('style[data-component="tag-manager-new"]')) {
            style.setAttribute('data-component', 'tag-manager-new');
            document.head.appendChild(style);
        }
    }
}
