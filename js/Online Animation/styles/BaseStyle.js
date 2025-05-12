/**
 * 连线渲染样式基类
 * 所有具体渲染样式类都应继承这个基类并实现相应方法
 */
export class BaseStyle {
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
            || "#ff0000";
    }

    /**
     * 为样式创建渐变颜色
     * @param {Object} ctx - 画布上下文
     * @param {Array} from - 起始点坐标 [x, y]
     * @param {Array} to - 结束点坐标 [x, y]
     * @param {String} baseColor - 基础颜色
     * @returns {String|CanvasGradient} 颜色或渐变对象
     */
    createGradientColor(ctx, from, to, baseColor) {
        // 如果动画管理器存在并启用了渐变，使用其渐变生成逻辑
        if (this.animationManager && 
            this.animationManager.useGradient && 
            this.animationManager._makeFancyGradient) {
            return this.animationManager._makeFancyGradient(ctx, from, to, baseColor);
        }
        return baseColor; // 默认返回基础颜色
    }

    /**
     * 初始化样式（可选，用于需要特殊初始化的样式）
     */
    init() {
        // 默认不做任何操作
    }

    /**
     * 清理样式资源（可选，用于需要释放资源的样式）
     */
    cleanup() {
        // 默认不做任何操作
    }
}
