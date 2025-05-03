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
        this.renderStyle = "曲线"; // 新增：动画渲染路径样式
        this.useGradient = true; // 新增：是否启用连线渐变
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
    }
    setUseGradient(flag) {
        this.useGradient = !!flag;
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
