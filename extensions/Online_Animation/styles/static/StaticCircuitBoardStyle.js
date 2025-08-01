import { StaticBaseStyle } from './StaticBaseStyle.js';

/**
 * Liang-Barsky 线段裁剪算法
 * 用于检测线段是否与矩形相交，以及计算交点
 */
const EPSILON = 1e-6;
const INSIDE = 1;
const OUTSIDE = 0;

/**
 * 裁剪参数计算辅助函数
 */
function clipT(num, denom, c) {
    const tE = c[0], tL = c[1];
    if (Math.abs(denom) < EPSILON)
        return num < 0;
    const t = num / denom;
    if (denom > 0) {
        if (t > tL) return 0;
        if (t > tE) c[0] = t;
    } else {
        if (t < tE) return 0;
        if (t < tL) c[1] = t;
    }
    return 1;
}

/**
 * Liang-Barsky 线段裁剪算法
 */
function liangBarsky(a, b, box, da, db) {
    const x1 = a[0], y1 = a[1];
    const x2 = b[0], y2 = b[1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    if (da === undefined || db === undefined) {
        da = a;
        db = b;
    } else {
        da[0] = a[0];
        da[1] = a[1];
        db[0] = b[0];
        db[1] = b[1];
    }
    
    // 如果点在矩形内，并且两点几乎重合
    if (Math.abs(dx) < EPSILON && 
        Math.abs(dy) < EPSILON && 
        x1 >= box[0] && x1 <= box[2] && 
        y1 >= box[1] && y1 <= box[3]) {
        return INSIDE;
    }
    
    const c = [0, 1];
    if (clipT(box[0] - x1, dx, c) && 
        clipT(x1 - box[2], -dx, c) && 
        clipT(box[1] - y1, dy, c) && 
        clipT(y1 - box[3], -dy, c)) {
        
        const tE = c[0], tL = c[1];
        if (tL < 1) {
            db[0] = x1 + tL * dx;
            db[1] = y1 + tL * dy;
        }
        if (tE > 0) {
            da[0] += tE * dx;
            da[1] += tE * dy;
        }
        return INSIDE;
    }
    return OUTSIDE;
}

/**
 * 静态电路板样式
 * 完全复制CircuitBoardStyle的复杂避障算法以确保路径完全一致
 */
export class StaticCircuitBoardStyle extends StaticBaseStyle {
    constructor(animationManager) {
        super(animationManager);
        this.paths = [];
        this.mapLinks = null;
    }

    /**
     * 初始化样式
     */
    init() {
        // 创建电路板连线地图实例 - 完全复制原版MapLinks
        this.mapLinks = new StaticMapLinks(this.animationManager.canvas);
        this.mapLinks.lineSpace = Math.floor(3 + this.animationManager.lineWidth);
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.mapLinks) {
            this.paths = [];
            this.mapLinks = null;
        }
    }

    /**
     * 计算单条连线路径 - 与原版保持一致
     */
    calculatePath(outNode, inNode, outPos, inPos, link) {
        // 对于单条连线，使用简单的L型路径作为备选
        const horzDistance = Math.abs(inPos[0] - outPos[0]);
        const vertDistance = Math.abs(inPos[1] - outPos[1]);
        
        let pathPoints;
        if (horzDistance > vertDistance) {
            pathPoints = [
                outPos,
                [inPos[0], outPos[1]],
                inPos
            ];
        } else {
            pathPoints = [
                outPos,
                [outPos[0], inPos[1]],
                inPos
            ];
        }
        
        return {
            points: pathPoints,
            type: "angled"
        };
    }

    /**
     * 获取所有路径 - 使用完整的MapLinks算法
     */
    getAllPaths() {
        if (!this.mapLinks) return [];
        
        // 重新计算所有路径
        const nodesByExecution = this.animationManager.canvas?.graph?.computeExecutionOrder?.() || [];
        if (nodesByExecution && nodesByExecution.length > 0) {
            try {
                this.mapLinks.mapLinks(nodesByExecution);
                return this.mapLinks.paths || [];
            } catch (err) {
                console.error("静态电路板路径计算错误:", err);
                return [];
            }
        }
        
        return [];
    }
}

