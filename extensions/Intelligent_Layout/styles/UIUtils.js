// 智能布局 通用工具模块
//
// 兼容性说明（ComfyUI 旧前端 / Nodes 2.0 新版前端）
// ------------------------------------------------------------------
// 旧版（LiteGraph 直接绘制节点）：
//   * 选中节点：canvas.selected_nodes（{ id: node }）
//   * 选中组：  canvas.selected_groups（数组）
//   * 节点尺寸/位置：node.size / node.pos（普通数组，直接改）
//   * 节点颜色：node.color（标题栏颜色）
//
// Nodes 2.0（Vue 节点渲染）：
//   * 选中项：canvas.selectedItems（Set，包含节点、组、重路由）
//   * 节点几何数据保存在 layout store 中，需通过 node.setSize()/node.setPos() 写入
//   * 节点颜色是响应式状态：node.color 决定节点主体底色，node.bgcolor 决定内部控件底色
//   * LiteGraph.vueNodesMode === true
//
// 下面所有函数都做了特性探测，任一侧 API 缺失时自动回退，不会抛错中断面板功能。

// ==========================================================
// 运行环境探测
// ==========================================================

// 是否处于 Nodes 2.0（Vue 节点）渲染模式
export function isVueNodesMode() {
  try {
    return !!window.LiteGraph?.vueNodesMode;
  } catch (e) {
    return false;
  }
}

function getCanvasFromDOM() {
  if (typeof document === 'undefined') return null;
  const selectors = ['.litegraph.litegraph-canvas', 'canvas.litegraph', '.litegraph'];
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const canvas = element?.lgraphcanvas;
    if (canvas?.graph) return canvas;
  }
  return null;
}

// 获取 ComfyUI 应用实例（优先返回真实 app，保证调用方能用到 extensionManager 等）
export function getComfyUIApp() {
  const app = window.app;
  if (app) {
    // Nodes 2.0 中 canvas 可能晚于 app 创建，使用 canvasOrUndefined 安全探测
    const canvas = app.canvas || app.canvasOrUndefined;
    const graph = app.graph || app.rootGraph;
    if (canvas && graph) return app;
  }

  // 兜底：直接从 LiteGraph / DOM 上取画布，构造一个最小可用的 app 替身
  const activeCanvas = window.LiteGraph?.LGraphCanvas?.active_canvas || getCanvasFromDOM();
  if (activeCanvas?.graph) {
    return {
      canvas: activeCanvas,
      graph: activeCanvas.graph,
      rootGraph: activeCanvas.graph,
      __isFallbackApp: true
    };
  }

  return null;
}

// 获取当前画布对应的图（子图模式下与 app.graph 不同，优先取画布的图）
export function getGraph(app) {
  if (!app) return null;
  return app.canvas?.graph || app.graph || app.rootGraph || null;
}

// ==========================================================
// 选中项获取（新旧 API 兼容）
// ==========================================================

// 新版：canvas.selectedItems 是 Set（节点 / 组 / 重路由）
function readSelectedItems(canvas) {
  if (!canvas) return [];
  const items = canvas.selectedItems;
  if (items && typeof items.size === 'number' && typeof items[Symbol.iterator] === 'function') {
    try {
      return Array.from(items);
    } catch (e) {
      return [];
    }
  }
  return [];
}

// 旧版：canvas.selected_nodes 是 { id: node } 字典
function readLegacySelectedNodes(canvas) {
  if (!canvas) return [];
  const legacy = canvas.selected_nodes;
  if (!legacy) return [];
  if (Array.isArray(legacy)) return legacy.filter(Boolean);
  if (typeof legacy === 'object') return Object.values(legacy).filter(Boolean);
  return [];
}

function readLegacySelectedGroups(canvas) {
  if (!canvas) return [];
  const legacy = canvas.selected_groups;
  return Array.isArray(legacy) ? legacy.filter(Boolean) : [];
}

// 判断是否为节点（重路由 / 组都不带 inputs+outputs 数组）
export function isNodeItem(item) {
  if (!item) return false;
  return Array.isArray(item.inputs) || Array.isArray(item.outputs);
}

// 判断是否为重路由（Nodes 2.0 中可与节点一起被选中，但没有尺寸概念）
export function isRerouteItem(item) {
  if (!item || isNodeItem(item)) return false;

  const RerouteClass = window.Reroute || window.LiteGraph?.Reroute;
  if (RerouteClass && item instanceof RerouteClass) return true;

  return typeof item.radius === 'number' && typeof item.id !== 'undefined' && !item.inputs;
}

