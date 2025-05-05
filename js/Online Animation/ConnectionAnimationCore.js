// 动画核心模块，只包含动画逻辑和默认配置
export class ConnectionAnimation {
    constructor() {
        this.enabled = false;
        this.lineWidth = 3;
        this.effect = "流动"; // 流动 | 波浪 | 律动 | 脉冲
        this.canvas = null;
        this._lastTime = 0;
        this._phase = 0;
        this._originalDrawConnections = null;
        this._animating = false;
        this.speed = 2; // 1~3
        this.effectExtra = true;
        this.renderStyle = "曲线"; 
        this.useGradient = true; 
        this.circuitBoardMap = null; 
    }

    setEnabled(e) {
        this.enabled = e;
        this._lastTime = performance.now();
        if (e) this._startTime = performance.now();
        if (this.canvas) {
            if (e) {
                if (!this._originalDrawConnections) {
                    this._originalDrawConnections = this.canvas.drawConnections;
                }
                const self = this;
                this.canvas.drawConnections = function(ctx) {
                    self.drawAnimation(ctx);
                };
                // 只在 enabled 时启动动画循环
                if (!this._animating) {
                    this._animating = true;
                    this._animationLoop();
                }
            } else {
                if (this._originalDrawConnections) {
                    this.canvas.drawConnections = this._originalDrawConnections;
                }
                this._animating = false;
            }
            this.canvas.setDirty(true, true);
        }
    }

    _animationLoop() {
        if (!this.enabled || !this.canvas) {
            this._animating = false;
            return;
        }
        this.canvas.setDirty(true, true);
        window.requestAnimationFrame(() => {
            if (this.enabled && this._animating) {
                this._animationLoop();
            }
        });
    }

    setLineWidth(w) {
        this.lineWidth = w;
    }
    setEffect(effect) {
        this.effect = effect;
    }
    setSpeed(speed) {
        this.speed = speed;
    }
    setEffectExtra(flag) {
        this.effectExtra = !!flag;
    }
    setRenderStyle(style) {
        this.renderStyle = style || "曲线";
        // 支持电路板1和电路板2
        if ((this.renderStyle === "电路板1" || this.renderStyle === "电路板2") && this.canvas) {
            // 修复：每次切换都强制重建MapLinks
            this.circuitBoardMap = null;
            this._initCircuitBoardMap();
        } else {
            this.circuitBoardMap = null;
        }
    }
    setUseGradient(flag) {
        this.useGradient = !!flag;
        if (this.canvas) {
            this.canvas.setDirty(true, true);
        }
    }

    _initCircuitBoardMap() {
        // 根据风格选择不同的MapLinks实现
        if (!this.circuitBoardMap) {
            let MapLinks;
            if (this.renderStyle === "电路板2") {
                MapLinks = this._createMapLinks2Class();
            } else {
                MapLinks = this._createMapLinksClass();
            }
            this.circuitBoardMap = new MapLinks(this.canvas);
            this.circuitBoardMap.lineSpace = Math.floor(3 + this.lineWidth);
        }
    }

