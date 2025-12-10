// 提示词管理器 UI 主控制器 - 重构后的版本
// 负责组件组合和逻辑调度，不包含具体的UI实现

import { MainModal } from './components/MainModal.js';
import { SearchBar } from './components/SearchBar.js';
import { PromptList } from './components/PromptList.js';
import { PromptForm } from './components/PromptForm.js';
import { DialogComponents } from './components/DialogComponents.js';
import { TagManager } from './components/TagManager.js';

export class PromptManagerUI {
    constructor(embedder) {
        this.embedder = embedder;
        this.promptManager = embedder.promptManager;
        this.node = embedder.node;
          // 组件实例
        this.mainModal = null;
        this.searchBar = null;
        this.promptList = null;
        this.promptForm = null;
        this.dialogComponents = null;
        this.tagManager = null;
        
        // 状态管理
        this.isVisible = false;
        this.editingPrompt = null;
        this.currentSearchKeyword = '';
        
        this.initializeComponents();
        this.setupEventHandlers();
    }

    initializeComponents() {
        // 初始化主模态框
        this.mainModal = new MainModal('提示词管理');
        
        // 初始化对话框组件
        this.dialogComponents = new DialogComponents();        
        // 初始化列表组件
        this.promptList = new PromptList({
            onEdit: (index, prompt) => this.handleEditPrompt(index, prompt),
            onDelete: (index, prompt) => this.handleDeletePrompt(index, prompt),
            onApply: (index, prompt) => this.handleApplyPrompt(index, prompt),
            onTagClick: (tagName) => this.handleTagClick(tagName)
        });        // 初始化搜索栏 (在列表组件之后初始化)
        this.searchBar = new SearchBar(
            // 兼容旧的搜索回调
            (keyword) => {
                this.currentSearchKeyword = keyword;
                
                // 设置原始数据，然后应用搜索关键词
                this.promptList.setPrompts(this.promptManager.getPrompts());
                const searchResultCount = this.promptList.filterPrompts(keyword);
                
                return searchResultCount;
            },
            // 新的标签筛选回调
            (keyword, selectedTags) => {
                this.currentSearchKeyword = keyword;
                
                // 设置原始数据，然后应用搜索关键词和标签筛选
                this.promptList.setPrompts(this.promptManager.getPrompts());
                const searchResultCount = this.promptList.filterPrompts(keyword, selectedTags);
                
                return searchResultCount;
            }
        );        // 初始化表单组件
        this.promptForm = new PromptForm({
            onSubmit: (formData, isEditing, editingPrompt) => this.handleFormSubmit(formData, isEditing, editingPrompt),
            onCancel: () => this.handleFormCancel(),
            getPrompts: () => this.promptManager.getPrompts() // 新增：提供获取提示词数据的回调
        });
        
        // 初始化标签管理组件
        this.tagManager = new TagManager({
            onClose: () => {
                // 标签管理关闭后刷新标签筛选区域
                if (this.searchBar && this.searchBar.refreshTags) {
                    this.searchBar.refreshTags();
                }
            },            onTagColorChange: () => {
                // 标签颜色变更后立即刷新所有组件的标签颜色和标签列表
                this.refreshAllTagColors();
                // 同时刷新搜索栏的标签列表
                if (this.searchBar && this.searchBar.refreshTags) {
                    this.searchBar.refreshTags();
                }
            },
            promptManager: this.promptManager
        });
        
        this.assembleUI();
    }

