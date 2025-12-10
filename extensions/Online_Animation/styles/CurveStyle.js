import { BaseStyle } from './BaseStyle.js';

/**
 * 曲线渲染样式
 * 使用贝塞尔曲线连接点
 */
export class CurveStyle extends BaseStyle {
    constructor(animationManager) {
        super(animationManager);
    }

    /**
     * 计算贝塞尔曲线连接路径 (基于ComfyUI官方算法)
     * @param {Object} outNode - 输出节点
     * @param {Object} inNode - 输入节点
     * @param {Array} outPos - 输出位置坐标 [x, y]
     * @param {Array} inPos - 输入位置坐标 [x, y]
     * @param {Object} link - 连线数据
     * @returns {Object} 路径信息 { points: Array, type: String }
     */
    calculatePath(_outNode, _inNode, outPos, inPos, _link) {
        // 使用ComfyUI官方的SPLINE_LINK算法
        // 1. 计算两点间的直线距离
        const dx = inPos[0] - outPos[0];
        const dy = inPos[1] - outPos[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 2. 根据官方#addSplineOffset方法计算控制点
        // 默认方向：输出为RIGHT，输入为LEFT
        // 控制点偏移系数为0.25
        const factor = 0.25;
        const cp1 = [outPos[0] + dist * factor, outPos[1]];  // RIGHT方向
        const cp2 = [inPos[0] - dist * factor, inPos[1]];    // LEFT方向
        
        const pathPoints = [outPos, cp1, cp2, inPos];
        
        return {
            points: pathPoints,
            type: "bezier"
        };
    }
}
