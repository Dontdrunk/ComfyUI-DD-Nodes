import { FlowEffect } from './FlowEffect.js';
import { WaveEffect } from './WaveEffect.js';
import { RhythmEffect } from './RhythmEffect.js';
import { PulseEffect } from './PulseEffect.js';

/**
 * 连线动画效果管理器
 * 负责创建、管理和切换不同的连线动画效果
 */
export class EffectManager {
    /**
     * 构造函数
     * @param {Object} animationManager - 动画管理器引用
     */
    constructor(animationManager) {
        this.animationManager = animationManager;
        
        // 效果类映射
        this.effectMap = {
            "流动": FlowEffect,
            "波浪": WaveEffect,
            "律动": RhythmEffect,
            "脉冲": PulseEffect
        };
        
        // 效果实例缓存
        this.effectInstances = {};
        
        // 初始化默认效果
        this.currentEffect = null;
        this.currentEffectName = null;
    }
      /**
     * 获取效果实例（如不存在则创建）
     * @param {string} effectName - 效果名称
     * @returns {BaseEffect} 效果实例
     */
    getEffect(effectName) {
        // 确保效果名称有效
        if (!effectName || typeof effectName !== 'string') {
            return null;
        }
        
        // 如果实例不存在，创建新实例
        if (!this.effectInstances[effectName]) {
            const EffectClass = this.effectMap[effectName];
            if (EffectClass) {
                try {
                    this.effectInstances[effectName] = new EffectClass(this.animationManager);
                    this.effectInstances[effectName].init();
                } catch (e) {
                    console.error(`创建效果实例失败: ${effectName}`, e);
                    return null;
                }
            } else {
                console.error(`未找到效果: ${effectName}`);
                return null;
            }
        }
        
        this.currentEffectName = effectName;
        this.currentEffect = this.effectInstances[effectName];
        return this.currentEffect;
    }
    
    /**
     * 清理所有效果实例
     */
    cleanup() {
        // 如果效果类有需要清理的资源，可以在这里添加清理逻辑
        this.effectInstances = {};
        this.currentEffect = null;
        this.currentEffectName = null;
    }
    
    /**
     * 获取所有可用效果名称
     * @returns {Array<string>} 效果名称列表
     */
    getEffectNames() {
        return Object.keys(this.effectMap);
    }
    
    /**
     * 注册新效果
     * @param {string} effectName - 效果名称
     * @param {class} EffectClass - 效果类
     */
    registerEffect(effectName, EffectClass) {
        this.effectMap[effectName] = EffectClass;
    }
}