    assembleUI() {
        const contentContainer = this.mainModal.getContentContainer();
        
        // 创建左右分栏布局
        contentContainer.innerHTML = `
            <div class="prompt-manager-layout">
                <div class="prompt-manager-main">
                    <!-- 搜索栏和列表将插入这里 -->
                </div>
                <div class="prompt-manager-form">
                    <!-- 表单将插入这里 -->
                </div>
            </div>
        `;
        
        const mainSection = contentContainer.querySelector('.prompt-manager-main');
        const formSection = contentContainer.querySelector('.prompt-manager-form');
          // 插入组件
        mainSection.appendChild(this.promptList.getElement());
        mainSection.insertBefore(this.searchBar.getElement(), this.promptList.getElement());
        formSection.appendChild(this.promptForm.getElement());
        formSection.appendChild(this.tagManager.getElement());
        
        // 添加布局样式
        this.addLayoutStyles();
    }    setupEventHandlers() {
        // 绑定头部操作按钮事件
        const headerActions = this.promptList.getHeaderActions();
        
        headerActions.addBtn.addEventListener('click', () => {
            this.showForm();
        });
        
        headerActions.importBtn.addEventListener('click', () => {
            this.handleImport();
        });
        
        headerActions.exportBtn.addEventListener('click', () => {
            this.handleExport();
        });
        
        headerActions.tagManagerBtn.addEventListener('click', () => {
            this.handleTagManager();
        });
    }    // 显示管理器
    show() {
        this.isVisible = true;
        this.mainModal.show();
        
        // 确保布局容器初始状态正确（没有展开类）
        const layoutContainer = this.mainModal.getContentContainer().querySelector('.prompt-manager-layout');
        if (layoutContainer) {
            layoutContainer.classList.remove('form-expanded');
        }
        
        // 重置搜索状态
        this.currentSearchKeyword = '';
        this.searchBar.setKeyword('');
        
        // 刷新数据
        this.refreshPromptList();
    }    // 显示表单
    showForm(prompt = null) {
        this.editingPrompt = prompt;
        
        // 隐藏标签管理器（如果正在显示）
        if (this.tagManager && this.tagManager.isVisible()) {
            this.tagManager.hide();
        }
        
        if (prompt) {
            this.promptForm.show('edit', prompt);
        } else {
            this.promptForm.show('add');
        }
    }    // 隐藏表单
    hideForm() {
        this.editingPrompt = null;
        this.promptForm.hide();
    }

    // 处理编辑提示词
    async handleEditPrompt(index, prompt) {
        this.showForm(prompt);
    }

    // 处理删除提示词
    async handleDeletePrompt(index, prompt) {
        const confirmed = await this.dialogComponents.showDeleteConfirm(prompt.name);
          if (confirmed) {
            try {
                this.promptManager.deletePrompt(prompt.id);
                this.refreshPromptList();
                
                // 删除成功，不显示弹窗，直接完成操作
            } catch (error) {
                console.error('删除提示词失败:', error);
                await this.dialogComponents.showErrorDialog(
                    '删除失败',
                    error.message || '删除提示词时发生错误'
                );
            }
        }
    }    // 处理应用提示词
    async handleApplyPrompt(index, prompt) {
        try {
            // 获取所有文本组件
            const textWidgets = this.embedder.getAllTextWidgets();
            
            if (textWidgets.length === 0) {
                await this.dialogComponents.showErrorDialog(
                    '应用失败',
                    '未找到可用的文本输入框'
                );
                return;
            }

            let targetWidget = null;

            // 如果有多个文本组件，显示选择器
            if (textWidgets.length > 1) {
                targetWidget = await this.dialogComponents.showWidgetSelector(
                    textWidgets,
                    (widget) => this.embedder.getWidgetDisplayName(widget)
                );
                
                if (!targetWidget) {
                    return; // 用户取消选择
                }
            } else {
                targetWidget = textWidgets[0];
            }

            // 检查是否有现有内容
            const currentValue = targetWidget.value || '';
            const hasContent = currentValue.trim().length > 0;
            
            let insertMode = 'replace'; // 默认模式

            if (hasContent) {
                // 显示插入模式选择对话框
                insertMode = await this.dialogComponents.showInsertModeDialog(
                    '选择插入模式',
                    '检测到输入框中已有内容，请选择插入模式：'
                );
                
                if (!insertMode) {
                    return; // 用户取消或关闭对话框
                }
            }            // 应用提示词
            this.embedder.applyPromptToWidget(prompt, targetWidget, insertMode);

            // 隐藏管理器
            this.hide();

            // 不再显示成功提示，直接完成操作

        } catch (error) {
            console.error('应用提示词失败:', error);
            await this.dialogComponents.showErrorDialog(
                '应用失败',
                error.message || '应用提示词时发生错误'
            );
        }
    }

