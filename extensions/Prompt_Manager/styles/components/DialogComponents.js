// 对话框组件 - 负责各种确认对话框和选择器

export class DialogComponents {
    constructor() {
        this.addStyles();
    }

    // 删除确认对话框
    showDeleteConfirm(promptName, onConfirm) {
        return new Promise((resolve) => {
            const modal = this.createModal('delete-confirm-modal');
            modal.innerHTML = `
                <div class="dialog-overlay">
                    <div class="dialog-container delete-confirm">
                        <div class="dialog-header">
                            <h4>⚠️ 确认删除</h4>
                            <button class="dialog-close-btn">&times;</button>
                        </div>
                        <div class="dialog-content">
                            <p>确定要删除提示词 "<strong>${this.escapeHtml(promptName)}</strong>" 吗？</p>
                            <p class="warning-text">此操作不可撤销！</p>
                            <div class="dialog-actions">
                                <button class="btn-danger delete-confirm-btn">确定删除</button>
                                <button class="btn-secondary delete-cancel-btn">取消</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.bindDialogEvents(modal, {
                '.delete-confirm-btn': () => {
                    if (onConfirm) onConfirm();
                    resolve(true);
                    this.closeModal(modal);
                },
                '.delete-cancel-btn': () => {
                    resolve(false);
                    this.closeModal(modal);
                }
            });

            this.showModal(modal);
        });
    }    // 插入模式选择对话框
    showInsertModeDialog(title = '选择插入模式', message = '检测到输入框中已有内容，请选择插入模式：') {
        return new Promise((resolve) => {
            let resolved = false; // 防止多次resolve
            
            const modal = this.createModal('insert-mode-modal');
            modal.innerHTML = `
                <div class="dialog-overlay">
                    <div class="dialog-container insert-mode">
                        <div class="dialog-header">
                            <h4>${title}</h4>
                            <button class="dialog-close-btn">&times;</button>
                        </div>
                        <div class="dialog-content">
                            <p>${message}</p>
                            <div class="option-cards">
                                <div class="option-card" data-action="insert">
                                    <div class="option-icon">📝</div>
                                    <div class="option-title">插入模式</div>
                                    <div class="option-description">在光标位置或文本开头插入提示词</div>
                                </div>
                                <div class="option-card" data-action="append">
                                    <div class="option-icon">➕</div>
                                    <div class="option-title">追加模式</div>
                                    <div class="option-description">在现有内容后面添加提示词</div>
                                </div>
                                <div class="option-card" data-action="replace">
                                    <div class="option-icon">🔄</div>
                                    <div class="option-title">替换模式</div>
                                    <div class="option-description">删除原有内容，使用新提示词替换</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const resolveOnce = (value) => {
                if (!resolved) {
                    resolved = true;
                    this.closeModal(modal);
                    resolve(value);
                }
            };

            this.bindDialogEvents(modal, {
                '.option-card': (e) => {
                    const action = e.currentTarget.getAttribute('data-action');
                    console.log('插入模式选择:', action); // 调试信息
                    resolveOnce(action);
                },
                '.dialog-close-btn': () => {
                    console.log('对话框关闭按钮点击'); // 调试信息
                    resolveOnce(null);
                }
            });

            this.showModal(modal);
        });
    }

    // 文本组件选择器对话框
    showWidgetSelector(widgets, getDisplayName) {
        return new Promise((resolve) => {
            if (!Array.isArray(widgets) || widgets.length <= 1) {
                resolve(widgets[0] || null);
                return;
            }

            const modal = this.createModal('widget-selector-modal');
            modal.innerHTML = `
                <div class="dialog-overlay">
                    <div class="dialog-container widget-selector">
                        <div class="dialog-header">
                            <h4>🎯 选择文本输入框</h4>
                            <button class="dialog-close-btn">&times;</button>
                        </div>
                        <div class="dialog-content">
                            <p>该节点有多个文本输入框，请选择要应用提示词的输入框：</p>
                            <div class="widget-list">
                                ${widgets.map((widget, index) => `
                                    <button class="widget-option" data-index="${index}">
                                        <div class="widget-info">
                                            <div class="widget-name">${getDisplayName ? getDisplayName(widget) : `输入框 ${index + 1}`}</div>
                                            <div class="widget-preview">${widget.value ? this.truncateText(widget.value, 50) : '(空)'}</div>
                                        </div>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.bindDialogEvents(modal, {
                '.widget-option': (e) => {
                    const index = parseInt(e.currentTarget.getAttribute('data-index'));
                    resolve(widgets[index]);
                    this.closeModal(modal);
                }
            });

            this.showModal(modal);
        });
    }