// 完整复制MapLinks类 - 确保算法100%一致，并添加空间分区优化
class StaticMapLinks {
    constructor(canvas) {
        this.canvas = canvas;
        this.nodesByRight = [];
        this.nodesById = [];
        this.lastPathId = 10000000;
        this.paths = [];
        this.lineSpace = 5;
        this.maxDirectLineDistance = Number.MAX_SAFE_INTEGER;
        this.debug = false;
        
        // 空间分区优化
        this.spatialGrid = null;
        this.gridSize = 100; // 网格大小，可根据节点密度调整
        this.bounds = null;
        this.gridWidth = 0;
        this.gridHeight = 0;
    }

    /**
     * 检查点是否在某个节点内部
     */
    isInsideNode(xy) {
        for (let i = 0; i < this.nodesByRight.length; ++i) {
            const nodeI = this.nodesByRight[i];
            if (nodeI.node.isPointInside(xy[0], xy[1])) {
                return nodeI.node;
            }
        }
        return null;
    }

    /**
     * 计算所有节点的边界框
     */
    calculateBounds() {
        if (this.nodesByRight.length === 0) {
            return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
        }

        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;

        this.nodesByRight.forEach(nodeInfo => {
            const area = nodeInfo.area;
            minX = Math.min(minX, area[0]);
            minY = Math.min(minY, area[1]);
            maxX = Math.max(maxX, area[2]);
            maxY = Math.max(maxY, area[3]);
        });

        // 添加边界缓冲区
        const padding = this.gridSize;
        return {
            minX: minX - padding,
            minY: minY - padding,
            maxX: maxX + padding,
            maxY: maxY + padding
        };
    }

