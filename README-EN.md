# ComfyUI-DD-Nodes

<div align="right">
  <a href="https://github.com/Dontdrunk/ComfyUI-DD-Nodes/blob/main/README.md">中文</a> | <b>English</b>
</div>

## 🚀 Project Overview

**ComfyUI-DD-Nodes** is a professional ComfyUI custom node collection focused on enhancing AI image generation workflow efficiency and user experience. This project adopts a full-process AI development approach, providing fully localized interfaces and rich functional modules, aiming to create the best ComfyUI extension experience for users.

### ✨ Core Features

- **🎯 Professional Toolkit**: Comprehensive functionality covering prompt management, model optimization, image processing, interface beautification, and more
- **🌏 Full Localization**: Supports ComfyUI's native internationalization system with seamless Chinese-English switching
- **⚡ Performance Optimization**: Multiple optimizations including intelligent model loading, sampling optimization, and animation performance tuning
- **🎨 Interface Enhancement**: Theme system, connection animations, layout tools, and other visual enhancement features
- **🔧 User-Friendly**: Intuitive and simple operation interface, reducing learning curve
- **📈 Continuous Updates**: Active development and maintenance with rapid response to user needs

## 📋 Node Functions Overview

| Node Name | Function Description | Image Description |
|-----------|---------------------|-------------------|
| **DD Model Optimizer** | High-performance model loading optimizer supporting intelligent loading and multiple optimization modes. Built-in Smart Mode automatically selects the best loading solution based on model size and hardware configuration, compatible with all models loaded through UNET nodes | ![Model Optimizer](https://github.com/user-attachments/assets/61fafb61-3f77-4154-bf89-ad82fb59c961) |
| **DD Image To Video** | Efficient image to video frame converter supporting batch processing and multiple output formats, providing convenience for video generation workflows | ![Image To Video Interface](https://github.com/user-attachments/assets/66c05a9c-c33b-4813-b434-d3c5928067c5) |
| **DD Advanced Fusion** | Powerful image and video fusion processor supporting multiple fusion algorithms and parameter adjustments for professional-grade image composition effects | ![Advanced Fusion Demo](https://github.com/user-attachments/assets/2a50614f-1911-4fd8-bc2e-8d2bece91e73) |
| **DD Dimension Calculator** | Minimalist image dimension calculator providing precise dimension calculation and ratio adjustment functions, ensuring output images meet expected specifications | ![Dimension Calculator](https://github.com/user-attachments/assets/f3b670d6-a471-4851-a2bf-49b8f174d83e) |
| **DD Simple Latent** | Simplified latent space generator providing quick and convenient latent space creation functionality, optimizing workflow node connections | ![Simple Latent](https://github.com/user-attachments/assets/ca00fb32-aa48-4e18-9a60-56b1c6cbda9c) |
| **DD Image Uniform Size** | Multi-functional image and video size unification processor supporting batch processing and intelligent scaling, ensuring output content size consistency | ![Image Uniform Size](https://github.com/user-attachments/assets/c96fbfa0-9da4-4641-a08b-6ce5699dfae3) |
| **DD Mask Uniform Size** | Professional mask size unification tool that works perfectly with image processing, ensuring mask and target image size matching | ![Mask Uniform Size](https://github.com/user-attachments/assets/65a7c374-cc3b-4bcf-b767-73d899b43128) |
| **DD Image Size Limiter** | Smart image size limiter ensuring images are within specified maximum and minimum size ranges, preventing memory overflow and performance issues | ![Image Size Limiter Interface](https://github.com/user-attachments/assets/d2fac125-fad3-4f51-9b91-39d0be4c7753) |
| **DD Switcher Series** | Includes condition switcher, latent switcher, model switcher and other switching nodes, simplifying workflows and improving processing flexibility | ![Switcher Series Interface](https://github.com/user-attachments/assets/54690c0c-3627-4970-9bc0-ef58ca4be2f7) |
| **DD Video First Last Frame** | Professional video frame extraction tool that can precisely extract the first and last frames of videos, providing convenience for video processing workflows | ![Video First Last Frame](https://github.com/user-attachments/assets/243c4809-8c83-43a3-9c2b-768f16644ded) |

## 🎯 Extension Functions Overview

| Function Name | Function Description | Image Description |
|---------------|---------------------|-------------------|
| **DD Prompt Manager** | Intelligent prompt embedding and management system providing powerful prompt management capabilities for all CLIP text encoder nodes. Supports prompt search, tag classification, import/export, real-time synchronization and other functions, significantly improving workflow creation efficiency | ![Prompt Manager Interface](https://github.com/user-attachments/assets/8a751d5a-980d-48d6-898d-fb8a016920fc) |
| **DD Interface Layout** | Intelligent node layout tool supporting random or specified node title colors, providing node alignment, size synchronization and other functions. Built-in theme system with two different styles per theme, click coin animation to switch | ![Interface Layout Effect](https://github.com/user-attachments/assets/e79cfa00-9243-41bb-98e3-e9c67e104419) |
| **DD Node Connection Animation** | Provides various cool animation effects for ComfyUI node connections, supporting "Flow", "Wave", "Rhythm", "Pulse" and other animation styles. Animation parameters are customizable (line width, speed, effects, etc.) with intelligent performance optimization | ![Connection Animation Effect](https://github.com/user-attachments/assets/aeac1b96-c8d0-497a-9594-1ab7b5766f44) |

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
- **v2.6.0** (2025-07-06)
  - 🔧 Attempted to fix multi-system compatibility bugs in interface layout panel
  - ➕ Added video first and last frame output node

### Important Updates
- **v2.5.1** (2025-07-02)
  - 🎯 Prompt management panel perfectly embedded in most official CLIP nodes and third-party CLIP nodes
  - 🔗 Perfect compatibility with ComfyUI-Easy-Use and ComfyUI-Fast-Use
  - 🐛 Fixed some known issues

- **v2.5.0** (2025-06-23)
  - 🎨 Complete reconstruction of prompt management panel UI and interaction
  - 🏷️ Tag colors can be freely set with batch editing support
  - 🔍 Upgraded search functionality supporting tag + text dual search
  - 💾 Real-time data synchronization with local files, goodbye browser cache
  - 📤 Export function includes complete data (prompts + tags)

- **v2.4.0** (2025-06-20)
  - 🔄 **Prompt Manager New Features**:
    - Intelligent backup functionality, all prompt operations automatically save to extensions\Prompt_Manager\prompts.json
    - Added tag functionality, now you can add up to 4 tags per prompt for categorization and quick searching

- **v2.3.0** (2025-06-18)
  - 🎉 **New Prompt Manager Feature**:
    - Added intelligent prompt embedding functionality for all CLIP text encoder nodes
    - Supports CRUD operations for prompts with a modern management interface
    - Supports import/export of prompt files in JSON format
    - Search functionality for prompt names and content for quick location
  - ⚡ **Online Animation Performance & Feature Optimization**:
    - Added animation visual options with "Show All" and "Hover Node" display modes
    - Improved intelligent frame rate control: dynamically adjusts refresh rate based on connection count

- **v2.2.1** (2025-05-27)
  - Improved interface UI, added theme options, and fixed bugs

- **v2.2.0** (2025-05-14)
  - Interface Layout Alpha 2.0 version released, with improved interface and basic tools
  - Now you can synchronize the width, height, and size of selected nodes, and align all selected nodes

- **v2.1.0** (2025-05-13)
  - Added support for ComfyUI's native internationalization (i18n) system
  - Now can seamlessly switch between Chinese and English interfaces
  - All node names, descriptions, parameters, and outputs support bilingual display

<details>
<summary>Click to view more version history</summary>

- **v2.0.2** (2025-05-12)
  - Further improved animation performance and effects, fixed some path bugs in animations

- **v2.0.1** (2025-05-08)
  - Fixed compatibility issues between connection animation and the cg-use-everywhere plugin
  - When animation is disabled, it will use cg-use-everywhere's animation implementation
  - Fixed a serious bug in the smart layout functionality

- **v2.0.0** (2025-05-08)
  - Modularized connection animation effects for easier maintenance and future additions
  - Optimized animation performance and algorithms, added animation sampling strength options
  - [Low-spec computers: reduce sampling strength and increase animation speed to improve FPS by about 20%]
  - Improved pulse animation effects and fixed rhythm effect bugs
  - [New Feature!] Implemented Alpha version of interface layout functionality

- **v1.9.1** (2025-05-05~06)
  - Permanently removed node alignment functionality, with plans for a more powerful interface layout tool
  - [Changed project to MIT license for full open-source accessibility]

- **v1.9.0** (2025-05-04)
  - Added "Circuit Board 1" and "Circuit Board 2" connection styles:
    - Circuit board implementation references the [quick-connections](https://github.com/niknah/quick-connections) project
    - Circuit Board 1: Classic L-shaped/folded paths, compatible with any node layout, fully supports animations and effects
    - Circuit Board 2: Supports recursive obstacle avoidance, prioritizes 90/45 degree connections, automatically avoids obstacle nodes
  - Both circuit board modes support "Flow", "Wave", "Rhythm", "Pulse" animation styles and gradient effects

- **v1.8.0** (2025-05-03)
  - Added a complete set of frontend connection animations

- **v1.7.0** (2025-04-22)
  - ┭┮﹏┭┮

- **v1.6.0** (2025-04-21)
  - Added mask uniform size node
  - Added image size limiter node
  - Added switcher series nodes (Condition, Latent, Model)

- **v1.5.0** (2025-03-05)
  - Added image uniform size node

- **v1.4.0** (2025-03-02)
  - Added empty Latent video (Wan2.1) [This node has been removed!]

- **v1.2.0** (2025-02-21)
  - Added model optimizer node for UNET model optimization

- **v1.1.0** (2025-02-20)
  - Added advanced fusion node for image and video processing
  - Added simple latent node

- **v1.0.1** (2025-02-19)
  - Added layer control features
  - Improved mask blending system

- **v1.0.0** (2025-02-17)
  - Initial release
  - Added dimension calculator node
  - Added image to video frame node
  - Full Chinese interface support

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
