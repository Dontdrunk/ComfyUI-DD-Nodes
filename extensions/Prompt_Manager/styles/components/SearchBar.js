// 搜索栏组件 - 负责提示词搜索功能和标签筛选

import { globalTagColorManager } from './TagColorManager.js';

export class SearchBar {
    constructor(onSearch = null, onTagFilter = null) {
        this.onSearch = onSearch;
        this.onTagFilter = onTagFilter; // 标签筛选回调
        this.currentKeyword = '';
        this.selectedTags = new Set(); // 选中的标签
        this.allTags = new Set(); // 所有可用标签
        this.searchInput = null;
        this.container = null;        this.tagsContainer = null;
        this.debounceTimer = null;
        this.createSearchBar();
    }createSearchBar() {
        this.container = document.createElement('div');
        this.container.className = 'search-section';
        this.container.innerHTML = `
            <div class="search-container">
                <input type="text" class="search-input" placeholder="搜索提示词名称、内容或标签（多标签用逗号分隔）..." />
                <div class="search-icon">🔍</div>
                <button class="clear-search-btn" style="display: none;" title="清除搜索">×</button>
            </div>
            <div class="tags-filter-container">
                <!-- 标签筛选区域将在这里动态生成 -->
            </div>
            <div class="search-stats" style="display: none;">
                <span class="search-results-count">找到 0 个结果</span>
                <span class="active-filters-count" style="display: none;">筛选: <span class="filter-count">0</span> 个标签</span>
            </div>
        `;

        this.searchInput = this.container.querySelector('.search-input');
        this.clearBtn = this.container.querySelector('.clear-search-btn');
        this.statsContainer = this.container.querySelector('.search-stats');
        this.resultsCount = this.container.querySelector('.search-results-count');
        this.tagsContainer = this.container.querySelector('.tags-filter-container');
        this.activeFiltersCount = this.container.querySelector('.active-filters-count');
        this.filterCount = this.container.querySelector('.filter-count');

        this.bindEvents();
        this.addStyles();
    }

