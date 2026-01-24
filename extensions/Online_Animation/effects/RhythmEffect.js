import { BaseEffect } from './BaseEffect.js';

/**
 * 律动效果 - 小球沿路径移动的动画
 */
export class RhythmEffect extends BaseEffect {
    constructor(animationManager) {
        super(animationManager);
        // 不再在此处写死采样点数量，改为动态获取
    }

    draw(ctx, pathData, now, phase) {
        ctx.save();

        // 颜色（支持渐变）
        const strokeStyle = this.getPathColor(ctx, pathData);
        
        // 静态线统一用采样点绘制，保证动画和静态线完全重合
        const staticSampleCount = Math.max(80, this.animationManager.getDynamicSampleCount("律动"));
        const staticSampledPoints = this.samplePath(pathData, staticSampleCount);
        if (!staticSampledPoints || staticSampledPoints.length < 2) {
            ctx.restore();
            return;
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = this.animationManager.lineWidth;
        ctx.globalAlpha = 0.85;
        if (this.animationManager.effectExtra) {
            ctx.shadowColor = pathData.baseColor;
            ctx.shadowBlur = 8 + this.animationManager.lineWidth * 1.5;
        }
        ctx.beginPath();
        ctx.moveTo(staticSampledPoints[0][0], staticSampledPoints[0][1]);
        for (let i = 1; i < staticSampledPoints.length; i++) {
            ctx.lineTo(staticSampledPoints[i][0], staticSampledPoints[i][1]);
        }
        ctx.stroke();
        
        // 周期时间（毫秒），不同速度有不同的周期
        const speed = Math.max(0.5, Math.min(3, Number(this.animationManager.speed ?? 2)));
        const exponent = speed - 1;
        const period = 7500 / Math.pow(2, exponent);
        
        // 当前周期内的时间位置 (0-1)
        let t = ((now % period) / period);
        t = (t + (phase || 0)) % 1;
        
        // 动态采样点数量
        const sampleCount = this.animationManager.getDynamicSampleCount("律动");
        const sampledPoints = this.samplePath(pathData, sampleCount);
        if (!sampledPoints || sampledPoints.length < 2) {
            ctx.restore();
            return;
        }
        
        // 计算路径长度
        const { totalLength, segLengths } = this.calculatePathLengths(sampledPoints);
        
        // 应用缓动函数，使运动更加平滑流畅
        // 低速度使用更强的缓动效果
        const easingType = speed <= 1.5 ? 'easeInOutCubic' : (speed <= 2.5 ? 'easeInOutQuad' : 'easeInOutSine');
        t = this.applyEasing(t, easingType);
        
        // 根据路径长度精确计算小球位置
        const pointInfo = this.getPointAtLength(sampledPoints, segLengths, totalLength, t);
        if (!pointInfo) {
            ctx.restore();
            return;
        }
        
        const ballPos = pointInfo.point;
        
        // 绘制主小球
        this._drawBall(ctx, ballPos, strokeStyle, 1.0, 0.95);
         
        ctx.restore();
    }
    
    /**
     * 辅助方法：绘制小球
     */
    _drawBall(ctx, position, color, scale = 1.0, alpha = 0.95) {
        ctx.beginPath();
        // 小球大小根据线宽和缩放因子计算
        const radius = (6 + this.animationManager.lineWidth * 1.5) * scale;
        ctx.arc(position[0], position[1], radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        
        if (this.animationManager.effectExtra) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 16 + this.animationManager.lineWidth * 2 * scale;
        }
        
        ctx.fill();
    }
}
