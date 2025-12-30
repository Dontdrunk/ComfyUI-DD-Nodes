// 动画核心模块，只包含动画逻辑和默认配置
import { EffectManager } from './effects/EffectManager.js';
import { StyleManager } from './styles/StyleManager.js';
import { StaticStyleManager } from './styles/static/StaticStyleManager.js';

export class ConnectionAnimation {
    constructor() {
        this.enabled = false;
        this.lineWidth = 3;
        this.effect = "流动"; // 流动 | 波浪 | 律动 | 脉冲
        this.canvas = null;
        this._lastTime = 0;
        this._phase = 0;
        this._originalDrawConnections = null;
        this._animating = false;        this.speed = 2; // 1~3
        this.effectExtra = true;        this.renderStyle = "曲线";        this.useGradient = true; 
        this.circuitBoardMap = null; 
        this.displayMode = "全部显示"; // 新增：动画显示模式
        this.staticRenderMode = "独立渲染"; // 新增：静态渲染模式
        this._hoveredNode = null; // 追踪悬停节点
        
        // 初始化效果管理器
        this.effectManager = new EffectManager(this);
        
        // 初始化样式管理器
        this.styleManager = new StyleManager(this);
        
        // 初始化静态样式管理器
        this.staticStyleManager = new StaticStyleManager(this);
        
        // 设置默认的静态样式
        this.staticStyleManager.setStyle(this.renderStyle);
    }    // 获取与指定节点相关的连线
    _getRelevantLinks() {
        if (!this.canvas || !this.canvas.graph || !this.canvas.graph.links) {
            return [];
        }
        
        const links = this.canvas.graph.links;
        const relevantLinks = [];
        
        if (this.displayMode === "全部显示") {
            // 全部显示：返回所有连线
            return Object.values(links);
        } else if (this.displayMode === "悬停节点" && this._hoveredNode) {
            // 悬停模式：只返回与悬停节点相关的连线
            const nodeId = this._hoveredNode.id;
            Object.values(links).forEach(link => {
                if (link.origin_id === nodeId || link.target_id === nodeId) {
                    relevantLinks.push(link);
                }
            });
        } else if (this.displayMode === "选中节点" && this.canvas.selected_nodes) {
            // 选中模式：只返回与选中节点相关的连线
            const selectedNodes = this.canvas.selected_nodes;
            Object.values(links).forEach(link => {
                if (selectedNodes[link.origin_id] || selectedNodes[link.target_id]) {
                    relevantLinks.push(link);
                }
            });
        }
        
        return relevantLinks;
    }

    // 检查是否应该运行动画循环
    _shouldRunAnimation() {
        if (!this.enabled || !this.canvas) return false;
        
        switch (this.displayMode) {
            case "全部显示":
                return true; // 全部显示模式总是需要动画
                
            case "悬停节点":
                return this._hoveredNode !== null; // 只有悬停节点时才需要动画

            case "选中节点":
                return this.canvas.selected_nodes && Object.keys(this.canvas.selected_nodes).length > 0;
                
            default:
                return true;
        }
    }
    
