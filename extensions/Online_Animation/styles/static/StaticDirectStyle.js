import { StaticBaseStyle } from './StaticBaseStyle.js';

/**
 * 静态直线渲染样式
 * 两点间直接连接，与动画直线保持一致的路径
 */
export class StaticDirectStyle extends StaticBaseStyle {
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
    calculatePath(_outNode, _inNode, outPos, inPos, _link) {
        // 直线：直接连接两点
        const pathPoints = [outPos, inPos];
        
        return {
            points: pathPoints,
            type: "direct"
        };
    }
}
