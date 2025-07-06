/**
 * AncientGod2.js - 古神之眼 血色版
 * 这个文件将SVG内容转换为可在JavaScript中直接使用的格式
 * 使用方法：调用createAncientGod2Eye函数，传入目标DOM元素ID和可选的配置参数
 */

(function(global) {
    // SVG内容作为字符串存储
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
  <!-- 古神之眼SVG：血色版 -->
  <defs>
    <!-- 诡异血色主辉光渐变 -->
    <linearGradient id="bloodGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF2D2D" stop-opacity="1" />
      <stop offset="100%" stop-color="#7A0404" stop-opacity="1" />
    </linearGradient>
  
    <!-- 脉动血色滤镜 -->
    <filter id="bloodPulsatingBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.2" result="blur">
        <animate attributeName="stdDeviation" values="1.2;1.8;1.2" dur="5s" repeatCount="indefinite" />
      </feGaussianBlur>
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    
    <!-- 血色金属齿轮渐变 -->
    <linearGradient id="bloodGearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF4B4B" />
      <stop offset="30%" stop-color="#B80000" />
      <stop offset="70%" stop-color="#7A0404" />
      <stop offset="100%" stop-color="#3A0000" />
    </linearGradient>

    <!-- 齿轮血色发光边缘 -->
    <filter id="bloodGlowingEdge" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="0.8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    
    <!-- 齿轮阴影滤镜 - 更深血色 -->
    <filter id="bloodGearShadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
      <feOffset dx="0.5" dy="0.5" result="offsetblur" />
      <feFlood flood-color="#7A0404" flood-opacity="0.6" />
      <feComposite in2="offsetblur" operator="in" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    
    <!-- 血滴效果滤镜 -->
    <filter id="bloodDropEffect" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
  
  <!-- 背景元素组 - 血色旋转动画 -->
  <g id="background">
    <!-- 血色背景旋转 -->
    <animateTransform 
      attributeName="transform" 
      type="rotate" 
      from="0 50 50" 
      to="360 50 50" 
      dur="120s" 
      repeatCount="indefinite" />
      
    <!-- 血红色背景圆形 -->
    <circle cx="50" cy="50" r="45" fill="url(#bloodGlow)" stroke="#FF0000" stroke-width="1.5" />
    
    <!-- 诡异血色脉动辉光 -->
    <circle cx="50" cy="50" r="42" fill="none" stroke="#FF2D2D" stroke-width="0.5" opacity="0.4" filter="url(#bloodPulsatingBlur)">
      <animate attributeName="r" values="42;43;42" dur="8s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.4;0.6;0.4" dur="8s" repeatCount="indefinite" />
    </circle>
    
    <!-- 暗红色内圈 -->
    <circle cx="50" cy="50" r="38" fill="#4A0000" opacity="0.6">
      <animate attributeName="r" values="38;40;38" dur="10s" repeatCount="indefinite" />
    </circle>
    
    <!-- 血丝纹路 - 不规则血管效果 -->
    <g stroke="#FF0000" stroke-width="0.3" opacity="0.7" fill="none">
      <path d="M20,20 Q30,40 50,30 T80,20" filter="url(#bloodDropEffect)">
        <animate attributeName="d" values="M20,20 Q30,40 50,30 T80,20;M22,22 Q35,45 55,33 T78,18;M20,20 Q30,40 50,30 T80,20" dur="15s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0.5;0.7" dur="8s" repeatCount="indefinite" />
      </path>
      <path d="M25,75 Q40,60 60,70 T85,75" filter="url(#bloodDropEffect)">
        <animate attributeName="d" values="M25,75 Q40,60 60,70 T85,75;M28,72 Q45,57 62,73 T82,76;M25,75 Q40,60 60,70 T85,75" dur="17s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.4;0.6" dur="9s" repeatCount="indefinite" />
      </path>
      <path d="M15,50 Q30,40 50,50 T85,50" filter="url(#bloodDropEffect)">
        <animate attributeName="d" values="M15,50 Q30,40 50,50 T85,50;M17,48 Q32,35 52,54 T83,52;M15,50 Q30,40 50,50 T85,50" dur="16s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0.5;0.7" dur="7s" repeatCount="indefinite" />
      </path>
    </g>
  </g>
    
  <!-- 主齿轮与克苏鲁之眼 - 行星中心 -->
  <g transform="translate(50, 50)">
    <!-- 齿轮轮廓 - 增强血色质感 -->
    <path d="M0,-20 L5,-18 L7,-23 L12,-22 L10,-16 L15,-14 L18,-19 L22,-16 L20,-11 L25,-8 L28,-12 L30,-8 L26,-4 L30,0 L26,4 L30,8 L28,12 L25,8 L20,11 L22,16 L18,19 L15,14 L10,16 L12,22 L7,23 L5,18 L0,20 L-5,18 L-7,23 L-12,22 L-10,16 L-15,14 L-18,19 L-22,16 L-20,11 L-25,8 L-28,12 L-30,8 L-26,4 L-30,0 L-26,-4 L-30,-8 L-28,-12 L-25,-8 L-20,-11 L-22,-16 L-18,-19 L-15,-14 L-10,-16 L-12,-22 L-7,-23 L-5,-18 Z" 
          fill="url(#bloodGearGradient)" stroke="#FF9999" stroke-width="1" filter="url(#bloodGearShadow)">
      <!-- 生物机械感 - 血肉蠕动效果 -->
      <animate attributeName="d" 
            values="M0,-20 L5,-18 L7,-23 L12,-22 L10,-16 L15,-14 L18,-19 L22,-16 L20,-11 L25,-8 L28,-12 L30,-8 L26,-4 L30,0 L26,4 L30,8 L28,12 L25,8 L20,11 L22,16 L18,19 L15,14 L10,16 L12,22 L7,23 L5,18 L0,20 L-5,18 L-7,23 L-12,22 L-10,16 L-15,14 L-18,19 L-22,16 L-20,11 L-25,8 L-28,12 L-30,8 L-26,4 L-30,0 L-26,-4 L-30,-8 L-28,-12 L-25,-8 L-20,-11 L-22,-16 L-18,-19 L-15,-14 L-10,-16 L-12,-22 L-7,-23 L-5,-18 Z;
                   M0,-22 L6,-19 L9,-25 L14,-23 L12,-16 L18,-15 L20,-21 L24,-17 L21,-11 L27,-7 L30,-13 L33,-8 L28,-4 L33,0 L28,5 L33,9 L29,14 L26,7 L20,12 L24,18 L19,22 L16,14 L12,18 L15,25 L9,26 L6,19 L0,23 L-6,19 L-9,26 L-15,25 L-12,18 L-18,14 L-20,22 L-24,18 L-21,12 L-27,7 L-32,14 L-33,9 L-28,5 L-33,0 L-28,-5 L-33,-8 L-30,-13 L-26,-7 L-21,-11 L-24,-17 L-20,-21 L-18,-15 L-12,-16 L-14,-23 L-9,-25 L-6,-19 Z;
                   M0,-20 L5,-18 L7,-23 L12,-22 L10,-16 L15,-14 L18,-19 L22,-16 L20,-11 L25,-8 L28,-12 L30,-8 L26,-4 L30,0 L26,4 L30,8 L28,12 L25,8 L20,11 L22,16 L18,19 L15,14 L10,16 L12,22 L7,23 L5,18 L0,20 L-5,18 L-7,23 L-12,22 L-10,16 L-15,14 L-18,19 L-22,16 L-20,11 L-25,8 L-28,12 L-30,8 L-26,4 L-30,0 L-26,-4 L-30,-8 L-28,-12 L-25,-8 L-20,-11 L-22,-16 L-18,-19 L-15,-14 L-10,-16 L-12,-22 L-7,-23 L-5,-18 Z" 
            dur="15s" 
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1" />
    </path>
    
    <!-- 血色发光齿轮边缘 -->
    <path d="M0,-20 L5,-18 L7,-23 L12,-22 L10,-16 L15,-14 L18,-19 L22,-16 L20,-11 L25,-8 L28,-12 L30,-8 L26,-4 L30,0 L26,4 L30,8 L28,12 L25,8 L20,11 L22,16 L18,19 L15,14 L10,16 L12,22 L7,23 L5,18 L0,20 L-5,18 L-7,23 L-12,22 L-10,16 L-15,14 L-18,19 L-22,16 L-20,11 L-25,8 L-28,12 L-30,8 L-26,4 L-30,0 L-26,-4 L-30,-8 L-28,-12 L-25,-8 L-20,-11 L-22,-16 L-18,-19 L-15,-14 L-10,-16 L-12,-22 L-7,-23 L-5,-18 Z" 
          fill="none" stroke="#FF5555" stroke-width="0.3" opacity="0.8" filter="url(#bloodGlowingEdge)">
      <!-- 血脉跳动 -->
      <animate attributeName="opacity" values="0.8;0.4;0.8" dur="4s" repeatCount="indefinite" />
    </path>
    
    <!-- 血管效果 -->
    <g stroke="#FF0000" stroke-width="0.2" opacity="0.5">
      <path d="M-15,-10 Q-10,-5 -15,0 Q-10,5 -5,0" />
      <path d="M5,-15 Q10,-10 15,-15 Q10,-5 15,0" />
      <path d="M-5,15 Q0,10 5,15 Q0,5 -5,5" />
      <path d="M-10,-5 Q-5,0 0,-5 Q5,0 10,-5" />
      <path d="M-8,8 Q-4,4 0,8 Q4,4 8,8" />
      
      <!-- 脉动动画 -->
      <animate attributeName="opacity" values="0.5;0.3;0.5" dur="5s" repeatCount="indefinite" />
      <animate attributeName="stroke-width" values="0.2;0.3;0.2" dur="3s" repeatCount="indefinite" />
    </g>
    
    <!-- 眼白（暗红色） -->
    <circle cx="0" cy="0" r="12.8" fill="#330000" stroke="#FF0000" stroke-width="0.4"/>
    
    <!-- 眼球内部血丝 -->
    <path d="M-9,0 A9,12 0 0,1 9,0 A9,12 0 0,1 -9,0" 
          fill="none" stroke="#FF0000" stroke-width="0.3" opacity="0.7" />
    <path d="M0,-9 A12,9 0 0,1 0,9 A12,9 0 0,1 0,-9" 
          fill="none" stroke="#FF0000" stroke-width="0.3" opacity="0.7" />
    
    <!-- 血色虹膜 -->
    <circle cx="0" cy="0" r="8" fill="#7A0404" stroke="#FF0000" stroke-width="0.3">
      <!-- 虹膜脉动 - 更血腥的感觉 -->
      <animate attributeName="r" values="7.8;8.5;7.8" dur="3s" repeatCount="indefinite" />
      <animate attributeName="fill" values="#7A0404;#B80000;#7A0404" dur="5s" repeatCount="indefinite" />
    </circle>
    
    <!-- 诡异眼瞳（不规则移动）-->
    <g class="eyeball">
      <!-- 更加诡异的眼神移动 - 同步为与紫色之眼相同的轨迹 -->
      <animateTransform 
        attributeName="transform" 
        type="translate" 
        values="0,0; 2,-1; -1,-2; -2,1; 3,2; 1,3; -3,-1; -1,2; 2,2; 0,0" 
        keyTimes="0;0.11;0.22;0.33;0.44;0.55;0.66;0.77;0.88;1"
        dur="15s" 
        repeatCount="indefinite" 
        calcMode="spline"
        keySplines="0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1" />
        
      <!-- 深不见底的黑色瞳孔 - 移除脉动动画 -->
      <circle cx="0" cy="0" r="4" fill="#000000" />
    </g>
  </g>  
  
  <!-- 血滴和血迹效果 -->
  <g id="bloodSplatter">
    <!-- 血滴1 -->
    <path d="M15,25 Q15,20 20,20" fill="none" stroke="#FF0000" stroke-width="1" opacity="0.8">
      <animate attributeName="d" values="M15,25 Q15,20 20,20;M14,24 Q13,18 19,19;M15,25 Q15,20 20,20" dur="10s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.8;0.5;0.8" dur="8s" repeatCount="indefinite" />
    </path>
    
    <!-- 血滴2 -->
    <path d="M80,30 Q80,25 75,25" fill="none" stroke="#FF0000" stroke-width="1" opacity="0.7">
      <animate attributeName="d" values="M80,30 Q80,25 75,25;M81,31 Q82,26 74,26;M80,30 Q80,25 75,25" dur="12s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.7;0.4;0.7" dur="9s" repeatCount="indefinite" />
    </path>
    
    <!-- 血滴3 -->
    <path d="M30,75 Q35,75 35,70" fill="none" stroke="#FF0000" stroke-width="1" opacity="0.9">
      <animate attributeName="d" values="M30,75 Q35,75 35,70;M29,74 Q34,73 33,68;M30,75 Q35,75 35,70" dur="11s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.9;0.6;0.9" dur="7s" repeatCount="indefinite" />
    </path>
    
    <!-- 血迹斑点 -->
    <circle cx="20" cy="65" r="1.5" fill="#B80000" opacity="0.7" />
    <circle cx="22" cy="67" r="0.8" fill="#B80000" opacity="0.8" />
    <circle cx="18" cy="64" r="0.6" fill="#B80000" opacity="0.6" />
    
    <circle cx="75" cy="40" r="1.2" fill="#B80000" opacity="0.7" />
    <circle cx="78" cy="42" r="0.7" fill="#B80000" opacity="0.8" />
    <circle cx="73" cy="38" r="0.5" fill="#B80000" opacity="0.6" />
    
    <circle cx="45" cy="80" r="1.3" fill="#B80000" opacity="0.7" />
    <circle cx="48" cy="82" r="0.9" fill="#B80000" opacity="0.8" />
    <circle cx="43" cy="78" r="0.7" fill="#B80000" opacity="0.6" />
  </g>
  
  <!-- 诡异漂浮的血色粒子 -->
  <g id="bloodParticles">
    <circle cx="25" cy="35" r="0.7" fill="#FF0000" opacity="0.7" filter="url(#bloodGlowingEdge)">
      <animate attributeName="cx" values="25;28;22;30;25" dur="7s" repeatCount="indefinite" />
      <animate attributeName="cy" values="35;32;38;30;35" dur="8s" repeatCount="indefinite" />
      <animate attributeName="r" values="0.7;1.2;0.5;1;0.7" dur="6s" repeatCount="indefinite" />
    </circle>
    <circle cx="75" cy="65" r="0.9" fill="#B80000" opacity="0.6" filter="url(#bloodGlowingEdge)">
      <animate attributeName="cx" values="75;70;80;77;75" dur="8s" repeatCount="indefinite" />
      <animate attributeName="cy" values="65;70;60;68;65" dur="7s" repeatCount="indefinite" />
      <animate attributeName="r" values="0.9;1.5;0.6;1.1;0.9" dur="7s" repeatCount="indefinite" />
    </circle>
    <circle cx="60" cy="25" r="0.6" fill="#7A0404" opacity="0.8" filter="url(#bloodGlowingEdge)">
      <animate attributeName="cx" values="60;65;55;62;60" dur="6s" repeatCount="indefinite" />
      <animate attributeName="cy" values="25;20;30;28;25" dur="9s" repeatCount="indefinite" />
      <animate attributeName="r" values="0.6;1.1;0.4;0.8;0.6" dur="5s" repeatCount="indefinite" />
    </circle>
    <circle cx="40" cy="75" r="0.8" fill="#FF0000" opacity="0.7" filter="url(#bloodGlowingEdge)">
      <animate attributeName="cx" values="40;45;35;42;40" dur="7s" repeatCount="indefinite" />
      <animate attributeName="cy" values="75;70;80;78;75" dur="8s" repeatCount="indefinite" />
      <animate attributeName="r" values="0.8;1.3;0.5;1;0.8" dur="8s" repeatCount="indefinite" />
    </circle>
  </g>
</svg>`;

// 导出函数：将SVG插入到指定DOM元素
global.createAncientGod2Eye = function(targetId, options = {}) {
    const container = document.getElementById(targetId);
    if (!container) return;
    container.innerHTML = svgContent;
    
    // 获取SVG元素
    const svg = container.querySelector('svg');
    const eyeball = svg.querySelector('.eyeball');
    const iris = svg.querySelector('g[transform="translate(50, 50)"] > circle[r="8"]'); // 血色虹膜
    const sclera = svg.querySelector('g[transform="translate(50, 50)"] > circle[r="12.8"]'); // 眼白(暗红色)
    
    // 存储原始瞳孔半径
    const pupil = eyeball.querySelector('circle');
    const originalPupilRadius = pupil ? pupil.getAttribute('r') : "4";
    
    // 最大移动范围（像素）- 血色版眼睛可以有更剧烈的反应
    const maxEyeMovement = 5;
    const maxIrisMovement = 3;  // 虹膜移动范围比瞳孔小一点，但血色版幅度更大
    
    // 添加变量跟踪鼠标活动状态
    let mouseActive = false;
    let mouseTimer = null;
    let debugLog = false; // 调试模式
    
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
        
        // 获取SVG的位置和尺寸
        const svgRect = svg.getBoundingClientRect();
        
        // 计算鼠标相对于SVG中心的位置
        const centerX = svgRect.width / 2 + svgRect.left;
        const centerY = svgRect.height / 2 + svgRect.top;
        
        // 计算偏移方向
        const deltaX = event.clientX - centerX;
        const deltaY = event.clientY - centerY;
        
        // 计算眼睛注视方向
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const normalizedX = distance > 0 ? deltaX / distance : 0;
        const normalizedY = distance > 0 ? deltaY / distance : 0;
        
        // 设置眼球跟随，限制在最大范围内
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
            
            // 血色版虹膜脉动效果 - 根据鼠标接近程度增强
            // 临时暂停原有动画
            const irisAnimateR = iris.querySelector('animate[attributeName="r"]');
            if (irisAnimateR) {
                irisAnimateR.setAttribute('dur', 'indefinite');
            }
            
            const irisAnimateFill = iris.querySelector('animate[attributeName="fill"]');
            if (irisAnimateFill) {
                irisAnimateFill.setAttribute('dur', 'indefinite');
            }
            
            // 根据距离调整虹膜大小和颜色 - 距离越近，虹膜越紧缩
            const maxDistance = Math.max(svgRect.width, svgRect.height) / 2;
            const distanceRatio = Math.min(distance / maxDistance, 1); // 0到1之间
            
            const minIrisSize = 7.4; // 接近时紧缩
            const maxIrisSize = 8.6; // 远离时放大
            const irisSize = minIrisSize + distanceRatio * (maxIrisSize - minIrisSize);
            iris.setAttribute('r', irisSize.toFixed(1));
            
            // 距离越近，血色越深
            const irisColor = distanceRatio < 0.3 ? '#6A0303' : // 非常近 - 深红色
                              distanceRatio < 0.6 ? '#7A0404' : // 中等距离
                              '#B80000'; // 远距离 - 鲜红色
            iris.setAttribute('fill', irisColor);
        }
        
        // 添加血色瞳孔收缩效应 - 鼠标靠近时瞳孔扩大(血色版特性相反)
        if (pupil) {
            // 基于距离计算瞳孔大小
            const maxDistance = Math.max(svgRect.width, svgRect.height) / 2;
            const distanceRatio = Math.min(distance / maxDistance, 1); // 0到1之间
            
            // 血色版特殊效果：越近瞳孔越大(掠食特性)，相反于普通眼睛
            // 显著增大变化范围，使效果更加明显
            const minPupilSize = 2.8;  // 远时最小
            const maxPupilSize = 5.5;  // 近时最大
            const pupilSize = maxPupilSize - distanceRatio * (maxPupilSize - minPupilSize);
            
            // 直接设置瞳孔大小，并确保应用生效
            pupil.setAttribute('r', pupilSize.toFixed(1));
            
            // 调试日志
            if (debugLog) {
                console.log(`距离比例: ${distanceRatio.toFixed(2)}, 瞳孔大小: ${pupilSize.toFixed(1)}`);
            }
        }
        
        // 设置鼠标不活动定时器，2.5秒后恢复原动画（血色版反应更快）
        mouseTimer = setTimeout(() => {
            mouseActive = false;
            resetEyeAnimations();
        }, 2500);
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
        
        // 创建平滑返回中心的过渡动画 - 血色版眼睛的过渡比秩序之眼更快速但仍然平滑
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

            // 在下一帧添加过渡效果 - 血色版使用更短的过渡时间
            requestAnimationFrame(() => {
                eyeball.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
                eyeball.style.transform = 'translate(0px, 0px)';
                
                // 过渡结束后平滑恢复原始动画
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
                    
                    // 同样对虹膜进行平滑过渡
                    if (iris) {
                        iris.style.transition = '';
                        iris.style.transform = '';
                        iris.removeAttribute('style');
                    }
                }, 800); // 与过渡时间相匹配
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
        
        // 重置瞳孔大小为原始值，添加平滑过渡效果
        if (pupil) {
            // 获取当前瞳孔大小
            const currentPupilSize = parseFloat(pupil.getAttribute('r')) || parseFloat(originalPupilRadius);
            const targetPupilSize = parseFloat(originalPupilRadius);
            
            // 如果尺寸差异显著，使用动画过渡
            if (Math.abs(currentPupilSize - targetPupilSize) > 0.1) {
                // 创建动画过渡 - 血色版动画更快
                const duration = 600; // 持续时间600毫秒
                const startTime = performance.now();
                const animate = (time) => {
                    const elapsedTime = time - startTime;
                    const progress = Math.min(elapsedTime / duration, 1);
                    // 使用弹性缓动让血色版更有特点
                    const easeProgress = 1 - Math.pow(1 - progress, 2.5); // 略微弹性的缓出
                    
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
        
        // 重置虹膜，同样添加平滑过渡
        if (iris) {
            // 对虹膜大小和颜色也添加过渡效果
            iris.style.transition = 'fill 0.8s ease';
            iris.removeAttribute('r');  // 让原有动画接管大小变化
            iris.removeAttribute('fill');  // 让原有动画接管颜色变化
            
            // 处理虹膜的位置过渡
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
                iris.style.transition = iris.style.transition + ', transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
                requestAnimationFrame(() => {
                    iris.style.transform = 'translate(0px, 0px)';
                    
                    setTimeout(() => {
                        iris.style.transition = '';
                        iris.style.transform = '';
                        
                        // 恢复虹膜动画
                        const irisAnimateR = iris.querySelector('animate[attributeName="r"]');
                        if (irisAnimateR) {
                            irisAnimateR.setAttribute('dur', '3s');
                        }
                        
                        const irisAnimateFill = iris.querySelector('animate[attributeName="fill"]');
                        if (irisAnimateFill) {
                            irisAnimateFill.setAttribute('dur', '5s');
                        }
                    }, 800);
                });
            } else {
                iris.style.transform = '';
                
                // 恢复虹膜动画
                const irisAnimateR = iris.querySelector('animate[attributeName="r"]');
                if (irisAnimateR) {
                    irisAnimateR.setAttribute('dur', '3s');
                }
                
                const irisAnimateFill = iris.querySelector('animate[attributeName="fill"]');
                if (irisAnimateFill) {
                    irisAnimateFill.setAttribute('dur', '5s');
                }
            }
        }
    }
    
    // 添加事件监听器 - 改为监听整个文档的鼠标移动
    document.addEventListener('mousemove', handleMouseMove);
    
    // 返回清理函数
    return function cleanup() {
        document.removeEventListener('mousemove', handleMouseMove);
        // 不再需要移除mouseleave事件，因为它现在全局监视
    };
};

})(typeof window !== "undefined" ? window : this);
