// 主模态框组件 - 负责整体模态框结构和基础样式

export class MainModal {
    constructor(title = '嵌入提示词管理') {
        this.title = title;
        this.modal = null;
        this.isVisible = false;
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'prompt-embedder-modal';
        this.modal.innerHTML = `
            <div class="prompt-embedder-overlay">
                <div class="prompt-embedder-container">
                    <div class="prompt-embedder-header">
                        <h3>${this.title}</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="prompt-embedder-content">
                        <!-- 内容将由其他组件填充 -->
                    </div>
                </div>
            </div>
        `;
        
        // 添加基础样式
        this.addStyles();
        
        // 隐藏模态框
        this.modal.style.display = 'none';
        document.body.appendChild(this.modal);
    }    bindEvents() {
        // 关闭按钮事件
        const closeBtn = this.modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.hide());

        // 移除点击遮罩层关闭功能，防止误点击
        // const overlay = this.modal.querySelector('.prompt-embedder-overlay');
        // overlay.addEventListener('click', (e) => {
        //     if (e.target === overlay) {
        //         this.hide();
        //     }
        // });

        // ESC键关闭（保留快捷键）
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    show() {
        this.modal.style.display = 'block';
        this.isVisible = true;
        
        // 添加显示动画
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });
    }

    hide() {
        this.modal.classList.remove('show');
        this.isVisible = false;
        
        // 等待动画完成后隐藏
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    getContentContainer() {
        return this.modal.querySelector('.prompt-embedder-content');
    }

    setTitle(title) {
        this.title = title;
        const titleElement = this.modal.querySelector('.prompt-embedder-header h3');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .prompt-embedder-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }

            .prompt-embedder-modal.show {
                opacity: 1;
                visibility: visible;
            }            .prompt-embedder-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(8px);
                padding: 20px;
                box-sizing: border-box;
                overflow-y: auto;
            }            .prompt-embedder-container {
                background: linear-gradient(145deg, #2d2d30, #252528);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                width: 100%;
                max-width: 1200px;
                max-height: calc(100vh - 40px);
                box-shadow: 
                    0 32px 64px rgba(0, 0, 0, 0.4),
                    0 16px 32px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transform: scale(0.95) translateY(20px);
                transition: all 0.4s ease-out;
                position: relative;
                margin: auto;
                box-sizing: border-box;
            }.prompt-embedder-modal.show .prompt-embedder-container {
                transform: scale(1) translateY(0);
            }

            .prompt-embedder-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px 32px 20px;
                background: linear-gradient(135deg, #3a3a3d, #2d2d30);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
                z-index: 2;
            }

            .prompt-embedder-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            }            .prompt-embedder-header h3 {
                color: #ffffff;
                font-size: 20px;
                font-weight: 600;
                margin: 0;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                letter-spacing: 0.5px;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 28px;
                color: #888;
                cursor: pointer;
                padding: 8px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: all 0.3s ease-out;
                position: relative;
                overflow: hidden;
            }

            .close-btn::before {
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

            .close-btn:hover {
                color: #fff;
                transform: scale(1.1);
            }

            .close-btn:hover::before {
                width: 100%;
                height: 100%;
            }

            .close-btn:active {
                transform: scale(0.95);
            }            .prompt-embedder-content {
                flex: 1;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                background: #1e1e1e;
                position: relative;
            }

            .prompt-embedder-content::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                z-index: 1;
            }
        `;
        
        if (!document.head.querySelector('style[data-component="main-modal"]')) {
            style.setAttribute('data-component', 'main-modal');
            document.head.appendChild(style);
        }
    }

    destroy() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        
        // 移除样式
        const style = document.head.querySelector('style[data-component="main-modal"]');
        if (style) {
            style.remove();
        }
    }
}
