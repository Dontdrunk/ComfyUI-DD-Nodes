import { StaticBaseStyle } from './StaticBaseStyle.js';

/**
 * 静态曲线渲染样式
 * 使用贝塞尔曲线连接点，与动画曲线保持一致的路径
 */
export class StaticCurveStyle extends StaticBaseStyle {
    constructor(animationManager) {
        super(animationManager);
    }

    /**
     * 计算贝塞尔曲线连接路径 (基于ComfyUI官方SPLINE_LINK算法)
     * @param {Object} outNode - 输出节点
     * @param {Object} inNode - 输入节点
     * @param {Array} outPos - 输出位置坐标 [x, y]
     * @param {Array} inPos - 输入位置坐标 [x, y]
     * @param {Object} link - 连线数据
     * @returns {Object} 路径信息 { points: Array, type: String }
     */
    calculatePath(_outNode, _inNode, outPos, inPos, _link) {
        // 使用ComfyUI官方的SPLINE_LINK算法
        // 计算实际距离 (官方使用欧几里得距离)
        const dx = inPos[0] - outPos[0];
        const dy = inPos[1] - outPos[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 使用官方的0.25因子计算控制点偏移
        const offset = Math.max(dist * 0.25, 40);
        
        // 计算贝塞尔控制点
        const cp1 = [outPos[0] + offset, outPos[1]];
        const cp2 = [inPos[0] - offset, inPos[1]];
        const pathPoints = [outPos, cp1, cp2, inPos];
        
        return {
            points: pathPoints,
            type: "bezier"
        };
    }
}
