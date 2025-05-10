// 智能布局算法模块 - 提供自动化节点排布功能
// 包含：模块排布算法

// 默认配置
const AUTO_LAYOUT_CONFIG = {
  // 通用设置
  horizontalSpacing: 140, // 水平间距
  verticalSpacing: 80,    // 垂直间距
  levelSeparation: 200,   // 层级间隔
  nodeWidth: 200,         // 默认节点宽度
  nodeHeight: 80,         // 默认节点高度
  compactFactor: 0.8,     // 紧凑程度(0-1)
  
  // 模块排布设置
  moduleClusters: {       // 模块分组规则
    "loaders": [
      // 基础加载器
      "LoadImage", "LoadVideo", "LoadModel", "VAE", "CLIP",
      // 模型加载器
      "CheckpointLoader", "ModelLoader", "Checkpoint", 
      // Lora相关
      "LoRA", "LoCon", "LoRA_Loader", "LoraLoader", 
      // 其他常见模型加载器
      "ControlNetLoader", "Upscaler", "Hypernetwork", "Embedding", 
      // 带有Load前缀或后缀的节点
      "Load", "Loader"
    ], 
    "condition": [
      "CLIPTextEncode", "ConditioningCombine", "ConditioningAverage", "ConditioningConcat",
      "Conditioning", "ConditioningSet", "Prompt", "Text", "Encode"
    ],
    "control": [
      "Control", "ControlNet", "Processor", "Detector", "Estimator", "Depth"
    ],
    "samplers": [
      "KSampler", "SamplerAdvanced", "Sample", "Sampler", "Sampling"
    ],
    "latent": [
      "VAEDecode", "VAEEncode", "LatentUpscale", "Latent", "Noise"
    ],
    "image": [
      "ImageScale", "ImageUpscale", "ImageComposite", "Image", "Img", "Upscale"
    ],
    "transform": [
      "Transform", "Rotate", "Flip", "Crop", "Resize", "Scale", "Uniform", "Batch"
    ],
    "effects": [
      "Effect", "Blur", "Sharpen", "Filter", "Enhance", "Color", "Style", "Tint"
    ],
    "math": [
      "Math", "Add", "Multiply", "Divide", "Subtract", "Calculator", "Formula", "Compute", "Number"
    ],
    "utils": [
      "Switch", "Switcher", "Select", "Apply", "Join", "Split", "Combine", "Converter", "Convert"
    ],
    "generator": [
      "Generator", "Generate", "Random", "Pattern", "Noise", "Creator"
    ],
    "output": [
      "Save", "Output", "Preview", "Display", "Show"
    ]
  },
  
  // 特定节点顺序规则 - 明确定义哪些节点类型应该放在其他节点下方
  nodeOrder: {
    // VAEDecode应该在KSampler下方
    "VAEDecode": ["KSampler", "SamplerAdvanced", "Sample", "Sampler", "Sampling"],
    "ImageUpscale": ["VAEDecode"] // 图像放大应该在VAE解码下方
  }
};

/**
 * 自动化布局引擎
 */
export class AutoLayoutEngine {
  constructor(app) {
    this.app = app;
    this.config = {...AUTO_LAYOUT_CONFIG};
  }

  /**
   * 获取选中的节点
   * @returns {Array} 选中的节点数组
   */
  getSelectedNodes() {
    if (!this.app?.canvas) return [];
    
    if (this.app.canvas.selected_nodes?.length) {
      return Array.from(this.app.canvas.selected_nodes);
    }

    const selectedNodes = [];
    if (this.app.graph?._nodes) {
      for (const node of this.app.graph._nodes) {
        if (node.is_selected) {
          selectedNodes.push(node);
        }
      }
    }
    
    return selectedNodes;
  }

  /**
   * 获取所有节点
   * @returns {Array} 所有节点数组
   */
  getAllNodes() {
    if (!this.app?.graph?._nodes) return [];
    return Array.from(this.app.graph._nodes);
  }

