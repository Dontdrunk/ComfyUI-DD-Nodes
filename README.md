# ComfyUI-DD-Nodes

一个全流程 AI 开发的 ComfyUI 自定义节点集合（完全汉化），由 Dontdrunk 开发维护。

## 当前节点列表

<details>
  <summary>DD 模型优化加载+DD 采样优化器</summary>

高性能的模型加载优化器，支持智能加载和多种优化模式：
- 支持标准加载和分步加载两种方式
- 内置智能模式（针对模型大小与电脑配置自动选择最佳加载方案）
- 支持所有通过UNET节点进行加载的模型

- 模型首次采样速度优化器，消除首次采样延迟

![2131](https://github.com/user-attachments/assets/85c3f36b-f51a-4651-b4f7-9ff0d9f78170)

</details>

<details>
  <summary>DD 图片转视频帧</summary>

- 高效的图片转视频帧转换器

![微信截图_20250217231533](https://github.com/user-attachments/assets/66c05a9c-c33b-4813-b434-d3c5928067c5)

</details>

<details>
  <summary>DD 高级融合</summary>

- 强大的图像和视频融合处理器


![QQ2025220-185810-HD 00_00_00-00_00_30](https://github.com/user-attachments/assets/2a50614f-1911-4fd8-bc2e-8d2bece91e73)

</details>

<details>
  <summary>DD 颜色背景生成器</summary>

- 高级颜色背景生成器，支持多种颜色模式和图层控制

  
![123213](https://github.com/user-attachments/assets/141b1585-0d02-47f1-9d51-2d12eccc6403)

</details>

<details>
  <summary>DD 尺寸计算器+DD 极简Latent</summary>

- 极简的图像尺寸计算器与Latent 空间生成器

![123](https://github.com/user-attachments/assets/dca647bf-1c8f-4947-ad14-c7ad00e98d10)

</details>

<details>
  <summary>DD 图像统一尺寸+DD 遮罩统一尺寸</summary>

- 多功能图像和视频与遮罩的尺寸统一处理器

![2](https://github.com/user-attachments/assets/58629a1d-f331-4fd6-aabe-de7158d6fdda)

</details>

<details>
  <summary>DD 限制图像大小</summary>

- 智能图像尺寸限制器，确保图像在指定的最大和最小尺寸范围内

![3](https://github.com/user-attachments/assets/d2fac125-fad3-4f51-9b91-39d0be4c7753)

</details>

<details>
  <summary>DD 切换器系列节点</summary>

- 简化工作流程，提高处理灵活性

![2](https://github.com/user-attachments/assets/54690c0c-3627-4970-9bc0-ef58ca4be2f7)

</details>

<details>
  <summary>DD 界面布局</summary>

-已实现Alpha版本，可以随机或指定节点标题的颜色，可以对杂乱工作流做快速的模块化分类整理

</details>

<details>
  <summary>DD 节点连线动画</summary>

为 ComfyUI 节点连线提供多种炫酷动画效果，支持自定义风格：
- 支持“流动”、“波浪”、“律动”、“脉冲”等多种动画风格
- 动画参数可自定义（线宽、速度、特效等）

</details>

## 安装

1. 将文件复制到 ComfyUI 的 custom_nodes 目录
2. 安装依赖：`pip install -r requirements.txt`
3. 重启 ComfyUI

## 版本历史
- v2.1.0-F  （2025-05-08）
- 修复了连线动画与cg-use-everywhere插件的兼容性问题，现在当你关闭插件动画后，将采用cg-use-everywhere的动画实现（如果没有生效，请刷新浏览器）
- 修复了智能布局功能的一个严重BUG。

- v2.1.0  （2025-05-08）
  - 将连线动画效果做了模块化拆分，将动画效果抽离，方便日后维护以及添加新的动画效果。
   - 优化动画性能与算法，添加了可自主设置动画采样强度的设置选项，通过降低动画流畅度进一步降低大工作流下的性能开销。
   - 【低配置电脑建议拉低采样强度，拉高动画速度，以实现低性能开销，高流畅效果的实现，经过测试，该方法可以提升20%左右的FPS】
   - 优化了脉冲动画的效果，现在更加直观，修复了律动效果的一些BUG。
  - 【新功能！】实现了智能布局功能的Alpha版本，功能还在完善中，可能存在较多BUG，如果发现BUG或有功能方面的异常请提交issue进行反馈。

- v2.0.0-F（2025-05-05~06）
- 由于一些原因，我决定永久移除节点对齐的功能实现和所有代码，不久后一个更加强大的界面布局工具将重新加入该项目。
- 【已将项目修改为MIT协议，完全开源，我希望更多的人可以使用我的代码来创建或融入自己的项目】

- v2.0.0（2025-05-04）
  - 新增“电路板1”“电路板2”两种前端连线风格：
     电路板实现参考了 [quick-connections](https://github.com/niknah/quick-connections) 项目
    - 电路板1：经典L型/折线路径，兼容任意节点布局，动画与特效全兼容
    - 电路板2：支持递归避障，优先90/45度连线，自动智能绕障碍节点，动画与特效全兼容
  - 两种电路板模式均支持“流动”“波浪”“律动”“脉冲”等动画风格和渐变特效

- v1.9.0（2025-05-03）
  - 添加了一套完整的前端连线动画

- v1.8.0（2025-04-22）
  - ┭┮﹏┭┮

- v1.7.0（2025-04-21）
  - 添加遮罩统一尺寸节点
  - 添加限制图像大小节点
  - 添加切换器系列节点（条件切换器、Latent切换器、模型切换器）

- v1.6.0（2025-03-05）
  - 添加图像统一尺寸节点

- v1.5.0（2025-03-02）
  - 添加空Latent视频(Wan2.1)【该节点已经删除！！】

- v1.4.0（2025-03-01）
  - 添加采样优化器节点用于，实现首次采样延迟消除，优化CLIP文本编码预热

- v1.3.0（2025-02-21）
  - 添加模型优化加载节点，自动优化UNET模型

- v1.2.0（2025-02-20）
  - 添加高级融合节点，支持图片和视频的混合处理
  - 添加极简Latent节点

- v1.1.0（2025-02-19）
  - 优化颜色背景生成器节点
  - 添加图层控制功能
  - 改进遮罩混合系统

- v1.0.0（2025-02-17）
  - 初始发布
  - 添加颜色背景生成器节点
  - 添加尺寸计算器节点
  - 添加图片转视频帧节点
  - 完整中文界面支持

## 后续计划

- 添加更多图像处理节点
- 添加更多视频处理节点
- 添加工作流辅助节点
- 持续优化现有节点的性能和功能

## 反馈与建议

这是一个持续成长的节点集合，主要用于分享实用的 ComfyUI 扩展工具。欢迎通过 Issues 提供建议和反馈。如果您发现任何问题或有任何改进建议，请随时提出。

## 许可证

MIT

1. 听说项目的成长需要Money来维持 
2. 不打赏的话，作者可能会：
   - 🦥 躺平摆烂
   - 😴 睡大觉
   - 🎮 玩游戏去了

您的支持就是作者继续咕咕咕的动力！╭(●｀∀´●)╯
![收款码](https://github.com/user-attachments/assets/77c99c94-3854-4c12-81cf-09c9f76099ac)

