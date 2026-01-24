import { BaseEffect } from './BaseEffect.js';

/**
 * 脉冲效果 - 发光带沿路径移动的动画
 */
export class PulseEffect extends BaseEffect {
    constructor(animationManager) {
        super(animationManager);
    }

    draw(ctx, pathData, now, phase) {
        ctx.save();

        // 颜色（支持渐变）
        const strokeStyle = this.getPathColor(ctx, pathData);
        
        // 脉冲周期
        const speed = Math.max(0.5, Math.min(3, Number(this.animationManager.speed ?? 2)));
        const exponent = speed - 1;
        const period = 5000 / Math.pow(2, exponent);
        
        let t = ((now % period) / period); // 0~1
        t = (t + (phase || 0)) % 1;
        const waveCenter = t; // 脉冲中心位置
        const waveWidth = 0.18; // 脉冲宽度
        
        // 静态线统一用采样点绘制，保证动画和静态线完全重合
        const staticSampleCount = Math.max(80, this.animationManager.getDynamicSampleCount("脉冲"));
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

        // --- 动画脉冲带部分 ---
        // 采样点数量始终受采样强度影响
        const sampleCount = this.animationManager.getDynamicSampleCount("脉冲");
        const sampledPoints = this.samplePath(pathData, sampleCount);
        if (!sampledPoints || sampledPoints.length < 2) {
            ctx.restore();
            return;
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = this.animationManager.lineWidth * 2.2;
        ctx.globalAlpha = 0.92;
        if (this.animationManager.effectExtra) {
            ctx.shadowColor = pathData.baseColor;
            ctx.shadowBlur = 24 + this.animationManager.lineWidth * 2;
        }
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < sampledPoints.length; i++) {
            const pt = sampledPoints[i];
            const tt = i / (sampledPoints.length - 1);
            let d = Math.abs(tt - waveCenter);
            if (d > 0.5) d = 1 - d;
            if (d < waveWidth/2) {
                if (!started) { 
                    ctx.moveTo(pt[0], pt[1]); 
                    started = true; 
                } else {
                    ctx.lineTo(pt[0], pt[1]);
                }
            } else {
                started = false;
            }
        }
        ctx.stroke();
        // 端点光晕
        if (this.animationManager.effectExtra) {
            ctx.beginPath();
            ctx.arc(pathData.from[0], pathData.from[1], 2 + this.animationManager.lineWidth, 0, 2 * Math.PI);
            ctx.arc(pathData.to[0], pathData.to[1], 2 + this.animationManager.lineWidth, 0, 2 * Math.PI);
            ctx.fillStyle = pathData.baseColor;
            ctx.globalAlpha = 0.4 + 0.4 * 0.5;
            ctx.shadowBlur = 16 + this.animationManager.lineWidth * 2;
            ctx.fill();
        }
        ctx.restore();
    }
}
