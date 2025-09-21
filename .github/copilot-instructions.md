# ComfyUI-DD-Nodes Developer Guide

## Architecture Overview

This is a **ComfyUI extension** with hybrid Python/JavaScript architecture:
- **Backend**: Python nodes in `/node/` (image processing, AI workflows)  
- **Frontend**: JavaScript extensions in `/extensions/` (UI enhancements, animations, APIs)
- **Localization**: Bilingual support via `/locales/zh/` and `/locales/en/`

## Key Development Patterns

### Adding New Nodes
1. Create Python class in `/node/` with ComfyUI conventions:
   ```python
   class YourNode:
       @classmethod
       def INPUT_TYPES(s):
           return {"required": {"input": ("TYPE",)}}
       
       RETURN_TYPES = ("OUTPUT_TYPE",)
       FUNCTION = "process"
       CATEGORY = "🍺DD系列节点"
   ```

2. Export in `NODE_CLASS_MAPPINGS = {"DD-YourNode": YourNode}`
3. Import in `__init__.py` and add to main `NODE_CLASS_MAPPINGS`
4. Add Chinese translations to `locales/zh/nodeDefs.json`

### Frontend Extensions
Create extension in `/extensions/YourExt/`:
```javascript
import { app } from "/scripts/app.js";

app.registerExtension({
    name: "ComfyUI.YourExtension",
    setup() {
        // Initialization code
    },
    beforeRegisterNodeDef(nodeType, nodeData, app) {
        // Hook into node creation
    }
});
```

### Adding API Endpoints
In Python modules, use ComfyUI's PromptServer:
```python
from server import PromptServer

@PromptServer.instance.routes.post("/your_api/endpoint")
async def your_handler(request):
    return web.json_response({"success": True})
```

## Critical Conventions

### Canvas Monkey-Patching
When modifying ComfyUI's canvas behavior, **always preserve original methods**:
```javascript
const originalMethod = app.canvas.originalMethod;
app.canvas.originalMethod = function(...args) {
    // Your enhancement
    return originalMethod?.call(this, ...args);
};
```

### Settings Integration
Use ComfyUI's built-in settings system:
```javascript
app.extensionManager.setting.get("YourExt.setting") ?? defaultValue
app.extensionManager.setting.onChange("YourExt.setting", callback)
```

### Theme Architecture
Themes must implement interface: `{init, applyTheme, flipCoin, cleanup, name}`
Register via: `registerTheme('theme-id', themeModule)`

## Performance Patterns

### Spatial Optimization
For canvas operations affecting many nodes, use spatial partitioning (see `StaticCircuitBoardStyle.js`):
- Build spatial grid index for O(1) lookups
- Use Bresenham line algorithm for collision detection
- Dynamic grid sizing based on node count

### Lazy Loading
Extensions use singleton patterns:
```javascript
function getOrCreateInstance() {
    if (!app.canvas._yourInstance) {
        app.canvas._yourInstance = new YourClass();
    }
    return app.canvas._yourInstance;
}
```

## File Structure Conventions

```
/node/                    # Python backend nodes
/extensions/              # Frontend JavaScript modules
  /YourExt/
    YourExtExt.js        # Extension entry (imported in index.js)
    YourExtCore.js       # Core functionality
    /styles/             # UI styling and utilities
/locales/zh/             # Chinese translations
  nodeDefs.json         # Node translations
  main.json            # UI translations
```

## Development Workflow

1. **No build system** - Direct ES6 modules, hot-reload friendly
2. **Testing**: Restart ComfyUI to test Python changes, refresh for JS changes  
3. **Dependencies**: Add to `requirements.txt`, use npm-style imports for JS
4. **Debugging**: Use browser DevTools for frontend, Python print/logging for backend

## Integration Points

- Node widgets auto-added via `beforeRegisterNodeDef` hooks
- Settings persist via ComfyUI's storage system
- API calls use `/scripts/api.js` from ComfyUI core
- Internationalization follows ComfyUI's i18n system
- Extension loading via `WEB_DIRECTORY = "extensions"` in `__init__.py`

When adding features, follow existing patterns in `/extensions/Prompt_Manager/` (API integration) or `/extensions/Online_Animation/` (canvas enhancement) as reference implementations.
