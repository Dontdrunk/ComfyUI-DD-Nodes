/**
 * AncientGod1.js - 古神之眼 紫色版
 * 这个文件将SVG内容转换为可在JavaScript中直接使用的格式
 * 使用方法：调用createAncientGod1Eye函数，传入目标DOM元素ID和可选的配置参数
 */

(function(global) {
    // SVG内容作为字符串存储
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
  <!-- 古神之眼SVG：星盘与齿轮 -->  <defs>
    <linearGradient id="destinyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9370DB" stop-opacity="1" />
      <stop offset="100%" stop-color="#483D8B" stop-opacity="1" />
    </linearGradient>
  
    
    <!-- 脉动模糊滤镜 -->
    <filter id="pulsatingBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.2" result="blur">
        <animate attributeName="stdDeviation" values="1.2;1.8;1.2" dur="5s" repeatCount="indefinite" />
      </feGaussianBlur>
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    
    <!-- 金属质感齿轮渐变 -->
    <linearGradient id="gearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8A6FD0" />
      <stop offset="30%" stop-color="#63438F" />
      <stop offset="70%" stop-color="#533178" />
      <stop offset="100%" stop-color="#422261" />
    </linearGradient>

    
    <!-- 齿轮发光边缘 -->
    <filter id="glowingEdge" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="0.8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    
    <!-- 齿轮阴影滤镜 -->
    <filter id="gearShadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
      <feOffset dx="0.5" dy="0.5" result="offsetblur" />
      <feFlood flood-color="#000000" flood-opacity="0.4" />
      <feComposite in2="offsetblur" operator="in" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    
  </defs>
  <!-- 背景元素组 - 添加旋转动画 -->
  <g id="background">
    <!-- 添加旋转动画 -->
    <animateTransform 
      attributeName="transform" 
      type="rotate" 
      from="0 50 50" 
      to="360 50 50" 
      dur="60s" 
      repeatCount="indefinite" />
      
    <!-- 背景圆形 -->
    <circle cx="50" cy="50" r="45" fill="url(#destinyGlow)" stroke="#B08DE1" stroke-width="1.5" />
    
    <!-- 克苏鲁风格脉动辉光 -->
    <circle cx="50" cy="50" r="42" fill="none" stroke="#6A5ACD" stroke-width="0.5" opacity="0.3" filter="url(#pulsatingBlur)">
      <animate attributeName="r" values="42;43;42" dur="8s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.3;0.5;0.3" dur="8s" repeatCount="indefinite" />
    </circle>
  <circle cx="50" cy="50" r="38" fill="#341E6A" opacity="0.4">
      <animate attributeName="r" values="38;40;38" dur="10s" repeatCount="indefinite" />
    </circle>
      <!-- 星盘元素 -->
    <circle cx="50" cy="50" r="35" fill="none" stroke="#FFFFFF" stroke-width="0.5" opacity="0.7" />
    <circle cx="50" cy="50" r="25" fill="none" stroke="#FFFFFF" stroke-width="0.5" opacity="0.8" />
    
    <!-- 神秘符文 -->
    <g opacity="0.6">
      <!-- 符文1 - 外圈 -->
      <path d="M50,15 L55,15 L53,18 Z" fill="none" stroke="#FFFFFF" stroke-width="0.3" />
      <path d="M85,50 L85,55 L82,53 Z" fill="none" stroke="#FFFFFF" stroke-width="0.3" />
      <path d="M50,85 L45,85 L47,82 Z" fill="none" stroke="#FFFFFF" stroke-width="0.3" />
      <path d="M15,50 L15,45 L18,47 Z" fill="none" stroke="#FFFFFF" stroke-width="0.3" />
      
      <!-- 符文2 - 内圈不规则符号 -->
      <path d="M40,25 L45,27 L43,31 L38,29 Z" fill="none" stroke="#FFFFFF" stroke-width="0.3" />
      <path d="M75,40 L73,45 L69,43 L71,38 Z" fill="none" stroke="#FFFFFF" stroke-width="0.3" />
      <path d="M60,75 L55,73 L57,69 L62,71 Z" fill="none" stroke="#FFFFFF" stroke-width="0.3" />
      <path d="M25,60 L27,55 L31,57 L29,62 Z" fill="none" stroke="#FFFFFF" stroke-width="0.3" />
    </g>
  </g>
    <!-- 主齿轮与克苏鲁之眼 - 行星中心 -->
  <g transform="translate(50, 50)">
    
    <!-- 齿轮轮廓 - 增强质感 -->
    <path d="M0,-20 L5,-18 L7,-23 L12,-22 L10,-16 L15,-14 L18,-19 L22,-16 L20,-11 L25,-8 L28,-12 L30,-8 L26,-4 L30,0 L26,4 L30,8 L28,12 L25,8 L20,11 L22,16 L18,19 L15,14 L10,16 L12,22 L7,23 L5,18 L0,20 L-5,18 L-7,23 L-12,22 L-10,16 L-15,14 L-18,19 L-22,16 L-20,11 L-25,8 L-28,12 L-30,8 L-26,4 L-30,0 L-26,-4 L-30,-8 L-28,-12 L-25,-8 L-20,-11 L-22,-16 L-18,-19 L-15,-14 L-10,-16 L-12,-22 L-7,-23 L-5,-18 Z" 
          fill="url(#gearGradient)" stroke="#DDC6FF" stroke-width="1" filter="url(#gearShadow)">
      <!-- 生物机械感 - 微变形 -->
      <animate attributeName="d" 
            values="M0,-20 L5,-18 L7,-23 L12,-22 L10,-16 L15,-14 L18,-19 L22,-16 L20,-11 L25,-8 L28,-12 L30,-8 L26,-4 L30,0 L26,4 L30,8 L28,12 L25,8 L20,11 L22,16 L18,19 L15,14 L10,16 L12,22 L7,23 L5,18 L0,20 L-5,18 L-7,23 L-12,22 L-10,16 L-15,14 L-18,19 L-22,16 L-20,11 L-25,8 L-28,12 L-30,8 L-26,4 L-30,0 L-26,-4 L-30,-8 L-28,-12 L-25,-8 L-20,-11 L-22,-16 L-18,-19 L-15,-14 L-10,-16 L-12,-22 L-7,-23 L-5,-18 Z;
                   M0,-19 L5,-17 L8,-23 L13,-22 L11,-15 L16,-14 L19,-20 L22,-15 L19,-10 L25,-7 L29,-12 L31,-7 L27,-4 L31,0 L27,4 L31,8 L29,13 L25,7 L19,12 L22,17 L18,20 L16,13 L11,16 L13,23 L8,24 L5,17 L0,21 L-5,17 L-7,23 L-12,22 L-10,16 L-15,14 L-18,19 L-22,16 L-20,11 L-25,8 L-28,12 L-30,8 L-26,4 L-30,0 L-26,-4 L-30,-7 L-29,-12 L-25,-7 L-19,-10 L-22,-15 L-19,-20 L-16,-14 L-11,-15 L-13,-22 L-8,-23 L-5,-17 Z;
                   M0,-20 L5,-18 L7,-23 L12,-22 L10,-16 L15,-14 L18,-19 L22,-16 L20,-11 L25,-8 L28,-12 L30,-8 L26,-4 L30,0 L26,4 L30,8 L28,12 L25,8 L20,11 L22,16 L18,19 L15,14 L10,16 L12,22 L7,23 L5,18 L0,20 L-5,18 L-7,23 L-12,22 L-10,16 L-15,14 L-18,19 L-22,16 L-20,11 L-25,8 L-28,12 L-30,8 L-26,4 L-30,0 L-26,-4 L-30,-8 L-28,-12 L-25,-8 L-20,-11 L-22,-16 L-18,-19 L-15,-14 L-10,-16 L-12,-22 L-7,-23 L-5,-18 Z" 
            dur="20s" 
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1" />
    </path>
    
    <!-- 发光齿轮边缘 -->
    <path d="M0,-20 L5,-18 L7,-23 L12,-22 L10,-16 L15,-14 L18,-19 L22,-16 L20,-11 L25,-8 L28,-12 L30,-8 L26,-4 L30,0 L26,4 L30,8 L28,12 L25,8 L20,11 L22,16 L18,19 L15,14 L10,16 L12,22 L7,23 L5,18 L0,20 L-5,18 L-7,23 L-12,22 L-10,16 L-15,14 L-18,19 L-22,16 L-20,11 L-25,8 L-28,12 L-30,8 L-26,4 L-30,0 L-26,-4 L-30,-8 L-28,-12 L-25,-8 L-20,-11 L-22,-16 L-18,-19 L-15,-14 L-10,-16 L-12,-22 L-7,-23 L-5,-18 Z" 
          fill="none" stroke="#DDC6FF" stroke-width="0.3" opacity="0.6" filter="url(#glowingEdge)">
      <animate attributeName="opacity" values="0.6;0.2;0.6" dur="8s" repeatCount="indefinite" />
    </path>
    
    <!-- 微血管效果 -->
    <g stroke="#AA3377" stroke-width="0.1" opacity="0.3">
      <path d="M-15,-10 Q-10,-5 -15,0 Q-10,5 -5,0" />
      <path d="M5,-15 Q10,-10 15,-15 Q10,-5 15,0" />
      <path d="M-5,15 Q0,10 5,15 Q0,5 -5,5" />
      <path d="M-10,-5 Q-5,0 0,-5 Q5,0 10,-5" />
      <path d="M-8,8 Q-4,4 0,8 Q4,4 8,8" />
      
      <!-- 脉动动画 -->
      <animate attributeName="opacity" values="0.3;0.1;0.3" dur="10s" repeatCount="indefinite" />
    </g>
    
    <!-- 眼白（取代内圆） - 保持克苏鲁眼睛特性 -->
    <circle cx="0" cy="0" r="12.8" fill="#2A1E4A" stroke="#B08DE1"/>
    
    <!-- 眼球内部花纹 -->
    <path d="M-9,0 A9,12 0 0,1 9,0 A9,12 0 0,1 -9,0" 
          fill="none" stroke="#8A2BE2" stroke-width="0.3" opacity="0.7" />
    <path d="M0,-9 A12,9 0 0,1 0,9 A12,9 0 0,1 0,-9" 
          fill="none" stroke="#8A2BE2" stroke-width="0.3" opacity="0.7" />
    
    <!-- 虹膜 -->
    <circle cx="0" cy="0" r="8" fill="#341E6A" stroke="#9370DB" stroke-width="0.3">
      <!-- 虹膜脉动动画 -->
      <animate attributeName="r" values="7.8;8.2;7.8" dur="3s" repeatCount="indefinite" />
    </circle>
    
    <!-- 眼瞳（不规则移动）-->
    <g class="eyeball">
      <!-- 复合动画：眼瞳不规则移动 -->
      <animateTransform 
        attributeName="transform" 
        type="translate" 
        values="0,0; 2,-1; -1,-2; -2,1; 3,2; 1,3; -3,-1; -1,2; 2,2; 0,0" 
        keyTimes="0;0.11;0.22;0.33;0.44;0.55;0.66;0.77;0.88;1"
        dur="15s" 
        repeatCount="indefinite" 
        calcMode="spline"
        keySplines="0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1" />
        <!-- 瞳孔 -->
      <circle cx="0" cy="0" r="3.5" fill="#090418" />
    </g>
  </g>  
  <g id="stars">
    <!-- 添加与背景相同的旋转动画 -->
    <animateTransform 
      attributeName="transform" 
      type="rotate" 
      from="0 50 50" 
      to="360 50 50" 
      dur="60s" 
      repeatCount="indefinite" />
    <!-- 明亮星星 -->
    <g fill="#FFFFFF">
      <circle cx="15" cy="35" r="0.6" opacity="0.8" filter="url(#glowingEdge)">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite" />
        <animate attributeName="r" values="0.6;0.8;0.6" dur="6s" repeatCount="indefinite" />
      </circle>
      <circle cx="85" cy="65" r="0.7" opacity="0.8" filter="url(#glowingEdge)">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="4s" repeatCount="indefinite" />
        <animate attributeName="r" values="0.7;0.9;0.7" dur="7s" repeatCount="indefinite" />
      </circle>
      <circle cx="40" cy="15" r="0.5" opacity="0.8" filter="url(#glowingEdge)">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="5s" repeatCount="indefinite" />
        <animate attributeName="r" values="0.5;0.7;0.5" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="85" r="0.6" opacity="0.8" filter="url(#glowingEdge)">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="4.5s" repeatCount="indefinite" />
        <animate attributeName="r" values="0.6;0.8;0.6" dur="8s" repeatCount="indefinite" />
      </circle>
    </g>
    
    <!-- 装饰星星 - 额外增加 -->
    <g fill="#FFFFFF">
      <circle cx="20" cy="20" r="0.4" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="6s" repeatCount="indefinite" />
      </circle>
      <circle cx="80" cy="20" r="0.3" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.15;0.5" dur="7s" repeatCount="indefinite" begin="1s" />
      </circle>
      <circle cx="20" cy="80" r="0.35" opacity="0.55">
        <animate attributeName="opacity" values="0.55;0.2;0.55" dur="9s" repeatCount="indefinite" begin="3s" />
      </circle>
      <circle cx="80" cy="80" r="0.25" opacity="0.45">
        <animate attributeName="opacity" values="0.45;0.1;0.45" dur="8s" repeatCount="indefinite" begin="4s" />
      </circle>
      <circle cx="50" cy="15" r="0.3" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.15;0.5" dur="6s" repeatCount="indefinite" begin="2s" />
      </circle>
      <circle cx="50" cy="85" r="0.35" opacity="0.55">
        <animate attributeName="opacity" values="0.55;0.2;0.55" dur="7s" repeatCount="indefinite" begin="1s" />
      </circle>
      <circle cx="15" cy="50" r="0.25" opacity="0.45">
        <animate attributeName="opacity" values="0.45;0.1;0.45" dur="8s" repeatCount="indefinite" begin="3s" />
      </circle>
      <circle cx="85" cy="50" r="0.3" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.15;0.5" dur="9s" repeatCount="indefinite" begin="2s" />
      </circle>
    </g>
  </g>
</svg>`;

// 导出函数：将SVG插入到指定DOM元素
global.createAncientGod1Eye = function(targetId, options = {}) {
    const container = document.getElementById(targetId);
    if (!container) return;
    container.innerHTML = svgContent;
    
    // 获取SVG元素
    const svg = container.querySelector('svg');
    const eyeball = svg.querySelector('.eyeball');
    const iris = svg.querySelector('g[transform="translate(50, 50)"] > circle[r="8"]'); // 虹膜
    const sclera = svg.querySelector('g[transform="translate(50, 50)"] > circle[r="12.8"]'); // 眼白
    
    // 存储原始瞳孔半径
    const pupil = eyeball.querySelector('circle');
    const originalPupilRadius = pupil ? pupil.getAttribute('r') : "3.5";
    
    // 最大移动范围（像素）
    const maxEyeMovement = 4;
    const maxIrisMovement = 2.5;  // 虹膜移动范围比瞳孔小一点
    
    // 添加变量跟踪鼠标活动状态
    let mouseActive = false;
    let mouseTimer = null;
    
    // 鼠标移动监听函数
    function handleMouseMove(event) {
        mouseActive = true;
        clearTimeout(mouseTimer);
        
        // 暂停原有动画
        const animateTransform = eyeball.querySelector('animateTransform');
        if (animateTransform) {
            try {
                // 完全暂停动画而非设置为indefinite
                animateTransform.setAttribute('repeatCount', '0');
                animateTransform.setAttribute('dur', '999999s');
            } catch (e) {
                console.error("无法暂停动画:", e);
            }
        }
        
        // 获取SVG的位置和尺寸 - 无论鼠标在哪都要获取
        const svgRect = svg.getBoundingClientRect();
        
        // 计算鼠标相对于SVG中心的位置
        const centerX = svgRect.width / 2 + svgRect.left;
        const centerY = svgRect.height / 2 + svgRect.top;
        
        // 计算偏移方向
        const deltaX = event.clientX - centerX;
        const deltaY = event.clientY - centerY;
        
        // 计算目光注视方向
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const normalizedX = distance > 0 ? deltaX / distance : 0;
        const normalizedY = distance > 0 ? deltaY / distance : 0;
        
        // 计算鼠标与中心的相对距离比例（用于瞳孔大小）
        // 根据距离计算瞳孔大小 - 距离越近，瞳孔越大
        const maxDistance = Math.max(svgRect.width, svgRect.height) / 2;
        const distanceRatio = 1 - Math.min(distance / maxDistance, 1); // 0到1之间
        
        // 瞳孔设置 - 根据距离调整大小
        if (pupil) {
            const minPupilSize = 3.0;
            const maxPupilSize = 4.2;
            const pupilSize = minPupilSize + distanceRatio * (maxPupilSize - minPupilSize);
            pupil.setAttribute('r', pupilSize.toFixed(1));
        }
        
        // 设置眼球跟随，限制在合理范围内
        const eyeballMoveX = normalizedX * maxEyeMovement;
        const eyeballMoveY = normalizedY * maxEyeMovement;
        
        // 设置虹膜跟随，幅度比瞳孔小一些
        const irisMoveX = normalizedX * maxIrisMovement;
        const irisMoveY = normalizedY * maxIrisMovement;
        
        // 应用变换 - 眼瞳
        eyeball.style.transform = `translate(${eyeballMoveX}px, ${eyeballMoveY}px)`;
        
        // 应用变换 - 虹膜
        if (iris) {
            iris.style.transform = `translate(${irisMoveX}px, ${irisMoveY}px)`;
        }
        
        // 鼠标不活动定时器，3秒后恢复原动画
        mouseTimer = setTimeout(() => {
            mouseActive = false;
            resetEyeAnimations();
        }, 3000);
    }
    
    // 重置眼睛所有动画
    function resetEyeAnimations() {
        // 获取当前位置，用于平滑过渡
        const currentTransform = eyeball.style.transform;
        let currentX = 0;
        let currentY = 0;
        
        // 如果当前有transform，解析出当前位置
        if (currentTransform && currentTransform.includes('translate')) {
            const match = currentTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
            if (match) {
                currentX = parseFloat(match[1]);
                currentY = parseFloat(match[2]);
            }
        }
        
        // 创建平滑返回中心的过渡动画
        if (currentX !== 0 || currentY !== 0) {
            // 清除之前可能存在的过渡
            eyeball.style.transition = '';
            
            // 先确保移除animateTransform的所有效果
            const animateTransform = eyeball.querySelector('animateTransform');
            if (animateTransform) {
                // 完全禁用SVG动画，直到CSS过渡完成
                animateTransform.setAttribute('repeatCount', '0');
                animateTransform.setAttribute('dur', '999999s');
                animateTransform.setAttribute('values', '0,0; 0,0; 0,0');
            }
            
            // 在下一帧添加过渡效果
            requestAnimationFrame(() => {
                eyeball.style.transition = 'transform 1s cubic-bezier(0.4, 0.0, 0.2, 1)';
                eyeball.style.transform = 'translate(0px, 0px)';
                
                // 平滑过渡到中心后再恢复原始动画
                setTimeout(() => {
                    // 完全移除CSS transform和transition
                    eyeball.style.transition = '';
                    eyeball.style.transform = '';
                    
                    // 等待DOM更新完成
                    setTimeout(() => {
                        // 确保没有残留的内联样式
                        eyeball.removeAttribute('style');
                        
                        // 重新启用SVG动画
                        if (animateTransform) {
                            // 恢复原始动画内容
                            animateTransform.setAttribute('values', '0,0; 2,-1; -1,-2; -2,1; 3,2; 1,3; -3,-1; -1,2; 2,2; 0,0');
                            animateTransform.setAttribute('dur', '15s');
                            animateTransform.setAttribute('repeatCount', 'indefinite');
                        }
                    }, 50);
                    
                    // 同样对虹膜进行过渡处理
                    if (iris) {
                        iris.style.transition = '';
                        iris.style.transform = '';
                        iris.removeAttribute('style');
                    }
                }, 1000); // 与过渡时间相匹配
            });
        } else {
            // 如果已经在中心位置，直接恢复动画
            eyeball.style.removeProperty('transform');
            eyeball.removeAttribute('style');
            
            const animateTransform = eyeball.querySelector('animateTransform');
            if (animateTransform) {
                animateTransform.setAttribute('values', '0,0; 2,-1; -1,-2; -2,1; 3,2; 1,3; -3,-1; -1,2; 2,2; 0,0');
                animateTransform.setAttribute('dur', '15s');
                animateTransform.setAttribute('repeatCount', 'indefinite');
            }
        }
        
        // 重置瞳孔大小为原始值，添加平滑过渡
        if (pupil) {
            // 获取当前瞳孔大小
            const currentPupilSize = parseFloat(pupil.getAttribute('r')) || parseFloat(originalPupilRadius);
            const targetPupilSize = parseFloat(originalPupilRadius);
            
            // 如果尺寸差异显著，使用动画过渡
            if (Math.abs(currentPupilSize - targetPupilSize) > 0.1) {
                // 创建动画过渡
                const duration = 800; // 持续时间800毫秒
                const startTime = performance.now();
                const animate = (time) => {
                    const elapsedTime = time - startTime;
                    const progress = Math.min(elapsedTime / duration, 1);
                    // 使用缓动函数让动画更自然
                    const easeProgress = 1 - Math.pow(1 - progress, 3); // 缓出效果
                    
                    const currentSize = currentPupilSize + (targetPupilSize - currentPupilSize) * easeProgress;
                    pupil.setAttribute('r', currentSize.toFixed(2));
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };
                
                requestAnimationFrame(animate);
            } else {
                // 如果差异很小，直接设置
                pupil.setAttribute('r', originalPupilRadius);
            }
        }
        
        // 重置虹膜，也添加平滑过渡
        if (iris) {
            const currentIrisTransform = iris.style.transform;
            let currentIrisX = 0;
            let currentIrisY = 0;
            
            if (currentIrisTransform && currentIrisTransform.includes('translate')) {
                const match = currentIrisTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
                if (match) {
                    currentIrisX = parseFloat(match[1]);
                    currentIrisY = parseFloat(match[2]);
                }
            }
            
            if (currentIrisX !== 0 || currentIrisY !== 0) {
                iris.style.transition = '';
                requestAnimationFrame(() => {
                    iris.style.transition = 'transform 1s cubic-bezier(0.4, 0.0, 0.2, 1)';
                    iris.style.transform = 'translate(0px, 0px)';
                    
                    setTimeout(() => {
                        iris.style.removeProperty('transform');
                    }, 50);
                });
            } else {
                iris.style.transform = '';
            }
        }
    }
    
    // 添加鼠标离开监听
    function handleMouseLeave() {
        clearTimeout(mouseTimer);
        mouseTimer = setTimeout(() => {
            mouseActive = false;
            resetEyeAnimations();
        }, 1000); // 鼠标离开后1秒恢复原动画
    }
    
    // 添加事件监听器 - 改为监听整个文档的鼠标移动
    document.addEventListener('mousemove', handleMouseMove);
    
    // 返回清理函数
    return function cleanup() {
        document.removeEventListener('mousemove', handleMouseMove);
    };
};

})(typeof window !== "undefined" ? window : this);