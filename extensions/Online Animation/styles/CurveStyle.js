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
     * 计算贝塞尔曲线连接路径
     * @param {Object} outNode - 输出节点
     * @param {Object} inNode - 输入节点
     * @param {Array} outPos - 输出位置坐标 [x, y]
     * @param {Array} inPos - 输入位置坐标 [x, y]
     * @param {Object} link - 连线数据
     * @returns {Object} 路径信息 { points: Array, type: String }
     */
    calculatePath(outNode, inNode, outPos, inPos, link) {
        // 曲线：贝塞尔曲线控制点
        const dist = Math.max(Math.abs(inPos[0] - outPos[0]), 40);
        const cp1 = [outPos[0] + dist * 0.5, outPos[1]];
        const cp2 = [inPos[0] - dist * 0.5, inPos[1]];
        const pathPoints = [outPos, cp1, cp2, inPos];
        
        return {
            points: pathPoints,
            type: "bezier"
        };
    }
}
