# ComfyUI-DD-Nodes AI Agent Guide

## Project Architecture

This is a **ComfyUI extension** providing custom nodes and frontend enhancements. The project has a dual-layer architecture:

### Backend: Python Nodes (`/node/`)
- Each file exports `NODE_CLASS_MAPPINGS` and `NODE_DISPLAY_NAME_MAPPINGS`
- Node classes follow ComfyUI's pattern: `INPUT_TYPES()`, `RETURN_TYPES`, `FUNCTION`, `CATEGORY = "🍺DD系列节点"`
- All nodes use Chinese parameter names (e.g., `"宽度"`, `"高度"`) with English translations via localization
- Core categories: image processing, video processing, model optimization, switching utilities

### Frontend: JavaScript Extensions (`/extensions/`)
- Three main extensions: `Prompt_Manager`, `Online Animation`, `Intelligent Layout`
- Entry point: `extensions/index.js` imports all extension modules
- Each extension follows pattern: `{ExtensionName}Ext.js` → `{ExtensionName}Core.js` → `/styles/` or `/effects/`

## Key Patterns

### Node Development
```python
# Standard node structure - use this pattern for new nodes
class DDNodeName:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {"参数名": ("TYPE", {"default": value})}}
    
    RETURN_TYPES = ("OUTPUT_TYPE",)
    RETURN_NAMES = ("输出名",)
    FUNCTION = "function_name"
    CATEGORY = "🍺DD系列节点"
```

### Frontend Extension Registration
```javascript
// Extension entry pattern
import { app } from "/scripts/app.js";
app.registerExtension({
    name: "ComfyUI.ExtensionName",
    setup() { /* initialization */ }
});
```

### Settings Integration
Extensions use `app.extensionManager.setting.get()` for user preferences and apply them through core classes.

## Internationalization (i18n)

- **Backend**: Chinese parameter names with English via `/locales/{en,zh}/nodeDefs.json`
- **Frontend**: Currently Chinese-only, English i18n planned
- **Pattern**: Use Chinese internally, provide English translations in locale files
- **Category**: Always `"🍺DD系列节点"` (translates to "DD Series Nodes")

## Extension Development

### Prompt Manager
- Embeds prompt management UI into CLIP text encoder nodes
- Maintains compatibility with 30+ node types (see `CLIP_TEXT_ENCODERS` array)
- API backend: `prompt_api.py` handles JSON persistence via aiohttp routes

### Animation System
- Modular effect system: `BaseEffect.js` → specific effects (`FlowEffect.js`, `PulseEffect.js`, etc.)
- Style system: `BaseStyle.js` → rendering styles (`CurveStyle.js`, `CircuitBoard1Style.js`, etc.)
- Performance optimization: dynamic FPS based on connection count, hover-based rendering

### Layout System
- Theme architecture: `UIStyles.js` registers themes, `AncientGodEye/` contains theme implementations
- Node manipulation utilities in `UIUtils.js`
- Panel-based UI with settings persistence

## Development Workflow

### Adding New Nodes
1. Create node file in `/node/` following the standard pattern
2. Add import and mapping to `__init__.py`
3. Add translations to `/locales/en/nodeDefs.json` and `/locales/zh/nodeDefs.json`
4. Update version in `pyproject.toml`

### Frontend Development
1. Extensions auto-load via `extensions/index.js`
2. Use modular architecture: Core class + UI components + Effects/Styles
3. Integrate with ComfyUI's settings system for user preferences
4. Follow performance patterns: avoid constant redraws, use hover states wisely

### Testing Integration Points
- Test node compatibility with major ComfyUI workflows
- Verify extension compatibility with ComfyUI Manager
- Test i18n switching (Settings → Language)

## Dependencies & Performance

- **Core deps**: torch, opencv, pillow, moviepy for media processing
- **Memory optimization**: Smart model loading based on system resources (see `model_optimizer.py`)
- **Animation performance**: Intelligent frame rate control, connection-count-based optimization
- **File operations**: Async file handling in prompt manager API

## Common Patterns to Follow

- **Error handling**: Graceful degradation when ComfyUI APIs unavailable
- **Backwards compatibility**: Support multiple node type variants
- **User experience**: Chinese-first UI with English fallbacks
- **Performance**: Always consider resource usage, especially for animations and model operations
