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

    // 智能主题识别和动态样式生成
    updateTheme() {
        if (!this.container) return;

        // 智能提取主题色彩
        const themeColors = this.extractThemeColors();

        // 动态生成并应用样式
        this.applyDynamicTheme(themeColors);

        // 强制重绘以确保样式正确应用
        this.container.offsetHeight;

        console.log('🎨 颜色选择器主题已更新:', themeColors);
    }

    // 智能提取当前主题的主色调
    extractThemeColors() {
        const defaultColors = {
            primary: '#8a2be2',      // 主色调
            secondary: '#b08de1',    // 次要色调
            accent: '#6a5acd',       // 强调色
            background: 'rgba(26, 26, 46, 0.9)', // 背景色
            border: 'rgba(176, 141, 225, 0.3)',  // 边框色
            shadow: 'rgba(138, 43, 226, 0.15)'   // 阴影色
        };

        try {
            // 尝试从当前面板容器中提取颜色
            const panel = document.querySelector('.layout-panel');
            if (!panel) return defaultColors;

            // 获取计算样式
            const computedStyle = window.getComputedStyle(panel);

            // 提取边框颜色作为主色调参考
            const borderColor = computedStyle.borderColor;
            const boxShadow = computedStyle.boxShadow;

            // 解析颜色值
            const extractedColors = this.parseThemeColors(borderColor, boxShadow);

            return { ...defaultColors, ...extractedColors };
        } catch (e) {
            console.warn('主题色彩提取失败，使用默认色彩:', e);
            return defaultColors;
        }
    }

    // 解析主题颜色
    parseThemeColors(borderColor, boxShadow) {
        const colors = {};

        try {
            // 从边框颜色提取主色调
            if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
                const rgba = this.parseRGBA(borderColor);
                if (rgba) {
                    colors.primary = this.rgbaToHex(rgba);
                    colors.secondary = this.lightenColor(colors.primary, 20);
                    colors.accent = this.darkenColor(colors.primary, 15);
                    colors.border = borderColor;

                    // 生成对应的背景和阴影色
                    colors.background = this.generateBackgroundColor(rgba);
                    colors.shadow = this.generateShadowColor(rgba);
                }
            }

            // 尝试从阴影中提取额外的颜色信息
            if (boxShadow && boxShadow !== 'none') {
                const shadowColors = this.extractColorsFromShadow(boxShadow);
                if (shadowColors.length > 0) {
                    // 使用阴影中的颜色来增强主题色彩
                    const shadowRgba = this.parseRGBA(shadowColors[0]);
                    if (shadowRgba && !colors.primary) {
                        colors.primary = this.rgbaToHex(shadowRgba);
                        colors.secondary = this.lightenColor(colors.primary, 20);
                        colors.accent = this.darkenColor(colors.primary, 15);
                    }
                }
            }

            // 检测是否为红色系主题（混沌主题）
            if (colors.primary && this.isRedTheme(colors.primary)) {
                colors.background = 'rgba(46, 26, 26, 0.9)';
                colors.shadow = 'rgba(184, 0, 0, 0.15)';
            }

        } catch (e) {
            console.warn('颜色解析失败:', e);
        }

        return colors;
    }

    // 从阴影字符串中提取颜色
    extractColorsFromShadow(shadowStr) {
        const colorRegex = /rgba?\([^)]+\)/g;
        return shadowStr.match(colorRegex) || [];
    }

    // 颜色处理辅助方法
    parseRGBA(colorStr) {
        const match = colorStr.match(/rgba?\(([^)]+)\)/);
        if (!match) return null;

        const values = match[1].split(',').map(v => parseFloat(v.trim()));
        return {
            r: values[0] || 0,
            g: values[1] || 0,
            b: values[2] || 0,
            a: values[3] !== undefined ? values[3] : 1
        };
    }

    rgbaToHex(rgba) {
        const toHex = (n) => {
            const hex = Math.round(n).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
    }

    lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
    }

    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return `#${(0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1)}`;
    }

    generateBackgroundColor(rgba) {
        // 基于主色调生成背景色
        const r = Math.max(26, Math.min(rgba.r * 0.3, 46));
        const g = Math.max(26, Math.min(rgba.g * 0.3, 46));
        const b = Math.max(26, Math.min(rgba.b * 0.3, 62));
        return `rgba(${r}, ${g}, ${b}, 0.9)`;
    }

    generateShadowColor(rgba) {
        // 基于主色调生成阴影色
        return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, 0.15)`;
    }

    isRedTheme(hex) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = num >> 16;
        const g = (num >> 8) & 0x00FF;
        const b = num & 0x0000FF;

        // 判断是否为红色系：红色分量明显大于绿色和蓝色
        return r > g + 50 && r > b + 50;
    }

    // 动态应用主题样式
    applyDynamicTheme(colors) {
        if (!this.container) return;

        // 移除旧的主题类
        this.container.classList.remove('theme-purple', 'theme-blood', 'theme-dynamic');

        // 添加动态主题类
        this.container.classList.add('theme-dynamic');

        // 生成动态CSS
        const dynamicCSS = this.generateDynamicCSS(colors);

        // 注入或更新动态样式
        this.injectDynamicStyles(dynamicCSS);
    }

    generateDynamicCSS(colors) {
        return `
            /* 动态主题样式 */
            .layout-inline-color-picker.theme-dynamic {
                background: linear-gradient(145deg, ${colors.background}, ${colors.background.replace('0.9', '0.8')});
                border: 1px solid ${colors.border};
                box-shadow:
                    0 8px 24px rgba(0, 0, 0, 0.4),
                    0 0 15px ${colors.shadow};
            }

            .layout-inline-color-picker.theme-dynamic::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, ${colors.border.replace('0.3', '0.7')}, transparent);
            }

            .theme-dynamic .inline-color-picker-header {
                border-bottom: 1px solid ${colors.border.replace('0.3', '0.2')};
                background: linear-gradient(135deg, ${colors.border.replace('0.3', '0.1')}, ${colors.shadow});
            }

            .theme-dynamic .section-label::before {
                content: '●';
                color: ${colors.border.replace('0.3', '0.7')};
                font-size: 6px;
            }

            .theme-dynamic .preset-colors-grid {
                background: linear-gradient(145deg, rgba(0, 0, 0, 0.2), ${colors.border.replace('0.3', '0.15')});
                border: 1px solid ${colors.border.replace('0.3', '0.15')};
            }

            .theme-dynamic .color-option.selected {
                border-color: ${colors.border.replace('0.3', '0.8')};
                box-shadow:
                    0 0 0 2px ${colors.shadow.replace('0.15', '0.4')},
                    0 3px 12px rgba(0, 0, 0, 0.4),
                    0 0 15px ${colors.shadow.replace('0.15', '0.3')};
                transform: scale(1.05);
            }

            .theme-dynamic .custom-color-row {
                background: linear-gradient(145deg, rgba(0, 0, 0, 0.2), ${colors.border.replace('0.3', '0.15')});
                border: 1px solid ${colors.border.replace('0.3', '0.15')};
            }

            .theme-dynamic .color-input {
                border: 1px solid ${colors.border.replace('0.3', '0.4')};
                background-color: ${colors.background.replace('0.9', '0.6')};
            }

            .theme-dynamic .color-hex-input {
                border: 1px solid ${colors.border.replace('0.3', '0.4')};
                background-color: ${colors.background.replace('0.9', '0.6')};
                color: #e1e1e1;
            }

            .theme-dynamic .apply-btn {
                background: linear-gradient(135deg, ${colors.primary}, ${colors.accent});
                border: 1px solid ${colors.border.replace('0.3', '0.6')};
                color: white;
            }

            .theme-dynamic .apply-btn:hover {
                background: linear-gradient(135deg, ${colors.accent}, ${colors.primary});
                box-shadow: 0 0 15px ${colors.shadow.replace('0.15', '0.4')};
            }

            .theme-dynamic .cancel-btn {
                background: rgba(60, 60, 60, 0.6);
                border: 1px solid ${colors.border.replace('0.3', '0.4')};
                color: #ccc;
            }

            .theme-dynamic .cancel-btn:hover {
                background: rgba(80, 80, 80, 0.8);
                border-color: ${colors.border.replace('0.3', '0.6')};
                color: white;
            }
        `;
    }

    injectDynamicStyles(css) {
        // 移除旧的动态样式
        const oldStyle = document.querySelector('#dynamic-color-picker-theme');
        if (oldStyle) {
            oldStyle.remove();
        }

        // 注入新的动态样式
        const style = document.createElement('style');
        style.id = 'dynamic-color-picker-theme';
        style.textContent = css;
        document.head.appendChild(style);
    }

    destroy() {
        // 移除动态样式
        const dynamicStyle = document.querySelector('#dynamic-color-picker-theme');
        if (dynamicStyle) {
            dynamicStyle.remove();
        }

        // 移除事件监听器和DOM元素
        if (this.container) {
            // 移除DOM元素（会自动清理事件监听器）
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
        style.textContent = `            /* ========== 智能布局内嵌颜色选择器基础样式 ========== */
            .layout-inline-color-picker {
                width: 100%;
                margin-top: 0px;
                border-radius: 10px;
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                position: relative;
            }

            /* ========== 头部样式 ========== */
            .inline-color-picker-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px 8px;
                border-radius: 10px 10px 0 0;
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


        `;
        
        document.head.appendChild(style);
    }
}