// 判断是否为组
export function isGroupItem(item) {
  if (!item || isNodeItem(item)) return false;

  const GroupClass = window.LGraphGroup || window.LiteGraph?.LGraphGroup;
  if (GroupClass && item instanceof GroupClass) return true;

  return typeof item.title === 'string' && Array.isArray(item._nodes || item.nodes);
}

// 导出统一的选中项读取（节点 + 组 + 重路由），便于调试
export function getSelectedItems(app) {
  const canvas = app?.canvas;
  const items = readSelectedItems(canvas);
  if (items.length) return items;
  if (canvas && typeof canvas.selectedItems?.size === 'number') return [];

  const legacyNodes = readLegacySelectedNodes(canvas);
  if (legacyNodes.length) return legacyNodes;

  const legacyGroups = readLegacySelectedGroups(canvas);
  if (legacyGroups.length) return legacyGroups;

  return [];
}

// 获取选中的节点
export function getSelectedNodes(app) {
  const canvas = app?.canvas;
  const selected = [];
  const seen = new Set();

  const push = (item) => {
    if (item && !seen.has(item)) {
      seen.add(item);
      selected.push(item);
    }
  };

  // 1) Nodes 2.0 / 新版 LiteGraph：selectedItems
  readSelectedItems(canvas).forEach((item) => {
    if (!isGroupItem(item) && !isRerouteItem(item)) push(item);
  });

  // 2) 旧版：selected_nodes 字典
  if (!selected.length) {
    readLegacySelectedNodes(canvas).forEach(push);
  }

  // 3) 最后兜底：扫描图中的选中标记
  if (!selected.length) {
    const graph = getGraph(app);
    const nodes = graph?._nodes || graph?.nodes || [];
    for (const node of nodes) {
      if (node?.is_selected || node?.selected) push(node);
    }
  }

  return selected;
}

