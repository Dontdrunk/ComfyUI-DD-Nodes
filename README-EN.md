# ComfyUI-DD-Nodes

<div align="right">
  <a href="https://github.com/Dontdrunk/ComfyUI-DD-Nodes/blob/main/README.md">中文</a> | <b>English</b>
</div>

A collection of fully customized ComfyUI nodes developed by Dontdrunk, designed to enhance your workflow with powerful tools and optimizations.

## Node List

<details>
  <summary>DD Model Optimizer + DD Sampling Optimizer</summary>

High-performance model loading optimizer with multiple optimization modes:
- Supports standard loading and step-by-step loading methods
- Built-in Smart Mode (automatically selects the best loading solution based on model size and hardware configuration)
- Compatible with all models loaded through UNET nodes

- First-time sampling speed optimizer, eliminates first sampling delay

![2131](https://github.com/user-attachments/assets/85c3f36b-f51a-4651-b4f7-9ff0d9f78170)

</details>

<details>
  <summary>DD Image To Video</summary>

- Efficient image to video frame converter

![微信截图_20250217231533](https://github.com/user-attachments/assets/66c05a9c-c33b-4813-b434-d3c5928067c5)

</details>

<details>
  <summary>DD Advanced Fusion</summary>

- Powerful image and video fusion processor

![QQ2025220-185810-HD 00_00_00-00_00_30](https://github.com/user-attachments/assets/2a50614f-1911-4fd8-bc2e-8d2bece91e73)

</details>

<details>
  <summary>DD Color Background Generator</summary>

- Advanced color background generator supporting various color modes and layer controls
  
![123213](https://github.com/user-attachments/assets/141b1585-0d02-47f1-9d51-2d12eccc6403)

</details>

<details>
  <summary>DD Dimension Calculator + DD Simple Latent</summary>

- Minimalist image dimension calculator and latent space generator

![123](https://github.com/user-attachments/assets/dca647bf-1c8f-4947-ad14-c7ad00e98d10)

</details>

<details>
  <summary>DD Image Uniform Size + DD Mask Uniform Size</summary>

- Multi-functional image, video, and mask size unification processor

![2](https://github.com/user-attachments/assets/58629a1d-f331-4fd6-aabe-de7158d6fdda)

</details>

<details>
  <summary>DD Image Size Limiter</summary>

- Smart image size limiter, ensuring images are within specified maximum and minimum size ranges

![3](https://github.com/user-attachments/assets/d2fac125-fad3-4f51-9b91-39d0be4c7753)

</details>

<details>
  <summary>DD Switcher Series Nodes</summary>

- Simplify workflows and increase processing flexibility

![2](https://github.com/user-attachments/assets/54690c0c-3627-4970-9bc0-ef58ca4be2f7)

</details>

<details>
  <summary>DD Interface Layout</summary>

- Alpha version implemented, can randomly or specifically color node titles, and quickly organize messy workflows into modules

</details>

<details>
  <summary>DD Node Connection Animation</summary>

Provides various cool animation effects for ComfyUI node connections, supporting customizable styles:
- Supports "Flow", "Wave", "Rhythm", "Pulse" and other animation styles
- Animation parameters are customizable (line width, speed, effects, etc.)

</details>

## Installation
Method 1
1. Copy the files to ComfyUI's custom_nodes directory
2. Install dependencies: `pip install -r requirements.txt`
3. Restart ComfyUI

Method 2 (Recommended)
Use Manager or launcher for installation

## Language Switching

This extension now supports ComfyUI's native internationalization (i18n) system, allowing switching between Chinese and English interfaces:

1. Switch languages: Select language options in the settings menu in the upper right corner of the ComfyUI interface
2. Choose Chinese (zh) or English (en)
3. Currently only supports node translation, frontend functionality translation is not yet supported

## Version History
- v2.3.0 (2025-05-14)
  - Interface Layout Alpha 2.0 version released, with improved interface and basic tools
  - Now you can synchronize the width, height, and size of selected nodes, and align all selected nodes
  - Still a test version, please report bugs if you find any

- v2.2.0 (2025-05-13)
  - Added support for ComfyUI's native internationalization (i18n) system
  - Now can seamlessly switch between Chinese and English interfaces
  - All node names, descriptions, parameters, and outputs support bilingual display
  - Removed modular functionality from the smart layout (may be replaced with custom templates in the future)

- v2.1.2 (2025-05-12)
  - Further improved animation performance and effects, fixed some path bugs in animations

- v2.1.1 (2025-05-08)
  - Fixed compatibility issues between connection animation and the cg-use-everywhere plugin
  - When animation is disabled, it will use cg-use-everywhere's animation implementation (refresh browser if not working)
  - Fixed a serious bug in the smart layout functionality

- v2.1.0 (2025-05-08)
  - Modularized connection animation effects for easier maintenance and future additions
  - Optimized animation performance and algorithms, added animation sampling strength options
  - [Low-spec computers: reduce sampling strength and increase animation speed to improve FPS by about 20%]
  - Improved pulse animation effects and fixed rhythm effect bugs
  - Implemented Alpha version of smart layout functionality (may contain bugs)

- v2.0.0-F (2025-05-05~06)
  - Permanently removed node alignment functionality, with plans for a more powerful interface layout tool
  - Changed project to MIT license for full open-source accessibility

- v2.0.0 (2025-05-04)
  - Added "Circuit Board 1" and "Circuit Board 2" connection styles:
    - Circuit board implementation references the [quick-connections](https://github.com/niknah/quick-connections) project
    - Circuit Board 1: Classic L-shaped/folded paths, compatible with any node layout, fully supports animations and effects
    - Circuit Board 2: Supports recursive obstacle avoidance, prioritizes 90/45 degree connections, automatically avoids obstacle nodes
  - Both circuit board modes support "Flow", "Wave", "Rhythm", "Pulse" animation styles and gradient effects

- v1.9.0 (2025-05-03)
  - Added a complete set of frontend connection animations

- v1.8.0 (2025-04-22)
  - ┭┮﹏┭┮

- v1.7.0 (2025-04-21)
  - Added mask uniform size node
  - Added image size limiter node
  - Added switcher series nodes (Condition, Latent, Model)

- v1.6.0 (2025-03-05)
  - Added image uniform size node

- v1.5.0 (2025-03-02)
  - Added empty Latent video (Wan2.1) [This node has been removed!]

- v1.4.0 (2025-03-01)
  - Added sampling optimizer node for first sampling delay elimination and CLIP text encoding preheating

- v1.3.0 (2025-02-21)
  - Added model optimizer node for UNET model optimization

- v1.2.0 (2025-02-20)
  - Added advanced fusion node for image and video processing
  - Added simple latent node

- v1.1.0 (2025-02-19)
  - Optimized color background generator node
  - Added layer control features
  - Improved mask blending system

- v1.0.0 (2025-02-17)
  - Initial release
  - Added color background generator node
  - Added dimension calculator node
  - Added image to video frame node
  - Full Chinese interface support

## Future Plans

- Add more image processing nodes
- Add more video processing nodes
- Add workflow assistance nodes
- Continue optimizing existing node performance and functionality

## Feedback and Suggestions

This is a growing collection of nodes, primarily for sharing practical ComfyUI extension tools. Feel free to provide suggestions and feedback through Issues. If you find any problems or have any improvement suggestions, please feel free to raise them.

## License

MIT

1. Project growth requires financial support
2. Without donations, the author might:
   - 🦥 Stop development
   - 😴 Take a long nap
   - 🎮 Go play games instead

Your support is the motivation for the author to continue development! ╭(●｀∀´●)╯
![QR Code](https://github.com/user-attachments/assets/77c99c94-3854-4c12-81cf-09c9f76099ac)
