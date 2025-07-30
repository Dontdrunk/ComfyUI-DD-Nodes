// ComfyUI Qwen-MT Core - 核心功能实现
import { api } from "/scripts/api.js";

export class QwenMTConfigManager {
    constructor() {
        this.currentConfig = null;
        this.dialog = null;
        this.overlay = null;
        this.injectStyles();
    }

    injectStyles() {
        if (!document.getElementById('qwen-mt-config-styles')) {
            const style = document.createElement('style');
            style.id = 'qwen-mt-config-styles';
            style.textContent = `
                .qwen-mt-config-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 9999;
                }

                .qwen-mt-config-dialog {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: var(--comfy-menu-bg);
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    padding: 20px;
                    min-width: 400px;
                    max-width: 500px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    color: var(--input-text);
                }

                .qwen-mt-config-header {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    text-align: center;
                    color: var(--input-text);
                }

                .qwen-mt-config-status {
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    text-align: center;
                    font-weight: bold;
                }

                .qwen-mt-config-status.configured {
                    background: rgba(76, 175, 80, 0.2);
                    border: 1px solid #4CAF50;
                    color: #4CAF50;
                }

                .qwen-mt-config-status.not-configured {
                    background: rgba(255, 193, 7, 0.2);
                    border: 1px solid #FFC107;
                    color: #FFC107;
                }

                .qwen-mt-config-section {
                    margin-bottom: 15px;
                }

                .qwen-mt-config-label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: var(--input-text);
                }

                .qwen-mt-config-input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--comfy-input-bg);
                    color: var(--input-text);
                    font-size: 14px;
                    box-sizing: border-box;
                }

                .qwen-mt-config-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 20px;
                }

                .qwen-mt-config-button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.2s;
                }

                .qwen-mt-config-button.primary {
                    background: var(--comfy-menu-bg);
                    color: var(--input-text);
                    border: 1px solid var(--border-color);
                }

                .qwen-mt-config-button.primary:hover {
                    background: var(--border-color);
                }

                .qwen-mt-config-button.secondary {
                    background: transparent;
                    color: var(--input-text);
                    border: 1px solid var(--border-color);
                }

                .qwen-mt-config-button.secondary:hover {
                    background: var(--border-color);
                }

                .qwen-mt-config-link {
                    display: block;
                    margin-top: 10px;
                    text-align: center;
                    color: #4a9eff;
                    text-decoration: none;
                    font-size: 14px;
                }

                .qwen-mt-config-link:hover {
                    text-decoration: underline;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async loadConfig() {
        try {
            const response = await api.fetchApi('/qwen_mt/config', { method: 'GET' });
            if (response.ok) {
                this.currentConfig = await response.json();
            } else {
                this.currentConfig = {
                    configured: false,
                    api_key_preview: "未配置",
                    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
                    console_url: "https://bailian.console.aliyun.com/?tab=home#/home"
                };
            }
        } catch (error) {
            console.error('Failed to load Qwen-MT config:', error);
            this.currentConfig = {
                configured: false,
                api_key_preview: "未配置",
                base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
                console_url: "https://bailian.console.aliyun.com/?tab=home#/home"
            };
        }
    }

    async saveConfig(apiKey) {
        try {
            const response = await api.fetchApi('/qwen_mt/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ api_key: apiKey })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.currentConfig = result;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to save Qwen-MT config:', error);
            return false;
        }
    }

    createDialog() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'qwen-mt-config-overlay';
        this.overlay.onclick = () => this.closeDialog();

        // Create dialog
        this.dialog = document.createElement('div');
        this.dialog.className = 'qwen-mt-config-dialog';
        this.dialog.onclick = (e) => e.stopPropagation();

        const header = document.createElement('div');
        header.className = 'qwen-mt-config-header';
        header.textContent = 'Qwen-MT API 配置';

        const statusDiv = document.createElement('div');
        statusDiv.className = `qwen-mt-config-status ${this.currentConfig.configured ? 'configured' : 'not-configured'}`;
        statusDiv.textContent = this.currentConfig.configured ? 
            `✓ 已配置 (${this.currentConfig.api_key_preview})` : 
            '⚠ 未配置 API 密钥';

        const section = document.createElement('div');
        section.className = 'qwen-mt-config-section';

        const label = document.createElement('label');
        label.className = 'qwen-mt-config-label';
        label.textContent = 'API 密钥:';

        const input = document.createElement('input');
        input.className = 'qwen-mt-config-input';
        input.type = 'password';
        input.placeholder = '请输入你的阿里云百炼 API 密钥 (sk-...)';
        input.id = 'qwen-mt-api-key-input';

        const link = document.createElement('a');
        link.className = 'qwen-mt-config-link';
        link.href = this.currentConfig.console_url;
        link.target = '_blank';
        link.textContent = '📎 获取 API 密钥 - 访问阿里云百炼控制台';

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'qwen-mt-config-buttons';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'qwen-mt-config-button primary';
        saveBtn.textContent = '保存配置';
        saveBtn.onclick = () => this.saveDialog();

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'qwen-mt-config-button secondary';
        cancelBtn.textContent = '取消';
        cancelBtn.onclick = () => this.closeDialog();

        buttonsDiv.appendChild(cancelBtn);
        buttonsDiv.appendChild(saveBtn);

        section.appendChild(label);
        section.appendChild(input);

        this.dialog.appendChild(header);
        this.dialog.appendChild(statusDiv);
        this.dialog.appendChild(section);
        this.dialog.appendChild(link);
        this.dialog.appendChild(buttonsDiv);

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.dialog);
    }

    async saveDialog() {
        const input = document.getElementById('qwen-mt-api-key-input');
        const apiKey = input.value.trim();

        if (!apiKey) {
            alert('请输入 API 密钥');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            alert('API 密钥格式不正确，应该以 sk- 开头');
            return;
        }

        const success = await this.saveConfig(apiKey);
        if (success) {
            alert('API 密钥配置成功！');
            this.closeDialog();
            // Refresh any existing Qwen-MT nodes
            if (window.app && window.app.graph) {
                window.app.graph._nodes.forEach(node => {
                    if (node.type === 'DD-QwenMTTranslator') {
                        node.setDirtyCanvas(true);
                    }
                });
            }
        } else {
            alert('配置保存失败，请检查网络连接或重试');
        }
    }

    closeDialog() {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
        }
        if (this.dialog) {
            document.body.removeChild(this.dialog);
            this.dialog = null;
        }
    }

    async showConfigDialog() {
        await this.loadConfig();
        this.createDialog();
    }
}