    _createMapLinksClass() {
        // 从CircuitBoardLines.js中提取的精简版MapLinks类
        const EPSILON = 1e-6;
        const INSIDE = 1;
        const OUTSIDE = 0;
        
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
            if (Math.abs(dx) < EPSILON &&
                Math.abs(dy) < EPSILON &&
                x1 >= box[0] &&
                x1 <= box[2] &&
                y1 >= box[1] &&
                y1 <= box[3]) {
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
        
        return class MapLinks {
            constructor(canvas) {
                this.canvas = canvas;
                this.nodesByRight = [];
                this.nodesById = [];
                this.lastPathId = 10000000;
                this.paths = [];
                this.lineSpace = 5;
                this.maxDirectLineDistance = Number.MAX_SAFE_INTEGER;
                this.debug = false;
            }

            isInsideNode(xy) {
                for (let i = 0; i < this.nodesByRight.length; ++i) {
                    const nodeI = this.nodesByRight[i];
                    if (nodeI.node.isPointInside(xy[0], xy[1])) {
                        return nodeI.node;
                    }
                }
                return null;
            }

            findClippedNode(outputXY, inputXY) {
                let closestDistance = Number.MAX_SAFE_INTEGER;
                let closest = null;

                for (let i = 0; i < this.nodesByRight.length; ++i) {
                    const node = this.nodesByRight[i];
                    const clipA = [-1, -1];
                    const clipB = [-1, -1];
                    const clipped = liangBarsky(
                        outputXY,
                        inputXY,
                        node.area,
                        clipA,
                        clipB,
                    );

                    if (clipped === INSIDE) {
                        const centerX = (node.area[0] + ((node.area[2] - node.area[0]) / 2));
                        const centerY = (node.area[1] + ((node.area[3] - node.area[1]) / 2));
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
                return { clipped: closest, closestDistance };
            }

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

            mapFinalLink(outputXY, inputXY) {
                const { clipped } = this.findClippedNode(outputXY, inputXY);
                if (!clipped) {
                    const dist = Math.sqrt(((outputXY[0] - inputXY[0]) ** 2) + ((outputXY[1] - inputXY[1]) ** 2));
                    if (dist < this.maxDirectLineDistance) {
                        // 直接连接，没有阻塞
                        return { path: [outputXY, inputXY] };
                    }
                }

                const horzDistance = inputXY[0] - outputXY[0];
                const vertDistance = inputXY[1] - outputXY[1];
                const horzDistanceAbs = Math.abs(horzDistance);
                const vertDistanceAbs = Math.abs(vertDistance);

                if (horzDistanceAbs > vertDistanceAbs) {
                    // 水平距离大于垂直距离
                    const goingLeft = inputXY[0] < outputXY[0];
                    const pathStraight45 = [
                        outputXY,
                        [inputXY[0] - (goingLeft ? -vertDistanceAbs : vertDistanceAbs), outputXY[1]],
                        inputXY,
                    ];
                    if (!this.testPath(pathStraight45)) {
                        return { path: pathStraight45 };
                    }

                    const path45Straight = [
                        outputXY,
                        [outputXY[0] + (goingLeft ? -vertDistanceAbs : vertDistanceAbs), inputXY[1]],
                        inputXY,
                    ];
                    if (!this.testPath(path45Straight)) {
                        return { path: path45Straight };
                    }
                } else {
                    // 垂直距离大于水平距离
                    const goingUp = inputXY[1] < outputXY[1];
                    const pathStraight45 = [
                        outputXY,
                        [outputXY[0], inputXY[1] + (goingUp ? horzDistanceAbs : -horzDistanceAbs)],
                        inputXY,
                    ];
                    if (!this.testPath(pathStraight45)) {
                        return { path: pathStraight45 };
                    }

                    const path45Straight = [
                        outputXY,
                        [inputXY[0], outputXY[1] - (goingUp ? horzDistanceAbs : -horzDistanceAbs)],
                        inputXY,
                    ];
                    if (!this.testPath(path45Straight)) {
                        return { path: path45Straight };
                    }
                }

                const path90Straight = [
                    outputXY,
                    [outputXY[0], inputXY[1]],
                    inputXY,
                ];
                const clippedVert = this.testPath(path90Straight);
                if (!clippedVert) {
                    return { path: path90Straight };
                }

                const pathStraight90 = [
                    outputXY,
                    [inputXY[0], outputXY[1]],
                    inputXY,
                ];
                const clippedHorz = this.testPath(pathStraight90);
                if (!clippedHorz) {
                    return { path: pathStraight90 };
                }

                // --- 修复：兜底始终返回一条L型折线路径，避免连线消失 ---
                // 优先用L型（先水平后垂直）
                const fallbackL1 = [outputXY, [inputXY[0], outputXY[1]], inputXY];
                // 或者先垂直后水平
                const fallbackL2 = [outputXY, [outputXY[0], inputXY[1]], inputXY];
                // 任选一种
                return { path: fallbackL1 };
            }

            mapLinks(nodesByExecution) {
                if (!this.canvas.graph.links) {
                    return;
                }

                this.links = [];
                this.lastPathId = 1000000;
                this.nodesByRight = [];
                this.nodesById = {};
                this.nodesByRight = nodesByExecution.map((node) => {
                    const barea = new Float32Array(4);
                    node.getBounding(barea); 
                    const area = [
                        barea[0],
                        barea[1],
                        barea[0] + barea[2],
                        barea[1] + barea[3],
                    ];
                    const linesArea = Array.from(area);
                    linesArea[0] -= 5;
                    linesArea[1] -= 1;
                    linesArea[2] += 3;
                    linesArea[3] += 3;
                    const obj = {
                        node,
                        area,
                        linesArea,
                    };
                    this.nodesById[node.id] = obj;
                    return obj;
                });

                // 计算每个连线的路径
                this.paths = [];
                const links = this.canvas.graph.links;
                Object.values(links).forEach(link => {
                    const originNode = this.canvas.graph.getNodeById(link.origin_id);
                    const targetNode = this.canvas.graph.getNodeById(link.target_id);
                    
                    if (!originNode || !targetNode) return;
                    
                    const outputPos = originNode.getConnectionPos(false, link.origin_slot);
                    const inputPos = targetNode.getConnectionPos(true, link.target_slot);
                    
                    const originNodeInfo = this.nodesById[originNode.id];
                    const targetNodeInfo = this.nodesById[targetNode.id];
                    
                    if (!originNodeInfo || !targetNodeInfo) return;
                    
                    const outputXY = [originNodeInfo.linesArea[2], outputPos[1]];
                    const inputXY = [targetNodeInfo.linesArea[0] - 1, inputPos[1]];
                    
                    const { path } = this.mapFinalLink(outputXY, inputXY);
                    
                    // 添加完整的路径
                    if (path) {
                        this.paths.push({
                            path: [outputPos, ...path, inputPos], 
                            originNode,
                            targetNode,
                            originSlot: link.origin_slot,
                            targetSlot: link.target_slot,
                            baseColor: link.color
                        });
                    }
                });
            }

            // 绘制电路板风格连线
            drawLinks(ctx, baseColor) {
                ctx.save();
                const cornerRadius = this.lineSpace;

                for (const pathI of this.paths) {
                    const path = pathI.path;
                    if (path.length <= 1) {
                        continue;
                    }
                    
                    ctx.beginPath();
                    
                    // 获取连线颜色
                    const originNode = pathI.originNode;
                    const slotColor = pathI.baseColor || 
                        (originNode.outputs && originNode.outputs[pathI.originSlot] && 
                         originNode.outputs[pathI.originSlot].color) ||
                        (this.canvas.default_connection_color_byType && 
                         originNode.outputs && originNode.outputs[pathI.originSlot] && 
                         this.canvas.default_connection_color_byType[originNode.outputs[pathI.originSlot].type]) ||
                        (this.canvas.default_connection_color && this.canvas.default_connection_color.input_on) ||
                        baseColor || "#FFFFFF";
                    
                    // 修复：电路板风格也支持渐变
                    let strokeStyle = slotColor;
                    if (this.canvas._connectionAnimation && this.canvas._connectionAnimation.useGradient) {
                        // 取首尾点
                        const from = path[0];
                        const to = path[path.length - 1];
                        strokeStyle = this.canvas._connectionAnimation._makeFancyGradient(ctx, from, to, slotColor);
                    }
                    
                    ctx.strokeStyle = strokeStyle;
                    ctx.lineWidth = 3;
                    
                    let isPrevDotRound = false;
                    for (let p = 0; p < path.length; ++p) {
                        const pos = path[p];

                        if (p === 0) {
                            ctx.moveTo(pos[0], pos[1]);
                        }
                        const prevPos = pos;
                        const cornerPos = path[p + 1];
                        const nextPos = path[p + 2];

                        let drawn = false;
                        if (nextPos) {
                            const xDiffBefore = cornerPos[0] - prevPos[0];
                            const yDiffBefore = cornerPos[1] - prevPos[1];
                            const xDiffAfter = nextPos[0] - cornerPos[0];
                            const yDiffAfter = nextPos[1] - cornerPos[1];
                            const isBeforeStraight = xDiffBefore === 0 || yDiffBefore === 0;
                            const isAfterStraight = xDiffAfter === 0 || yDiffAfter === 0;
                            
                            if (isBeforeStraight || isAfterStraight) {
                                const beforePos = [
                                    cornerPos[0],
                                    cornerPos[1],
                                ];
                                const afterPos = [
                                    cornerPos[0],
                                    cornerPos[1],
                                ];

                                if (isBeforeStraight) {
                                    const xSignBefore = Math.sign(xDiffBefore);
                                    const ySignBefore = Math.sign(yDiffBefore);
                                    beforePos[0] = cornerPos[0] - cornerRadius * xSignBefore;
                                    beforePos[1] = cornerPos[1] - cornerRadius * ySignBefore;
                                }
                                if (isAfterStraight) {
                                    const xSignAfter = Math.sign(xDiffAfter);
                                    const ySignAfter = Math.sign(yDiffAfter);
                                    afterPos[0] = cornerPos[0] + cornerRadius * xSignAfter;
                                    afterPos[1] = cornerPos[1] + cornerRadius * ySignAfter;
                                }

                                if (isPrevDotRound
                                    && Math.abs(isPrevDotRound[0] - beforePos[0]) <= cornerRadius
                                    && Math.abs(isPrevDotRound[1] - beforePos[1]) <= cornerRadius
                                ) {
                                    ctx.lineTo(cornerPos[0], cornerPos[1]);
                                } else {
                                    ctx.lineTo(beforePos[0], beforePos[1]);
                                    ctx.quadraticCurveTo(cornerPos[0], cornerPos[1], afterPos[0], afterPos[1]);
                                }
                                isPrevDotRound = beforePos;
                                drawn = true;
                            }
                        }
                        if (p > 0 && !drawn) {
                            if (!isPrevDotRound) {
                                ctx.lineTo(pos[0], pos[1]);
                            }
                            isPrevDotRound = false;
                        }
                    }

                    ctx.stroke();
                    ctx.closePath();
                }
                
                ctx.restore();
            }
        };
    }

    _createMapLinks2Class() {
        // 递归避障算法，参考CS/CircuitBoardLines.js的mapLink
        const EPSILON = 1e-6;
        const INSIDE = 1;
        const OUTSIDE = 0;
        function clipT(num, denom, c) {
            const tE = c[0], tL = c[1];
            if (Math.abs(denom) < EPSILON) return num < 0;
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
            if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON && x1 >= box[0] && x1 <= box[2] && y1 >= box[1] && y1 <= box[3]) {
                return INSIDE;
            }
            const c = [0, 1];
            if (clipT(box[0] - x1, dx, c) && clipT(x1 - box[2], -dx, c) && clipT(box[1] - y1, dy, c) && clipT(y1 - box[3], -dy, c)) {
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
        return class MapLinks2 {
            constructor(canvas) {
                this.canvas = canvas;
                this.nodesByRight = [];
                this.nodesById = [];
                this.lastPathId = 10000000;
                this.paths = [];
                this.lineSpace = 5;
                this.maxDirectLineDistance = Number.MAX_SAFE_INTEGER;
                this.debug = false;
            }
            isInsideNode(xy) {
                for (let i = 0; i < this.nodesByRight.length; ++i) {
                    const nodeI = this.nodesByRight[i];
                    if (nodeI.node.isPointInside(xy[0], xy[1])) {
                        return nodeI.node;
                    }
                }
                return null;
            }
            findClippedNode(outputXY, inputXY) {
                let closestDistance = Number.MAX_SAFE_INTEGER;
                let closest = null;
                for (let i = 0; i < this.nodesByRight.length; ++i) {
                    const node = this.nodesByRight[i];
                    const clipA = [-1, -1];
                    const clipB = [-1, -1];
                    const clipped = liangBarsky(outputXY, inputXY, node.area, clipA, clipB);
                    if (clipped === INSIDE) {
                        const centerX = (node.area[0] + ((node.area[2] - node.area[0]) / 2));
                        const centerY = (node.area[1] + ((node.area[3] - node.area[1]) / 2));
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
                return { clipped: closest, closestDistance };
            }
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
            mapFinalLink(outputXY, inputXY) {
                // 递归避障主入口
                const { clipped } = this.findClippedNode(outputXY, inputXY);
                if (!clipped) {
                    const dist = Math.sqrt(((outputXY[0] - inputXY[0]) ** 2) + ((outputXY[1] - inputXY[1]) ** 2));
                    if (dist < this.maxDirectLineDistance) {
                        return { path: [outputXY, inputXY] };
                    }
                }
                // 递归避障
                const isBlocked = {};
                const path = this.mapLink(outputXY, inputXY, null, isBlocked, null);
                return { path };
            }
            mapLink(outputXY, inputXY, targetNodeInfo, isBlocked, lastDirection) {
                // 递归避障算法，参考CS/CircuitBoardLines.js
                const { clippedHorz, clippedVert, path } = this._try90and45(outputXY, inputXY);
                if (path) return path;
                const horzDistance = inputXY[0] - outputXY[0];
                const vertDistance = inputXY[1] - outputXY[1];
                const horzDistanceAbs = Math.abs(horzDistance);
                const vertDistanceAbs = Math.abs(vertDistance);
                let blockedNodeId, linesArea, pathAvoidNode, lastPathLocation, thisDirection;
                if (horzDistanceAbs > vertDistanceAbs) {
                    blockedNodeId = clippedHorz && clippedHorz.node.node.id;
                    linesArea = clippedHorz && clippedHorz.node.linesArea;
                    const horzEdge = horzDistance <= 0 ? (linesArea[2]) : (linesArea[0] - 1);
                    pathAvoidNode = [ [outputXY[0], outputXY[1]], [horzEdge, outputXY[1]] ];
                    if (horzDistance <= 0) linesArea[2] += this.lineSpace;
                    else linesArea[0] -= this.lineSpace;
                    const vertDistanceViaBlockTop = Math.abs(inputXY[1] - linesArea[1]) + Math.abs(linesArea[1] - outputXY[1]);
                    const vertDistanceViaBlockBottom = Math.abs(inputXY[1] - linesArea[3]) + Math.abs(linesArea[3] - outputXY[1]);
                    lastPathLocation = [ horzEdge, vertDistanceViaBlockTop <= vertDistanceViaBlockBottom ? (linesArea[1]) : (linesArea[3]) ];
                    const unblockNotPossible1 = this.testPath([...pathAvoidNode, lastPathLocation]);
                    if (unblockNotPossible1) {
                        lastPathLocation = [ horzEdge, vertDistanceViaBlockTop > vertDistanceViaBlockBottom ? (linesArea[1]) : (linesArea[3]) ];
                    }
                    if (lastPathLocation[1] < outputXY[1]) {
                        linesArea[1] -= this.lineSpace;
                        lastPathLocation[1] -= 1;
                    } else {
                        linesArea[3] += this.lineSpace;
                        lastPathLocation[1] += 1;
                    }
                    thisDirection = 'vert';
                } else {
                    blockedNodeId = clippedVert && clippedVert.node.node.id;
                    linesArea = clippedVert && clippedVert.node.linesArea;
                    const vertEdge = vertDistance <= 0 ? (linesArea[3] + 1) : (linesArea[1] - 1);
                    pathAvoidNode = [ [outputXY[0], outputXY[1]], [outputXY[0], vertEdge] ];
                    if (vertDistance <= 0) linesArea[3] += this.lineSpace;
                    else linesArea[1] -= this.lineSpace;
                    const horzDistanceViaBlockLeft = Math.abs(inputXY[0] - linesArea[0]) + Math.abs(linesArea[0] - outputXY[0]);
                    const horzDistanceViaBlockRight = Math.abs(inputXY[0] - linesArea[2]) + Math.abs(linesArea[2] - outputXY[0]);
                    lastPathLocation = [ horzDistanceViaBlockLeft <= horzDistanceViaBlockRight ? (linesArea[0] - 1) : (linesArea[2]), vertEdge ];
                    const unblockNotPossible1 = this.testPath([...pathAvoidNode, lastPathLocation]);
                    if (unblockNotPossible1) {
                        lastPathLocation = [ horzDistanceViaBlockLeft > horzDistanceViaBlockRight ? (linesArea[0]) : (linesArea[2]), vertEdge ];
                    }
                    if (lastPathLocation[0] < outputXY[0]) {
                        linesArea[0] -= this.lineSpace;
                    } else {
                        linesArea[2] += this.lineSpace;
                    }
                    thisDirection = 'horz';
                }
                if (blockedNodeId && isBlocked[blockedNodeId] > 3) {
                    return [outputXY, inputXY];
                }
                if (blockedNodeId) {
                    if (isBlocked[blockedNodeId]) ++isBlocked[blockedNodeId];
                    else isBlocked[blockedNodeId] = 1;
                }
                const nextPath = this.mapLink(lastPathLocation, inputXY, targetNodeInfo, isBlocked, thisDirection);
                return [...pathAvoidNode, lastPathLocation, ...nextPath.slice(1)];
            }
            _try90and45(outputXY, inputXY) {
                // 复用电路板1的90/45度分支
                const horzDistance = inputXY[0] - outputXY[0];
                const vertDistance = inputXY[1] - outputXY[1];
                const horzDistanceAbs = Math.abs(horzDistance);
                const vertDistanceAbs = Math.abs(vertDistance);
                if (horzDistanceAbs > vertDistanceAbs) {
                    const goingLeft = inputXY[0] < outputXY[0];
                    const pathStraight45 = [ outputXY, [inputXY[0] - (goingLeft ? -vertDistanceAbs : vertDistanceAbs), outputXY[1]], inputXY ];
                    if (!this.testPath(pathStraight45)) return { path: pathStraight45 };
                    const path45Straight = [ outputXY, [outputXY[0] + (goingLeft ? -vertDistanceAbs : vertDistanceAbs), inputXY[1]], inputXY ];
                    if (!this.testPath(path45Straight)) return { path: path45Straight };
                } else {
                    const goingUp = inputXY[1] < outputXY[1];
                    const pathStraight45 = [ outputXY, [outputXY[0], inputXY[1] + (goingUp ? horzDistanceAbs : -horzDistanceAbs)], inputXY ];
                    if (!this.testPath(pathStraight45)) return { path: pathStraight45 };
                    const path45Straight = [ outputXY, [inputXY[0], outputXY[1] - (goingUp ? horzDistanceAbs : -horzDistanceAbs)], inputXY ];
                    if (!this.testPath(path45Straight)) return { path: path45Straight };
                }
                const path90Straight = [ outputXY, [outputXY[0], inputXY[1]], inputXY ];
                const clippedVert = this.testPath(path90Straight);
                if (!clippedVert) return { path: path90Straight };
                const pathStraight90 = [ outputXY, [inputXY[0], outputXY[1]], inputXY ];
                const clippedHorz = this.testPath(pathStraight90);
                if (!clippedHorz) return { path: pathStraight90 };
                return { clippedHorz, clippedVert };
            }
            mapLinks(nodesByExecution) {
                if (!this.canvas.graph.links) return;
                this.links = [];
                this.lastPathId = 1000000;
                this.nodesByRight = [];
                this.nodesById = {};
                this.nodesByRight = nodesByExecution.map((node) => {
                    const barea = new Float32Array(4);
                    node.getBounding(barea);
                    const area = [ barea[0], barea[1], barea[0] + barea[2], barea[1] + barea[3] ];
                    const linesArea = Array.from(area);
                    linesArea[0] -= 5;
                    linesArea[1] -= 1;
                    linesArea[2] += 3;
                    linesArea[3] += 3;
                    const obj = { node, area, linesArea };
                    this.nodesById[node.id] = obj;
                    return obj;
                });
                this.paths = [];
                const links = this.canvas.graph.links;
                Object.values(links).forEach(link => {
                    const originNode = this.canvas.graph.getNodeById(link.origin_id);
                    const targetNode = this.canvas.graph.getNodeById(link.target_id);
                    if (!originNode || !targetNode) return;
                    const outputPos = originNode.getConnectionPos(false, link.origin_slot);
                    const inputPos = targetNode.getConnectionPos(true, link.target_slot);
                    const originNodeInfo = this.nodesById[originNode.id];
                    const targetNodeInfo = this.nodesById[targetNode.id];
                    if (!originNodeInfo || !targetNodeInfo) return;
                    const outputXY = [originNodeInfo.linesArea[2], outputPos[1]];
                    const inputXY = [targetNodeInfo.linesArea[0] - 1, inputPos[1]];
                    const { path } = this.mapFinalLink(outputXY, inputXY);
                    if (path) {
                        this.paths.push({
                            path: [outputPos, ...path, inputPos],
                            originNode,
                            targetNode,
                            originSlot: link.origin_slot,
                            targetSlot: link.target_slot,
                            baseColor: link.color
                        });
                    }
                });
            }
            drawLinks(ctx, baseColor) {
                // 复用电路板1的drawLinks
                if (typeof this.__proto__.__proto__.drawLinks === 'function') {
                    return this.__proto__.__proto__.drawLinks.call(this, ctx, baseColor);
                }
            }
        };
    }

    initOverrides(canvas) {
        this.canvas = canvas;
        if (!this._originalDrawConnections) {
            this._originalDrawConnections = canvas.drawConnections;
        }
        this.setEnabled(this.enabled);
    }

    drawAnimation(ctx) {
        if (!this.canvas || !this.canvas.graph || !this.enabled) return;
        const links = this.canvas.graph.links;
        if (!links) return;

        // 修复：支持电路板1和电路板2
        if (this.renderStyle === "电路板1" || this.renderStyle === "电路板2") {
            this._drawCircuitBoardStyle(ctx);
            return;
        }

        const now = performance.now();
        const speedMap = {1: 0.001, 2: 0.002, 3: 0.004};
        let phaseSpeed = speedMap[this.speed] || 0.002;
        const isWave = this.effect === "波浪";
        if (isWave) phaseSpeed *= 0.5;
        if (!this._startTime) this._startTime = now;
        this._phase = ((now - this._startTime) * phaseSpeed) % 1;
        this._lastTime = now;
        ctx.save();
        let outNode, inNode, outPos, inPos, baseColor;
        Object.values(links).forEach(link => {
            outNode = this.canvas.graph.getNodeById(link.origin_id);
            inNode = this.canvas.graph.getNodeById(link.target_id);
            if (!outNode || !inNode) return;
            outPos = outNode.getConnectionPos(false, link.origin_slot);
            inPos = inNode.getConnectionPos(true, link.target_slot);
            baseColor = (outNode.outputs && outNode.outputs[link.origin_slot] && outNode.outputs[link.origin_slot].color)
                || (this.canvas.default_connection_color_byType && outNode.outputs && outNode.outputs[link.origin_slot] && this.canvas.default_connection_color_byType[outNode.outputs[link.origin_slot].type])
                || (this.canvas.default_connection_color && this.canvas.default_connection_color.input_on)
                || "#ff0000";
            // 根据 renderStyle 选择路径类型
            let from = outPos, to = inPos;
            let pathPoints = null;
            if (this.renderStyle === "直线") {
                // 直线：from, to 不变
            } else if (this.renderStyle === "直角线") {
                // 直角线：中间插入拐点
                const mid = [inPos[0], outPos[1]];
                pathPoints = [from, mid, to];
            } else if (this.renderStyle === "曲线") {
                // 曲线：贝塞尔曲线控制点
                const dist = Math.max(Math.abs(inPos[0] - outPos[0]), 40);
                const cp1 = [outPos[0] + dist * 0.5, outPos[1]];
                const cp2 = [inPos[0] - dist * 0.5, inPos[1]];
                pathPoints = [from, cp1, cp2, to];
            }
            if (this.effect === "流动") {
                this.drawFlow(ctx, from, to, baseColor, pathPoints);
            } else if (this.effect === "波浪") {
                this.drawWave(ctx, from, to, baseColor, this._phase, pathPoints);
            } else if (this.effect === "律动") {
                this.drawRhythm(ctx, from, to, baseColor, now, pathPoints);
            } else if (this.effect === "脉冲") {
                this.drawPulse(ctx, from, to, baseColor, now, pathPoints);
            }
        });
        ctx.restore();
    }

    // 新增：绘制电路板风格连线
    _drawCircuitBoardStyle(ctx) {
        if (!this.circuitBoardMap) {
            this._initCircuitBoardMap();
        }

        // 获取节点执行顺序（适用于电路板风格的路由算法）
        const nodesByExecution = this.canvas.graph.computeExecutionOrder() || [];
        
        // 计算所有连线的电路板风格路径
        this.circuitBoardMap.lineSpace = Math.floor(3 + this.lineWidth); // 线间距随线宽调整
        this.circuitBoardMap.mapLinks(nodesByExecution);
        
        // 应用电路板风格动画效果
        ctx.save();
        // 只在无动画时绘制静态线，否则只绘制动画
        if (this.effect !== "流动" && this.effect !== "波浪" && this.effect !== "律动" && this.effect !== "脉冲") {
            this.circuitBoardMap.drawLinks(ctx);
        } else if (this.effect === "流动") {
            this._drawCircuitBoardFlow(ctx);
        } else if (this.effect === "波浪") {
            this._drawCircuitBoardWave(ctx);
        } else if (this.effect === "律动") {
            this._drawCircuitBoardRhythm(ctx);
        } else if (this.effect === "脉冲") {
            this._drawCircuitBoardPulse(ctx);
        }
        
        ctx.restore();
    }

    // 电路板风格 + 流动动画（速度与主样式同步）
    _drawCircuitBoardFlow(ctx) {
        ctx.save();
        ctx.shadowBlur = 0;
        const dashLen = 24, gapLen = 18;
        const dashCycleLen = dashLen + gapLen;
        const now = performance.now();
        if (!this._startTime) this._startTime = now;
        // 与主样式同步速度
        const speedMap = {1: 0.001, 2: 0.002, 3: 0.004};
        const phaseSpeed = speedMap[this.speed] || 0.002;
        this._phase = ((now - this._startTime) * phaseSpeed) % 1;
        const dashOffset = -this._phase * dashCycleLen;
        for (const pathI of this.circuitBoardMap.paths) {
            const path = pathI.path;
            if (path.length <= 1) continue;
            // 获取颜色
            const originNode = pathI.originNode;
            const slotColor = pathI.baseColor || 
                (originNode.outputs && originNode.outputs[pathI.originSlot] && 
                 originNode.outputs[pathI.originSlot].color) ||
                (this.canvas.default_connection_color_byType && 
                 originNode.outputs && originNode.outputs[pathI.originSlot] && 
                 this.canvas.default_connection_color_byType[originNode.outputs[pathI.originSlot].type]) ||
                (this.canvas.default_connection_color && this.canvas.default_connection_color.input_on) ||
                "#FFFFFF";
            ctx.save();
            // 修复：使用_makeFancyGradient创建渐变
            const from = path[0];
            const to = path[path.length - 1];
            const strokeStyle = this.useGradient ? this._makeFancyGradient(ctx, from, to, slotColor) : slotColor;
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = this.lineWidth + 0.5;
            ctx.setLineDash([dashLen, gapLen]);
            ctx.lineDashOffset = dashOffset;
            if (this.effectExtra) {
                ctx.shadowColor = slotColor;
                ctx.shadowBlur = 8 + this.lineWidth * 1.5;
            }
            ctx.beginPath();
            ctx.moveTo(path[0][0], path[0][1]);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i][0], path[i][1]);
            }
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    // 电路板风格 + 波浪动画（同步主样式参数并增加小球）
    _drawCircuitBoardWave(ctx) {
        ctx.save();
        ctx.shadowBlur = 0;
        const now = performance.now();
        if (!this._startTime) this._startTime = now;
        // 与主样式同步速度
        const speedMap = {1: 0.001, 2: 0.002, 3: 0.004};
        const phaseSpeed = speedMap[this.speed] || 0.002;
        this._phase = ((now - this._startTime) * phaseSpeed) % 1;
        for (const pathI of this.circuitBoardMap.paths) {
            const path = pathI.path;
            if (path.length <= 1) continue;
            // 获取颜色
            const originNode = pathI.originNode;
            const slotColor = pathI.baseColor || 
                (originNode.outputs && originNode.outputs[pathI.originSlot] && 
                 originNode.outputs[pathI.originSlot].color) ||
                (this.canvas.default_connection_color_byType && 
                 originNode.outputs && originNode.outputs[pathI.originSlot] && 
                 this.canvas.default_connection_color_byType[originNode.outputs[pathI.originSlot].type]) ||
                (this.canvas.default_connection_color && this.canvas.default_connection_color.input_on) ||
                "#FFFFFF";
            // 采样整条折线路径
            const sampleCount = Math.max(40, Math.floor(this.lineWidth * 18));
            const points = [];
            let totalLen = 0;
            const segLens = [];
            for (let i = 1; i < path.length; i++) {
                const dx = path[i][0] - path[i-1][0];
                const dy = path[i][1] - path[i-1][1];
                const len = Math.hypot(dx, dy);
                segLens.push(len);
                totalLen += len;
            }
            // 波浪参数与主样式同步
            const amplitude = 8 * this.lineWidth / 3;
            const freq = 1 + this.lineWidth / 8;
            // 沿路径采样
            for (let s = 0; s <= sampleCount; s++) {
                const t = s / sampleCount;
                let dist = t * totalLen;
                let segIdx = 0;
                while (segIdx < segLens.length && dist > segLens[segIdx]) {
                    dist -= segLens[segIdx];
                    segIdx++;
                }
                if (segIdx >= segLens.length) {
                    points.push(path[path.length-1]);
                    continue;
                }
                const segT = segLens[segIdx] === 0 ? 0 : dist / segLens[segIdx];
                const x = path[segIdx][0] + (path[segIdx+1][0] - path[segIdx][0]) * segT;
                const y = path[segIdx][1] + (path[segIdx+1][1] - path[segIdx][1]) * segT;
                // 法线方向
                const dx = path[segIdx+1][0] - path[segIdx][0];
                const dy = path[segIdx+1][1] - path[segIdx][0];
                const len = Math.hypot(dx, dy);
                let nx = 0, ny = 0;
                if (len > 0) { nx = -dy/len; ny = dx/len; }
                // 波浪
                const wave = Math.sin(2 * Math.PI * (freq * t + this._phase)) * amplitude;
                points.push([x + nx * wave, y + ny * wave]);
            }
            ctx.save();
            
            // 修复：使用_makeFancyGradient创建渐变
            const from = path[0];
            const to = path[path.length - 1];
            const strokeStyle = this.useGradient ? this._makeFancyGradient(ctx, from, to, slotColor) : slotColor;
            ctx.strokeStyle = strokeStyle;
            
            ctx.lineWidth = this.lineWidth + 0.5;
            if (this.effectExtra) {
                ctx.shadowColor = slotColor;
                ctx.shadowBlur = 8 + this.lineWidth * 1.5;
            }
            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i][0], points[i][1]);
            }
            ctx.stroke();
            ctx.restore();
            // 小球动画
            const ballT = this._phase % 1;
            let ballDist = ballT * totalLen;
            let segIdx = 0;
            while (segIdx < segLens.length && ballDist > segLens[segIdx]) {
                ballDist -= segLens[segIdx];
                segIdx++;
            }
            if (segIdx >= segLens.length) segIdx = segLens.length - 1;
            const segT = segLens[segIdx] === 0 ? 0 : ballDist / segLens[segIdx];
            const bx = path[segIdx][0] + (path[segIdx+1][0] - path[segIdx][0]) * segT;
            const by = path[segIdx][1] + (path[segIdx+1][1] - path[segIdx][1]) * segT;
            // 法线方向
            const dx = path[segIdx+1][0] - path[segIdx][0];
            const dy = path[segIdx+1][1] - path[segIdx][0];
            const len = Math.hypot(dx, dy);
            let nx = 0, ny = 0;
            if (len > 0) { nx = -dy/len; ny = dx/len; }
            const wave = Math.sin(2 * Math.PI * (freq * (ballT) + this._phase)) * amplitude;
            const wx = bx + nx * wave;
            const wy = by + ny * wave;
            ctx.save();
            ctx.beginPath();
            ctx.arc(wx, wy, 6 + this.lineWidth * 1.5, 0, 2 * Math.PI);
            ctx.fillStyle = strokeStyle; // 修复：使用渐变颜色
            ctx.globalAlpha = 0.95;
            if (this.effectExtra) {
                ctx.shadowColor = slotColor;
                ctx.shadowBlur = 16 + this.lineWidth * 2;
            }
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    // 电路板风格 + 律动动画（主线+小球）
    _drawCircuitBoardRhythm(ctx) {
        let period = 3000;
        if (this.speed === 1) period = 6000;
        else if (this.speed === 2) period = 3000;
        else if (this.speed === 3) period = 1500;
        const now = performance.now();
        const t = ((now % period) / period);
        for (const pathI of this.circuitBoardMap.paths) {
            const path = pathI.path;
            if (path.length <= 1) continue;
            // 获取颜色
            const originNode = pathI.originNode;
            const slotColor = pathI.baseColor || 
                (originNode.outputs && originNode.outputs[pathI.originSlot] && 
                 originNode.outputs[pathI.originSlot].color) ||
                (this.canvas.default_connection_color_byType && 
                 originNode.outputs && originNode.outputs[pathI.originSlot] && 
                 this.canvas.default_connection_color_byType[originNode.outputs[pathI.originSlot].type]) ||
                (this.canvas.default_connection_color && this.canvas.default_connection_color.input_on) ||
                "#FFFFFF";
            // 修复：使用_makeFancyGradient创建渐变
            const from = path[0];
            const to = path[path.length - 1];
            const strokeStyle = this.useGradient ? this._makeFancyGradient(ctx, from, to, slotColor) : slotColor;
            
            // 主线
            ctx.save();
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = this.lineWidth + 0.5;
            if (this.effectExtra) {
                ctx.shadowColor = slotColor;
                ctx.shadowBlur = 8 + this.lineWidth * 1.5;
            }
            ctx.beginPath();
            ctx.moveTo(path[0][0], path[0][1]);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i][0], path[i][1]);
            }
            ctx.stroke();
            ctx.restore();
            // 小球沿路径运动
            // 采样折线路径
            const sampleCount = Math.max(40, Math.floor(this.lineWidth * 18));
            let totalLen = 0;
            const segLens = [];
            for (let i = 1; i < path.length; i++) {
                const dx = path[i][0] - path[i-1][0];
                const dy = path[i][1] - path[i-1][1];
                const len = Math.hypot(dx, dy);
                segLens.push(len);
                totalLen += len;
            }
            let dist = t * totalLen;
            let segIdx = 0;
            while (segIdx < segLens.length && dist > segLens[segIdx]) {
                dist -= segLens[segIdx];
                segIdx++;
            }
            if (segIdx >= segLens.length) segIdx = segLens.length - 1;
            const segT = segLens[segIdx] === 0 ? 0 : dist / segLens[segIdx];
            const x = path[segIdx][0] + (path[segIdx+1][0] - path[segIdx][0]) * segT;
            const y = path[segIdx][1] + (path[segIdx+1][1] - path[segIdx][1]) * segT;
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, 6 + this.lineWidth * 1.5, 0, 2 * Math.PI);
            ctx.fillStyle = strokeStyle; // 使用渐变颜色
            ctx.globalAlpha = 0.95;
            if (this.effectExtra) {
                ctx.shadowColor = slotColor;
                ctx.shadowBlur = 16 + this.lineWidth * 2;
            }
            ctx.fill();
            ctx.restore();
        }
    }

