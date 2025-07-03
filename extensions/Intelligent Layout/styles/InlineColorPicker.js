// 智能布局内嵌颜色选择器组件 - 修正版
export class InlineColorPicker {
    constructor(options = {}) {
        this.onColorSelect = options.onColorSelect || null;
        this.onCancel = options.onCancel || null;
        this.defaultColor = options.defaultColor || '#3355aa';
        this.title = options.title || '选择颜色';
        this.getThemeInfo = options.getThemeInfo || null; // 新增：获取主题信息的回调

        this.container = null;
        this.selectedColor = this.defaultColor;
        this._isVisible = false; // 使用 _isVisible 避免方法名冲突
        this.currentTheme = 'purple'; // 默认主题

        // 自动创建样式
        this.addStyles();
    }

    // 创建内嵌式颜色选择器 DOM 元素
    createInlineColorPicker() {
        // 如果已经创建过容器，直接返回
        if (this.container) {
            return this.container;
        }

        this.container = document.createElement('div');
        this.container.className = 'layout-inline-color-picker';
        this.container.style.display = 'none';

        // 添加实例引用，以便主题系统能够找到它
        this.container._inlineColorPickerInstance = this;
        this.container.innerHTML = `
            <div class="inline-color-picker-header">
                <div class="picker-title">
                    <span class="title-icon">🎨</span>
                    <span class="title-text">${this.title}</span>
                </div>
            </div>
            <div class="inline-color-picker-content">
                <div class="preset-colors-section">
                    <div class="section-label">预设颜色</div>
                    <div class="preset-colors-grid">
                        <div class="color-option" data-color="#2a82e4" style="background: #2a82e4" title="蓝色"></div>
                        <div class="color-option" data-color="#e74c3c" style="background: #e74c3c" title="红色"></div>
                        <div class="color-option" data-color="#27ae60" style="background: #27ae60" title="绿色"></div>
                        <div class="color-option" data-color="#f39c12" style="background: #f39c12" title="橙色"></div>
                        <div class="color-option" data-color="#9b59b6" style="background: #9b59b6" title="紫色"></div>
                        <div class="color-option" data-color="#1abc9c" style="background: #1abc9c" title="青色"></div>
                        <div class="color-option" data-color="#e67e22" style="background: #e67e22" title="深橙"></div>
                        <div class="color-option" data-color="#34495e" style="background: #34495e" title="深蓝灰"></div>
                        <div class="color-option" data-color="#e91e63" style="background: #e91e63" title="粉红"></div>
                        <div class="color-option" data-color="#00bcd4" style="background: #00bcd4" title="蓝绿"></div>
                        <div class="color-option" data-color="#ff5722" style="background: #ff5722" title="深橙红"></div>
                        <div class="color-option" data-color="#607d8b" style="background: #607d8b" title="蓝灰"></div>
                    </div>
                </div>
                <div class="custom-color-section">
                    <div class="section-label">自定义颜色</div>
                    <div class="custom-color-row">
                        <input type="color" class="color-input" value="${this.defaultColor}">
                        <div class="color-preview"></div>
                        <input type="text" class="color-hex-input" value="${this.defaultColor}" placeholder="#000000">
                    </div>
                </div>
                <div class="picker-buttons">
                    <button class="cancel-btn" type="button">取消</button>
                    <button class="apply-btn" type="button">应用颜色</button>
                </div>
            </div>
        `;

        // 添加事件监听器
        this.addEventListeners();

        // 设置默认选中颜色
        this.setSelectedColor(this.defaultColor);

        // 设置初始主题
        this.updateTheme();

        return this.container;
    }