    /**
     * 构建空间分区索引
     */
    buildSpatialIndex() {
        this.bounds = this.calculateBounds();
        this.gridWidth = Math.ceil((this.bounds.maxX - this.bounds.minX) / this.gridSize);
        this.gridHeight = Math.ceil((this.bounds.maxY - this.bounds.minY) / this.gridSize);
        
        this.spatialGrid = new Map();
        
        // 将节点分配到相应的网格中
        this.nodesByRight.forEach(nodeInfo => {
            const area = nodeInfo.area;
            const startX = Math.max(0, Math.floor((area[0] - this.bounds.minX) / this.gridSize));
            const endX = Math.min(this.gridWidth - 1, Math.floor((area[2] - this.bounds.minX) / this.gridSize));
            const startY = Math.max(0, Math.floor((area[1] - this.bounds.minY) / this.gridSize));
            const endY = Math.min(this.gridHeight - 1, Math.floor((area[3] - this.bounds.minY) / this.gridSize));
            
            // 将节点添加到所有覆盖的网格中
            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    const key = `${x},${y}`;
                    if (!this.spatialGrid.has(key)) {
                        this.spatialGrid.set(key, []);
                    }
                    this.spatialGrid.get(key).push(nodeInfo);
                }
            }
        });
    }

    /**
     * 获取线段经过的所有网格
     */
    getLineGrids(startPos, endPos) {
        const grids = new Set();
        
        // 使用Bresenham直线算法获取线段经过的网格
        const x0 = Math.floor((startPos[0] - this.bounds.minX) / this.gridSize);
        const y0 = Math.floor((startPos[1] - this.bounds.minY) / this.gridSize);
        const x1 = Math.floor((endPos[0] - this.bounds.minX) / this.gridSize);
        const y1 = Math.floor((endPos[1] - this.bounds.minY) / this.gridSize);
        
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        let x = x0;
        let y = y0;
        
        const x_inc = x0 < x1 ? 1 : -1;
        const y_inc = y0 < y1 ? 1 : -1;
        let error = dx - dy;
        
        for (let i = 0; i <= dx + dy; i++) {
            // 确保网格坐标在有效范围内
            if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                grids.add(`${x},${y}`);
            }
            
            if (x === x1 && y === y1) break;
            
            const e2 = 2 * error;
            if (e2 > -dy) {
                error -= dy;
                x += x_inc;
            }
            if (e2 < dx) {
                error += dx;
                y += y_inc;
            }
        }
        
        return Array.from(grids);
    }

    /**
     * 根据节点数量动态优化网格大小
     */
    optimizeGridSize(nodeCount) {
        // 根据节点数量动态调整网格大小
        if (nodeCount < 10) {
            this.gridSize = 150; // 节点少时使用大网格
        } else if (nodeCount < 50) {
            this.gridSize = 100; // 中等节点数量
        } else if (nodeCount < 100) {
            this.gridSize = 75;  // 较多节点
        } else {
            this.gridSize = 50;  // 大量节点时使用小网格
        }
        
        // 如果网格大小改变，重新构建索引
        if (this.spatialGrid) {
            this.buildSpatialIndex();
        }
    }

    /**
     * 查找与线段相交的最近节点 - 使用空间分区优化
     */
    findClippedNode(outputXY, inputXY) {
        let closest = null;
        let closestDistance = Number.MAX_SAFE_INTEGER;
    
        const clipA = [...outputXY];
        const clipB = [...inputXY];
        
        // 如果空间索引已构建，使用优化算法
        if (this.spatialGrid && this.bounds) {
            const lineGrids = this.getLineGrids(outputXY, inputXY);
            const checkedNodes = new Set(); // 避免重复检查同一节点
            
            // 只检查线段经过的网格中的节点
            for (const gridKey of lineGrids) {
                const nodes = this.spatialGrid.get(gridKey);
                if (!nodes) continue;
                
                for (const node of nodes) {
                    // 跳过已检查的节点
                    if (checkedNodes.has(node.node.id)) continue;
                    checkedNodes.add(node.node.id);
                    
                    const clipped = liangBarsky(
                        outputXY, 
                        inputXY, 
                        node.area, 
                        clipA, 
                        clipB
                    );
                    
                    if (clipped === INSIDE) {
                        const centerX = (node.area[0] + (node.area[2] - node.area[0]) / 2);
                        const centerY = (node.area[1] + (node.area[3] - node.area[1]) / 2);
                        const dist = Math.sqrt(((centerX - outputXY[0]) ** 2) + ((centerY - outputXY[1]) ** 2));
                        if (dist < closestDistance) {
                            closest = {
                                start: clipA,
                                end: clipB,
                                node,
                            };
                            closestDistance = dist;
                        }
                    }
                }
            }
        } else {
            // 回退到原始算法（用于兼容性）
            for (let i = 0; i < this.nodesByRight.length; ++i) {
                const node = this.nodesByRight[i];
                const clipped = liangBarsky(
                    outputXY, 
                    inputXY, 
                    node.area, 
                    clipA, 
                    clipB
                );
                
                if (clipped === INSIDE) {
                    const centerX = (node.area[0] + (node.area[2] - node.area[0]) / 2);
                    const centerY = (node.area[1] + (node.area[3] - node.area[1]) / 2);
                    const dist = Math.sqrt(((centerX - outputXY[0]) ** 2) + ((centerY - outputXY[1]) ** 2));
                    if (dist < closestDistance) {
                        closest = {
                            start: clipA,
                            end: clipB,
                            node,
                        };
                        closestDistance = dist;
                    }
                }
            }
        }
        
        return { clipped: closest, closestDistance };
    }

    /**
     * 测试路径是否被节点阻挡 - 完全复制动态版本
     */
    testPath(path) {
        const len1 = (path.length - 1);
        for (let p = 0; p < len1; ++p) {
            const { clipped } = this.findClippedNode(path[p], path[p + 1]);
            if (clipped) {
                return clipped;
            }
        }
        return null;
    }

    /**
     * 计算两点之间的电路板风格路径 - 完全复制动态版本
     */
    mapFinalLink(outputXY, inputXY) {
        const { clipped } = this.findClippedNode(outputXY, inputXY);
        if (!clipped) {
            const dist = Math.sqrt(((outputXY[0] - inputXY[0]) ** 2) + ((outputXY[1] - inputXY[1]) ** 2));
            if (dist < this.maxDirectLineDistance) {
                // 直连，无阻挡
                return { path: [outputXY, inputXY] };
            }
        }

        const horzDistance = inputXY[0] - outputXY[0];
        const vertDistance = inputXY[1] - outputXY[1];
        const horzDistanceAbs = Math.abs(horzDistance);
        const vertDistanceAbs = Math.abs(vertDistance);

        // 尝试90度和45度路径组合
        if (horzDistanceAbs > vertDistanceAbs) {
            // 水平距离大于垂直距离，先尝试带45度的路径
            const goingLeft = inputXY[0] < outputXY[0];
            const pathStraight45 = [
                outputXY,
                [inputXY[0] - (goingLeft ? -vertDistanceAbs : vertDistanceAbs), outputXY[1]],
                inputXY
            ];
            
            if (!this.testPath(pathStraight45)) {
                return { path: pathStraight45 };
            }

            const path45Straight = [
                outputXY,
                [outputXY[0] + (goingLeft ? -vertDistanceAbs : vertDistanceAbs), inputXY[1]],
                inputXY
            ];
            
            if (!this.testPath(path45Straight)) {
                return { path: path45Straight };
            }
        } else {
            // 垂直距离大于或等于水平距离
            const goingUp = inputXY[1] < outputXY[1];
            const pathStraight45 = [
                outputXY,
                [outputXY[0], inputXY[1] + (goingUp ? horzDistanceAbs : -horzDistanceAbs)],
                inputXY
            ];
            
            if (!this.testPath(pathStraight45)) {
                return { path: pathStraight45 };
            }

            const path45Straight = [
                outputXY,
                [inputXY[0], outputXY[1] - (goingUp ? horzDistanceAbs : -horzDistanceAbs)],
                inputXY
            ];
            
            if (!this.testPath(path45Straight)) {
                return { path: path45Straight };
            }
        }

        // 尝试直角(90度)路径
        const path90Straight = [
            outputXY,
            [outputXY[0], inputXY[1]],
            inputXY
        ];
        
        const clippedVert = this.testPath(path90Straight);
        if (!clippedVert) {
            return { path: path90Straight };
        }

        const pathStraight90 = [
            outputXY,
            [inputXY[0], outputXY[1]],
            inputXY
        ];
        
        const clippedHorz = this.testPath(pathStraight90);
        if (!clippedHorz) {
            return { path: pathStraight90 };
        }

        // 所有简单路径都被阻挡
        return {
            clippedHorz,
            clippedVert
        };
    }

    /**
     * 递归计算避开障碍的路径 - 完全复制原版算法
     */
    mapLink(outputXY, inputXY, targetNodeInfo, isBlocked, lastDirection) {
        // 尝试简单路径
        const result = this.mapFinalLink(outputXY, inputXY);
        const { clippedHorz, clippedVert, path } = result;
        if (path) {
            return path;
        }

        const horzDistance = inputXY[0] - outputXY[0];
        const vertDistance = inputXY[1] - outputXY[1];
        const horzDistanceAbs = Math.abs(horzDistance);
        const vertDistanceAbs = Math.abs(vertDistance);

        let blockedNodeId;
        let pathAvoidNode;
        let lastPathLocation;
        let linesArea;
        let thisDirection;

        // 根据水平/垂直距离选择避让方向
        if (horzDistanceAbs > vertDistanceAbs) {
            // 水平优先: 先水平后垂直来避开阻挡节点
            blockedNodeId = clippedHorz.node.node.id;
            linesArea = clippedHorz.node.linesArea;
            
            // 确定水平边缘位置
            const horzEdge = horzDistance <= 0 
                ? (linesArea[2]) 
                : (linesArea[0] - 1);
                
            // 构建避让路径的第一段
            pathAvoidNode = [
                [outputXY[0], outputXY[1]],
                [horzEdge, outputXY[1]]
            ];

            // 调整线条区域以避免未来线条重叠
            if (horzDistance <= 0) {
                linesArea[2] += this.lineSpace;
            } else {
                linesArea[0] -= this.lineSpace;
            }

            // 计算绕节点上方与下方的距离
            const vertDistanceViaBlockTop = 
                Math.abs(inputXY[1] - linesArea[1]) +
                Math.abs(linesArea[1] - outputXY[1]);
            const vertDistanceViaBlockBottom = 
                Math.abs(inputXY[1] - linesArea[3]) +
                Math.abs(linesArea[3] - outputXY[1]);

            // 选择距离较短的路径
            lastPathLocation = [
                horzEdge,
                vertDistanceViaBlockTop <= vertDistanceViaBlockBottom ?
                    (linesArea[1]) : (linesArea[3])
            ];
            
            // 尝试精确路径，可能仍被阻挡
            const unblockNotPossible1 = this.testPath([...pathAvoidNode, lastPathLocation]);
            if (unblockNotPossible1) {
                // 如果仍被阻挡，尝试另一个方向
                lastPathLocation = [
                    horzEdge,
                    vertDistanceViaBlockTop > vertDistanceViaBlockBottom ?
                        (linesArea[1]) : (linesArea[3])
                ];
            }
            
            // 调整垂直区域以避免线条重叠
            if (lastPathLocation[1] < outputXY[1]) {
                linesArea[1] -= this.lineSpace;
                lastPathLocation[1] -= 1;
            } else {
                linesArea[3] += this.lineSpace;
                lastPathLocation[1] += 1;
            }
            
            thisDirection = 'vert';
        } else {
            // 垂直优先: 先垂直后水平来避开阻挡节点
            blockedNodeId = clippedVert.node.node.id;
            linesArea = clippedVert.node.linesArea;
            
            // 确定垂直边缘位置
            const vertEdge = vertDistance <= 0 
                ? (linesArea[3] + 1) 
                : (linesArea[1] - 1);
                
            // 构建避让路径的第一段
            pathAvoidNode = [
                [outputXY[0], outputXY[1]],
                [outputXY[0], vertEdge]
            ];
            
            // 调整线条区域以避免未来线条重叠
            if (vertDistance <= 0) {
                linesArea[3] += this.lineSpace;
            } else {
                linesArea[1] -= this.lineSpace;
            }
            
            // 计算绕节点左侧与右侧的距离
            const horzDistanceViaBlockLeft =
                Math.abs(inputXY[0] - linesArea[0]) +
                Math.abs(linesArea[0] - outputXY[0]);
            const horzDistanceViaBlockRight =
                Math.abs(inputXY[0] - linesArea[2]) +
                Math.abs(linesArea[2] - outputXY[0]);
            
            // 选择距离较短的路径
            lastPathLocation = [
                horzDistanceViaBlockLeft <= horzDistanceViaBlockRight ?
                    (linesArea[0] - 1) : (linesArea[2]),
                vertEdge
            ];
            
            // 尝试精确路径，可能仍被阻挡
            const unblockNotPossible1 = this.testPath([...pathAvoidNode, lastPathLocation]);
            if (unblockNotPossible1) {
                // 如果仍被阻挡，尝试另一个方向
                lastPathLocation = [
                    horzDistanceViaBlockLeft > horzDistanceViaBlockRight ?
                        (linesArea[0]) : (linesArea[2]),
                    vertEdge
                ];
            }
            
            // 调整水平区域以避免线条重叠
            if (lastPathLocation[0] < outputXY[0]) {
                linesArea[0] -= this.lineSpace;
            } else {
                linesArea[2] += this.lineSpace;
            }
            
            thisDirection = 'horz';
        }

        // 防止过多递归，如果一个节点被绕过太多次，直接返回直连路径
        if (blockedNodeId && isBlocked[blockedNodeId] > 3) {
            return [outputXY, inputXY];
        }
        
        // 记录绕过的节点
        if (blockedNodeId) {
            if (isBlocked[blockedNodeId]) {
                ++isBlocked[blockedNodeId];
            } else {
                isBlocked[blockedNodeId] = 1;
            }
        }
        
        // 递归计算剩余路径
        const nextPath = this.mapLink(
            lastPathLocation,
            inputXY,
            targetNodeInfo,
            isBlocked,
            thisDirection
        );
        
        // 合并路径
        return [...pathAvoidNode, lastPathLocation, ...nextPath.slice(1)];
    }

    /**
     * 为画布中的所有节点计算电路板风格的连线 - 完全复制原版
     */
    mapLinks(nodesByExecution) {
        if (!this.canvas.graph.links) {
            console.error('Missing graph.links', this.canvas.graph);
            return;
        }

        const startCalcTime = new Date().getTime();
        this.links = [];
        this.lastPathId = 1000000;
        this.nodesByRight = [];
        this.nodesById = {};
        
        // 初始化节点区域信息 - 完全复制原版逻辑
        this.nodesByRight = nodesByExecution.map((node) => {
            const barea = new Float32Array(4);
            node.getBounding(barea);
            const area = [
                barea[0],
                barea[1],
                barea[0] + barea[2],
                barea[1] + barea[3]
            ];
            const linesArea = Array.from(area);
            linesArea[0] -= 5;
            linesArea[1] -= 1;
            linesArea[2] += 3;
            linesArea[3] += 3;
            const obj = { node, area, linesArea };
            this.nodesById[node.id] = obj;
            return obj;
        });

        // 构建空间分区索引以优化性能
        this.buildSpatialIndex();
        
        // 动态调整网格大小以获得最佳性能
        this.optimizeGridSize(nodesByExecution.length);

        // 计算所有连线 - 完全复制原版的嵌套filter逻辑
        this.paths = [];
        
        this.nodesByRight.filter((nodeI) => {
            const { node } = nodeI;
            if (!node.outputs) {
                return false;
            }
            
            node.outputs.filter((output, slot) => {
                if (!output.links) {
                    return false;
                }

                const linkPos = new Float32Array(2);
                const outputXYConnection = node.getConnectionPos(false, slot, linkPos);
                const outputNodeInfo = this.nodesById[node.id];
                let outputXY = Array.from(outputXYConnection);
                
                output.links.filter((linkId) => {
                    // 关键！调整输出点到节点右边缘
                    outputXY[0] = outputNodeInfo.linesArea[2];
                    
                    const link = this.canvas.graph.links[linkId];
                    if (!link) {
                        return false;
                    }
                    
                    const targetNode = this.canvas.graph.getNodeById(link.target_id);
                    if (!targetNode) {
                        return false;
                    }

                    const inputLinkPos = new Float32Array(2);
                    const inputXYConnection = targetNode.getConnectionPos(
                        true,
                        link.target_slot,
                        inputLinkPos
                    );
                    const inputXY = Array.from(inputXYConnection);
                    const nodeInfo = this.nodesById[targetNode.id];
                    // 关键！调整输入点到节点左边缘
                    inputXY[0] = nodeInfo.linesArea[0] - 1;

                    // 检查起点和终点是否被节点阻挡
                    const inputBlockedByNode = this.getNodeOnPos(inputXY);
                    const outputBlockedByNode = this.getNodeOnPos(outputXY);

                    let path = null;
                    
                    // 如果起点和终点没有被阻挡，计算避让路径
                    if (!inputBlockedByNode && !outputBlockedByNode) {
                        const pathFound = this.mapLink(outputXY, inputXY, nodeInfo, {}, null);
                        if (pathFound && pathFound.length > 2) {
                            // 关键！组合完整路径：真实连接点 + 计算路径 + 真实连接点
                            path = [outputXYConnection, ...pathFound, inputXYConnection];
                            this.expandTargetNodeLinesArea(nodeInfo, path);
                        }
                    }
                    
                    // 如果没有找到有效路径，使用直连
                    if (!path) {
                        path = [outputXYConnection, outputXY, inputXY, inputXYConnection];
                    }
                    
                    // 扩展源节点的线条区域并保存路径
                    this.expandSourceNodeLinesArea(nodeI, path);
                    
                    // 获取连线颜色
                    const baseColor = (output.color || 
                        (this.canvas.default_connection_color_byType && 
                         this.canvas.default_connection_color_byType[output.type]) ||
                        (this.canvas.default_connection_color && 
                         this.canvas.default_connection_color.input_on) ||
                        "#ff0000");

                    this.paths.push({
                        path,
                        from: outputXYConnection,
                        to: inputXYConnection,
                        baseColor: link.color || baseColor,
                        originNode: node,
                        targetNode,
                        originSlot: slot,
                        targetSlot: link.target_slot,
                        type: "angled", // 角线类型
                        link: {
                            origin_id: link.origin_id,
                            target_id: link.target_id,
                            origin_slot: link.origin_slot,
                            target_slot: link.target_slot,
                            ...link
                        } // 添加完整的link信息以便进行显示模式判断
                    });
                    
                    // 关键！为下一条线预留空间
                    outputXY = [
                        outputXY[0] + this.lineSpace,
                        outputXY[1]
                    ];
                    
                    return false;
                });
                
                return false;
            });
            
            return false;
        });
        
        // 记录计算时间
        this.lastCalculate = new Date().getTime();
        this.lastCalcTime = this.lastCalculate - startCalcTime;
    }

    /**
     * 获取某个点上的节点
     */
    getNodeOnPos(xy) {
        for (let i = 0; i < this.nodesByRight.length; ++i) {
            const nodeI = this.nodesByRight[i];
            const { linesArea } = nodeI;
            if (xy[0] >= linesArea[0] &&
                xy[1] >= linesArea[1] &&
                xy[0] < linesArea[2] &&
                xy[1] < linesArea[3]) {
                return nodeI;
            }
        }
        return null;
    }

    /**
     * 扩展源节点的线条区域
     */
    expandSourceNodeLinesArea(sourceNodeInfo, path) {
        if (path.length < 3) {
            return false;
        }

        const linesArea = sourceNodeInfo.linesArea;
        if (path[1][0] === path[2][0]) {
            // 第一条线是垂直的
            linesArea[2] += this.lineSpace;
        }
        return true;
    }

    /**
     * 扩展目标节点的线条区域
     */
    expandTargetNodeLinesArea(targetNodeInfo, path) {
        if (path.length < 2) {
            return false;
        }

        const linesArea = targetNodeInfo.linesArea;
        const path2Len = path.length - 2;
        if (path[path2Len - 1][0] === path[path2Len][0]) {
            // 最后一条线是垂直的
            linesArea[0] -= this.lineSpace;
        }
        return true;
    }

    /**
     * 获取基础颜色的辅助方法
     */
    getBaseColor(outNode, link) {
        return (outNode.outputs && outNode.outputs[link.origin_slot] && outNode.outputs[link.origin_slot].color)
            || (this.canvas.default_connection_color_byType && 
                outNode.outputs && 
                outNode.outputs[link.origin_slot] && 
                this.canvas.default_connection_color_byType[outNode.outputs[link.origin_slot].type])
            || (this.canvas.default_connection_color && 
                this.canvas.default_connection_color.input_on)
            || "#999999";
    }
}