    // 电路板风格 + 脉冲动画（主线+脉冲高亮带）
    _drawCircuitBoardPulse(ctx) {
        ctx.save();
        let period = 2000;
        if (this.speed === 1) period = 4000;
        else if (this.speed === 2) period = 2000;
        else if (this.speed === 3) period = 1000;
        const now = performance.now();
        const t = ((now % period) / period); // 0~1
        const waveCenter = t;
        const waveWidth = 0.1;
        for (const pathI of this.circuitBoardMap.paths) {
            const path = pathI.path;
            if (path.length <= 1) continue;
            // 获取颜色
            const originNode = pathI.originNode;
            const slotColor = pathI.baseColor || 
                (originNode.outputs && originNode.outputs[pathI.originSlot] && 
                 originNode.outputs[pathI.originSlot].color) ||
                (this.canvas.default_connection_color_byType && 
                 originNode.outputs && originNode.outputs[pathI.originSlot] && 
                 this.canvas.default_connection_color_byType[originNode.outputs[pathI.originSlot].type]) ||
                (this.canvas.default_connection_color && this.canvas.default_connection_color.input_on) ||
                "#FFFFFF";
                
            // 修复：使用_makeFancyGradient创建渐变
            const from = path[0];
            const to = path[path.length - 1];
            const strokeStyle = this.useGradient ? this._makeFancyGradient(ctx, from, to, slotColor) : slotColor;
            
            // 主线
            ctx.save();
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = this.lineWidth + 0.5;
            if (this.effectExtra) {
                ctx.shadowColor = slotColor;
                ctx.shadowBlur = 8 + this.lineWidth * 1.5;
            }
            ctx.beginPath();
            ctx.moveTo(path[0][0], path[0][1]);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i][0], path[i][1]);
            }
            ctx.stroke();
            ctx.restore();
            // 脉冲高亮带
            const sampleCount = Math.max(40, Math.floor(this.lineWidth * 18));
            let totalLen = 0;
            const segLens = [];
            for (let i = 1; i < path.length; i++) {
                const dx = path[i][0] - path[i-1][0];
                const dy = path[i][1] - path[i-1][1];
                const len = Math.hypot(dx, dy);
                segLens.push(len);
                totalLen += len;
            }
            ctx.save();
            ctx.strokeStyle = strokeStyle; // 修复：使用渐变颜色
            ctx.lineWidth = this.lineWidth * 2.2;
            ctx.globalAlpha = 0.92;
            if (this.effectExtra) {
                ctx.shadowColor = slotColor;
                ctx.shadowBlur = 24 + this.lineWidth * 2;
            }
            ctx.beginPath();
            let started = false;
            for (let s = 0; s <= sampleCount; s++) {
                const tt = s / sampleCount;
                let dist = tt * totalLen;
                let segIdx = 0;
                while (segIdx < segLens.length && dist > segLens[segIdx]) {
                    dist -= segLens[segIdx];
                    segIdx++;
                }
                if (segIdx >= segLens.length) segIdx = segLens.length - 1;
                const segT = segLens[segIdx] === 0 ? 0 : dist / segLens[segIdx];
                const x = path[segIdx][0] + (path[segIdx+1][0] - path[segIdx][0]) * segT;
                const y = path[segIdx][1] + (path[segIdx+1][1] - path[segIdx][1]) * segT;
                let d = Math.abs(tt - waveCenter);
                if (d > 0.5) d = 1 - d;
                if (d < waveWidth/2) {
                    if (!started) { ctx.moveTo(x, y); started = true; }
                    else ctx.lineTo(x, y);
                } else {
                    started = false;
                }
            }
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    // 自动生成“主色→浅主色→同色系随机颜色→深主色→主色”渐变，主色为 baseColor
    _makeFancyGradient(ctx, from, to, baseColor) {
        if (!this.useGradient) {
            return baseColor;
        }
        // 将 baseColor 转为 HSL
        function hexToHSL(hex) {
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex.split('').map(x=>x+x).join('');
            const r = parseInt(hex.substring(0,2),16)/255;
            const g = parseInt(hex.substring(2,4),16)/255;
            const b = parseInt(hex.substring(4,6),16)/255;
            const max = Math.max(r,g,b), min = Math.min(r,g,b);
            let h,s,l = (max+min)/2;
            if(max===min){h=s=0;}else{
                const d = max-min;
                s = l>0.5 ? d/(2-max-min) : d/(max+min);
                switch(max){
                    case r: h=(g-b)/d+(g<b?6:0);break;
                    case g: h=(b-r)/d+2;break;
                    case b: h=(r-g)/d+4;break;
                }
                h/=6;
            }
            return {h: h*360, s: s*100, l: l*100};
        }
        function hslToHex(h,s,l){
            s/=100; l/=100;
            let c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2, r=0,g=0,b=0;
            if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
            r=Math.round((r+m)*255);g=Math.round((g+m)*255);b=Math.round((b+m)*255);
            return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
        }
        // 主色HSL
        const hsl = hexToHSL(baseColor);
        // 浅主色（亮度+22，饱和-16）
        const lightMain = hslToHex(hsl.h, Math.max(0, hsl.s-16), Math.min(100, hsl.l+22));
        // 固定提升同色系（色相+32°，饱和+28，亮度+18）
        const fixedH = (hsl.h + 32) % 360;
        const fixedS = Math.max(0, Math.min(100, hsl.s + 28));
        const fixedL = Math.max(0, Math.min(100, hsl.l + 18));
        const randomColor = hslToHex(fixedH, fixedS, fixedL);
        // 深主色（亮度-28，饱和+24）
        const darkMain = hslToHex(hsl.h, Math.min(100, hsl.s+24), Math.max(0, hsl.l-28));
        const grad = ctx.createLinearGradient(from[0], from[1], to[0], to[1]);
        grad.addColorStop(0, baseColor);
        grad.addColorStop(0.25, lightMain);
        grad.addColorStop(0.5, randomColor);
        grad.addColorStop(0.75, darkMain);
        grad.addColorStop(1, baseColor);
        return grad;
    }

    drawFlow(ctx, from, to, baseColor, pathPoints) {
        ctx.save();
        let grad = this._makeFancyGradient(ctx, from, to, baseColor);
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.lineWidth;
        ctx.globalAlpha = 0.85;
        const dashLen = 24, gapLen = 18;
        const dashCycleLen = dashLen + gapLen;
        const phase = this._phase;
        const dashOffset = -phase * dashCycleLen;
        ctx.setLineDash([dashLen, gapLen]);
        ctx.lineDashOffset = dashOffset;
        if (this.effectExtra) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 8 + this.lineWidth * 2;
        }
        ctx.beginPath();
        if (!pathPoints) {
            ctx.moveTo(from[0], from[1]);
            ctx.lineTo(to[0], to[1]);
        } else if (pathPoints.length === 3) {
            ctx.moveTo(pathPoints[0][0], pathPoints[0][1]);
            ctx.lineTo(pathPoints[1][0], pathPoints[1][1]);
            ctx.lineTo(pathPoints[2][0], pathPoints[2][1]);
        } else if (pathPoints.length === 4) {
            ctx.moveTo(pathPoints[0][0], pathPoints[0][1]);
            ctx.bezierCurveTo(
                pathPoints[1][0], pathPoints[1][1],
                pathPoints[2][0], pathPoints[2][1],
                pathPoints[3][0], pathPoints[3][1]
            );
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // 已去除三角形箭头绘制，避免渲染异常
        // 端点光晕
        if (this.effectExtra) {
            ctx.beginPath();
            ctx.arc(from[0], from[1], 2 + this.lineWidth, 0, 2 * Math.PI);
            ctx.arc(to[0], to[1], 2 + this.lineWidth, 0, 2 * Math.PI);
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = 0.5;
            ctx.shadowBlur = 12 + this.lineWidth * 2;
            ctx.fill();
        }
        ctx.restore();
    }

    drawWave(ctx, from, to, baseColor, phase, pathPoints) {
        if (pathPoints && pathPoints.length === 3) {
            // 直角线分两段波浪
            this._drawWaveSegment(ctx, pathPoints[0], pathPoints[1], baseColor, phase);
            this._drawWaveSegment(ctx, pathPoints[1], pathPoints[2], baseColor, phase);
            return;
        } else if (pathPoints && pathPoints.length === 4) {
            // 贝塞尔曲线波浪
            this._drawWaveBezier(ctx, pathPoints[0], pathPoints[1], pathPoints[2], pathPoints[3], baseColor, phase);
            return;
        }
        // 默认直线波浪
        this._drawWaveSegment(ctx, from, to, baseColor, phase);
    }

    _drawWaveSegment(ctx, from, to, baseColor, phase) {
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const len = Math.hypot(dx, dy);
        const points = Math.max(20, Math.floor(len / 8));
        const amplitude = 8 * this.lineWidth / 3;
        const freq = 1 + this.lineWidth / 8;
        ctx.save();
        let grad = this._makeFancyGradient(ctx, from, to, baseColor);
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.lineWidth + Math.sin((phase ?? this._phase) * 2 * Math.PI) * 0.5;
        if (this.effectExtra) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 10 + this.lineWidth * 2;
        }
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        let nx = -dy / len, ny = dx / len;
        const ph = phase ?? this._phase;
        for (let i = 0; i <= points; i++) {
            const t = i / points;
            const x = from[0] + dx * t;
            const y = from[1] + dy * t;
            const wave = Math.sin(2 * Math.PI * (freq * t + ph)) * amplitude;
            const wx = x + nx * wave;
            const wy = y + ny * wave;
            if (i === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
        }
        ctx.stroke();
        ctx.restore();
        // 小球动画
        const t = (phase ?? this._phase) % 1;
        const ballT = t;
        const ballIndex = Math.floor(points * ballT);
        nx = -dy / len; ny = dx / len;
        const ball_t = ballIndex / points;
        const x = from[0] + dx * ball_t;
        const y = from[1] + dy * ball_t;
        const wave = Math.sin(2 * Math.PI * (freq * ball_t + ph)) * amplitude;
        const wx = x + nx * wave;
        const wy = y + ny * wave;
        ctx.save();
        ctx.beginPath();
        ctx.arc(wx, wy, 6 + this.lineWidth * 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.95;
        if (this.effectExtra) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 16 + this.lineWidth * 2;
        }
        ctx.fill();
        ctx.restore();
    }

    drawRhythm(ctx, from, to, baseColor, now, pathPoints) {
        if (pathPoints && pathPoints.length === 3) {
            this._drawRhythmSegment(ctx, pathPoints[0], pathPoints[1], baseColor, now);
            this._drawRhythmSegment(ctx, pathPoints[1], pathPoints[2], baseColor, now);
            return;
        } else if (pathPoints && pathPoints.length === 4) {
            this._drawRhythmBezier(ctx, pathPoints[0], pathPoints[1], pathPoints[2], pathPoints[3], baseColor, now);
            return;
        }
        this._drawRhythmSegment(ctx, from, to, baseColor, now);
    }

    // 贝塞尔曲线律动效果
    _drawRhythmBezier(ctx, p0, p1, p2, p3, baseColor, now) {
        let period = 3000;
        if (this.speed === 1) period = 6000;
        else if (this.speed === 2) period = 3000;
        else if (this.speed === 3) period = 1500;
        const t = ((now % period) / period);

        // 绘制基础贝塞尔曲线
        ctx.save();
        let grad = this._makeFancyGradient(ctx, p0, p3, baseColor);
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.lineWidth;
        ctx.globalAlpha = 0.85;
        if (this.effectExtra) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 8 + this.lineWidth * 2;
        }
        ctx.stroke();
        ctx.restore();

        // 计算小球位置
        const ballPoint = this._getBezierPoint(t, p0, p1, p2, p3);
        
        // 绘制小球
        ctx.save();
        ctx.beginPath();
        ctx.arc(ballPoint[0], ballPoint[1], 6 + this.lineWidth * 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.95;
        if (this.effectExtra) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 16 + this.lineWidth * 2;
        }
        ctx.fill();
        ctx.restore();
    }

    _drawRhythmSegment(ctx, from, to, baseColor, now) {
        let period = 3000;
        if (this.speed === 1) period = 6000;
        else if (this.speed === 2) period = 3000;
        else if (this.speed === 3) period = 1500;
        const t = ((now % period) / period);
        ctx.save();
        let grad = this._makeFancyGradient(ctx, from, to, baseColor);
        ctx.beginPath();
        ctx.moveTo(from[0], from[1]);
        ctx.lineTo(to[0], to[1]);
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.lineWidth;
        ctx.globalAlpha = 0.85;
        if (this.effectExtra) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 8 + this.lineWidth * 2;
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.restore();
        // 小球
        const x = from[0] + (to[0] - from[0]) * t;
        const y = from[1] + (to[1] - from[1]) * t;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 6 + this.lineWidth * 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.95;
        if (this.effectExtra) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 16 + this.lineWidth * 2;
        }
        ctx.fill();
        ctx.restore();
    }

    // 计算贝塞尔曲线上的点
    _getBezierPoint(t, p0, p1, p2, p3) {
        const mt = 1 - t;
        return [
            mt*mt*mt * p0[0] + 3*mt*mt*t * p1[0] + 3*mt*t*t * p2[0] + t*t*t * p3[0],
            mt*mt*mt * p0[1] + 3*mt*mt*t * p1[1] + 3*mt*t*t * p2[1] + t*t*t * p3[1]
        ];
    }

    // 计算贝塞尔曲线上某点的切线方向
    _getBezierTangent(t, p0, p1, p2, p3) {
        const mt = 1 - t;
        const x = 3*mt*mt * (p1[0] - p0[0]) + 6*mt*t * (p2[0] - p1[0]) + 3*t*t * (p3[0] - p2[0]);
        const y = 3*mt*mt * (p1[1] - p0[1]) + 6*mt*t * (p2[1] - p1[1]) + 3*t*t * (p3[1] - p2[1]);
        const len = Math.sqrt(x*x + y*y);
        return len > 0 ? [x/len, y/len] : [0, 0];
    }

    // 计算贝塞尔曲线上某点的法线方向
    _getBezierNormal(t, p0, p1, p2, p3) {
        const tangent = this._getBezierTangent(t, p0, p1, p2, p3);
        return [-tangent[1], tangent[0]]; // 切线顺时针旋转90度得到法线
    }

    // 贝塞尔曲线波浪效果
    _drawWaveBezier(ctx, p0, p1, p2, p3, baseColor, phase) {
        const points = 50; // 贝塞尔曲线采样点数
        const amplitude = 8 * this.lineWidth / 3;
        const freq = 1 + this.lineWidth / 8;
        const ph = phase ?? this._phase;

        ctx.save();
        let grad = this._makeFancyGradient(ctx, p0, p3, baseColor);
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.lineWidth + Math.sin(ph * 2 * Math.PI) * 0.5;
        if (this.effectExtra) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 10 + this.lineWidth * 2;
        }
        ctx.globalAlpha = 0.85;
        ctx.beginPath();

        // 生成波浪效果的贝塞尔曲线
        for (let i = 0; i <= points; i++) {
            const t = i / points;
            // 计算曲线上的基础点
            const point = this._getBezierPoint(t, p0, p1, p2, p3);
            // 计算该点的法线方向
            const normal = this._getBezierNormal(t, p0, p1, p2, p3);
            // 添加波浪效果
            const wave = Math.sin(2 * Math.PI * (freq * t + ph)) * amplitude;
            const wx = point[0] + normal[0] * wave;
            const wy = point[1] + normal[1] * wave;
            
            if (i === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
        }
        ctx.stroke();
        ctx.restore();

        // 小球动画
        const ballT = ph % 1;
        const ballPoint = this._getBezierPoint(ballT, p0, p1, p2, p3);
        const ballNormal = this._getBezierNormal(ballT, p0, p1, p2, p3);
        const wave = Math.sin(2 * Math.PI * (freq * ballT + ph)) * amplitude;
        const wx = ballPoint[0] + ballNormal[0] * wave;
        const wy = ballPoint[1] + ballNormal[1] * wave;

        ctx.save();
        ctx.beginPath();
        ctx.arc(wx, wy, 6 + this.lineWidth * 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.95;
        if (this.effectExtra) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 16 + this.lineWidth * 2;
        }
        ctx.fill();
        ctx.restore();
    }

    // 脉冲动画修正：冲击波始终单向流动（输出端→输入端），每周期只正向流动一次
    drawPulse(ctx, from, to, baseColor, now, pathPoints) {
        // 脉冲周期（ms）
        let period = 2000;
        if (this.speed === 1) period = 4000;
        else if (this.speed === 2) period = 2000;
        else if (this.speed === 3) period = 1000;
        const t = ((now % period) / period); // 0~1
        // 冲击波中心直接用 t，保证单向流动
        const waveCenter = t; // 冲击波中心（0~1）
        const waveWidth = 0.18; // 冲击波带宽（0~1），更宽
        // 路径采样点数
        const sampleCount = pathPoints && pathPoints.length === 4 ? 64 : 48;
        // 路径采样函数
        let getPoint;
        if (pathPoints && pathPoints.length === 4) {
            getPoint = (tt) => this._getBezierPoint(tt, pathPoints[0], pathPoints[1], pathPoints[2], pathPoints[3]);
        } else if (pathPoints && pathPoints.length === 3) {
            const [p0, p1, p2] = pathPoints;
            getPoint = (tt) => {
                if (tt <= 0.5) {
                    const t2 = tt * 2;
                    return [p0[0] + (p1[0]-p0[0])*t2, p0[1] + (p1[1]-p0[1])*t2];
                } else {
                    const t2 = (tt-0.5)*2;
                    return [p1[0] + (p2[0]-p1[0])*t2, p1[1] + (p2[1]-p1[1])*t2];
                }
            };
        } else {
            getPoint = (tt) => [from[0] + (to[0]-from[0])*tt, from[1] + (to[1]-from[1])*tt];
        }
        // 先绘制更亮的主脉冲线
        ctx.save();
        let grad = this._makeFancyGradient(ctx, from, to, baseColor);
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.lineWidth + 0.5 * this.lineWidth * 1.5;
        ctx.globalAlpha = 0.7 + 0.5 * 0.5;
        if (this.effectExtra) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 10 + this.lineWidth * 2;
        }
        ctx.beginPath();
        for (let i = 0; i <= sampleCount; i++) {
            const tt = i / sampleCount;
            const p = getPoint(tt);
            if (i === 0) ctx.moveTo(p[0], p[1]);
            else ctx.lineTo(p[0], p[1]);
        }
        ctx.stroke();
        ctx.restore();
        // 冲击波高亮带（更宽、更亮、发光）
        ctx.save();
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = this.lineWidth * 2.2;
        ctx.globalAlpha = 0.92;
        if (this.effectExtra) {
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 24 + this.lineWidth * 2;
        }
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= sampleCount; i++) {
            const tt = i / sampleCount;
            let d = Math.abs(tt - waveCenter);
            if (d > 0.5) d = 1 - d;
            if (d < waveWidth/2) {
                const p = getPoint(tt);
                if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
                else ctx.lineTo(p[0], p[1]);
            } else {
                started = false;
            }
        }
        ctx.stroke();
        ctx.restore();
        // 冲击波边缘高光（可选，增强立体感）
        ctx.save();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = this.lineWidth * 0.7;
        ctx.globalAlpha = 0.25 + 0.25 * 0.5;
        ctx.beginPath();
        started = false;
        for (let i = 0; i <= sampleCount; i++) {
            const tt = i / sampleCount;
            let d = Math.abs(tt - waveCenter);
            if (d > 0.5) d = 1 - d;
            if (d < waveWidth/2) {
                const p = getPoint(tt);
                if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
                else ctx.lineTo(p[0], p[1]);
            } else {
                started = false;
            }
        }
        ctx.stroke();
        ctx.restore();
        // 端点脉冲光晕
        if (this.effectExtra) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(from[0], from[1], 2 + this.lineWidth, 0, 2 * Math.PI);
            ctx.arc(to[0], to[1], 2 + this.lineWidth, 0, 2 * Math.PI);
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = 0.4 + 0.4 * 0.5;
            ctx.shadowBlur = 16 + this.lineWidth * 2;
            ctx.fill();
            ctx.restore();
        }
    }
}

export const DEFAULT_CONFIG = {
    enabled: false,
    lineWidth: 3,
    effect: "流动"
};
