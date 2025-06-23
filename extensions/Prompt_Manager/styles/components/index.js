// 组件统一导出文件
// 方便在其他地方统一导入所有UI组件

export { MainModal } from './MainModal.js';
export { SearchBar } from './SearchBar.js';
export { PromptList } from './PromptList.js';
export { PromptForm } from './PromptForm.js';
export { DialogComponents } from './DialogComponents.js';
export { TagColorManager, globalTagColorManager } from './TagColorManager.js';
export { TagManager } from './TagManager.js';

// 组件版本信息
export const COMPONENT_VERSION = '1.0.0';

// 组件元数据
export const COMPONENT_METADATA = {
    MainModal: {
        version: '1.0.0',
        description: '主模态框组件，负责整体模态框结构和基础样式',
        dependencies: []
    },
    SearchBar: {
        version: '1.0.0',
        description: '搜索栏组件，负责提示词搜索功能',
        dependencies: []
    },
    PromptList: {
        version: '1.0.0',
        description: '列表组件，负责提示词列表的显示和交互',
        dependencies: []
    },
    PromptForm: {
        version: '1.0.0',
        description: '表单组件，负责添加/编辑提示词的表单',
        dependencies: []
    },
    DialogComponents: {
        version: '1.0.0',
        description: '对话框组件，负责各种确认对话框和选择器',
        dependencies: []
    }
};

// 验证所有组件是否正确加载
export function validateComponents() {
    const components = [
        'MainModal',
        'SearchBar', 
        'PromptList',
        'PromptForm',
        'DialogComponents'
    ];
    
    const results = {};
    let allValid = true;
    
    components.forEach(componentName => {
        try {
            const Component = eval(componentName);
            results[componentName] = {
                loaded: true,
                constructor: typeof Component === 'function',
                metadata: COMPONENT_METADATA[componentName]
            };
        } catch (error) {
            results[componentName] = {
                loaded: false,
                error: error.message,
                metadata: COMPONENT_METADATA[componentName]
            };
            allValid = false;
        }
    });
    
    return {
        allValid,
        components: results,
        version: COMPONENT_VERSION
    };
}
