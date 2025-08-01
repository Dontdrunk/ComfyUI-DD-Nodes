import { StaticBaseStyle } from './StaticBaseStyle.js';

/**
 * 静态直角线渲染样式
 * L型连接，与动画直角线保持一致的路径
 */
export class StaticAngledStyle extends StaticBaseStyle {
    constructor(animationManager) {
        super(animationManager);
    }

    /**
     * 计算直角线连接路径 (基于ComfyUI官方STRAIGHT_LINK算法)
     * @param {Object} outNode - 输出节点
     * @param {Object} inNode - 输入节点
     * @param {Array} outPos - 输出位置坐标 [x, y]
     * @param {Array} inPos - 输入位置坐标 [x, y]
     * @param {Object} link - 连线数据
     * @returns {Object} 路径信息 { points: Array, type: String }
     */
    calculatePath(outNode, inNode, outPos, inPos, link) {
        // 使用ComfyUI官方的STRAIGHT_LINK算法
        // 控制点延伸长度为10像素
        const l = 10;
        
        // 计算控制点 (官方默认：输出向右，输入向左)
        const innerA = [outPos[0] + l, outPos[1]];  // RIGHT方向
        const innerB = [inPos[0] - l, inPos[1]];    // LEFT方向
        
        // 计算中点X坐标
        const midX = (innerA[0] + innerB[0]) * 0.5;
        
        // 构建官方6点路径：起点 -> 控制点1 -> 中点水平 -> 中点垂直 -> 控制点2 -> 终点
        const pathPoints = [
            outPos,                    // 起点
            innerA,                    // 控制点1 (向右延伸)  
            [midX, innerA[1]],        // 中点水平线
            [midX, innerB[1]],        // 中点垂直线
            innerB,                    // 控制点2 (向左延伸)
            inPos                      // 终点
        ];
        
        return {
            points: pathPoints,
            type: "angled"
        };
    }
}
