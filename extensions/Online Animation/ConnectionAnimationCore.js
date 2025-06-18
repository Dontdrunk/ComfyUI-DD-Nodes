// 动画核心模块，只包含动画逻辑和默认配置
import { EffectManager } from './effects/EffectManager.js';
import { StyleManager } from './styles/StyleManager.js';

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
        this.renderStyle = "曲线";        this.useGradient = true; 
        this.circuitBoardMap = null; 
        
        // 初始化效果管理器
        this.effectManager = new EffectManager(this);
        
        // 初始化样式管理器
        this.styleManager = new StyleManager(this);
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
    }      setRenderStyle(style) {
        this.renderStyle = style || "曲线";
        // 使用样式管理器切换渲染样式
        this.styleManager.setStyle(this.renderStyle);
        
        // 单次触发画布重绘，不使用延迟重绘以避免循环问题
        if (this.canvas) {
            this.canvas.setDirty(true, true);
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
        // 使用样式管理器计算所有路径
        return this.styleManager.calculatePaths();
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