    // 标签筛选和搜索组合逻辑
    filterPromptsWithTagsAndSearch(keyword, selectedTags) {
        let allPrompts = this.promptManager.getPrompts();
        
        // 如果有搜索关键词，先进行搜索筛选
        if (keyword && keyword.trim()) {
            allPrompts = this.promptManager.searchPrompts(keyword.trim());
        }
        
        // 如果有选中的标签，进行标签筛选
        if (selectedTags && selectedTags.length > 0) {
            allPrompts = allPrompts.filter(prompt => {
                if (!prompt.tags || !Array.isArray(prompt.tags)) {
                    return false;
                }
                
                // 检查提示词是否包含所有选中的标签（AND逻辑）
                return selectedTags.every(selectedTag => 
                    prompt.tags.some(tag => tag && tag.trim() === selectedTag)
                );
            });
        }
        
        return allPrompts;
    }

    // 处理标签点击（从提示词卡片中点击标签）
    handleTagClick(tagName) {
        // 将标签添加到搜索栏的筛选中
        this.searchBar.selectedTags.add(tagName);
        this.searchBar.renderTags();
        this.searchBar.updateActiveFiltersDisplay();
        this.searchBar.handleFilter();
    }

    // 处理表单提交
    async handleFormSubmit(formData, isEditing, editingPrompt) {
        try {
            const { name, content, tags } = formData;            if (isEditing && editingPrompt) {
                // 编辑模式
                this.promptManager.updatePrompt(editingPrompt.id, name, content, tags);
                
                // 更新成功，不显示弹窗，直接完成操作
            } else {
                // 添加模式
                this.promptManager.addPrompt(name, content, tags);
                
                // 添加成功，不显示弹窗，直接完成操作
            }

            this.hideForm();
            this.refreshPromptList();

        } catch (error) {
            console.error('保存提示词失败:', error);
            await this.dialogComponents.showErrorDialog(
                '保存失败',
                error.message || '保存提示词时发生错误'
            );
        }
    }

    // 处理表单取消
    handleFormCancel() {
        this.hideForm();
    }

    // 处理导入
    async handleImport() {
        try {
            const file = await this.dialogComponents.showFileImportDialog('.json');
            
            if (file) {
                const count = await this.promptManager.importPrompts(file);
                this.refreshPromptList();
                  await this.dialogComponents.showSuccessDialog(
                    '导入成功',
                    `成功导入 ${count} 个提示词！`,
                    1500  // 缩短显示时间到1.5秒
                );
            }
        } catch (error) {
            console.error('导入失败:', error);
            await this.dialogComponents.showErrorDialog(
                '导入失败',
                error.message || '导入文件时发生错误'
            );
        }
    }

    // 处理导出
    async handleExport() {
        try {
            const success = this.promptManager.exportPrompts();
            
            if (success) {                await this.dialogComponents.showSuccessDialog(
                    '导出成功',
                    '提示词数据已导出到文件！',
                    1500  // 缩短显示时间到1.5秒
                );
            }
        } catch (error) {
            console.error('导出失败:', error);
            await this.dialogComponents.showErrorDialog(
                '导出失败',
                error.message || '导出文件时发生错误'
            );
        }    }    // 处理标签管理
    handleTagManager() {
        // 如果标签管理器已经显示，则隐藏它
        if (this.tagManager.isVisible()) {
            this.tagManager.hide();
            return;
        }
        
        // 隐藏表单（如果正在显示）
        if (this.promptForm.isVisible()) {
            this.promptForm.hide();
        }
        this.editingPrompt = null;
        
        // 显示标签管理器
        this.tagManager.show();
    }