    // 导入文件选择对话框
    showFileImportDialog(accept = '.json') {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.style.display = 'none';
            
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                resolve(file);
                document.body.removeChild(input);
            });

            input.addEventListener('cancel', () => {
                resolve(null);
                document.body.removeChild(input);
            });

            document.body.appendChild(input);
            input.click();
        });
    }

    // 成功提示对话框
    showSuccessDialog(title, message, autoClose = 3000) {
        return new Promise((resolve) => {
            const modal = this.createModal('success-dialog-modal');
            modal.innerHTML = `
                <div class="dialog-overlay">
                    <div class="dialog-container success-dialog">
                        <div class="dialog-header success">
                            <h4>✅ ${title}</h4>
                            <button class="dialog-close-btn">&times;</button>
                        </div>
                        <div class="dialog-content">
                            <p>${message}</p>
                            ${autoClose ? `<div class="auto-close-indicator">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="animation-duration: ${autoClose}ms;"></div>
                                </div>
                                <small>对话框将在 ${Math.ceil(autoClose / 1000)} 秒后自动关闭</small>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
            `;

            this.bindDialogEvents(modal, {
                '.dialog-close-btn': () => {
                    resolve();
                    this.closeModal(modal);
                }
            });

            this.showModal(modal);

            // 自动关闭
            if (autoClose) {
                setTimeout(() => {
                    resolve();
                    this.closeModal(modal);
                }, autoClose);
            }
        });
    }

    // 错误提示对话框
    showErrorDialog(title, message) {
        return new Promise((resolve) => {
            const modal = this.createModal('error-dialog-modal');
            modal.innerHTML = `
                <div class="dialog-overlay">
                    <div class="dialog-container error-dialog">
                        <div class="dialog-header error">
                            <h4>❌ ${title}</h4>
                            <button class="dialog-close-btn">&times;</button>
                        </div>
                        <div class="dialog-content">
                            <p>${message}</p>
                            <div class="dialog-actions">
                                <button class="btn-primary error-ok-btn">确定</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.bindDialogEvents(modal, {
                '.error-ok-btn': () => {
                    resolve();
                    this.closeModal(modal);
                }
            });

            this.showModal(modal);
        });
    }

    // 通用确认对话框
    showConfirmDialog(title, message, confirmText = '确定', cancelText = '取消') {
        return new Promise((resolve) => {
            const modal = this.createModal('confirm-dialog-modal');
            modal.innerHTML = `
                <div class="dialog-overlay">
                    <div class="dialog-container confirm-dialog">
                        <div class="dialog-header">
                            <h4>${title}</h4>
                            <button class="dialog-close-btn">&times;</button>
                        </div>
                        <div class="dialog-content">
                            <p>${message}</p>
                            <div class="dialog-actions">
                                <button class="btn-primary confirm-ok-btn">${confirmText}</button>
                                <button class="btn-secondary confirm-cancel-btn">${cancelText}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.bindDialogEvents(modal, {
                '.confirm-ok-btn': () => {
                    resolve(true);
                    this.closeModal(modal);
                },
                '.confirm-cancel-btn': () => {
                    resolve(false);
                    this.closeModal(modal);
                }
            });

            this.showModal(modal);
        });
    }

    // 工具方法
    createModal(className) {
        // 移除已存在的相同类型对话框
        const existing = document.querySelector(`.${className}`);
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.className = className;
        return modal;
    }

    showModal(modal) {
        document.body.appendChild(modal);
        // 添加显示动画
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
    }

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }    bindDialogEvents(modal, eventMap) {
        // 绑定自定义事件
        Object.entries(eventMap).forEach(([selector, handler]) => {
            const elements = modal.querySelectorAll(selector);
            elements.forEach(element => {
                element.addEventListener('click', handler);
            });
        });

        // 只有在没有自定义关闭按钮处理时才绑定通用关闭事件
        if (!eventMap['.dialog-close-btn']) {
            const closeBtn = modal.querySelector('.dialog-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal(modal));
            }
        }       
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                // 如果有自定义关闭处理，使用它；否则直接关闭
                if (eventMap['.dialog-close-btn']) {
                    eventMap['.dialog-close-btn']();
                } else {
                    this.closeModal(modal);
                }
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 通用对话框样式 */
            .delete-confirm-modal,
            .insert-mode-modal,
            .widget-selector-modal,
            .success-dialog-modal,
            .error-dialog-modal,
            .confirm-dialog-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 20000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }

            .delete-confirm-modal.show,
            .insert-mode-modal.show,
            .widget-selector-modal.show,
            .success-dialog-modal.show,
            .error-dialog-modal.show,
            .confirm-dialog-modal.show {
                opacity: 1;
                visibility: visible;
            }

            .dialog-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(2px);
            }

            .dialog-container {
                background: #2b2b2b;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }

            .delete-confirm-modal.show .dialog-container,
            .insert-mode-modal.show .dialog-container,
            .widget-selector-modal.show .dialog-container,
            .success-dialog-modal.show .dialog-container,
            .error-dialog-modal.show .dialog-container,
            .confirm-dialog-modal.show .dialog-container {
                transform: scale(1);
            }

            .dialog-header {
                padding: 20px 24px;
                border-bottom: 1px solid #404040;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #3a3a3a 0%, #2b2b2b 100%);
            }

            .dialog-header.success {
                background: linear-gradient(135deg, #43cf7c 0%, #38b86a 100%);
            }

            .dialog-header.error {
                background: linear-gradient(135deg, #ff5733 0%, #e04929 100%);
            }

            .dialog-header h4 {
                margin: 0;
                color: #ffffff;
                font-size: 16px;
                font-weight: 600;
            }

            .dialog-close-btn {
                background: none;
                border: none;
                color: #fff;
                font-size: 20px;
                cursor: pointer;
                padding: 4px;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                transition: all 0.2s ease;
            }

            .dialog-close-btn:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }

            .dialog-content {
                padding: 24px;
                color: #e0e0e0;
                line-height: 1.6;
            }

            .dialog-content p {
                margin: 0 0 16px 0;
            }

            .warning-text {
                color: #ff8c42;
                font-weight: 500;
                font-size: 14px;
            }

            .dialog-actions {
                display: flex;
                gap: 12px;
                margin-top: 20px;
            }

            .btn-primary,
            .btn-secondary,
            .btn-danger {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                flex: 1;
            }

            .btn-primary {
                background: #2a82e4;
                color: white;
            }

            .btn-primary:hover {
                background: #1c6bb7;
                transform: translateY(-1px);
            }

            .btn-secondary {
                background: #6c757d;
                color: white;
            }

            .btn-secondary:hover {
                background: #5a6268;
                transform: translateY(-1px);
            }

            .btn-danger {
                background: #ff5733;
                color: white;
            }

            .btn-danger:hover {
                background: #e04929;
                transform: translateY(-1px);
            }

            /* 选项卡片样式 */
            .option-cards {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 16px;
            }

            .option-card {
                background: #1a1a1a;
                border: 2px solid #404040;
                border-radius: 8px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .option-card:hover {
                border-color: #2a82e4;
                background: #262626;
                transform: translateY(-2px);
            }

            .option-icon {
                font-size: 24px;
                flex-shrink: 0;
            }

            .option-title {
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 4px;
            }

            .option-description {
                font-size: 13px;
                color: #888;
                line-height: 1.4;
            }

            /* 组件选择器样式 */
            .widget-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 16px;
            }

            .widget-option {
                background: #1a1a1a;
                border: 2px solid #404040;
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
                color: #e0e0e0;
            }

            .widget-option:hover {
                border-color: #2a82e4;
                background: #262626;
            }

            .widget-info {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .widget-name {
                font-weight: 500;
                color: #ffffff;
            }

            .widget-preview {
                font-size: 12px;
                color: #888;
                font-family: monospace;
            }

            /* 自动关闭指示器 */
            .auto-close-indicator {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid #404040;
            }

            .progress-bar {
                width: 100%;
                height: 3px;
                background: #404040;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 8px;
            }

            .progress-fill {
                height: 100%;
                background: #43cf7c;
                width: 100%;
                animation: shrink linear forwards;
                transform-origin: right;
            }

            @keyframes shrink {
                from {
                    transform: scaleX(1);
                }
                to {
                    transform: scaleX(0);
                }
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .dialog-container {
                    margin: 20px;
                    max-width: none;
                    width: calc(100% - 40px);
                }

                .dialog-content {
                    padding: 16px;
                }

                .option-cards {
                    gap: 8px;
                }

                .option-card {
                    padding: 12px;
                    flex-direction: column;
                    text-align: center;
                    gap: 8px;
                }

                .dialog-actions {
                    flex-direction: column;
                }
            }
        `;
        
        if (!document.head.querySelector('style[data-component="dialog-components"]')) {
            style.setAttribute('data-component', 'dialog-components');
            document.head.appendChild(style);
        }
    }

    destroy() {
        // 移除所有对话框
        const dialogs = document.querySelectorAll(`
            .delete-confirm-modal,
            .insert-mode-modal,
            .widget-selector-modal,
            .success-dialog-modal,
            .error-dialog-modal,
            .confirm-dialog-modal
        `);
        
        dialogs.forEach(dialog => {
            if (dialog.parentNode) {
                dialog.parentNode.removeChild(dialog);
            }
        });
        
        // 移除样式
        const style = document.head.querySelector('style[data-component="dialog-components"]');
        if (style) {
            style.remove();
        }
    }
}
