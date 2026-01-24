# ComfyUI-DD-Nodes

<div align="right">
  <a href="https://github.com/Dontdrunk/ComfyUI-DD-Nodes/blob/main/README.md">中文</a> | <b>English</b>
</div>

## 🚀 Project Overview

**ComfyUI-DD-Nodes** is a professional ComfyUI custom node collection focused on improving AI generation workflow efficiency and user experience. This project adopts a full-process AI development approach, providing a fully localized UI and rich functional modules, aiming to deliver the best ComfyUI extension experience for Chinese users.

### ✨ Core Features

- **🎯 Professional Toolkit**: Covers prompt management, model optimization, image processing, UI enhancement, and more
- **🌏 Fully Localized**: Supports ComfyUI native internationalization (i18n) with seamless Chinese-English switching
- **⚡ Performance Optimization**: Multiple optimizations including intelligent model loading and animation performance tuning
- **🎨 UI Enhancement**: Theme system, connection animations, layout tools, and other visual enhancement features
- **🔧 Easy to Use**: Clean and intuitive UI, reducing the learning curve
- **📈 Actively Maintained**: Continuous development with fast response to user needs

## 🎯 Extension Functions Overview

| Function Name | Function Description | Image Description |
|--------------|----------------------|------------------|
| **DD Prompt Manager** | An intelligent prompt embedding and management system. It provides powerful prompt management for all CLIP text encoder nodes, including search, tag categorization, import/export, real-time sync, and more — significantly improving workflow creation efficiency | ![Prompt Manager UI](https://github.com/user-attachments/assets/8a751d5a-980d-48d6-898d-fb8a016920fc) |
| **DD Interface Layout** | An intelligent node layout tool. Supports random or specified node title colors, node alignment, size synchronization, and more. Built-in theme system (Chaos Mode / Order Mode), each theme has two styles. Click the coin animation to switch. Layout supports real-time preview and animation | ![Interface Layout](https://github.com/user-attachments/assets/e79cfa00-9243-41bb-98e3-e9c67e104419) |
| **DD Node Connection Animation** | Provides multiple cool animation effects for ComfyUI node connections, including "Flow", "Wave", "Rhythm", "Pulse", etc. Supports 4 rendering styles (straight, right-angle, curve, circuit board). Parameters are customizable (width, speed, effects, etc.). Provides "Show All" and "Hover Node" modes; hover mode uses static + animated overlay rendering for smooth visuals | ![Connection Animation](https://github.com/user-attachments/assets/aeac1b96-c8d0-497a-9594-1ab7b5766f44) |

## 📋 Node Feature Preview

| Node Name | Function Description | Image Description |
|----------|----------------------|------------------|
| **DD Image Outline** | Intelligent image outlining tool. Supports outlining for transparent and normal images. Provides outer outline, inner outline, and centered outline modes, with customizable color, size, opacity, and mask support | ![Image Outline](https://github.com/user-attachments/assets/5c4b6fc0-2f41-4c2d-8a18-fd6a7cdd5ca8) |
| **DD Qwen-MT Translator** | Powerful multilingual translation node based on Alibaba Cloud Qwen-MT. Supports translation between 92 languages and provides General, Terminology, and Domain translation modes | ![Qwen-MT](https://github.com/user-attachments/assets/baf85914-ceab-4aac-9b2a-7ac331ffbacb) |
| **DD Model Optimized Loading** | High-performance model loading optimizer supporting intelligent loading and multiple optimization modes. Built-in Smart Mode automatically selects the best loading strategy based on model size and hardware configuration. Supports all models loaded via UNET nodes | ![Model Loading](https://github.com/user-attachments/assets/61fafb61-3f77-4154-bf89-ad82fb59c961) |
| **DD Image To Video Frames** | Efficient image-to-video-frames converter supporting batch processing and multiple output formats, providing convenience for video generation workflows | ![Image To Video Frames](https://github.com/user-attachments/assets/66c05a9c-c33b-4813-b434-d3c5928067c5) |
| **DD Advanced Fusion** | Powerful image and video fusion processor supporting multiple fusion algorithms and parameter tuning to achieve professional-grade compositing effects | ![Advanced Fusion](https://github.com/user-attachments/assets/2a50614f-1911-4fd8-bc2e-8d2bece91e73) |
| **DD Dimension Calculator** | Minimal image dimension calculator providing precise size calculation and ratio adjustment to ensure outputs match expected specs | ![Dimension](https://github.com/user-attachments/assets/f3b670d6-a471-4851-a2bf-49b8f174d83e) |
| **DD Simple Latent** | Simplified latent generator that provides a fast and convenient way to create latent space, optimizing workflow node connections | ![Simple Latent](https://github.com/user-attachments/assets/ca00fb32-aa48-4e18-9a60-56b1c6cbda9c) |
| **DD Image Uniform Size** | Multi-functional image/video uniform-sizing processor with batch processing and smart scaling, ensuring consistent output dimensions | ![Image](https://github.com/user-attachments/assets/c96fbfa0-9da4-4641-a08b-6ce5699dfae3) |
| **DD Mask Uniform Size** | Professional mask uniform-sizing tool that pairs with image processing to ensure mask dimensions match the target image | ![Mask](https://github.com/user-attachments/assets/65a7c374-cc3b-4bcf-b767-73d899b43128) |
| **DD Image Size Limiter** | Smart image size limiter ensuring images stay within configured max/min sizes to prevent memory overflow and performance issues | ![Size Limiter](https://github.com/user-attachments/assets/d2fac125-fad3-4f51-9b91-39d0be4c7753) |
| **DD Switcher Series** | A set of switcher nodes including Conditional Switcher, Latent Switcher, Model Switcher, etc., simplifying workflows and improving flexibility | ![Switchers](https://github.com/user-attachments/assets/54690c0c-3627-4970-9bc0-ef58ca4be2f7) |
| **DD Video First/Last Frame Output** | Video frame extraction tool that precisely outputs the first and last frames of a video for video workflows | ![First/Last](https://github.com/user-attachments/assets/243c4809-8c83-43a3-9c2b-768f16644ded) |
| **DD Image Splitter** | Intelligent image splitter supporting custom ratio splitting. Choose left-right or top-bottom splitting, supports unequal ratios (e.g., 2:1:3), and outputs the specified split part | ![Image Splitter](To be added) |
| **DD Aspect Ratio Selector** | Aspect ratio selection tool that provides recommended resolutions for different models (e.g., Qwen-image, Wan2.2). Supports landscape/portrait/square categories and automatically provides the most suitable sizes | ![Aspect Ratio Selector](To be added) |
| **DD TXT File Merger** | Powerful text merger that recursively scans all TXT files in a folder (and subfolders) and merges them into a single text. Automatically adds file-path markers and supports multiple encodings | ![TXT Merger](To be added) |

## 🔧 Installation Methods

### Method 1: Manual Installation
1. Copy files to ComfyUI's `custom_nodes` directory
2. Install dependencies: `pip install -r requirements.txt`
3. Restart ComfyUI

### Method 2: Manager Installation (Recommended)
1. Use ComfyUI Manager or launcher for git installation
2. Or search "ComfyUI-DD-Nodes" directly in Manager and install

## 🌐 Language Switching

This extension now supports ComfyUI's native internationalization (i18n) system for seamless Chinese-English switching:

1. **Switch Language**: Select language options in the settings menu in the upper right corner of ComfyUI interface
2. **Select Language**: Supports Chinese (zh) and English (en)
3. **Function Scope**: Currently supports node translation, frontend function translation is under development

## 📈 Version History

### Latest Version
- **v3.1.3** (2025-01-24)
- Connection animation speed changed from 3 levels to 6 levels
- Text in the settings panel now switches with language (currently only Chinese and English)

- **v3.1.2** (2025-12-29)
- Added “Show connections for selected nodes” to the connection animation display system

- **v3.1.1** (2025-12-10)
- Added compatibility support for Vue Nodes 2.0 nodes

- **v3.1.0** (2025-09-21)
- Added DD TXT File Merger node, supporting recursive scan of TXT files and merging into one text

- **v3.0.0** (2025-09-05)
- Added DD Image Splitter node, supporting custom ratio splitting and output of specified parts

- **v2.9.1** (2025-09-04)
- Removed DD Sampler node (it no longer fits the latest ComfyUI)

- **v2.9.0** (2025-09-01)
- Added Aspect Ratio Selector node

- **v2.8.3** (2025-08-23)
- Prompt Manager added embedding support for the TextEncodeQwenImageEdit node

- **v2.8.2** (2025-08-01)
- Removed Circuit Board 1 (it is effectively the same as right-angle). If connections disappear after update, just re-select the style
- Fully synced path calculation for straight/curve/right-angle styles with ComfyUI official implementation

- **v2.8.1** (2025-07-31)
- Added default rendering style selection for static lines, supporting official-static+dynamic and independent-static+dynamic modes

- **v2.8.0** (2025-07-30)
  - **New: Qwen-MT Translation**:
    - Integrated Alibaba Cloud Qwen-MT, supports translation between 92 languages
    - Supports General / Terminology / Domain translation modes
    - Provides a convenient API key configuration UI, supporting one-click configuration and management
  - **Major connection animation system upgrade**:
    - Optimized visuals in hover mode, using fully independent static-style rendering
    - In hover mode, inactive connections now render as static; active connections overlay animation effects
  - **Circuit Board 2 performance optimization**:
    - Spatial partitioning optimization greatly improves path calculation performance (50–70% for small graphs, 80–95% for large graphs)
    - Dynamic grid size adjustment to optimize performance based on node count

- **v2.7.0** (2025-07-26)
  - 🎨 Added DD Image Outline node, supporting intelligent outlining for transparent and normal images
  - 🎯 Supports outer/inner/center outline modes for different use cases
  - 🎮 Supports custom outline size and opacity, fully compatible with masks

- **v2.6.0** (2025-07-06)
  - 🔧 Attempted to fix multi-OS compatibility issues for the Interface Layout panel
  - ➕ Added Video First/Last Frame Output node

- **v2.5.1** (2025-07-02)
  - 🎯 Prompt Manager panel perfectly embeds most official and third-party CLIP nodes
  - 🔗 Perfectly compatible with ComfyUI-Easy-Use and ComfyUI-Fast-Use
  - 🐛 Fixed some known issues

- **v2.5.0** (2025-06-23)
  - 🎨 Full UI/interaction refactor for Prompt Manager
  - 🏷️ Tag colors are freely editable, with batch edit support
  - 🔍 Search upgrade: tag + text dual search
  - 💾 Real-time sync to local file, no more browser cache
  - 📤 Export includes complete data (prompts + tags)

- **v2.4.0** (2025-06-20)
  - 🔄 **Prompt Manager new features**:
    - Smart backup: all prompt operations are saved to extensions\Prompt_Manager\prompts.json
    - Added tags: up to 4 tags per prompt for categorization and quick lookup

- **v2.3.0** (2025-06-18)
  - 🎉 **New: Prompt Manager**:
    - Added smart prompt embedding for all CLIP text encoder nodes
    - Supports CRUD for prompts with a modern management UI
    - Supports import/export of prompts in JSON
    - Supports searching by prompt name and content
  - ⚡ **Online Animation performance & feature optimization**:
    - Added visual options: "Show All" and "Hover Node"
    - Improved smart FPS control: dynamically adjusts redraw frequency based on connection count (hover mode is close to native FPS)

- **v2.2.1** (2025-05-27)
  - Improved UI, added theme options, and fixed bugs

- **v2.2.0** (2025-05-14)
  - Interface Layout Alpha 2.0 released with improved UI and basic tools
  - Can now sync width/height/size of selected nodes and align all selected nodes

- **v2.1.0** (2025-05-13)
  - Added support for ComfyUI native i18n
  - Seamless Chinese-English switching
  - All node names, descriptions, parameters, and outputs support bilingual display

<details>
<summary>Click to view more version history</summary>

- **v2.0.2** (2025-05-12)
  - Further improved animation performance and effects, fixed some path bugs

- **v2.0.1** (2025-05-08)
  - Fixed compatibility issues between connection animation and cg-use-everywhere
  - Fixed a serious bug in the Interface Layout feature

- **v2.0.0** (2025-05-08)
  - Modularized connection animation effects for easier future maintenance
  - Optimized animation performance and algorithms, added animation sampling strength options
  - [New Feature!] Implemented Alpha version of Interface Layout

- **v1.9.1** (2025-05-05~06)
  - Permanently removed node alignment functionality and all its code
  - [Project changed to MIT license, fully open-sourced]

- **v1.9.0** (2025-05-04)
  - Added "Circuit Board 1" and "Circuit Board 2" frontend connection styles
  - Circuit Board 1: classic L-shaped / folded paths, compatible with any node layout, animations and effects fully supported
  - Circuit Board 2: supports recursive obstacle avoidance, prefers 90/45-degree connections, and intelligently routes around obstacle nodes

- **v1.8.0** (2025-05-03)
  - Added a complete set of frontend connection animations

- **v1.6.0** (2025-04-21)
  - Added Mask Uniform Size node
  - Added Image Size Limiter node
  - Added Switcher Series nodes (Conditional Switcher, Latent Switcher, Model Switcher)

- **v1.5.0** (2025-03-05)
  - Added Image Uniform Size node

- **v1.3.0** (2025-03-01)
  - Added a Sampling Optimizer node to remove first-sampling delay and improve CLIP text encoder warm-up

- **v1.2.0** (2025-02-21)
  - Added Model Optimized Loading node to optimize UNET model loading

- **v1.1.0** (2025-02-20)
  - Added Advanced Fusion node, supporting mixed processing for images and videos
  - Added Simple Latent node

- **v1.0.1** (2025-02-19)
  - Added layer control features
  - Improved mask blending system

- **v1.0.0** (2025-02-17)
  - Initial release
  - Added Dimension Calculator node
  - Added Image To Video Frames node
  - Full Chinese UI support

</details>

## 🚀 Future Plans

- 🖼️ Add more image processing nodes
- 🎬 Expand video processing functionality
- 🔧 Develop workflow assistance tools
- ⚡ Continue optimizing existing node performance

## 💬 Feedback and Suggestions

This is a continuously growing professional node collection dedicated to providing the most practical extension tools for ComfyUI users. We welcome suggestions and feedback through Issues - every suggestion will drive the project's development.

## 📄 License
- MIT License

## ☕ Support the Author

If this project helps you, welcome to support the author's continued development:

1. They say project growth needs money to survive 💰
2. Without donations, the author might:
   - 🦥 Become lazy and slack off
   - 😴 Sleep all day
   - 🎮 Go play games instead

Your support is the motivation for the author to continue coding! ╭(●｀∀´●)╯

![Payment QR Code](https://github.com/user-attachments/assets/77c99c94-3854-4c12-81cf-09c9f76099ac)