    addEventListeners() {
        if (!this.container) return;

        // 防止重复绑定事件 - 检查是否已经绑定过
        if (this.container.dataset.eventsAttached === 'true') {
            return;
        }

        // 预设颜色点击事件
        const colorOptions = this.container.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                this.setSelectedColor(color);
            });
        });

        // 自定义颜色输入事件
        const colorInput = this.container.querySelector('.color-input');
        const hexInput = this.container.querySelector('.color-hex-input');

        if (colorInput) {
            colorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                this.setSelectedColor(color);
                if (hexInput) hexInput.value = color;
            });
        }

        if (hexInput) {
            hexInput.addEventListener('input', (e) => {
                const color = e.target.value;
                if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                    this.setSelectedColor(color);
                    if (colorInput) colorInput.value = color;
                }
            });
        }

        // 按钮事件
        const applyBtn = this.container.querySelector('.apply-btn');
        const cancelBtn = this.container.querySelector('.cancel-btn');

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.handleConfirm();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hide();
                // 在取消按钮点击时调用onCancel回调
                if (this.onCancel) {
                    this.onCancel();
                }
            });
        }

        // 标记事件已绑定
        this.container.dataset.eventsAttached = 'true';
    }

    setSelectedColor(color) {
        this.selectedColor = color;
        
        // 更新预览
        const preview = this.container?.querySelector('.color-preview');
        if (preview) {
            preview.style.background = color;
        }

        // 更新输入框
        const colorInput = this.container?.querySelector('.color-input');
        const hexInput = this.container?.querySelector('.color-hex-input');
        if (colorInput) colorInput.value = color;
        if (hexInput) hexInput.value = color;

        // 更新选中状态
        const colorOptions = this.container?.querySelectorAll('.color-option');
        colorOptions?.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === color) {
                option.classList.add('selected');
            }
        });
    }

    show(defaultColor) {
        if (!this.container) return;

        if (defaultColor) {
            this.setSelectedColor(defaultColor);
        }

        // 更新主题
        this.updateTheme();

        this.container.style.display = 'block';
        this._isVisible = true;

        // 添加显示动画
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
            this.container.style.transform = 'translateY(0)';
        });
    }
    
    hide() {
        if (!this.container) return;
        
        // 添加隐藏动画
        this.container.style.opacity = '0';
        this.container.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            this.container.style.display = 'none';
            this._isVisible = false;
        }, 200);
        
        // 注意：不在hide方法中调用onCancel，避免循环调用
        // onCancel应该只在用户点击取消按钮时调用
    }

    handleConfirm() {
        if (this.onColorSelect) {
            this.onColorSelect(this.selectedColor);
        }
        this.hide();
    }

    isVisible() {
        return this._isVisible;
    }

    // 更新主题
    updateTheme() {
        if (!this.container) return;

        // 获取当前主题信息
        let themeInfo = { type: 'purple' }; // 默认值
        if (this.getThemeInfo && typeof this.getThemeInfo === 'function') {
            try {
                themeInfo = this.getThemeInfo();
            } catch (e) {
                console.warn('获取主题信息失败，使用默认主题:', e);
            }
        }

        // 移除旧的主题类
        this.container.classList.remove('theme-purple', 'theme-blood');

        // 添加新的主题类
        if (themeInfo.type === 'blood') {
            this.container.classList.add('theme-blood');
            this.currentTheme = 'blood';
        } else {
            this.container.classList.add('theme-purple');
            this.currentTheme = 'purple';
        }
        
        // 强制重绘以确保样式正确应用
        this.container.offsetHeight;
    }

    destroy() {
        // 移除事件监听器
        if (this.container) {
            // 获取所有需要清理的元素
            const colorOptions = this.container.querySelectorAll('.color-option');
            const colorInput = this.container.querySelector('.color-input');
            const hexInput = this.container.querySelector('.color-hex-input');
            const applyBtn = this.container.querySelector('.apply-btn');
            const cancelBtn = this.container.querySelector('.cancel-btn');

            // 移除事件监听器（虽然移除DOM元素也会自动清理，但显式清理更安全）
            colorOptions.forEach(option => {
                option.removeEventListener('click', () => {});
            });

            // 移除DOM元素
            if (this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        }

        // 清理实例属性
        this.container = null;
        this.onColorSelect = null;
        this.onCancel = null;
        this.getThemeInfo = null;
        this._isVisible = false;
    }

    addStyles() {
        // 检查是否已经添加了样式
        const existingStyle = document.querySelector('#inline-color-picker-styles');
        if (existingStyle) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'inline-color-picker-styles';
        style.textContent = `            /* ========== 智能布局内嵌颜色选择器样式 ========== */
            .layout-inline-color-picker {
                width: 100%;
                margin-top: 0px; /* 移除上边距，因为要替换显示 */
                border-radius: 10px;
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            /* 紫色主题（秩序） */
            .layout-inline-color-picker.theme-purple {
                background: linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(22, 33, 62, 0.9));
                border: 1px solid rgba(176, 141, 225, 0.3);
                box-shadow:
                    0 8px 24px rgba(0, 0, 0, 0.4),
                    0 0 15px rgba(138, 43, 226, 0.15);
            }

            .layout-inline-color-picker.theme-purple::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(176, 141, 225, 0.7), transparent);
            }

            /* 血色主题（混沌） */
            .layout-inline-color-picker.theme-blood {
                background: linear-gradient(145deg, rgba(46, 26, 26, 0.9), rgba(62, 22, 22, 0.9));
                border: 1px solid rgba(255, 0, 0, 0.3);
                box-shadow:
                    0 8px 24px rgba(0, 0, 0, 0.4),
                    0 0 15px rgba(184, 0, 0, 0.15);
            }

            .layout-inline-color-picker.theme-blood::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 0, 0, 0.7), transparent);
            }

            /* ========== 头部样式 ========== */
            .inline-color-picker-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px 8px;
                border-radius: 10px 10px 0 0;
            }

            /* 紫色主题头部 */
            .theme-purple .inline-color-picker-header {
                border-bottom: 1px solid rgba(176, 141, 225, 0.2);
                background: linear-gradient(135deg, rgba(176, 141, 225, 0.1), rgba(138, 43, 226, 0.05));
            }

            /* 血色主题头部 */
            .theme-blood .inline-color-picker-header {
                border-bottom: 1px solid rgba(255, 0, 0, 0.2);
                background: linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(184, 0, 0, 0.05));
            }

            .picker-title {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #e1e1e1;
                font-size: 14px;
                font-weight: 600;
                letter-spacing: 0.3px;
            }

            .title-icon {
                font-size: 14px;
                opacity: 0.9;
            }

            /* ========== 内容区域 ========== */
            .inline-color-picker-content {
                padding: 12px 16px 16px;
            }

            .section-label {
                color: #ccc;
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 4px;
                opacity: 0.9;
            }

            .theme-purple .section-label::before {
                content: '●';
                color: rgba(176, 141, 225, 0.7);
                font-size: 6px;
            }

            .theme-blood .section-label::before {
                content: '●';
                color: rgba(255, 0, 0, 0.7);
                font-size: 6px;
            }

            /* ========== 预设颜色区域 ========== */
            .preset-colors-section {
                margin-bottom: 15px;
            }

            .preset-colors-grid {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 6px;
                padding: 10px;
                border-radius: 6px;
            }

            /* 紫色主题预设颜色网格 */
            .theme-purple .preset-colors-grid {
                background: linear-gradient(145deg, rgba(0, 0, 0, 0.2), rgba(42, 30, 74, 0.15));
                border: 1px solid rgba(176, 141, 225, 0.15);
            }

            /* 血色主题预设颜色网格 */
            .theme-blood .preset-colors-grid {
                background: linear-gradient(145deg, rgba(0, 0, 0, 0.2), rgba(74, 30, 30, 0.15));
                border: 1px solid rgba(255, 0, 0, 0.15);
            }

            .color-option {
                width: 24px;
                height: 24px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                border: 2px solid transparent;
                position: relative;
                box-shadow: 
                    0 2px 6px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
            }

            .color-option:hover {
                transform: scale(1.1);
                box-shadow: 
                    0 3px 12px rgba(0, 0, 0, 0.4),
                    0 0 8px rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
            }

            /* 紫色主题选中颜色 */
            .theme-purple .color-option.selected {
                border-color: rgba(176, 141, 225, 0.8);
                box-shadow:
                    0 0 0 2px rgba(138, 43, 226, 0.4),
                    0 3px 12px rgba(0, 0, 0, 0.4),
                    0 0 15px rgba(138, 43, 226, 0.3);
                transform: scale(1.05);
            }

            /* 血色主题选中颜色 */
            .theme-blood .color-option.selected {
                border-color: rgba(255, 0, 0, 0.8);
                box-shadow:
                    0 0 0 2px rgba(184, 0, 0, 0.4),
                    0 3px 12px rgba(0, 0, 0, 0.4),
                    0 0 15px rgba(184, 0, 0, 0.3);
                transform: scale(1.05);
            }

            .color-option.selected::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ffffff;
                font-size: 10px;
                font-weight: bold;
                text-shadow: 
                    0 0 3px rgba(0, 0, 0, 0.8),
                    0 1px 2px rgba(0, 0, 0, 0.6);
            }

            /* ========== 自定义颜色区域 ========== */
            .custom-color-section {
                margin-bottom: 15px;
            }

            .custom-color-row {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px;
                border-radius: 6px;
            }

            /* 紫色主题自定义颜色行 */
            .theme-purple .custom-color-row {
                background: linear-gradient(145deg, rgba(0, 0, 0, 0.2), rgba(42, 30, 74, 0.15));
                border: 1px solid rgba(176, 141, 225, 0.15);
            }

            /* 血色主题自定义颜色行 */
            .theme-blood .custom-color-row {
                background: linear-gradient(145deg, rgba(0, 0, 0, 0.2), rgba(74, 30, 30, 0.15));
                border: 1px solid rgba(255, 0, 0, 0.15);
            }

            .color-input {
                width: 40px;
                height: 28px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                background: none;
                outline: none;
            }

            .color-preview {
                width: 28px;
                height: 28px;
                border-radius: 4px;
                background: #3355aa;
                box-shadow:
                    0 2px 6px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
            }

            /* 紫色主题颜色预览 */
            .theme-purple .color-preview {
                border: 2px solid rgba(176, 141, 225, 0.3);
            }

            /* 血色主题颜色预览 */
            .theme-blood .color-preview {
                border: 2px solid rgba(255, 0, 0, 0.3);
            }

            .color-hex-input {
                flex: 1;
                padding: 6px 8px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
                color: #e1e1e1;
                font-size: 12px;
                outline: none;
                transition: all 0.2s ease;
            }

            /* 紫色主题输入框 */
            .theme-purple .color-hex-input {
                border: 1px solid rgba(176, 141, 225, 0.2);
            }

            .theme-purple .color-hex-input:focus {
                border-color: rgba(176, 141, 225, 0.5);
                box-shadow: 0 0 8px rgba(138, 43, 226, 0.2);
            }

            /* 血色主题输入框 */
            .theme-blood .color-hex-input {
                border: 1px solid rgba(255, 0, 0, 0.2);
            }

            .theme-blood .color-hex-input:focus {
                border-color: rgba(255, 0, 0, 0.5);
                box-shadow: 0 0 8px rgba(184, 0, 0, 0.2);
            }

            /* ========== 按钮区域 ========== */
            .picker-buttons {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }

            .cancel-btn, .apply-btn {
                padding: 6px 16px;
                border-radius: 4px;
                color: #e1e1e1;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                outline: none;
            }

            /* 紫色主题按钮 */
            .theme-purple .cancel-btn, .theme-purple .apply-btn {
                border: 1px solid rgba(176, 141, 225, 0.3);
                background: linear-gradient(145deg, rgba(26, 26, 46, 0.8), rgba(22, 33, 62, 0.8));
            }

            .theme-purple .cancel-btn:hover {
                background: linear-gradient(145deg, rgba(120, 120, 120, 0.2), rgba(80, 80, 80, 0.2));
                border-color: rgba(176, 141, 225, 0.5);
                box-shadow: 0 0 8px rgba(138, 43, 226, 0.2);
            }

            .theme-purple .apply-btn {
                background: linear-gradient(145deg, rgba(176, 141, 225, 0.3), rgba(138, 43, 226, 0.3));
                border-color: rgba(176, 141, 225, 0.5);
            }

            .theme-purple .apply-btn:hover {
                background: linear-gradient(145deg, rgba(176, 141, 225, 0.4), rgba(138, 43, 226, 0.4));
                border-color: rgba(176, 141, 225, 0.7);
                box-shadow: 0 0 12px rgba(138, 43, 226, 0.3);
            }

            /* 血色主题按钮 */
            .theme-blood .cancel-btn, .theme-blood .apply-btn {
                border: 1px solid rgba(255, 0, 0, 0.3);
                background: linear-gradient(145deg, rgba(46, 26, 26, 0.8), rgba(62, 22, 22, 0.8));
            }

            .theme-blood .cancel-btn:hover {
                background: linear-gradient(145deg, rgba(120, 80, 80, 0.2), rgba(80, 60, 60, 0.2));
                border-color: rgba(255, 0, 0, 0.5);
                box-shadow: 0 0 8px rgba(184, 0, 0, 0.2);
            }

            .theme-blood .apply-btn {
                background: linear-gradient(145deg, rgba(255, 0, 0, 0.3), rgba(184, 0, 0, 0.3));
                border-color: rgba(255, 0, 0, 0.5);
            }

            .theme-blood .apply-btn:hover {
                background: linear-gradient(145deg, rgba(255, 0, 0, 0.4), rgba(184, 0, 0, 0.4));
                border-color: rgba(255, 0, 0, 0.7);
                box-shadow: 0 0 12px rgba(184, 0, 0, 0.3);
            }
        `;
        
        document.head.appendChild(style);
    }
}
