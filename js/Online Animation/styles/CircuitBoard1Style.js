import { BaseStyle } from './BaseStyle.js';

/**
 * 电路板1样式
 * 实现经典L型/折线连接路径
 */
export class CircuitBoard1Style extends BaseStyle {
    constructor(animationManager) {
        super(animationManager);
        this.mapLinks = null;
        this.paths = [];
    }

    /**
     * 初始化样式
     */
    init() {
        // 创建新的连线映射实例
        this.mapLinks = {
            paths: [],
            mapLinks: (nodesByExecution) => {
                this.paths = []; // 清空现有路径
                if (!this.animationManager.canvas.graph.links) return;
                
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
                        originNode: outNode,
                        targetNode: inNode,
                        originSlot: link.origin_slot,
                        targetSlot: link.target_slot,
                        type: "angled" // 角线类型
                    });
                });
            }
        };
    }

    /**
     * 清理资源
     */
    cleanup() {
        // 释放资源
        if (this.mapLinks) {
            this.paths = [];
            this.mapLinks = null;
        }
    }

    /**
     * 计算电路板1风格的L型路径
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

    /**
     * 计算单条连线路径
     */
    calculatePath(outNode, inNode, outPos, inPos, link) {
        // 对于单条连线，直接计算简单路径
        const pathPoints = this._calculateSimplePath(outPos, inPos);
        return {
            points: pathPoints,
            type: "angled"
        };
    }
    
    /**
     * 获取所有路径
     * @returns {Array} 路径数据数组
     */
    getAllPaths() {
        // 先检查是否需要重新计算路径
        if (!this.mapLinks || !this.mapLinks.paths || this.mapLinks.paths.length === 0) {
            const nodesByExecution = this.animationManager.canvas?.graph?.computeExecutionOrder?.() || [];
            if (nodesByExecution && nodesByExecution.length > 0) {
                this.mapLinks.mapLinks(nodesByExecution);
            }
        }
        
        return this.paths || [];
    }
}