    // 智能启动或停止动画循环
    _updateAnimationLoop() {
        const shouldRun = this._shouldRunAnimation();
        
        if (shouldRun && !this._animating) {
            // 需要动画但当前没有运行，启动动画循环
            this._animating = true;
            this._animationLoop();
        } else if (!shouldRun && this._animating) {
            // 不需要动画但当前在运行，停止动画循环
            this._animating = false;
        }
    }    setEnabled(e) {
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
                // 使用智能动画循环控制
                this._updateAnimationLoop();
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
        }    }
      _animationLoop() {
        if (!this._shouldRunAnimation()) {
            this._animating = false;
            return;
        }
        
        // 智能帧率控制：根据相关连线数量调整重绘频率
        let delay = 0;
        if (this.displayMode !== "全部显示") {
            const relevantLinks = this._getRelevantLinks();
            if (relevantLinks.length <= 5) {
                delay = 16; // 约60fps，少量连线时降低频率
            } else if (relevantLinks.length <= 10) {
                delay = 8; // 约120fps
            }
            // 更多连线时使用原始频率(0延迟)
        }
        
        this.canvas.setDirty(true, true);
        
        const nextFrame = () => {
            if (this._shouldRunAnimation() && this._animating) {
                this._animationLoop();
            } else {
                this._animating = false;
            }
        };
        
        if (delay > 0) {
            setTimeout(() => {
                window.requestAnimationFrame(nextFrame);
            }, delay);
        } else {
            window.requestAnimationFrame(nextFrame);
        }
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
    }      setRenderStyle(style) {
        this.renderStyle = style || "曲线";
        // 使用样式管理器切换渲染样式
        this.styleManager.setStyle(this.renderStyle);
        
        // 同时设置静态样式管理器的样式
        this.staticStyleManager.setStyle(this.renderStyle);
        
        // 单次触发画布重绘，不使用延迟重绘以避免循环问题
        if (this.canvas) {
            this.canvas.setDirty(true, true);
        }
    }    setDisplayMode(mode) {
        const oldMode = this.displayMode;
        this.displayMode = mode || "全部显示";
        
        // 如果显示模式改变，重新评估是否需要动画循环
        if (oldMode !== this.displayMode) {
            this._updateAnimationLoop();
            if (this.canvas) {
                this.canvas.setDirty(true, true);
            }
        }
    }
    
    // 设置静态渲染模式
    setStaticRenderMode(mode) {
        this.staticRenderMode = mode || "独立渲染";
        
        // 重新绘制以应用新的静态渲染模式
        if (this.canvas) {
            this.canvas.setDirty(true, true);
        }
    }
    
    // 设置悬停节点
    setHoveredNode(node) {
        // 确保 node 是有效的节点对象或null
        const newHoveredNode = node && typeof node === 'object' ? node : null;
        const changed = this._hoveredNode !== newHoveredNode;
        this._hoveredNode = newHoveredNode;
        
        if (changed && this.displayMode === "悬停节点") {
            // 智能控制动画循环
            this._updateAnimationLoop();
            if (this.canvas) {
                this.canvas.setDirty(true, true);
            }
        }
    }

    // 通知选择变化
    notifySelectionChanged() {
        if (this.displayMode === "选中节点") {
            this._updateAnimationLoop();
            if (this.canvas) {
                this.canvas.setDirty(true, true);
            }
        }
    }

    // 检查是否有活跃节点（悬停或选中）
    _hasActiveNodes() {
        if (this.displayMode === "悬停节点") {
            return this._hoveredNode !== null;
        } else if (this.displayMode === "选中节点") {
            return this.canvas && this.canvas.selected_nodes && Object.keys(this.canvas.selected_nodes).length > 0;
        }
        return false;
    }

    // 检查连线是否应该显示动画
    _shouldShowAnimation(link) {
        if (!link || !this.canvas || !this.canvas.graph) return false;
        
        const originNode = this.canvas.graph._nodes_by_id[link.origin_id];
        const targetNode = this.canvas.graph._nodes_by_id[link.target_id];
        
        if (!originNode || !targetNode) return false;
        
        switch (this.displayMode) {
            case "全部显示":
                return true;
                
            case "悬停节点":
                return this._hoveredNode && 
                       (originNode === this._hoveredNode || targetNode === this._hoveredNode);

            case "选中节点":
                return this.canvas.selected_nodes && 
                       (this.canvas.selected_nodes[originNode.id] || this.canvas.selected_nodes[targetNode.id]);
                
            default:
                return true;
        }
    }
    
    setUseGradient(flag) {
        this.useGradient = !!flag;
        if (this.canvas) {
            this.canvas.setDirty(true, true);
        }
    }    // =============== 路径计算层 ===============
      // 统一路径计算入口
    _calculatePaths(specificLinks = null) {
        // 使用样式管理器计算指定连线或所有路径
        return this.styleManager.calculatePaths(specificLinks);
    }

    // =============== 统一动画绘制层 ===============
    
    // 总体动画绘制入口
    drawAnimation(ctx) {
        if (!this.canvas || !this.canvas.graph || !this.enabled) return;
        const links = this.canvas.graph.links;
        if (!links) return;

        if (this.displayMode === "全部显示") {
            // 全部显示模式：所有连线都使用动画渲染
            this._drawAllAnimatedConnections(ctx);
        } else if (this.displayMode === "悬停节点" || this.displayMode === "选中节点") {
            // 悬停/选中模式：静态线 + 活跃节点的动画线
            this._drawHybridConnections(ctx);
        }
    }

    // 绘制所有动画连线（全部显示模式）
    _drawAllAnimatedConnections(ctx) {
        // 更新时间和相位
        const now = performance.now();
        const speedMap = {1: 0.001, 2: 0.002, 3: 0.004};
        let phaseSpeed = speedMap[this.speed] || 0.002;
        const isWave = this.effect === "波浪";
        if (isWave) phaseSpeed *= 0.5;
        if (!this._startTime) this._startTime = now;
        this._phase = ((now - this._startTime) * phaseSpeed) % 1;
        this._lastTime = now;

        const pathsData = this._calculatePaths(); // 计算所有路径

        // 应用选择的动画效果到所有路径
        ctx.save();
        const effectInstance = this.effectManager.getEffect(this.effect);
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

    // 绘制混合连线（悬停/选中模式）
    _drawHybridConnections(ctx) {
        const links = this.canvas.graph.links;
        if (!links) return;

        // 根据静态渲染模式选择不同的渲染策略
        if (this.staticRenderMode === "官方实现") {
            // 官方实现：原有逻辑（静态基础 + 叠加动画）
            this._drawOfficialHybridMode(ctx);
        } else {
            // 独立渲染：新逻辑（静态线 + 替换式动画线）
            this._drawIndependentHybridMode(ctx);
        }
    }

    // 官方实现的混合模式（保持原有逻辑）
    _drawOfficialHybridMode(ctx) {
        // 总是先绘制ComfyUI原生连线
        if (this._originalDrawConnections) {
            this._originalDrawConnections.call(this.canvas, ctx);
        }

        // 如果有活跃节点，在基础连线上叠加动画效果
        if (this._hasActiveNodes()) {
            const relevantLinks = this._getRelevantLinks();
            if (relevantLinks.length > 0) {
                this._drawAnimatedConnections(ctx, relevantLinks);
            }
        }
    }

    // 独立渲染的混合模式（新的视觉逻辑）
    _drawIndependentHybridMode(ctx) {
        if (this._hasActiveNodes()) {
            const relevantLinks = this._getRelevantLinks();
            const relevantLinkIds = new Set(relevantLinks.map(link => link.id));

            // 1. 绘制非相关连线的静态样式（排除活跃节点相关的连线）
            this._drawIndependentStaticConnections(ctx, relevantLinkIds);

            // 2. 绘制活跃节点相关连线的动画效果（完全替换，不叠加）
            if (relevantLinks.length > 0) {
                this._drawAnimatedConnections(ctx, relevantLinks);
            }
        } else {
            // 无活跃节点时，所有连线都显示为静态样式
            this._drawIndependentStaticConnections(ctx, new Set());
        }
    }

    // 统一的动画连线绘制方法
    _drawAnimatedConnections(ctx, relevantLinks) {
        // 更新时间和相位
        const now = performance.now();
        const speedMap = {1: 0.001, 2: 0.002, 3: 0.004};
        let phaseSpeed = speedMap[this.speed] || 0.002;
        const isWave = this.effect === "波浪";
        if (isWave) phaseSpeed *= 0.5;
        if (!this._startTime) this._startTime = now;
        this._phase = ((now - this._startTime) * phaseSpeed) % 1;
        this._lastTime = now;

        // 只计算相关连线的路径
        const pathsData = this._calculatePaths(relevantLinks);

        // 绘制动画连线
        ctx.save();
        const effectInstance = this.effectManager.getEffect(this.effect);
        if (effectInstance) {
            for (const pathData of pathsData) {
                effectInstance.draw(ctx, pathData, now, this._phase);
            }
        }
        ctx.restore();
    }

    // 绘制所有静态连线
    _drawAllStaticConnections(ctx, excludeIds = new Set()) {
        const links = this.canvas.graph.links;
        if (!links) return;

        // 根据静态渲染模式选择渲染方式
        if (this.staticRenderMode === "官方实现") {
            // 使用ComfyUI官方默认连线渲染
            this._drawOfficialStaticConnections(ctx, excludeIds);
        } else {
            // 使用独立渲染模式（原有逻辑）
            this._drawIndependentStaticConnections(ctx, excludeIds);
        }
    }

    // 绘制官方静态连线
    _drawOfficialStaticConnections(ctx, excludeIds = new Set()) {
        // 使用ComfyUI原生的连线渲染方法
        if (this._originalDrawConnections && excludeIds.size === 0) {
            // 如果没有需要排除的连线，直接使用原始方法
            const wasEnabled = this.enabled;
            this.enabled = false;
            
            try {
                this._originalDrawConnections.call(this.canvas, ctx);
            } catch (e) {
                console.warn("官方连线渲染出错:", e);
                this._drawIndependentStaticConnections(ctx, excludeIds);
            }
            
            this.enabled = wasEnabled;
        } else if (this._originalDrawConnections && excludeIds.size > 0) {
            // 如果有需要排除的连线，需要手动渲染非排除的连线
            this._drawFilteredOfficialConnections(ctx, excludeIds);
        } else {
            // 如果没有原始方法，回退到独立渲染
            this._drawIndependentStaticConnections(ctx, excludeIds);
        }
    }

    // 绘制过滤后的官方连线
    _drawFilteredOfficialConnections(ctx, excludeIds) {
        const links = this.canvas.graph.links;
        if (!links) return;

        ctx.save();
        
        // 遍历所有连线，使用用户设置的样式绘制非排除的连线
        Object.values(links).forEach(link => {
            if (excludeIds.has(link.id)) {
                return; // 跳过需要排除的连线
            }

            // 获取节点和位置信息
            const outNode = this.canvas.graph.getNodeById(link.origin_id);
            const inNode = this.canvas.graph.getNodeById(link.target_id);
            
            if (!outNode || !inNode) return;

            try {
                const outPos = outNode.getConnectionPos(false, link.origin_slot);
                const inPos = inNode.getConnectionPos(true, link.target_slot);
                
                // 获取连线颜色（使用ComfyUI官方的颜色逻辑）
                const baseColor = (outNode.outputs && outNode.outputs[link.origin_slot] && outNode.outputs[link.origin_slot].color)
                    || (this.canvas.default_connection_color_byType && 
                        outNode.outputs && 
                        outNode.outputs[link.origin_slot] && 
                        this.canvas.default_connection_color_byType[outNode.outputs[link.origin_slot].type])
                    || (this.canvas.default_connection_color && 
                        this.canvas.default_connection_color.input_on)
                    || "#ff0000";

                // 使用用户设置的渲染样式计算路径
                const currentStyle = this.styleManager.currentStyle;
                if (currentStyle) {
                    const pathData = currentStyle.calculatePath(outNode, inNode, outPos, inPos, link);
                    if (pathData) {
                        // 使用官方的线宽和透明度，但路径跟随用户设置
                        ctx.strokeStyle = this.useGradient ? 
                            this._makeFancyGradient(ctx, outPos, inPos, baseColor) : 
                            baseColor;
                        ctx.lineWidth = this.canvas.connections_width || 2;
                        ctx.globalAlpha = 0.8;
                        
                        // 根据路径类型绘制
                        ctx.beginPath();
                        if (pathData.type === "bezier") {
                            const [p0, p1, p2, p3] = pathData.points;
                            ctx.moveTo(p0[0], p0[1]);
                            ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
                        } else {
                            // 直线或折线路径
                            const points = pathData.points;
                            if (points && points.length > 0) {
                                ctx.moveTo(points[0][0], points[0][1]);
                                for (let i = 1; i < points.length; i++) {
                                    ctx.lineTo(points[i][0], points[i][1]);
                                }
                            }
                        }
                        ctx.stroke();
                        ctx.globalAlpha = 1.0;
                    }
                } else {
                    // 如果没有样式管理器，回退到ComfyUI默认曲线
                    ctx.strokeStyle = baseColor;
                    ctx.lineWidth = this.canvas.connections_width || 2;
                    ctx.globalAlpha = 0.8;
                    
                    const dist = Math.max(Math.abs(inPos[0] - outPos[0]), 40);
                    const cp1 = [outPos[0] + dist * 0.5, outPos[1]];
                    const cp2 = [inPos[0] - dist * 0.5, inPos[1]];
                    
                    ctx.beginPath();
                    ctx.moveTo(outPos[0], outPos[1]);
                    ctx.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], inPos[0], inPos[1]);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }
            } catch (e) {
                console.warn("绘制单条官方连线时出错:", e);
            }
        });
        
        ctx.restore();
    }

    // 绘制独立静态连线（原有逻辑）
    _drawIndependentStaticConnections(ctx, excludeIds = new Set()) {
        const links = this.canvas.graph.links;
        if (!links) return;

        ctx.save();
        
        // 对于电路板样式，使用批量路径计算
        if (this.renderStyle === "电路板") {
            this._drawBatchStaticConnections(ctx, excludeIds);
        } else {
            // 对于其他样式，逐个计算连线
            Object.values(links).forEach(link => {
                // 跳过需要排除的连线（通常是要显示动画的连线）
                if (excludeIds.has(link.id)) {
                    return;
                }

                // 计算静态连线路径并绘制
                const pathData = this._calculateSingleStaticPath(link);
                if (pathData) {
                    this.staticStyleManager.draw(ctx, pathData);
                }
            });
        }

        ctx.restore();
    }

    // 批量绘制静态连线（用于电路板样式）
    _drawBatchStaticConnections(ctx, excludeIds = new Set()) {
        // 获取静态样式的所有路径
        const staticStyle = this.staticStyleManager.getCurrentStyle();
        
        if (!staticStyle || typeof staticStyle.getAllPaths !== 'function') {
            // 回退到逐个绘制
            const links = this.canvas.graph.links;
            if (!links) return;
            
            Object.values(links).forEach(link => {
                if (excludeIds.has(link.id)) return;
                
                const pathData = this._calculateSingleStaticPath(link);
                if (pathData) {
                    this.staticStyleManager.draw(ctx, pathData);
                }
            });
            return;
        }

        // 获取所有路径并过滤掉被排除的连线
        const allPaths = staticStyle.getAllPaths();
        
        allPaths.forEach(pathData => {
            if (pathData.link && !excludeIds.has(pathData.link.id)) {
                this.staticStyleManager.draw(ctx, pathData);
            }
        });
    }

    // 计算单条静态连线路径
    _calculateSingleStaticPath(link) {
        const graph = this.canvas.graph;
        if (!graph || !graph._nodes_by_id) return null;

        const outNode = graph._nodes_by_id[link.origin_id];
        const inNode = graph._nodes_by_id[link.target_id];
        
        if (!outNode || !inNode) return null;

        // 计算连接点位置
        const outPos = this._getConnectionPos(outNode, link.origin_slot, true);
        const inPos = this._getConnectionPos(inNode, link.target_slot, false);
        
        if (!outPos || !inPos) return null;

        // 使用静态样式管理器计算路径
        const pathInfo = this.staticStyleManager.calculatePath(outNode, inNode, outPos, inPos, link);
        if (!pathInfo) return null;

        // 获取基础颜色
        const baseColor = this.staticStyleManager.getCurrentStyle()?.getBaseColor(outNode, link) || "#999999";

        return {
            path: pathInfo.points,
            type: pathInfo.type,
            from: outPos,
            to: inPos,
            baseColor: baseColor,
            link: link
        };
    }

    // 获取连接点位置的辅助方法
    _getConnectionPos(node, slot, isOutput) {
        if (!node || slot === undefined) return null;
        
        // 使用ComfyUI标准的连接点位置获取方法
        if (typeof node.getConnectionPos === 'function') {
            return node.getConnectionPos(!isOutput, slot); // 注意：getConnectionPos的第一个参数是isInput
        }
        
        // 回退方法：如果node没有getConnectionPos方法，使用简化计算
        const nodePos = [node.pos[0], node.pos[1]];
        const nodeSize = node.size || [node.width || 150, node.height || 100];
        
        if (isOutput) {
            // 输出点通常在节点右侧
            return [nodePos[0] + nodeSize[0], nodePos[1] + 30 + slot * 20];
        } else {
            // 输入点通常在节点左侧
            return [nodePos[0], nodePos[1] + 30 + slot * 20];
        }
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
    }    // 统一的路径采样函数，将任何路径类型转换为均匀采样点
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
        
        // 对于直角线类型的路径，需要确保保留所有转角点，以保证精确的90度角
        if (pathData.type === "angled") {
            const path = pathData.path;
            
            // 对每段线段进行均匀采样
            for (let i = 1; i < path.length; i++) {
                const segSamples = Math.max(1, Math.floor(sampleCount / (path.length - 1)));
                const startPoint = path[i-1];
                const endPoint = path[i];
                
                // 添加该段的采样点
                for (let j = 0; j < segSamples; j++) {
                    const t = j / segSamples;
                    samples.push([
                        startPoint[0] + (endPoint[0] - startPoint[0]) * t,
                        startPoint[1] + (endPoint[1] - startPoint[1]) * t
                    ]);
                }
            }
            
            // 添加最后一个点
            samples.push([...path[path.length - 1]]);
            
            // 写入缓存
            pathData._sampleCache = { key: cacheKey, samples };
            return samples;
        }
        else if (pathData.type === "bezier") {
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

    // 计算贝塞尔曲线上的切线方向
    _getBezierTangent(t, p0, p1, p2, p3) {
        const mt = 1 - t;
        const x = 3*mt*mt * (p1[0] - p0[0]) + 6*mt*t * (p2[0] - p1[0]) + 3*t*t * (p3[0] - p2[0]);
        const y = 3*mt*mt * (p1[1] - p0[1]) + 6*mt*t * (p2[1] - p1[1]) + 3*t*t * (p3[1] - p2[1]);
        const len = Math.sqrt(x*x + y*y);
        return len > 0 ? [x/len, y/len] : [0, 0];
    }

    // 计算贝塞尔曲线上的法线方向
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
    effect: "流动",
    displayMode: "全部显示",
    staticRenderMode: "独立渲染"
};
