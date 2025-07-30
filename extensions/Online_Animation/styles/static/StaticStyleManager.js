import { StaticDirectStyle } from './StaticDirectStyle.js';
import { StaticAngledStyle } from './StaticAngledStyle.js';
import { StaticCurveStyle } from './StaticCurveStyle.js';
import { StaticCircuitBoard1Style } from './StaticCircuitBoard1Style.js';
import { StaticCircuitBoard2Style } from './StaticCircuitBoard2Style.js';

/**
 * 静态连线渲染样式管理器
 * 负责创建、管理和切换不同的静态连线渲染样式
 */
export class StaticStyleManager {
    /**
     * 构造函数
     * @param {Object} animationManager - 动画管理器引用 
     */
    constructor(animationManager) {
        this.animationManager = animationManager;
        
        // 静态样式名称映射
        this.styleMap = {
            "直线": StaticDirectStyle,
            "直角线": StaticAngledStyle,
            "曲线": StaticCurveStyle,
            "电路板1": StaticCircuitBoard1Style,
            "电路板2": StaticCircuitBoard2Style
        };
        
        // 当前样式实例
        this.currentStyle = null;
        this.currentStyleName = null;
    }

    /**
     * 设置静态渲染样式
     * @param {string} styleName - 样式名称
     */
    setStyle(styleName) {
        if (styleName === this.currentStyleName) {
            return; // 样式未改变
        }

        // 清理之前的样式实例
        if (this.currentStyle && this.currentStyle.cleanup) {
            try {
                this.currentStyle.cleanup();
            } catch (err) {
                console.error("清理静态样式时出错:", err);
            }
        }

        // 创建新的样式实例
        if (this.styleMap[styleName]) {
            try {
                const StyleClass = this.styleMap[styleName];
                this.currentStyle = new StyleClass(this.animationManager);
                this.currentStyleName = styleName;
                
                // 如果样式有初始化方法，调用它
                if (this.currentStyle.init) {
                    this.currentStyle.init();
                }
            } catch (err) {
                console.error(`创建静态样式实例时出错: ${styleName}`, err);
                this.currentStyle = null;
                this.currentStyleName = null;
            }
        } else {
            console.warn(`未知的静态样式: ${styleName}`);
            this.currentStyle = null;
            this.currentStyleName = null;
        }
    }

    /**
     * 获取当前样式实例
     * @returns {StaticBaseStyle|null} 当前样式实例
     */
    getCurrentStyle() {
        return this.currentStyle;
    }

    /**
     * 计算连线路径
     * @param {Object} outNode - 输出节点
     * @param {Object} inNode - 输入节点
     * @param {Array} outPos - 输出位置坐标
     * @param {Array} inPos - 输入位置坐标
     * @param {Object} link - 连线数据
     * @returns {Object|null} 路径数据对象
     */
    calculatePath(outNode, inNode, outPos, inPos, link) {
        if (!this.currentStyle) {
            return null;
        }

        try {
            return this.currentStyle.calculatePath(outNode, inNode, outPos, inPos, link);
        } catch (err) {
            console.error("计算静态连线路径时出错:", err);
            return null;
        }
    }

    /**
     * 绘制静态连线
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {Object} pathData - 路径数据
     */
    draw(ctx, pathData) {
        if (!this.currentStyle || !pathData) {
            return;
        }

        try {
            this.currentStyle.draw(ctx, pathData);
        } catch (err) {
            console.error("绘制静态连线时出错:", err);
        }
    }

    /**
     * 获取支持的样式列表
     * @returns {Array<string>} 支持的样式名称数组
     */
    getSupportedStyles() {
        return Object.keys(this.styleMap);
    }

    /**
     * 检查样式是否支持
     * @param {string} styleName - 样式名称
     * @returns {boolean} 是否支持该样式
     */
    isStyleSupported(styleName) {
        return this.styleMap.hasOwnProperty(styleName);
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.currentStyle && this.currentStyle.cleanup) {
            try {
                this.currentStyle.cleanup();
            } catch (err) {
                console.error("清理静态样式管理器时出错:", err);
            }
        }
        this.currentStyle = null;
        this.currentStyleName = null;
    }
}
