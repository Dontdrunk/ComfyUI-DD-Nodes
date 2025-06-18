/**
 * 连线动画效果基类
 * 所有具体效果类都应继承这个基类并实现draw方法
 */
export class BaseEffect {
    /**
     * 构造函数
     * @param {Object} animationManager - 动画管理器引用
     */
    constructor(animationManager) {
        this.animationManager = animationManager;
        this.initialized = false;
    }

    /**
     * 初始化效果
     */
    init() {
        this.initialized = true;
    }

    /**
     * 绘制效果（子类必须实现此方法）
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
     * @param {Object} pathData - 路径数据对象
     * @param {number} now - 当前时间戳（毫秒）
     * @param {number} phase - 当前动画相位（0-1）
     */
    draw(ctx, pathData, now, phase) {
        throw new Error("子类必须实现draw方法");
    }

    /**
     * 获取路径颜色（支持渐变）
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
     * @param {Object} pathData - 路径数据对象
     * @returns {string|CanvasGradient} 颜色或渐变对象
     */
    getPathColor(ctx, pathData) {
        return this.animationManager.useGradient ? 
            this.animationManager._makeFancyGradient(ctx, pathData.from, pathData.to, pathData.baseColor) : 
            pathData.baseColor;
    }

    /**
     * 均匀采样路径（带缓存优化）
     * @param {Object} pathData - 路径数据 
     * @param {number} sampleCount - 采样点数量
     * @returns {Array} 采样点数组
     */
    samplePath(pathData, sampleCount = 100) {
        // 直接调用 animationManager 的 _samplePath，已实现缓存与脏标记
        return this.animationManager._samplePath(pathData, sampleCount);
    }

    /**
     * 计算路径总长度和分段长度
     * @param {Array} points - 路径点数组
     * @returns {Object} 包含总长度和分段长度数组的对象
     */
    calculatePathLengths(points) {
        const segLengths = [];
        let totalLength = 0;
        
        for (let i = 1; i < points.length; i++) {
            const dx = points[i][0] - points[i-1][0];
            const dy = points[i][1] - points[i-1][1];
            const len = Math.sqrt(dx*dx + dy*dy);
            segLengths.push(len);
            totalLength += len;
        }
        
        return { totalLength, segLengths };
    }

    /**
     * 根据路径长度参数t(0-1)计算路径上的点
     * @param {Array} points - 路径点数组
     * @param {Array} segLengths - 分段长度数组
     * @param {number} totalLength - 路径总长度
     * @param {number} t - 参数t(0-1)
     * @returns {Object} 点的位置、切线方向等信息
     */
    getPointAtLength(points, segLengths, totalLength, t) {
        if (points.length < 2) return null;
        
        const pathT = Math.max(0, Math.min(1, t));
        const targetLength = pathT * totalLength;
        
        let accLength = 0;
        let segIdx = 0;
        
        // 找到目标长度所在的线段
        while (segIdx < segLengths.length && accLength + segLengths[segIdx] < targetLength) {
            accLength += segLengths[segIdx];
            segIdx++;
        }
        
        // 若超出范围，使用最后点
        if (segIdx >= segLengths.length) {
            return {
                point: [...points[points.length - 1]],
                tangent: [1, 0], // 默认向右的切线
                normal: [0, 1],  // 默认向下的法线
                segmentT: 1
            };
        }
        
        // 计算线段内的插值参数
        const segT = segLengths[segIdx] === 0 ? 0 : (targetLength - accLength) / segLengths[segIdx];
        
        // 计算点坐标
        const p1 = points[segIdx];
        const p2 = points[segIdx + 1];
        const point = [
            p1[0] + (p2[0] - p1[0]) * segT,
            p1[1] + (p2[1] - p1[1]) * segT
        ];
        
        // 计算切线方向（归一化）
        const tangent = [p2[0] - p1[0], p2[1] - p1[1]];
        const tangentLen = Math.sqrt(tangent[0]*tangent[0] + tangent[1]*tangent[1]);
        if (tangentLen > 0) {
            tangent[0] /= tangentLen;
            tangent[1] /= tangentLen;
        } else {
            tangent[0] = 1;
            tangent[1] = 0;
        }
        
        // 计算法线方向（切线旋转90度）
        const normal = [-tangent[1], tangent[0]];
        
        return { point, tangent, normal, segmentT: segT };
    }

    /**
     * 应用缓动函数使动画更平滑
     * @param {number} t - 原始参数(0-1)
     * @param {string} easingType - 缓动类型
     * @returns {number} 应用缓动后的值(0-1)
     */
    applyEasing(t, easingType = 'easeInOutQuad') {
        const easingFunctions = {
            'linear': t => t,
            'easeInQuad': t => t * t,
            'easeOutQuad': t => t * (2 - t),
            'easeInOutQuad': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            'easeInCubic': t => t * t * t,
            'easeOutCubic': t => (--t) * t * t + 1,
            'easeInOutCubic': t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            'easeInOutSine': t => -0.5 * (Math.cos(Math.PI * t) - 1),
        };
        
        return (easingFunctions[easingType] || easingFunctions.easeInOutQuad)(Math.max(0, Math.min(1, t)));
    }
}