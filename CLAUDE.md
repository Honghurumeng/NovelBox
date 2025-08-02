# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NovelBox is an AI-powered novel writing assistant built with Electron + Vue.js. It provides a three-column writing interface with chapter management and AI text rewriting capabilities.

## Key Features

- AI Integration: Supports OpenAI and Google Gemini compatible APIs
- Novel Editor: Three-column writing panel with chapter management
- Cross-platform: Built with Electron for desktop applications
- Unified Notification System: Modern toast notifications replacing alert() calls
- Theme Support: Light/Dark theme switching with CSS variables
- i18n support: Configured for Chinese and English

## Tech Stack

- Electron: Desktop application framework
- Vue.js 3: Frontend framework with Composition API
- Vite: Frontend build tool
- Pinia: State management
- Vue Router: Routing management
- Vue I18n: Internationalization (planned)

## Development Commands

### Install Dependencies
```bash
npm install
```

### Run Development Environment
This command starts both the Vite development server and the Electron application.
```bash
npm run dev
```

### Build Application
Build an executable for your operating system.
```bash
npm run dist
```

### Other Useful Commands
- `npm run build`: Build the Vue.js frontend
- `npm run preview`: Preview the built application
- `npm run dev-vue`: Run only the Vite development server
- `npm run dev-electron`: Run only the Electron application

## Code Architecture

### Main Entry Points
- `src/App.vue`: Main application component with notification container
- `main.js`: Electron main process entry point
- `src/main.js`: Vue.js application entry point
- `src/services/index.js`: Service layer exports
- `src/stores/index.js`: Pinia store exports

### Core Services
- `src/services/llm.js`: LLM service implementation with OpenAI and Gemini providers
- `src/services/electron.js`: Electron-specific functionality
- `src/services/utils.js`: Utility functions
- `src/services/notifications.js`: Unified notification service

### State Management (Pinia Stores)
- `src/stores/novels.js`: Novel data management
- `src/stores/chapters.js`: Chapter data management
- `src/stores/ui.js`: UI state management
- `src/stores/notifications.js`: Notification state management

### Key Components
- `src/components/editor/MainEditor.vue`: Main text editor with AI rewrite context menu
- `src/components/editor/AIPanel.vue`: AI panel for displaying rewrite results
- `src/components/editor/ContextMenu.vue`: Right-click context menu for text operations
- `src/components/editor/ChaptersList.vue`: Chapter navigation and management
- `src/components/settings/ProviderSettings.vue`: AI provider configuration UI
- `src/components/notifications/NotificationContainer.vue`: Toast notification system
- `src/components/notifications/NotificationItem.vue`: Individual notification component

### Notification System
The project uses a unified notification system instead of browser alert() calls:

```javascript
import { notificationService } from '@/services'

// Usage examples
notificationService.success('操作成功!')
notificationService.error('操作失败: ' + error.message)
notificationService.warning('请注意检查输入')
notificationService.info('这是一条提示信息')

// Advanced usage
notificationService.notify({
  type: 'success',
  title: '自动保存',
  message: '文档已保存',
  duration: 3000
})
```

**DO NOT use alert(), confirm() or other blocking dialogs. Always use the notification service.**

### AI Integration Flow
1. User selects text in the editor and right-clicks to open context menu
2. User chooses an AI rewrite option (expand, contract, beautify, continue, custom)
3. Selected text is sent to configured LLM provider via llmService
4. Results are displayed in the AIPanel component
5. User can replace or insert the rewritten text

### Error Handling Best Practices
- Use notificationService for user-facing error messages
- Log detailed errors to console for debugging
- Provide meaningful error messages in Chinese
- Handle network errors gracefully
- Validate user input before processing

### Security Considerations
- API keys are stored in localStorage (consider encryption for production)
- Electron security: nodeIntegration disabled, contextIsolation enabled
- CSP headers configured in main process
- No eval() or dangerous HTML injection

## Configuration
- AI providers are configured in the settings UI and saved to localStorage
- Theme and language settings are also stored in localStorage
- Notification preferences can be configured through the notification service

## File Organization
```
src/
├── components/
│   ├── editor/          # Text editor components
│   ├── modals/          # Modal dialogs
│   ├── notifications/   # Notification system
│   ├── oobe/           # Out-of-box experience
│   └── settings/       # Settings panels
├── services/           # Business logic and API calls
├── stores/            # Pinia state management
├── styles/            # Global styles and themes
└── views/             # Page-level components
```

## Recent Updates
- ✅ Implemented unified notification system (replaces all alert() calls)
- ✅ Fixed reactive/ref usage patterns for better performance
- ✅ Added proper error handling throughout the application
- ✅ Improved component architecture and separation of concerns

## Development Guidelines
- Use Composition API for new Vue components
- Follow the established notification patterns for user feedback
- Prefer reactive() for objects, ref() for primitives and DOM references
- Use TypeScript-style JSDoc comments for better IDE support
- Test notification flows when adding new features
- Maintain Chinese language support in user-facing text