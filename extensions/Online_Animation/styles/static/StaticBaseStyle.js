/**
 * 静态连线渲染样式基类
 * 所有静态连线样式类都应继承这个基类并实现相应方法
 */
export class StaticBaseStyle {
    /**
     * 构造函数
     * @param {Object} animationManager - 动画管理器引用
     */
    constructor(animationManager) {
        this.animationManager = animationManager;
    }

    /**
     * 计算连线路径点
     * @param {Object} outNode - 输出节点
     * @param {Object} inNode - 输入节点
     * @param {Array} outPos - 输出位置坐标 [x, y]
     * @param {Array} inPos - 输入位置坐标 [x, y]
     * @param {Object} link - 连线数据
     * @returns {Object} 包含路径点数组和类型的对象 { points: Array, type: String }
     */
    calculatePath(outNode, inNode, outPos, inPos, link) {
        throw new Error("子类必须实现calculatePath方法");
    }

    /**
     * 绘制静态连线
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
     * @param {Object} pathData - 路径数据对象
     */
    draw(ctx, pathData) {
        ctx.save();
        
        // 颜色（支持渐变）
        const strokeStyle = this.getPathColor(ctx, pathData);
        
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = this.animationManager.lineWidth;
        ctx.globalAlpha = 0.8; // 静态线稍微透明一些
        
        // 静态线不需要阴影效果，保持清爽
        
        ctx.beginPath();
        
        if (pathData.type === "bezier") {
            // 贝塞尔曲线
            const p = pathData.path;
            ctx.moveTo(p[0][0], p[0][1]);
            ctx.bezierCurveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]);
        } else {
            // 线段路径
            ctx.moveTo(pathData.path[0][0], pathData.path[0][1]);
            for (let i = 1; i < pathData.path.length; i++) {
                ctx.lineTo(pathData.path[i][0], pathData.path[i][1]);
            }
        }
        
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 获取路径颜色（支持渐变）
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
     * @param {Object} pathData - 路径数据对象
     * @returns {string|CanvasGradient} 颜色或渐变对象
     */
    getPathColor(ctx, pathData) {
        return this.animationManager.useGradient ? 
            this.animationManager._makeFancyGradient(ctx, pathData.from, pathData.to, pathData.baseColor) : 
            pathData.baseColor;
    }

    /**
     * 获取连线基础颜色
     * @param {Object} outNode - 输出节点
     * @param {Object} link - 连线数据
     * @returns {String} 连线颜色（十六进制颜色代码）
     */
    getBaseColor(outNode, link) {
        return (outNode.outputs && outNode.outputs[link.origin_slot] && outNode.outputs[link.origin_slot].color)
            || (this.animationManager.canvas.default_connection_color_byType && 
                outNode.outputs && 
                outNode.outputs[link.origin_slot] && 
                this.animationManager.canvas.default_connection_color_byType[outNode.outputs[link.origin_slot].type])
            || (this.animationManager.canvas.default_connection_color && 
                this.animationManager.canvas.default_connection_color.input_on)
            || "#999999"; // 静态线默认使用更柔和的灰色
    }
}
