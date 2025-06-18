// 智能布局 通用工具模块

// ==========================================================
// ComfyUI应用和节点相关函数
// ==========================================================

// 获取ComfyUI应用实例
export function getComfyUIApp() {
  if (window.app?.canvas && window.app?.graph) {
    return window.app;
  }

  if (window.LiteGraph?.LGraphCanvas?.active_canvas) {
    const canvas = LiteGraph.LGraphCanvas.active_canvas;
    if (canvas?.graph) {
      return { canvas, graph: canvas.graph };
    }
  }

  const canvasElement = document.querySelector(".litegraph.litegraph-canvas");
  if (canvasElement?.lgraphcanvas) {
    const canvas = canvasElement.lgraphcanvas;
    if (canvas?.graph) {
      return { canvas, graph: canvas.graph };
    }
  }
  
  return null;
}

// 获取选中的节点
export function getSelectedNodes(app) {
  if (app.canvas.selected_nodes?.length) {
    return Array.from(app.canvas.selected_nodes);
  }

  const selectedNodes = [];
  if (app.graph?._nodes) {
    for (const node of app.graph._nodes) {
      if (node.is_selected) {
        selectedNodes.push(node);
      }
    }
  }
  
  return selectedNodes;
}

// 获取选中的组
export function getSelectedGroups(app) {
  const selectedGroups = [];
  
  if (app.canvas?.selected_groups?.length) {
    return Array.from(app.canvas.selected_groups);
  }
  
  if (app.graph?.groups) {
    for (const group of app.graph.groups) {
      if (group.selected) {
        selectedGroups.push(group);
      }
    }
  }
  
  return selectedGroups;
}

// ==========================================================
// 颜色生成和处理函数
// ==========================================================

// 生成随机颜色
export function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// ==========================================================
// 节点排列和同步相关功能
// ==========================================================

// 判断节点排列主方向
export function getMainDirection(centers) {
  let dx = 0, dy = 0;
  for (let i = 1; i < centers.length; i++) {
    dx += Math.abs(centers[i].x - centers[0].x);
    dy += Math.abs(centers[i].y - centers[0].y);
  }
  return dx > dy ? 'horizontal' : 'vertical';
}

// 计算节点中心位置
export function getNodeCenters(nodes) {
  return nodes.map(node => ({
    node,
    x: node.pos ? node.pos[0] + (node.size ? node.size[0] / 2 : 0) : 0,
    y: node.pos ? node.pos[1] + (node.size ? node.size[1] / 2 : 0) : 0
  }));
}

// 同步节点大小
export function syncNodeSize(nodes) {
  let maxW = 0, maxH = 0;
  nodes.forEach(node => {
    if (node.size) {
      maxW = Math.max(maxW, node.size[0]);
      maxH = Math.max(maxH, node.size[1]);
    }
  });
  
  nodes.forEach(node => {
    if (node.size) {
      node.size[0] = maxW;
      node.size[1] = maxH;
    }
  });
  
  return { width: maxW, height: maxH };
}

// 同步节点宽高（根据排列方向）
export function syncNodeWidthHeight(nodes) {
  const centers = getNodeCenters(nodes);
  const mainDir = getMainDirection(centers);
  
  if (mainDir === 'horizontal') {
    // 横向排列，同步高度
    let maxH = 0;
    nodes.forEach(node => {
      if (node.size) maxH = Math.max(maxH, node.size[1]);
    });
    nodes.forEach(node => {
      if (node.size) node.size[1] = maxH;
    });
    return { direction: 'horizontal', height: maxH };
  } else {
    // 纵向排列，同步宽度
    let maxW = 0;
    nodes.forEach(node => {
      if (node.size) maxW = Math.max(maxW, node.size[0]);
    });
    nodes.forEach(node => {
      if (node.size) node.size[0] = maxW;
    });
    return { direction: 'vertical', width: maxW };
  }
}

// 对齐节点（根据排列方向）
export function alignNodes(nodes) {
  const centers = getNodeCenters(nodes);
  const mainDir = getMainDirection(centers);
  
  if (mainDir === 'horizontal') {
    // 横向排列，对齐Y轴
    const avgY = centers.reduce((sum, c) => sum + c.y, 0) / centers.length;
    nodes.forEach(node => {
      if (node.pos) node.pos[1] = avgY - (node.size ? node.size[1] / 2 : 0);
    });
    return { direction: 'horizontal', y: avgY };
  } else {
    // 纵向排列，对齐X轴
    const avgX = centers.reduce((sum, c) => sum + c.x, 0) / centers.length;
    nodes.forEach(node => {
      if (node.pos) node.pos[0] = avgX - (node.size ? node.size[0] / 2 : 0);
    });
    return { direction: 'vertical', x: avgX };
  }
}

// ==========================================================
// 面板位置和大小计算
// ==========================================================

// 计算面板在鼠标位置的居中定位
export function calculatePanelPosition(mousePosition, container) {
  if (!container) return { left: 0, top: 0 };
  
  const width = container.offsetWidth || 300; // 假设默认宽度为300px
  const height = container.offsetHeight || 400; // 假设默认高度为400px
  
  // 确保面板完全在视口内
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = mousePosition.x - width/2;
  let top = mousePosition.y - height/2;
  
  // 防止面板超出右边界
  if (left + width > viewportWidth) {
    left = viewportWidth - width - 10;
  }
  
  // 防止面板超出左边界
  if (left < 10) {
    left = 10;
  }
  
  // 防止面板超出下边界
  if (top + height > viewportHeight) {
    top = viewportHeight - height - 10;
  }
  
  // 防止面板超出上边界
  if (top < 10) {
    top = 10;
  }
  
  return { left, top };
}