    // 添加布局样式
    addLayoutStyles() {
        const style = document.createElement('style');
        style.textContent = `            .prompt-manager-layout {
                display: flex;
                height: 100%;
                max-height: calc(100vh - 160px);
                background: #1e1e1e;
                border-radius: 0 0 16px 16px;
                overflow: hidden;
                position: relative;
            }            .prompt-manager-main {
                width: 100%;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                background: #1e1e1e;
                position: relative;
                transition: width 0.3s ease-out;
                will-change: width;
                transform: translateZ(0);
                backface-visibility: hidden;
            }

            /* 当表单显示时，左侧区域收缩到固定宽度 */
            .prompt-manager-layout.form-expanded .prompt-manager-main {
                width: 800px;
            }            .prompt-manager-form {
                width: 0;
                background: linear-gradient(145deg, #2a2a2a, #232323);
                border-left: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
                overflow: hidden;
                opacity: 0;
                transition: width 0.3s ease-out, 
                           opacity 0.3s ease-out;
                will-change: width, opacity;
                transform: translateZ(0);
                backface-visibility: hidden;
            }

            /* 当表单显示时，右侧区域展开到400px宽度 */
            .prompt-manager-layout.form-expanded .prompt-manager-form {
                width: 400px;
                opacity: 1;
            }            /* 硬件加速优化 */
            .prompt-manager-layout,
            .prompt-manager-main,
            .prompt-manager-form {
                backface-visibility: hidden;
                perspective: 1000px;
                transform: translateZ(0);
            }

            .prompt-manager-form::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 1px;
                height: 100%;
                background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                z-index: 2;
            }

            .prompt-manager-form .prompt-form-section {
                border-top: none;
                border-left: none;
                height: 100%;
                background: transparent;
            }

            /* 光滑滚动 */
            .prompt-manager-main,
            .prompt-manager-form {
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
            }

            .prompt-manager-main::-webkit-scrollbar,
            .prompt-manager-form::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }

            .prompt-manager-main::-webkit-scrollbar-track,
            .prompt-manager-form::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 3px;
            }

            .prompt-manager-main::-webkit-scrollbar-thumb,
            .prompt-manager-form::-webkit-scrollbar-thumb {
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
                border-radius: 3px;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }

            .prompt-manager-main::-webkit-scrollbar-thumb:hover,
            .prompt-manager-form::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
            }
        `;
        
        if (!document.head.querySelector('style[data-component="prompt-manager-layout"]')) {
            style.setAttribute('data-component', 'prompt-manager-layout');
            document.head.appendChild(style);
        }
    }

    // 销毁组件
    destroy() {
        // 销毁所有子组件
        if (this.mainModal) {
            this.mainModal.destroy();
        }
        
        if (this.searchBar) {
            this.searchBar.destroy();
        }
        
        if (this.promptList) {
            this.promptList.destroy();
        }
        
        if (this.promptForm) {
            this.promptForm.destroy();
        }
          if (this.dialogComponents) {
            this.dialogComponents.destroy();
        }
        
        if (this.tagManager) {
            this.tagManager.destroy();
        }
        
        // 移除布局样式
        const style = document.head.querySelector('style[data-component="prompt-manager-layout"]');
        if (style) {
            style.remove();
        }
        
        // 重置状态
        this.isVisible = false;
        this.editingPrompt = null;
        this.currentSearchKeyword = '';
    }

    // 获取当前状态信息
    getState() {
        return {
            isVisible: this.isVisible,
            currentSearchKeyword: this.currentSearchKeyword,
            editingPrompt: this.editingPrompt,
            totalPrompts: this.promptManager.getPrompts().length
        };
    }

    // 设置搜索关键词（外部调用）
    setSearchKeyword(keyword) {
        this.searchBar.setKeyword(keyword);
    }