  /**
   * 获取节点之间的连接关系
   * @param {Array} nodes - 节点数组
   * @returns {Object} 节点连接关系图
   */
  buildConnectionGraph(nodes) {
    const graph = {
      nodes: {},
      links: [],
      roots: [],
      leaves: []
    };
    
    // 初始化节点记录
    nodes.forEach(node => {
      graph.nodes[node.id] = {
        node,
        inputs: [],
        outputs: [],
        level: -1,
        module: this._detectNodeModule(node)
      };
    });

    // 构建连接关系
    nodes.forEach(node => {
      if (node.inputs) {
        node.inputs.forEach((input, inputIndex) => {
          const links = input?.links || [];
          links.forEach(linkId => {
            const link = this.app.graph.links[linkId];
            if (link) {
              const srcNodeId = link.origin_id;
              const srcNode = graph.nodes[srcNodeId];
              const targetNode = graph.nodes[node.id];
              
              if (srcNode && targetNode) {
                srcNode.outputs.push(node.id);
                targetNode.inputs.push(srcNodeId);
                graph.links.push({
                  source: srcNodeId,
                  target: node.id,
                  link
                });
              }
            }
          });
        });
      }
    });

    // 确定根节点(没有输入的节点)和叶节点(没有输出的节点)
    for (const nodeId in graph.nodes) {
      if (graph.nodes[nodeId].inputs.length === 0) {
        graph.roots.push(nodeId);
      }
      if (graph.nodes[nodeId].outputs.length === 0) {
        graph.leaves.push(nodeId);
      }
    }

    return graph;
  }

  /**
   * 检测节点所属模块
   * @param {Object} node - 节点对象
   * @returns {String} 所属模块名称
   */
  _detectNodeModule(node) {
    if (!node.type) return "other";
    
    const type = node.type.toLowerCase();
    
    for (const [module, nodeTypes] of Object.entries(this.config.moduleClusters)) {
      for (const nodeType of nodeTypes) {
        if (type.includes(nodeType.toLowerCase())) {
          return module;
        }
      }
    }
    
    return "other";
  }

