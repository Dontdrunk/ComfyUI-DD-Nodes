import { DirectStyle } from './DirectStyle.js';
import { AngledStyle } from './AngledStyle.js';
import { CurveStyle } from './CurveStyle.js';
import { CircuitBoard1Style } from './CircuitBoard1Style.js';
import { CircuitBoard2Style } from './CircuitBoard2Style.js';

/**
 * 连线渲染样式管理器
 * 负责创建、管理和切换不同的连线渲染样式
 */
export class StyleManager {
    /**
     * 构造函数
     * @param {Object} animationManager - 动画管理器引用 
     */
    constructor(animationManager) {
        this.animationManager = animationManager;
        
        // 样式名称映射
        this.styleMap = {
            "直线": DirectStyle,
            "直角线": AngledStyle,
            "曲线": CurveStyle,
            "电路板1": CircuitBoard1Style,
            "电路板2": CircuitBoard2Style
        };
        
        // 当前样式实例
        this.currentStyle = null;
        this.currentStyleName = null;
    }
      /**
     * 设置渲染样式
     * @param {string} styleName - 样式名称
     */    setStyle(styleName) {
        // 特殊处理电路板样式之间的切换
        if (styleName === this.currentStyleName) {
            return; // 样式未改变
        }

        const isCircuitBoard1 = this.currentStyleName === "电路板1";
        const isCircuitBoard2 = this.currentStyleName === "电路板2";
        const switchingBetweenCircuitBoards = 
            (isCircuitBoard1 && styleName === "电路板2") || 
            (isCircuitBoard2 && styleName === "电路板1");

        // 当在两种电路板样式之间切换时，需要完全清理之前的样式
        if (switchingBetweenCircuitBoards) {
            // 强制进行彻底清理
            if (this.currentStyle && this.currentStyle.cleanup) {
                try {
                    this.currentStyle.cleanup();
                    // 确保mapLinks被完全清理
                    if (this.currentStyle.mapLinks) {
                        this.currentStyle.mapLinks = null;
                    }
                } catch (err) {
                    console.error("清理电路板样式时出错:", err);
                }
            }
        } else if (this.currentStyle) {
            // 常规清理
            try {
                this.currentStyle.cleanup();
            } catch (err) {
                console.error("清理样式时出错:", err);
            }
        }          // 创建新样式实例
        const StyleClass = this.styleMap[styleName];
        if (StyleClass) {
            try {
                this.currentStyle = new StyleClass(this.animationManager);
                this.currentStyleName = styleName;
                
                // 初始化新样式
                this.currentStyle.init();
                
                // 对电路板样式，立即初始化以确保正确渲染
                const isCircuitBoard = styleName === "电路板1" || styleName === "电路板2";
                
                if (isCircuitBoard && this.currentStyle.mapLinks && this.currentStyle.mapLinks.mapLinks) {
                    // 对电路板2样式添加特殊标记
                    if (styleName === "电路板2" && this.currentStyle.mapLinks) {
                        this.currentStyle.mapLinks._isMapLinks2 = true; 
                    }
                    
                    // 获取节点执行顺序
                    const nodesByExecution = this.animationManager.canvas?.graph?.computeExecutionOrder?.() || [];
                    if (nodesByExecution && nodesByExecution.length > 0) {
                        try {
                            // 设置线间距并计算路径
                            this.currentStyle.mapLinks.lineSpace = Math.floor(3 + this.animationManager.lineWidth);
                            this.currentStyle.mapLinks.mapLinks(nodesByExecution);
                        } catch (err) {
                            console.error(`${styleName}样式初始化错误:`, err);
                        }
                    }
                }
            } catch (err) {
                console.error(`创建${styleName}样式实例时出错:`, err);
                // 错误恢复：使用默认曲线样式
                this.currentStyle = new CurveStyle(this.animationManager);
                this.currentStyleName = "曲线";
            }} else {
            // 默认使用曲线样式
            this.currentStyle = new CurveStyle(this.animationManager);
            this.currentStyleName = "曲线";
        }
    }
      /**
     * 计算指定连线的路径
     * @param {Array} specificLinks - 要计算的特定连线数组，如果为null则计算所有连线
     * @returns {Array} 路径数据数组
     */
    calculatePaths(specificLinks = null) {
        if (!this.currentStyle) {
            console.warn("No current style set");
            return [];
        }
        
        // 对于电路板样式，仍然需要计算所有路径以保持布局一致性
        if (this.currentStyleName === "电路板1" || this.currentStyleName === "电路板2") {
            const allPaths = this.currentStyle.getAllPaths();
            // 如果指定了特定连线，则只返回相关的路径
            if (specificLinks && specificLinks.length > 0) {
                const specificLinkIds = new Set(specificLinks.map(link => link.id));
                return allPaths.filter(pathData => 
                    pathData.link && specificLinkIds.has(pathData.link.id)
                );
            }
            return allPaths;
        }
        
        // 对于标准样式，计算指定连线或所有连线的路径
        const pathsData = [];
        const linksToProcess = specificLinks || Object.values(this.animationManager.canvas.graph.links || {});
        
        // 处理指定的连线
        linksToProcess.forEach(link => {
            const outNode = this.animationManager.canvas.graph.getNodeById(link.origin_id);
            const inNode = this.animationManager.canvas.graph.getNodeById(link.target_id);
            if (!outNode || !inNode) return;
            
            const outPos = outNode.getConnectionPos(false, link.origin_slot);
            const inPos = inNode.getConnectionPos(true, link.target_slot);
            
            // 使用统一的getBaseColor方法获取颜色
            const baseColor = this.currentStyle.getBaseColor(outNode, link);
            
            // 计算路径点和类型
            const pathInfo = this.currentStyle.calculatePath(outNode, inNode, outPos, inPos, link);
            if (pathInfo && pathInfo.points) {
                pathsData.push({
                    path: pathInfo.points,
                    type: pathInfo.type,
                    from: outPos,
                    to: inPos,
                    baseColor: baseColor,
                    link: link // 添加link引用以便进行显示模式判断
                });
            }
        });
        
        return pathsData;    }
}
