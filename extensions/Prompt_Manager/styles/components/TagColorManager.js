// 标签颜色管理器 - 完全基于后端JSON文件同步，移除localStorage逻辑

export class TagColorManager {
    constructor() {
        this.colorMap = new Map(); // 标签名 -> 颜色映射
        this.usedColors = new Set(); // 已使用的颜色
        this.loadFromBackend(); // 启动时从后端加载
    }

    // 从后端API加载标签数据
    async loadFromBackend() {
        try {
            const response = await fetch('/dd_nodes/load_tags');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.tags) {
                    // 更新颜色映射
                    this.colorMap = new Map(Object.entries(result.tags));
                    this.usedColors = new Set(Object.values(result.tags));
                    
                    console.log(`从后端加载了 ${Object.keys(result.tags).length} 个标签颜色`);
                } else {
                    console.log('后端没有标签数据，使用空映射');
                }
            } else {
                console.warn('从后端加载标签失败，使用空映射');
            }
        } catch (error) {
            console.warn('从后端加载标签失败，使用空映射:', error);
        }
    }

    // 直接同步到后端，移除localStorage逻辑
    async saveToBackend() {
        try {
            const colorData = Object.fromEntries(this.colorMap);
            const response = await fetch('/dd_nodes/save_tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tags: colorData
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log('标签数据已同步到后端:', colorData);
                    return true;
                } else {
                    console.error('后端同步失败:', result.error);
                    return false;
                }
            } else {
                console.error('后端同步请求失败:', response.status);
                return false;
            }
        } catch (error) {
            console.error('同步标签到后端失败:', error);
            return false;
        }
    }

    // 获取标签颜色（只读取，不自动创建）
    getTagColor(tagName) {
        if (!tagName || typeof tagName !== 'string') {
            return '#666'; // 默认颜色
        }

        const normalizedTag = tagName.trim();
        
        // 如果标签存在，返回其颜色
        if (this.colorMap.has(normalizedTag)) {
            return this.colorMap.get(normalizedTag);
        }
        
        // 如果标签不存在，返回默认颜色，但不自动创建标签
        return '#666'; // 默认颜色，用于预览
    }
    
    // 获取或创建标签颜色（用于实际保存标签时）
    async getOrCreateTagColor(tagName) {
        if (!tagName || typeof tagName !== 'string') {
            return '#666'; // 默认颜色
        }

        const normalizedTag = tagName.trim();
        
        // 如果标签已存在，直接返回颜色
        if (this.colorMap.has(normalizedTag)) {
            return this.colorMap.get(normalizedTag);
        }
        
        // 标签不存在时，创建新颜色
        const newColor = this.generateUniqueColor();
        this.colorMap.set(normalizedTag, newColor);
        this.usedColors.add(newColor);
        
        console.log(`为新标签 "${normalizedTag}" 生成颜色: ${newColor}`);

        return newColor;
    }

    // 设置标签颜色（用于标签管理功能）
    setTagColor(tagName, color) {
        if (!tagName || typeof tagName !== 'string') return false;
        
        const normalizedTag = tagName.trim();
        const oldColor = this.colorMap.get(normalizedTag);
        
        console.log(`设置标签颜色: ${normalizedTag} -> ${color}`);
        
        // 移除旧颜色
        if (oldColor) {
            this.usedColors.delete(oldColor);
        }
        
        // 设置新颜色
        this.colorMap.set(normalizedTag, color);
        this.usedColors.add(color);
        
        return true; // 不立即同步，由调用方统一处理
    }

    // 获取标签的RGB值（用于CSS动画中的rgba()）
    getTagColorRGB(tagName) {
        const hslColor = this.getTagColor(tagName);
        return this.hslToRgb(hslColor);
    }

    // 将HSL颜色转换为RGB值字符串（如："255, 100, 50"）
    hslToRgb(hslString) {
        // 解析HSL字符串，如 "hsl(120, 75%, 50%)"
        const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return '102, 102, 102'; // 默认灰色的RGB
        
        const h = parseInt(match[1]) / 360;
        const s = parseInt(match[2]) / 100;
        const l = parseInt(match[3]) / 100;
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // 无饱和度时为灰色
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`;
    }

    // 生成唯一的随机颜色
    generateUniqueColor() {
        let attempts = 0;
        let color;
        
        do {
            color = this.generateRandomColor();
            attempts++;
        } while (this.usedColors.has(color) && attempts < 50);
        
        return color;
    }

    // 生成较明亮的随机颜色
    generateRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 65 + Math.floor(Math.random() * 25); // 65-90%
        const lightness = 45 + Math.floor(Math.random() * 15);  // 45-60%
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    // 获取所有标签颜色映射
    getAllColors() {
        return new Map(this.colorMap);
    }

    // 获取所有标签名称
    getAllTags() {
        const tags = Array.from(this.colorMap.keys()).sort();
        console.log('获取所有标签:', tags);
        return tags;
    }

    // 删除标签
    deleteTag(tagName) {
        if (!tagName || typeof tagName !== 'string') return false;
        
        const normalizedTag = tagName.trim();
        const color = this.colorMap.get(normalizedTag);
        
        console.log(`尝试删除标签: ${normalizedTag}，当前颜色映射:`, Object.fromEntries(this.colorMap));
        
        if (color) {
            this.colorMap.delete(normalizedTag);
            this.usedColors.delete(color);
            
            console.log(`标签 ${normalizedTag} 已删除，剩余标签:`, Object.fromEntries(this.colorMap));
            return true;
        }
        
        console.log(`标签 ${normalizedTag} 不存在，无法删除`);
        return false;
    }

    // 清除所有颜色映射
    async clear() {
        this.colorMap.clear();
        this.usedColors.clear();
        await this.saveToBackend();
    }

    // 更新颜色映射（从现有提示词中收集标签）
    updateFromPrompts(prompts) {
        if (!Array.isArray(prompts)) return;

        const allTags = new Set();
        
        prompts.forEach(prompt => {
            if (prompt.tags && Array.isArray(prompt.tags)) {
                prompt.tags.forEach(tag => {
                    if (tag && tag.trim()) {
                        allTags.add(tag.trim());
                    }
                });
            }
        });

        // 只为新发现的标签生成颜色
        for (const tag of allTags) {
            if (!this.colorMap.has(tag)) {
                this.getOrCreateTagColor(tag);
            }
        }
    }

    // 清理未使用的标签
    cleanupUnusedTags(prompts) {
        if (!Array.isArray(prompts)) return;

        const usedTags = new Set();
        
        // 收集所有正在使用的标签
        prompts.forEach(prompt => {
            if (prompt.tags && Array.isArray(prompt.tags)) {
                prompt.tags.forEach(tag => {
                    if (tag && tag.trim()) {
                        usedTags.add(tag.trim());
                    }
                });
            }
        });

        // 删除不再使用的标签
        const tagsToDelete = [];
        for (const [tagName] of this.colorMap) {
            if (!usedTags.has(tagName)) {
                tagsToDelete.push(tagName);
            }
        }

        tagsToDelete.forEach(tagName => {
            this.deleteTag(tagName);
        });

        if (tagsToDelete.length > 0) {
            console.log(`清理了 ${tagsToDelete.length} 个未使用的标签:`, tagsToDelete);
        }
    }
}

// 创建全局单例实例
export const globalTagColorManager = new TagColorManager();