  /**
   * 应用模块排布算法(按功能分组)
   * @returns {Boolean} 是否成功应用
   */
  applyModuleLayout() {
    try {
      const nodes = this.getSelectedNodes().length > 1 ? 
        this.getSelectedNodes() : this.getAllNodes();
      
      if (nodes.length < 2) {
        console.log("节点数量不足，无法应用布局");
        return false;
      }
      
      const graph = this.buildConnectionGraph(nodes);
      
      // 按模块分组节点
      const modules = {};
      for (const nodeId in graph.nodes) {
        const module = graph.nodes[nodeId].module;
        if (!modules[module]) {
          modules[module] = [];
        }
        modules[module].push(nodeId);
      }
      
      // 调整列布局 - 将latent分组移到samplers分组所在的列，以便VAEDecode能放在KSampler下方
      const columns = [
        ["loaders"], // 第1列：模型加载器
        ["condition", "control"], // 第2列：条件和控制模块
        ["samplers", "latent"], // 第3列：采样器和潜变量（包括VAE解码）
        ["transform", "effects", "math"], // 第4列：变换、特效和数学运算
        ["image", "utils", "generator", "output", "other"] // 第5列：图像处理、工具和其他
      ];
      
      // 特定节点顺序映射表
      const nodeTypeMapping = {};
      for (const nodeId in graph.nodes) {
        const node = graph.nodes[nodeId].node;
        const nodeType = node.type;
        if (nodeType) {
          nodeTypeMapping[nodeId] = nodeType;
        }
      }
      
      let xOffset = 0;
      
      // 处理每一列
      columns.forEach((columnModules, columnIndex) => {
        let yOffset = 0;
        let maxWidth = 0;
        let hasNodes = false;
        
        // 处理列中的每个模块
        columnModules.forEach(moduleName => {
          if (!modules[moduleName] || modules[moduleName].length === 0) return;
          hasNodes = true;
          
          const moduleNodes = modules[moduleName];
          
          // 计算模块宽度
          moduleNodes.forEach(nodeId => {
            const node = graph.nodes[nodeId].node;
            maxWidth = Math.max(maxWidth, node.size[0]);
          });
          
          // 对于长列，使用更紧凑的垂直间距
          const verticalSpacing = columnIndex === 4 ? 
            this.config.verticalSpacing * 0.8 : this.config.verticalSpacing;
          
          // 特殊处理：如果当前模块是samplers或latent，进行特殊排序
          if (moduleName === "samplers" || moduleName === "latent") {
            // 按照特定规则排序
            moduleNodes.sort((aId, bId) => {
              const aType = nodeTypeMapping[aId] || "";
              const bType = nodeTypeMapping[bId] || "";
              
              // 实现特定的排序规则
              // 1. 如果是KSampler类节点，总是排在前面
              // 2. 如果是VAEDecode类节点，总是排在KSampler后面
              
              const isASampler = aType.includes("KSampler") || aType.includes("Sampler"); 
              const isBSampler = bType.includes("KSampler") || bType.includes("Sampler");
              
              const isAVAEDecode = aType.includes("VAEDecode");
              const isBVAEDecode = bType.includes("VAEDecode");
              
              // K采样器应该排在最前面
              if (isASampler && !isBSampler) return -1;
              if (!isASampler && isBSampler) return 1;
              
              // VAE解码应该排在K采样器之后，其他节点之前
              if (isAVAEDecode && !isBVAEDecode && !isBSampler) return -1;
              if (!isAVAEDecode && isBVAEDecode && !isASampler) return 1;
              
              // 如果都是采样器或都是VAE解码，则按字母顺序排列
              return aId.localeCompare(bId);
            });
          } else {
            // 默认按照节点ID排序，保持稳定排列
            moduleNodes.sort((a, b) => a.localeCompare(b));
          }
          
          // 排列模块内的节点
          moduleNodes.forEach(nodeId => {
            const node = graph.nodes[nodeId].node;
            
            // 调整节点大小为统一宽度
            const nodeHeight = node.size[1];
            node.size[0] = maxWidth;
            
            // 设置节点位置
            node.pos[0] = xOffset;
            node.pos[1] = yOffset;
            
            // 更新下一个节点的垂直位置，长列使用更紧凑的间距
            yOffset += nodeHeight + verticalSpacing;
          });
          
          // 模块之间添加额外间距，但对于长列减小间距
          yOffset += columnIndex === 4 ? 
            this.config.verticalSpacing * 0.5 : this.config.verticalSpacing;
        });
        
        // 只有当列中有节点时才更新水平偏移
        if (hasNodes) {
          // 更新下一列的水平位置
          xOffset += maxWidth + this.config.horizontalSpacing * 2;
        }
      });
      
      // 应用变更
      this.app.graph.setDirtyCanvas(true, true);
      return true;
    } catch (error) {
      console.error("应用模块排布失败:", error);
      return false;
    }
  }
}

// 工具函数
export const LayoutTools = {
  // 获取ComfyUI应用实例
  getAppInstance() {
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
  },
  
  // 显示通知
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'layout-notification';
    notification.textContent = message;
    
    Object.assign(notification.style, {
      position: 'fixed',
      top: '24px', 
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10000',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      width: 'auto',
      minWidth: '240px',
      maxWidth: '90%',
      textAlign: 'center',
      opacity: '0',
      transform: 'translateX(-50%) translateY(-20px)'
    });
    
    if (type === 'info') {
      notification.style.backgroundColor = 'rgba(20, 120, 60, 0.85)';
      notification.style.color = 'white';
    } else if (type === 'warn') {
      notification.style.backgroundColor = 'rgba(230, 150, 10, 0.85)';
      notification.style.color = 'white';
    } else {
      notification.style.backgroundColor = 'rgba(200, 0, 0, 0.85)';
      notification.style.color = 'white';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
};