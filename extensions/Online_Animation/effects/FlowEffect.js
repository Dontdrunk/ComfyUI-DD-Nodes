import { BaseEffect } from './BaseEffect.js';

/**
 * 流动效果 - 虚线流动动画
 */
export class FlowEffect extends BaseEffect {
    constructor(animationManager) {
        super(animationManager);
    }

    draw(ctx, pathData, now, phase) {
        ctx.save();
        
        // 颜色（支持渐变）
        const strokeStyle = this.getPathColor(ctx, pathData);
        
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = this.animationManager.lineWidth;
        ctx.globalAlpha = 0.85;
        
        // 虚线动画设置
        const dashLen = 24, gapLen = 18;
        const dashCycleLen = dashLen + gapLen;
        const periods = { 1: 4000, 2: 2000, 3: 1000 };
        const period = periods[this.animationManager.speed] || 2000;
        const t = ((now % period) / period);
        const dashOffset = -(((t + (phase || 0)) % 1) * dashCycleLen);
        ctx.setLineDash([dashLen, gapLen]);
        ctx.lineDashOffset = dashOffset;
        
        if (this.animationManager.effectExtra) {
            ctx.shadowColor = pathData.baseColor;
            ctx.shadowBlur = 8 + this.animationManager.lineWidth * 2;
        }
        
        ctx.beginPath();
        // 所有路径类型统一用采样点绘制，保证动画轨迹和路径重合
        const sampleCount = this.animationManager.getDynamicSampleCount("流动");
        const sampledPoints = this.samplePath(pathData, sampleCount);
        if (!sampledPoints || sampledPoints.length < 2) {
            ctx.restore();
            return;
        }
        ctx.moveTo(sampledPoints[0][0], sampledPoints[0][1]);
        for (let i = 1; i < sampledPoints.length; i++) {
            ctx.lineTo(sampledPoints[i][0], sampledPoints[i][1]);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 端点光晕
        if (this.animationManager.effectExtra) {
            ctx.beginPath();
            ctx.arc(pathData.from[0], pathData.from[1], 2 + this.animationManager.lineWidth, 0, 2 * Math.PI);
            ctx.arc(pathData.to[0], pathData.to[1], 2 + this.animationManager.lineWidth, 0, 2 * Math.PI);
            ctx.fillStyle = pathData.baseColor;
            ctx.globalAlpha = 0.5;
            ctx.shadowBlur = 12 + this.animationManager.lineWidth * 2;
            ctx.fill();
        }
        
        ctx.restore();
    }
}