// 获取选中的组
export function getSelectedGroups(app) {
  const canvas = app?.canvas;
  const selected = [];
  const seen = new Set();

  const push = (item) => {
    if (item && !seen.has(item)) {
      seen.add(item);
      selected.push(item);
    }
  };

  // 1) 新版：selectedItems 中的组
  readSelectedItems(canvas).forEach((item) => {
    if (isGroupItem(item)) push(item);
  });

  // 2) 旧版：selected_groups 数组
  if (!selected.length) {
    readLegacySelectedGroups(canvas).forEach(push);
  }

  // 3) 兜底：组自身的 selected 标记
  if (!selected.length) {
    const graph = getGraph(app);
    const groups = graph?.groups || graph?._groups || [];
    for (const group of groups) {
      if (group?.selected) push(group);
    }
  }

  return selected;
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

// 给节点上色（兼容旧画布与 Nodes 2.0 响应式节点）
//   * 旧版：node.color 是标题栏颜色
//   * Nodes 2.0：node.color 是响应式状态，同时决定节点主体底色，写入后界面会自动刷新
export function applyNodeColor(node, color) {
  if (!node || !color) return false;
  try {
    node.color = color;
    return true;
  } catch (e) {
    console.warn('[DD 界面布局] 设置节点颜色失败:', e);
    return false;
  }
}

// 给组上色
export function applyGroupColor(group, color) {
  if (!group || !color) return false;
  try {
    group.color = color;
    return true;
  } catch (e) {
    console.warn('[DD 界面布局] 设置组颜色失败:', e);
    return false;
  }
}

// ==========================================================
// 节点几何读写（new layout store / 旧数组双兼容）
// ==========================================================

export function getNodeSize(node) {
  if (!node) return null;
  try {
    const size = node.size;
    if (size && typeof size[0] === 'number' && typeof size[1] === 'number') {
      return [size[0], size[1]];
    }
    const bounds = typeof node.getBounding === 'function' ? node.getBounding() : null;
    if (bounds && typeof bounds[2] === 'number' && typeof bounds[3] === 'number') {
      return [bounds[2], bounds[3]];
    }
  } catch (e) {
    // 节点可能正处于删除 / 重建过程中，读取失败时忽略该节点
  }
  return null;
}

export function getNodePos(node) {
  if (!node) return null;
  try {
    const pos = node.pos;
    if (pos && typeof pos[0] === 'number' && typeof pos[1] === 'number') {
      return [pos[0], pos[1]];
    }
  } catch (e) {
    // 同上，忽略读取异常
  }
  return null;
}

// 写入节点尺寸：Nodes 2.0 中 size 由 layout store 托管，必须走 setSize
export function setNodeSize(node, width, height) {
  if (!node) return false;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  try {
    if (typeof node.setSize === 'function') {
      node.setSize([w, h]);
    } else if (node.size) {
      node.size[0] = w;
      node.size[1] = h;
    } else {
      node.size = [w, h];
    }
    return true;
  } catch (e) {
    console.warn('[DD 界面布局] 设置节点尺寸失败:', e);
    return false;
  }
}

// 写入节点位置：Nodes 2.0 中 pos 由 layout store 托管，必须走 setPos
export function setNodePos(node, x, y) {
  if (!node) return false;
  try {
    if (typeof node.setPos === 'function') {
      node.setPos(x, y);
    } else if (node.pos) {
      node.pos[0] = x;
      node.pos[1] = y;
    } else {
      node.pos = [x, y];
    }
    return true;
  } catch (e) {
    console.warn('[DD 界面布局] 设置节点位置失败:', e);
    return false;
  }
}

// 刷新画布：新旧模式都调用 setDirty（Nodes 2.0 的节点由响应式状态驱动，无需额外重绘）
export function refreshCanvas(app) {
  const canvas = app?.canvas || window.app?.canvas;
  const graph = getGraph(app);
  try {
    if (typeof canvas?.setDirty === 'function') {
      canvas.setDirty(true, true);
    }
  } catch (e) {
    // 忽略刷新失败，不影响数据写入
  }
  try {
    if (typeof graph?.setDirtyCanvas === 'function') {
      graph.setDirtyCanvas(true, true);
    }
  } catch (e) {
    // 忽略刷新失败
  }
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
  return nodes.map(node => {
    const pos = getNodePos(node) || [0, 0];
    const size = getNodeSize(node) || [0, 0];
    return {
      node,
      x: pos[0] + size[0] / 2,
      y: pos[1] + size[1] / 2
    };
  });
}

// 同步节点大小
export function syncNodeSize(nodes) {
  let maxW = 0, maxH = 0;
  nodes.forEach(node => {
    const size = getNodeSize(node);
    if (size) {
      maxW = Math.max(maxW, size[0]);
      maxH = Math.max(maxH, size[1]);
    }
  });

  let applied = 0;
  if (maxW > 0 && maxH > 0) {
    nodes.forEach(node => {
      if (getNodeSize(node) && setNodeSize(node, maxW, maxH)) applied++;
    });
  }

  return { width: maxW, height: maxH, applied };
}

// 同步节点宽高（根据排列方向）
export function syncNodeWidthHeight(nodes) {
  const centers = getNodeCenters(nodes);
  const mainDir = getMainDirection(centers);
  let applied = 0;

  if (mainDir === 'horizontal') {
    // 横向排列，同步高度
    let maxH = 0;
    nodes.forEach(node => {
      const size = getNodeSize(node);
      if (size) maxH = Math.max(maxH, size[1]);
    });
    nodes.forEach(node => {
      const size = getNodeSize(node);
      if (size && setNodeSize(node, size[0], maxH)) applied++;
    });
    return { direction: 'horizontal', height: maxH, applied };
  }

  // 纵向排列，同步宽度
  let maxW = 0;
  nodes.forEach(node => {
    const size = getNodeSize(node);
    if (size) maxW = Math.max(maxW, size[0]);
  });
  nodes.forEach(node => {
    const size = getNodeSize(node);
    if (size && setNodeSize(node, maxW, size[1])) applied++;
  });
  return { direction: 'vertical', width: maxW, applied };
}

// 对齐节点（根据排列方向）
export function alignNodes(nodes) {
  const centers = getNodeCenters(nodes);
  const mainDir = getMainDirection(centers);
  let applied = 0;

  if (mainDir === 'horizontal') {
    // 横向排列，对齐Y轴
    const avgY = centers.reduce((sum, c) => sum + c.y, 0) / centers.length;
    nodes.forEach(node => {
      const pos = getNodePos(node);
      const size = getNodeSize(node);
      if (pos && size && setNodePos(node, pos[0], avgY - size[1] / 2)) applied++;
    });
    return { direction: 'horizontal', y: avgY, applied };
  }

  // 纵向排列，对齐X轴
  const avgX = centers.reduce((sum, c) => sum + c.x, 0) / centers.length;
  nodes.forEach(node => {
    const pos = getNodePos(node);
    const size = getNodeSize(node);
    if (pos && size && setNodePos(node, avgX - size[0] / 2, pos[1])) applied++;
  });
  return { direction: 'vertical', x: avgX, applied };
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
