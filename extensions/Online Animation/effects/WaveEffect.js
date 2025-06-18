import { BaseEffect } from './BaseEffect.js';

/**
 * 波浪效果 - 正弦波动动画
 */
export class WaveEffect extends BaseEffect {
    constructor(animationManager) {
        super(animationManager);
    }

    draw(ctx, pathData, now, phase) {
        ctx.save();

        // 动态采样点数量
        const sampleCount = this.animationManager.getDynamicSampleCount("波浪");
        // 对不同路径类型进行采样，使其可以应用波浪效果
        const sampledPoints = this.samplePath(pathData, sampleCount);
        if (!sampledPoints || sampledPoints.length < 2) return;
        
        // 颜色（支持渐变）
        const strokeStyle = this.getPathColor(ctx, pathData);
        
        // 波浪参数
        const amplitude = 8 * this.animationManager.lineWidth / 3;
        const freq = 1 + this.animationManager.lineWidth / 8;
        const ph = phase;
        
        // 计算路径长度
        const { totalLength, segLengths } = this.calculatePathLengths(sampledPoints);
        
        // 生成波浪点
        const wavePoints = [];
        let accLength = 0;
        wavePoints.push(sampledPoints[0]);
        
        for (let i = 1; i < sampledPoints.length; i++) {
            const prev = sampledPoints[i-1];
            const curr = sampledPoints[i];
            const dx = curr[0] - prev[0];
            const dy = curr[1] - prev[1];
            const segLen = Math.sqrt(dx*dx + dy*dy);
            
            // 规范化方向向量
            let nx = 0, ny = 0;
            if (segLen > 0) {
                nx = -dy/segLen;
                ny = dx/segLen;
            }
            
            // 计算该点在总长度中的位置(0~1)
            accLength += segLen;
            const t = accLength / totalLength;
            
            // 波浪位移
            const wave = Math.sin(2 * Math.PI * (freq * t + ph)) * amplitude;
            
            // 波浪效果的点
            wavePoints.push([
                curr[0] + nx * wave,
                curr[1] + ny * wave
            ]);
        }
        
        // 绘制波浪线
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = this.animationManager.lineWidth + Math.sin(ph * 2 * Math.PI) * 0.5;
        ctx.globalAlpha = 0.85;
        
        if (this.animationManager.effectExtra) {
            ctx.shadowColor = pathData.baseColor;
            ctx.shadowBlur = 10 + this.animationManager.lineWidth * 2;
        }
        
        ctx.beginPath();
        ctx.moveTo(wavePoints[0][0], wavePoints[0][1]);
        for (let i = 1; i < wavePoints.length; i++) {
            ctx.lineTo(wavePoints[i][0], wavePoints[i][1]);
        }
        ctx.stroke();
        
        // 小球动画
        const ballT = ph % 1;
        
        // 根据路径长度计算小球位置
        const pointInfo = this.getPointAtLength(sampledPoints, segLengths, totalLength, ballT);
        if (!pointInfo) return;
        
        // 计算波浪位移
        const wave = Math.sin(2 * Math.PI * (freq * ballT + ph)) * amplitude;
        
        // 小球位置（加上波浪位移）
        const ballWaveX = pointInfo.point[0] + pointInfo.normal[0] * wave;
        const ballWaveY = pointInfo.point[1] + pointInfo.normal[1] * wave;
        
        // 绘制小球
        ctx.beginPath();
        ctx.arc(ballWaveX, ballWaveY, 6 + this.animationManager.lineWidth * 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = strokeStyle;
        ctx.globalAlpha = 0.95;
        
        if (this.animationManager.effectExtra) {
            ctx.shadowColor = pathData.baseColor;
            ctx.shadowBlur = 16 + this.animationManager.lineWidth * 2;
        }
        
        ctx.fill();
        ctx.restore();
    }
}