    bindEvents() {
        // 搜索输入事件（带防抖）
        this.searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim();
            this.updateClearButton(keyword);
            
            // 防抖处理
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            
            this.debounceTimer = setTimeout(() => {
                this.handleSearch(keyword);
            }, 300);
        });

        // 回车键搜索
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.debounceTimer) {
                    clearTimeout(this.debounceTimer);
                }
                this.handleSearch(this.searchInput.value.trim());
            }
        });

        // 清除搜索
        this.clearBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        // 聚焦输入框时的样式
        this.searchInput.addEventListener('focus', () => {
            this.container.querySelector('.search-container').classList.add('focused');
        });

        this.searchInput.addEventListener('blur', () => {
            this.container.querySelector('.search-container').classList.remove('focused');
        });
    }    handleSearch(keyword) {
        this.currentKeyword = keyword;
        
        // 同时应用搜索和标签筛选
        if (this.onTagFilter && typeof this.onTagFilter === 'function') {
            const results = this.onTagFilter(keyword, Array.from(this.selectedTags));
            this.updateSearchStats(results);
        } else if (this.onSearch && typeof this.onSearch === 'function') {
            // 兼容旧的搜索回调
            const results = this.onSearch(keyword);
            this.updateSearchStats(results);
        }
    }

    updateClearButton(keyword) {
        if (keyword) {
            this.clearBtn.style.display = 'block';
        } else {
            this.clearBtn.style.display = 'none';
        }
    }

    updateSearchStats(results) {
        if (this.currentKeyword) {
            this.statsContainer.style.display = 'block';
            const count = Array.isArray(results) ? results.length : (results || 0);
            this.resultsCount.textContent = `找到 ${count} 个结果`;
        } else {
            this.statsContainer.style.display = 'none';
        }
    }    clearSearch() {
        this.searchInput.value = '';
        this.currentKeyword = '';
        this.clearBtn.style.display = 'none';
        this.statsContainer.style.display = 'none';
        this.selectedTags.clear(); // 同时清除标签筛选
        this.renderTags();
        this.updateActiveFiltersDisplay();
        this.handleFilter();
        this.searchInput.focus();
    }

    setKeyword(keyword) {
        this.searchInput.value = keyword;
        this.currentKeyword = keyword;
        this.updateClearButton(keyword);
        this.handleSearch(keyword);
    }

    getKeyword() {
        return this.currentKeyword;
    }

    setOnSearch(callback) {
        this.onSearch = callback;
    }

    focus() {
        this.searchInput.focus();
    }

    addStyles() {        const style = document.createElement('style');
        style.textContent = `            .search-section {
                padding: 24px 32px 20px;
                background: linear-gradient(135deg, #2d2d30, #232326);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
                z-index: 2;
                box-sizing: border-box;
            }

            .search-section::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            }

            .search-container {
                position: relative;
                display: flex;
                align-items: center;
                background: linear-gradient(145deg, #1e1e1e, #2a2a2a);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                box-shadow: 
                    inset 0 1px 3px rgba(0, 0, 0, 0.2),
                    0 1px 3px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }

            .search-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .search-container.focused {
                border-color: rgba(0, 120, 212, 0.6);
                box-shadow: 
                    0 0 0 3px rgba(0, 120, 212, 0.15),
                    inset 0 1px 3px rgba(0, 0, 0, 0.2),
                    0 4px 12px rgba(0, 120, 212, 0.1);
                transform: translateY(-1px);
            }

            .search-container.focused::before {
                opacity: 1;
            }

            .search-input {
                flex: 1;
                background: transparent;
                border: none;
                color: #ffffff;
                padding: 14px 16px;
                font-size: 14px;
                font-weight: 400;
                outline: none;
                min-width: 0;
                letter-spacing: 0.25px;
            }

            .search-input::placeholder {
                color: #888;
                font-weight: 300;
            }

            .search-icon {
                color: #888;
                padding: 0 16px 0 16px;
                font-size: 16px;
                pointer-events: none;
                transition: color 0.3s ease;
            }

            .search-container.focused .search-icon {
                color: #0078d4;
            }

            .clear-search-btn {
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                padding: 8px 16px;
                font-size: 16px;
                transition: all 0.3s ease;
                border-radius: 6px;
                margin-right: 4px;
                opacity: 0;
                transform: scale(0.8);
                pointer-events: none;
            }

            .clear-search-btn.visible {
                opacity: 1;
                transform: scale(1);
                pointer-events: auto;
            }

            .clear-search-btn:hover {
                color: #fff;
                background: rgba(255, 255, 255, 0.1);
                transform: scale(1.1);
            }            .clear-search-btn:active {
                transform: scale(0.95);
            }

            .search-stats {
                margin-top: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 4px;
            }

            .search-results-count {
                color: #999;
                font-size: 12px;
                font-weight: 400;
                letter-spacing: 0.25px;
            }

            .active-filters-count {
                color: #4a9eff;
                font-size: 12px;
                font-weight: 500;
                padding: 2px 8px;
                background: rgba(74, 158, 255, 0.1);
                border-radius: 6px;
                border: 1px solid rgba(74, 158, 255, 0.2);
            }            /* 标签筛选样式 */
            .tags-filter-container {
                margin-top: 12px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
            }

            .tags-filter-container:empty {
                display: none;
            }            .tags-header {
                display: none;
            }

            .tags-title {
                color: #e0e0e0;
                font-size: 13px;
                font-weight: 600;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .tags-title::before {
                content: '🏷️';
                font-size: 12px;
            }            .clear-tags-btn {
                background: linear-gradient(145deg, #2a2a2a, #1e1e1e);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #ccc;
                padding: 6px 12px;
                font-size: 11px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                font-weight: 500;
                letter-spacing: 0.25px;
                height: 26px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-right: 8px;
            }

            .clear-tags-btn:hover {
                border-color: rgba(255, 255, 255, 0.2);
                color: #fff;
                background: linear-gradient(145deg, #3a3a3a, #2e2e2e);
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }

            .clear-tags-btn:active {
                transform: translateY(0);
            }            .tags-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
            }            .filter-tag {
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
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                user-select: none;
                border: 1px solid rgba(255, 255, 255, 0.1);
                min-width: 60px;
                max-width: 90px;
                height: 28px;
                overflow: hidden;
                text-overflow: ellipsis;
                position: relative;
                letter-spacing: 0.25px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                text-align: center;
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
            }.filter-tag::before {
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
            }            .filter-tag:hover {
                box-shadow: 
                    0 0 10px rgba(var(--tag-color-rgb), 0.3),
                    0 4px 15px rgba(0, 0, 0, 0.2);
                transform: scale(1.05);
                border-color: rgba(var(--tag-color-rgb), 0.4);
                filter: brightness(1.1) saturate(1.05);
            }.filter-tag:hover::before {
                opacity: 1;
            }            .filter-tag.selected {
                background: var(--tag-color, #2a82e4);
                box-shadow: 
                    0 0 12px rgba(var(--tag-color-rgb), 0.4),
                    0 4px 15px rgba(0, 0, 0, 0.3),
                    0 0 0 2px rgba(255, 255, 255, 0.8);
                border-color: rgba(var(--tag-color-rgb), 0.8);
                transform: scale(1.08);
                font-weight: 600;
                color: #ffffff;
                text-shadow: 
                    -1px -1px 0 #000,
                    1px -1px 0 #000,
                    -1px 1px 0 #000,
                    1px 1px 0 #000,
                    0 -1px 0 #000,
                    0 1px 0 #000,
                    -1px 0 0 #000,
                    1px 0 0 #000;
                position: relative;
                z-index: 2;
                filter: brightness(1.15) saturate(1.1);
                border: 2px solid rgba(255, 255, 255, 0.9);
                animation: tagSelectPulse 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }            .filter-tag.selected:hover {
                background: var(--tag-color, #2a82e4);
                box-shadow: 
                    0 0 16px rgba(var(--tag-color-rgb), 0.5),
                    0 6px 20px rgba(0, 0, 0, 0.3),
                    0 0 0 2px rgba(255, 255, 255, 0.9);
                transform: scale(1.12);
                filter: brightness(1.25) saturate(1.15);
            }

            @keyframes tagSelectPulse {
                0% {
                    transform: scale(1);
                    box-shadow: 
                        0 0 8px rgba(var(--tag-color-rgb), 0.3),
                        0 2px 8px rgba(0, 0, 0, 0.2);
                }
                50% {
                    transform: scale(1.15);
                    box-shadow: 
                        0 0 20px rgba(var(--tag-color-rgb), 0.6),
                        0 6px 20px rgba(0, 0, 0, 0.3),
                        0 0 0 3px rgba(255, 255, 255, 1);
                }
                100% {
                    transform: scale(1.08);
                    box-shadow: 
                        0 0 12px rgba(var(--tag-color-rgb), 0.4),
                        0 4px 15px rgba(0, 0, 0, 0.3),
                        0 0 0 2px rgba(255, 255, 255, 0.8);
                }            }

            .no-tags {
                display: none;
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .search-input {
                    padding: 10px 12px;
                    font-size: 16px; /* 防止iOS缩放 */
                }
                
                .search-input::placeholder {
                    font-size: 14px;
                }
            }
        `;
        
        if (!document.head.querySelector('style[data-component="search-bar"]')) {
            style.setAttribute('data-component', 'search-bar');
            document.head.appendChild(style);
        }
    }    // 标签相关方法
    updateTags(prompts) {
        // 收集所有标签
        this.allTags.clear();
        
        // 1. 从提示词中收集标签
        prompts.forEach(prompt => {
            if (prompt.tags && Array.isArray(prompt.tags)) {
                prompt.tags.forEach(tag => {
                    if (tag && tag.trim()) {
                        this.allTags.add(tag.trim());
                    }
                });
            }
        });

        // 2. 从TagColorManager中获取所有手动创建的标签（包括未使用的）
        const allManagedTags = globalTagColorManager.getAllTags();
        allManagedTags.forEach(tag => {
            this.allTags.add(tag);
        });

        // 更新全局标签颜色管理器
        globalTagColorManager.updateFromPrompts(prompts);

        this.renderTags();
    }

    generateRandomColor() {
        // 使用全局标签颜色管理器
        return globalTagColorManager.generateRandomColor();
    }    renderTags() {
        if (!this.tagsContainer) return;

        if (this.allTags.size === 0) {
            this.tagsContainer.innerHTML = '';
            return;
        }

        const sortedTags = Array.from(this.allTags).sort();
        
        // 如果有选中的标签，在标签列表前添加清除按钮
        const clearButton = this.selectedTags.size > 0 
            ? `<button class="clear-tags-btn" title="清除所有标签筛选">清除筛选</button>` 
            : '';
        
        this.tagsContainer.innerHTML = `
            ${clearButton}
            ${sortedTags.map(tag => this.createTagElement(tag)).join('')}
        `;

        this.bindTagEvents();
    }createTagElement(tag) {
        const isSelected = this.selectedTags.has(tag);
        const color = globalTagColorManager.getTagColor(tag);
        const colorRGB = globalTagColorManager.getTagColorRGB(tag);
        
        return `
            <span class="filter-tag ${isSelected ? 'selected' : ''}" 
                  data-tag="${this.escapeHtml(tag)}" 
                  style="--tag-color: ${color}; --tag-color-rgb: ${colorRGB};" 
                  title="点击选择/取消选择标签">
                ${this.escapeHtml(tag)}
            </span>
        `;
    }    bindTagEvents() {
        // 标签点击事件
        this.tagsContainer.querySelectorAll('.filter-tag').forEach(tagElement => {
            tagElement.addEventListener('click', () => {
                const tag = tagElement.dataset.tag;
                this.toggleTag(tag);
            });
        });

        // 清除标签筛选
        const clearTagsBtn = this.tagsContainer.querySelector('.clear-tags-btn');
        if (clearTagsBtn) {
            clearTagsBtn.addEventListener('click', () => {
                this.clearTagFilters();
            });
        }
    }

    toggleTag(tag) {
        if (this.selectedTags.has(tag)) {
            this.selectedTags.delete(tag);
        } else {
            this.selectedTags.add(tag);
        }

        this.renderTags();
        this.updateActiveFiltersDisplay();
        this.handleFilter();
    }

    clearTagFilters() {
        this.selectedTags.clear();
        this.renderTags();
        this.updateActiveFiltersDisplay();
        this.handleFilter();
    }

    updateActiveFiltersDisplay() {
        if (this.selectedTags.size > 0) {
            this.activeFiltersCount.style.display = 'inline';
            this.filterCount.textContent = this.selectedTags.size;
        } else {
            this.activeFiltersCount.style.display = 'none';
        }
    }

    handleFilter() {
        // 同时应用搜索和标签筛选
        if (this.onTagFilter && typeof this.onTagFilter === 'function') {
            const results = this.onTagFilter(this.currentKeyword, Array.from(this.selectedTags));
            this.updateSearchStats(results);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // 移除样式
        const style = document.head.querySelector('style[data-component="search-bar"]');
        if (style) {
            style.remove();
        }
    }

    // 公开方法
    getSelectedTags() {
        return Array.from(this.selectedTags);
    }

    hasTagsSelected() {
        return this.selectedTags.size > 0;
    }

    selectTag(tag) {
        if (this.allTags.has(tag) && !this.selectedTags.has(tag)) {
            this.selectedTags.add(tag);
            this.renderTags();
            this.updateActiveFiltersDisplay();
            this.handleFilter();
        }
    }

    getCurrentKeyword() {
        return this.currentKeyword;
    }

    // 获取组件元素
    getElement() {
        return this.container;
    }    // 刷新标签筛选区域（从TagColorManager获取所有标签）
    refreshTags() {
        console.log('SearchBar: 开始刷新标签列表...');
        
        // 从全局标签颜色管理器获取最新的标签列表
        const allTags = globalTagColorManager.getAllTags();
        console.log('SearchBar: 从TagColorManager获取到的标签:', allTags);
        
        // 更新本地标签集合
        this.allTags = new Set(allTags);
        
        // 清理已删除的标签选择状态
        const deletedTags = [];
        this.selectedTags.forEach(selectedTag => {
            if (!this.allTags.has(selectedTag)) {
                deletedTags.push(selectedTag);
            }
        });
        
        // 移除已删除标签的选择状态
        deletedTags.forEach(tag => {
            console.log(`SearchBar: 移除已删除标签的选择状态: ${tag}`);
            this.selectedTags.delete(tag);
        });
        
        // 重新渲染标签UI
        console.log('SearchBar: 重新渲染标签UI...');
        this.renderTags();
        
        // 如果有选中状态变化，重新应用筛选
        if (deletedTags.length > 0) {
            console.log('SearchBar: 检测到标签删除，重新应用筛选...');
            this.updateActiveFiltersDisplay();
            this.handleFilter();
        }
        
        console.log('SearchBar: 标签列表刷新完成，当前标签:', Array.from(this.allTags));
    }

    // 新增：刷新所有标签的颜色
    refreshTagColors() {
        // 重新渲染所有标签的颜色
        this.tagsContainer.querySelectorAll('.filter-tag').forEach(tagElement => {
            const tagName = tagElement.dataset.tag;
            if (tagName) {
                const color = globalTagColorManager.getTagColor(tagName);
                const colorRGB = globalTagColorManager.getTagColorRGB(tagName);
                tagElement.style.setProperty('--tag-color', color);
                tagElement.style.setProperty('--tag-color-rgb', colorRGB);
            }
        });
    }
}
