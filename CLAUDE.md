# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NovelBox is an AI-powered novel writing assistant built with Electron + Vue.js. It provides a three-column writing interface with chapter management and AI text rewriting capabilities.

## Key Features

- AI Integration: Supports OpenAI and Google Gemini compatible APIs
- Novel Editor: Three-column writing panel with chapter management
- Cross-platform: Built with Electron for desktop applications
- i18n support: Configured for Chinese and English

## Tech Stack

- Electron: Desktop application framework
- Vue.js 3: Frontend framework
- Vite: Frontend build tool
- Pinia: State management
- Vue Router: Routing management
- Vue I18n: Internationalization

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
- `src/App.vue`: Main application component
- `src/main.js`: Electron main process entry point
- `src/services/index.js`: Service layer exports
- `src/stores/index.js`: Pinia store exports

### Core Services
- `src/services/llm.js`: LLM service implementation with OpenAI and Gemini providers
- `src/services/electron.js`: Electron-specific functionality
- `src/services/utils.js`: Utility functions

### State Management (Pinia Stores)
- `src/stores/novels.js`: Novel data management
- `src/stores/chapters.js`: Chapter data management
- `src/stores/ui.js`: UI state management

### Key Components
- `src/components/editor/MainEditor.vue`: Main text editor with AI rewrite context menu
- `src/components/editor/AIPanel.vue`: AI panel for displaying rewrite results
- `src/components/editor/ContextMenu.vue`: Right-click context menu for text operations
- `src/components/settings/ProviderSettings.vue`: AI provider configuration UI

### AI Integration Flow
1. User selects text in the editor and right-clicks to open context menu
2. User chooses an AI rewrite option (expand, contract, beautify, continue, custom)
3. Selected text is sent to configured LLM provider via llmService
4. Results are displayed in the AIPanel component
5. User can replace or insert the rewritten text

## Configuration
- AI providers are configured in the settings UI and saved to localStorage
- Theme and language settings are also stored in localStorage