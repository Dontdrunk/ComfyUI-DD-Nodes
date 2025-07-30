import { StaticBaseStyle } from './StaticBaseStyle.js';

/**
 * 静态电路板1样式
 * 实现经典L型/折线连接路径，与动画版本保持一致
 */
export class StaticCircuitBoard1Style extends StaticBaseStyle {
    constructor(animationManager) {
        super(animationManager);
        this.paths = [];
    }

    /**
     * 初始化样式
     */
    init() {
        // 电路板1不需要复杂的初始化
    }

    /**
     * 计算L型连接路径 - 与动画版本完全一致
     * @param {Object} outNode - 输出节点
     * @param {Object} inNode - 输入节点
     * @param {Array} outPos - 输出位置坐标 [x, y]
     * @param {Array} inPos - 输入位置坐标 [x, y]
     * @param {Object} link - 连线数据
     * @returns {Object} 路径信息 { points: Array, type: String }
     */
    calculatePath(outNode, inNode, outPos, inPos, link) {
        const pathPoints = this._calculateSimplePath(outPos, inPos);
        
        return {
            points: pathPoints,
            type: "angled"
        };
    }

    /**
     * 获取所有路径 - 批量计算所有连线路径
     * @returns {Array} 路径数据数组
     */
    getAllPaths() {
        this.paths = [];
        
        if (!this.animationManager.canvas?.graph?.links) {
            return this.paths;
        }

        // 处理所有连线
        Object.values(this.animationManager.canvas.graph.links).forEach(link => {
            const outNode = this.animationManager.canvas.graph.getNodeById(link.origin_id);
            const inNode = this.animationManager.canvas.graph.getNodeById(link.target_id);
            if (!outNode || !inNode) return;
            
            const outPos = outNode.getConnectionPos(false, link.origin_slot);
            const inPos = inNode.getConnectionPos(true, link.target_slot);
            
            // 计算L型路径
            const pathPoints = this._calculateSimplePath(outPos, inPos);
            
            // 获取连线颜色
            const baseColor = this.getBaseColor(outNode, link);
            
            // 保存路径信息
            this.paths.push({
                path: pathPoints,
                from: outPos,
                to: inPos,
                baseColor: baseColor,
                type: "angled",
                link: link
            });
        });
        
        return this.paths;
    }

    /**
     * 计算简单L型路径 - 与CircuitBoard1Style的逻辑完全一致
     * @param {Array} outPos - 输出位置坐标 [x, y]
     * @param {Array} inPos - 输入位置坐标 [x, y]
     * @returns {Array} 路径点数组
     */
    _calculateSimplePath(outPos, inPos) {
        const startX = outPos[0];
        const startY = outPos[1];
        const endX = inPos[0];
        const endY = inPos[1];
        
        // 计算水平和垂直距离
        const horzDistance = Math.abs(endX - startX);
        const vertDistance = Math.abs(endY - startY);
        
        let pathPoints;
        if (horzDistance > vertDistance) {
            // 先水平后垂直的L型
            pathPoints = [
                outPos,
                [endX, startY],
                inPos
            ];
        } else {
            // 先垂直后水平的L型
            pathPoints = [
                outPos,
                [startX, endY],
                inPos
            ];
        }
        
        return pathPoints;
    }
}
