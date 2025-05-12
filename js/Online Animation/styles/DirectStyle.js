import { BaseStyle } from './BaseStyle.js';

/**
 * 直线渲染样式
 * 简单的从输出点到输入点的直线连接
 */
export class DirectStyle extends BaseStyle {
    constructor(animationManager) {
        super(animationManager);
    }

    /**
     * 计算直线连接路径
     * @param {Object} outNode - 输出节点
     * @param {Object} inNode - 输入节点
     * @param {Array} outPos - 输出位置坐标 [x, y]
     * @param {Array} inPos - 输入位置坐标 [x, y]
     * @param {Object} link - 连线数据
     * @returns {Object} 路径信息 { points: Array, type: String }
     */
    calculatePath(outNode, inNode, outPos, inPos, link) {
        // 直线：只需要起点和终点
        const pathPoints = [outPos, inPos];
        
        return {
            points: pathPoints,
            type: "direct"
        };
    }
}