    // 获取当前搜索关键词
    getSearchKeyword() {
        return this.currentSearchKeyword;
    }    // 隐藏管理器
    hide() {
        this.isVisible = false;
        this.hideForm(); // 先隐藏表单
        
        // 隐藏标签管理器（如果正在显示）
        if (this.tagManager && this.tagManager.isVisible()) {
            this.tagManager.hide();
        }
        
        this.mainModal.hide();
    }

    // 切换显示状态
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }    // 刷新提示词列表
    refreshPromptList() {
        // 获取所有提示词用于标签更新
        const allPrompts = this.promptManager.getPrompts();
        
        // 更新搜索栏的标签
        this.searchBar.updateTags(allPrompts);
          // 设置原始数据，然后应用搜索关键词和标签筛选
        this.promptList.setPrompts(allPrompts);
        if (this.currentSearchKeyword || (this.searchBar && this.searchBar.getSelectedTags().length > 0)) {
            const selectedTags = this.searchBar ? this.searchBar.getSelectedTags() : [];
            this.promptList.filterPrompts(this.currentSearchKeyword, selectedTags);
        }
    }    // 新增：刷新所有组件的标签颜色和标签列表
    refreshAllTagColors() {
        console.log('开始刷新所有组件的标签颜色和标签列表...');
        
        // 首先刷新提示词列表的数据（确保已删除的标签从提示词中移除）
        console.log('刷新提示词列表数据...');
        this.refreshPromptList();
        
        // 刷新搜索栏中的标签列表和颜色（标签删除后需要重新生成标签列表）
        if (this.searchBar) {
            if (typeof this.searchBar.refreshTags === 'function') {
                console.log('刷新搜索栏标签列表...');
                this.searchBar.refreshTags();
            }
            if (typeof this.searchBar.refreshTagColors === 'function') {
                console.log('刷新搜索栏标签颜色...');
                this.searchBar.refreshTagColors();
            }
        }
        
        // 刷新列表中的标签颜色（此时数据已经是最新的了）
        if (this.promptList && typeof this.promptList.refreshTagColors === 'function') {
            console.log('刷新提示词列表标签颜色...');
            this.promptList.refreshTagColors();
        }
        
        // 刷新表单中的标签颜色
        if (this.promptForm && typeof this.promptForm.refreshTagColors === 'function') {
            console.log('刷新提示词表单标签颜色...');
            this.promptForm.refreshTagColors();
        }
        
        console.log('所有组件标签颜色和标签列表刷新完成');
    }
    // 显示插入模式选择对话框
    async showInsertDialog(title, message, callback) {
        try {
            const result = await this.dialogComponents.showInsertModeDialog(title, message);
            if (callback && typeof callback === 'function') {
                callback(result);
            }
            return result;
        } catch (error) {
            console.error('显示插入对话框失败:', error);
            // 如果对话框失败，默认使用替换模式
            if (callback && typeof callback === 'function') {
                callback('replace');
            }
            return 'replace';
        }
    }

    // 显示文本组件选择器对话框
    async showTextWidgetSelector(prompt) {
        try {
            const textWidgets = this.embedder.getAllTextWidgets();
            
            if (textWidgets.length === 0) {
                await this.dialogComponents.showErrorDialog('错误', '未找到可用的文本输入框');
                return;
            }

            if (textWidgets.length === 1) {
                // 只有一个，直接应用
                this.embedder.applyPromptToWidget(prompt, textWidgets[0]);
                return;
            }

            const selectedWidget = await this.dialogComponents.showWidgetSelector(
                textWidgets,
                (widget) => {
                    // 生成显示名称
                    const name = widget.name || widget.options?.property || '未命名';
                    const index = textWidgets.indexOf(widget) + 1;
                    return `${name} (输入框 ${index})`;
                }
            );

            if (selectedWidget) {
                this.embedder.applyPromptToWidget(prompt, selectedWidget);
            }
        } catch (error) {
            console.error('显示文本组件选择器失败:', error);
            await this.dialogComponents.showErrorDialog('错误', '显示选择器时发生错误');
        }
    }
}
