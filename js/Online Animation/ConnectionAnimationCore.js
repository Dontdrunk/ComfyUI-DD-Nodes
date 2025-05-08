// 动画核心模块，只包含动画逻辑和默认配置
import { FlowEffect } from './effects/FlowEffect.js';
import { WaveEffect } from './effects/WaveEffect.js';
import { RhythmEffect } from './effects/RhythmEffect.js';
import { PulseEffect } from './effects/PulseEffect.js';

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
        
        // 动画效果实例
        this.effectInstances = {
            "流动": new FlowEffect(this),
            "波浪": new WaveEffect(this),
            "律动": new RhythmEffect(this),
            "脉冲": new PulseEffect(this)
        };
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
                    // 兼容性修改：检查当前的 drawConnections 是否是我们设置的函数
                    // 如果是，才恢复原始函数，否则可能是其他插件（如 cg-use-everywhere）设置的
                    const currentDrawConnections = this.canvas.drawConnections;
                    const isOurFunction = currentDrawConnections.toString().includes('self.drawAnimation');
                    if (isOurFunction) {
                        this.canvas.drawConnections = this._originalDrawConnections;
                    }
                    // 不再需要保持引用
                    this._originalDrawConnections = null;
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
        // 所有渲染样式现在共用路径计算机制
        // 只有电路板样式需要初始化额外的地图
        if ((this.renderStyle === "电路板1" || this.renderStyle === "电路板2") && this.canvas) {
            // 强制重建MapLinks
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

    // =============== 路径计算层 ===============
    
    // 统一路径计算入口
    _calculatePaths() {
        // 存储所有连线的路径数据
        const pathsData = [];
        
        // 电路板样式使用地图路由算法计算路径
        if (this.renderStyle === "电路板1" || this.renderStyle === "电路板2") {
            if (!this.circuitBoardMap) {
                this._initCircuitBoardMap();
            }

            // 获取节点执行顺序（适用于电路板风格的路由算法）
            const nodesByExecution = this.canvas.graph.computeExecutionOrder() || [];
            
            // 计算所有连线的电路板风格路径
            this.circuitBoardMap.lineSpace = Math.floor(3 + this.lineWidth); // 线间距随线宽调整
            this.circuitBoardMap.mapLinks(nodesByExecution);
            
            // 将电路板风格的路径转换为统一格式
            for (const pathI of this.circuitBoardMap.paths) {
                const path = pathI.path;
                if (path.length <= 1) continue;
                
                // 获取连线颜色
                const originNode = pathI.originNode;
                const slotColor = pathI.baseColor || 
                    (originNode.outputs && originNode.outputs[pathI.originSlot] && 
                     originNode.outputs[pathI.originSlot].color) ||
                    (this.canvas.default_connection_color_byType && 
                     originNode.outputs && originNode.outputs[pathI.originSlot] && 
                     this.canvas.default_connection_color_byType[originNode.outputs[pathI.originSlot].type]) ||
                    (this.canvas.default_connection_color && this.canvas.default_connection_color.input_on) ||
                    "#FFFFFF";
                
                // 添加统一格式的路径数据
                pathsData.push({
                    path: path,
                    type: "circuitboard",
                    from: path[0],
                    to: path[path.length-1],
                    baseColor: slotColor
                });
            }
            
            return pathsData;
        }
        
        // 标准样式（直线、直角线、曲线）路径计算
        const links = this.canvas.graph.links;
        if (!links) return pathsData;
        
        // 只处理可见连线
        Object.values(links).forEach(link => {
            const outNode = this.canvas.graph.getNodeById(link.origin_id);
            const inNode = this.canvas.graph.getNodeById(link.target_id);
            if (!outNode || !inNode) return;
            
            const outPos = outNode.getConnectionPos(false, link.origin_slot);
            const inPos = inNode.getConnectionPos(true, link.target_slot);
            
            const baseColor = (outNode.outputs && outNode.outputs[link.origin_slot] && outNode.outputs[link.origin_slot].color)
                || (this.canvas.default_connection_color_byType && outNode.outputs && outNode.outputs[link.origin_slot] && this.canvas.default_connection_color_byType[outNode.outputs[link.origin_slot].type])
                || (this.canvas.default_connection_color && this.canvas.default_connection_color.input_on)
                || "#ff0000";
            
            let pathPoints = null;
            let pathType = "direct";
            
            if (this.renderStyle === "直线") {
                // 直线：from, to 不变
                pathPoints = [outPos, inPos];
            } else if (this.renderStyle === "直角线") {
                // 直角线：中间插入拐点
                const mid = [inPos[0], outPos[1]];
                pathPoints = [outPos, mid, inPos];
                pathType = "angled";
            } else if (this.renderStyle === "曲线") {
                // 曲线：贝塞尔曲线控制点
                const dist = Math.max(Math.abs(inPos[0] - outPos[0]), 40);
                const cp1 = [outPos[0] + dist * 0.5, outPos[1]];
                const cp2 = [inPos[0] - dist * 0.5, inPos[1]];
                pathPoints = [outPos, cp1, cp2, inPos];
                pathType = "bezier";
            }
            
            pathsData.push({
                path: pathPoints,
                type: pathType,
                from: outPos,
                to: inPos,
                baseColor: baseColor
            });
        });
        
        return pathsData;
    }

    // =============== 统一动画绘制层 ===============

    // 总体动画绘制入口
    drawAnimation(ctx) {
        if (!this.canvas || !this.canvas.graph || !this.enabled) return;
        const links = this.canvas.graph.links;
        if (!links) return;

        // 更新时间和相位
        const now = performance.now();
        const speedMap = {1: 0.001, 2: 0.002, 3: 0.004};
        let phaseSpeed = speedMap[this.speed] || 0.002;
        const isWave = this.effect === "波浪";
        if (isWave) phaseSpeed *= 0.5;
        if (!this._startTime) this._startTime = now;
        this._phase = ((now - this._startTime) * phaseSpeed) % 1;
        this._lastTime = now;

        // 统一计算所有连线路径
        const pathsData = this._calculatePaths();

        // 应用选择的动画效果到所有路径
        ctx.save();
        
        // 获取当前效果实例
        const effectInstance = this.effectInstances[this.effect];
        if (!effectInstance) {
            // 无效效果，绘制静态线
            for (const pathData of pathsData) {
                this._drawStaticPath(ctx, pathData);
            }
        } else {
            // 使用效果实例绘制动画
            for (const pathData of pathsData) {
                effectInstance.draw(ctx, pathData, now, this._phase);
            }
        }
        
        ctx.restore();
    }

    // 统一的静态路径绘制（备用，当效果不存在时使用）
    _drawStaticPath(ctx, pathData) {
        ctx.save();
        
        // 颜色（支持渐变）
        const strokeStyle = this.useGradient ? 
            this._makeFancyGradient(ctx, pathData.from, pathData.to, pathData.baseColor) : 
            pathData.baseColor;
        
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = this.lineWidth;
        ctx.globalAlpha = 0.85;
        
        if (this.effectExtra) {
            ctx.shadowColor = pathData.baseColor;
            ctx.shadowBlur = 8 + this.lineWidth * 1.5;
        }
        
        ctx.beginPath();
        
        if (pathData.type === "bezier") {
            // 贝塞尔曲线
            const p = pathData.path;
            ctx.moveTo(p[0][0], p[0][1]);
            ctx.bezierCurveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]);
        } else {
            // 线段路径
            ctx.moveTo(pathData.path[0][0], pathData.path[0][1]);
            for (let i = 1; i < pathData.path.length; i++) {
                ctx.lineTo(pathData.path[i][0], pathData.path[i][1]);
            }
        }
        
        ctx.stroke();
        ctx.restore();
    }

    // 统一的路径采样函数，将任何路径类型转换为均匀采样点
    _samplePath(pathData, sampleCount = 50) {
        // --- 路径采样缓存与脏标记机制 ---
        if (!pathData) return [];
        // 生成cacheKey，包含路径点、类型、采样数、线宽、渲染样式等
        const cacheKey = JSON.stringify({
            path: pathData.path,
            type: pathData.type,
            sampleCount,
            lineWidth: this.lineWidth,
            renderStyle: this.renderStyle
        });
        if (!pathData._sampleCache) pathData._sampleCache = {};
        // 如果cacheKey未变且有缓存，直接返回
        if (pathData._sampleCache.key === cacheKey && pathData._sampleCache.samples) {
            return pathData._sampleCache.samples;
        }
        // 重新采样
        const samples = [];
        if (!pathData.path || pathData.path.length < 2) {
            pathData._sampleCache = { key: cacheKey, samples };
            return samples;
        }
        if (pathData.type === "bezier") {
            const [p0, p1, p2, p3] = pathData.path;
            for (let i = 0; i <= sampleCount; i++) {
                const t = i / sampleCount;
                samples.push(this._getBezierPoint(t, p0, p1, p2, p3));
            }
        } else {
            const path = pathData.path;
            let totalLength = 0;
            const segLengths = [];
            for (let i = 1; i < path.length; i++) {
                const dx = path[i][0] - path[i-1][0];
                const dy = path[i][1] - path[i-1][1];
                const len = Math.sqrt(dx*dx + dy*dy);
                segLengths.push(len);
                totalLength += len;
            }
            for (let i = 0; i <= sampleCount; i++) {
                const t = i / sampleCount;
                let targetDist = t * totalLength;
                let currDist = 0;
                let segIdx = 0;
                while (segIdx < segLengths.length && currDist + segLengths[segIdx] < targetDist) {
                    currDist += segLengths[segIdx];
                    segIdx++;
                }
                if (segIdx >= segLengths.length) {
                    samples.push([...path[path.length-1]]);
                } else {
                    const segT = segLengths[segIdx] === 0 ? 0 : (targetDist - currDist) / segLengths[segIdx];
                    const p1 = path[segIdx];
                    const p2 = path[segIdx+1];
                    samples.push([
                        p1[0] + (p2[0] - p1[0]) * segT,
                        p1[1] + (p2[1] - p1[1]) * segT
                    ]);
                }
            }
        }
        // 写入缓存
        pathData._sampleCache = { key: cacheKey, samples };
        return samples;
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

    // 自动生成"主色→浅主色→同色系随机颜色→深主色→主色"渐变，主色为 baseColor
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
                        lastPathLocation = [ horzDistanceViaBlockLeft > horzDistanceViaBlockRight ? (linesArea[0]) : (linesArea[2]) ];
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

    // =============== 统一的路径采样点数量 ===============
    /**
     * 返回动画类型的推荐采样点数量（受采样强度设置影响）
     * @param {string} effectType - 动画类型（"波浪"/"脉冲"/"律动"/"流动"）
     * @returns {number} 采样点数量
     */
    getDynamicSampleCount(effectType) {
        // 采样强度：1=低，2=中，3=高
        const level = this.samplingLevel || 2;
        const table = {
            "波浪":   [40, 60, 80],   
            "脉冲":   [40, 60, 80],  
            "律动":   [40, 60, 80], 
            "流动":   [30, 40, 50],   
        };
        const arr = table[effectType] || [40, 60, 80];
        return arr[Math.max(0, Math.min(2, level-1))];
    }
    
    /**
     * 设置采样强度等级（1/2/3）
     */
    setSamplingLevel(level) {
        this.samplingLevel = Math.max(1, Math.min(3, level));
    }

    initOverrides(canvas) {
        this.canvas = canvas;
        if (!this._originalDrawConnections) {
            this._originalDrawConnections = canvas.drawConnections;
        }
        this.setEnabled(this.enabled);
    }
}

export const DEFAULT_CONFIG = {
    enabled: false,
    lineWidth: 3,
    effect: "流动"
};
