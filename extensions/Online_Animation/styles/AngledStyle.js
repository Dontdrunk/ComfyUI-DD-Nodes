import { BaseStyle } from './BaseStyle.js';

/**
 * 直角线渲染样式
 * 形成精确的90度拐角连接
 */
export class AngledStyle extends BaseStyle {
    constructor(animationManager) {
        super(animationManager);
    }

    /**
     * 计算直角线连接路径
     * @param {Object} outNode - 输出节点
     * @param {Object} inNode - 输入节点
     * @param {Array} outPos - 输出位置坐标 [x, y]
     * @param {Array} inPos - 输入位置坐标 [x, y]
     * @param {Object} link - 连线数据
     * @returns {Object} 路径信息 { points: Array, type: String }
     */
    calculatePath(outNode, inNode, outPos, inPos, link) {
        // 确保精确的90°角，增加计算逻辑以选择最佳路径
        const horzDistance = Math.abs(inPos[0] - outPos[0]);
        const vertDistance = Math.abs(inPos[1] - outPos[1]);
        
        let pathPoints;
        if (horzDistance > vertDistance) {
            // 先水平后垂直
            // 使用三个点而不是两个转折点，确保完全的直角
            const midX = inPos[0];
            const midY = outPos[1];
            pathPoints = [
                outPos,              // 起点
                [midX, outPos[1]],   // 水平线终点
                [midX, midY],        // 转角点（确保精确90度）
                [midX, inPos[1]],    // 垂直线起点
                inPos                // 终点
            ];
        } else {
            // 先垂直后水平
            // 使用三个点而不是两个转折点，确保完全的直角
            const midX = outPos[0];
            const midY = inPos[1];
            pathPoints = [
                outPos,              // 起点
                [outPos[0], midY],   // 垂直线终点
                [midX, midY],        // 转角点（确保精确90度）
                [inPos[0], midY],    // 水平线起点
                inPos                // 终点
            ];
        }
        
        return {
            points: pathPoints,
            type: "angled"
        };
    }
}
