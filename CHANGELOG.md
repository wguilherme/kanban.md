# Changelog

All notable changes to the "Markdown Kanban" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-21

### 🚀 Major Features

- **Sidebar Integration**: Added Activity Bar icon with dedicated sidebar view for kanban boards
  - New TreeView displaying all `.kanban.md` files in workspace
  - Quick access to open kanban boards directly from sidebar
  - **New Kanban Board** button (➕) to create new boards instantly
  - Refresh button to update file list
  - Auto-refresh when `.kanban.md` files are created, deleted, or modified

- **Quick Board Creation**:
  - One-click board creation from sidebar
  - Interactive name input with validation
  - Pre-filled template with example tasks and columns
  - Auto-opens board after creation

### ⚡ Breaking Changes

- **Node.js 22+** now required (upgraded from Node 18)
- **Build System**: Migrated from esbuild to Vite 7
- **TypeScript 5.9**: Updated to modern TypeScript with strict mode enabled

### 🔧 Technical Improvements

- **Modern Build Tooling**:
  - Replaced manual esbuild configuration with Vite 7.2.4
  - Faster builds and better development experience
  - Proper SSR configuration for VSCode extensions
  - Improved watch mode with better problem matchers

- **TypeScript Modernization**:
  - Updated to TypeScript 5.9.3
  - Modern ESNext module resolution
  - Stricter type checking enabled
  - Better code quality with additional compiler checks

- **Dependency Updates**:
  - `@types/node`: 18.x → 24.10.1
  - `@types/vscode`: 1.74.0 → 1.106.1
  - `typescript`: 5.3.3 → 5.9.3
  - Removed deprecated `esbuild` in favor of `vite`

### 📝 File Organization

- Introduced `.kanban.md` file convention for better organization
- Sidebar now filters and displays only `.kanban.md` files
- Standard `.md` files can still be opened via command palette

---

## [1.3.1] - 2025-07-06

### Chore

- **chore:** Shorten command name to "Kanban"

## [1.3.0] - 2025-07-05

### Features

- **feature:** Add column archive support

## [1.2.3] - 2025-07-05

### Features

- **feature:** Add setting for task header format

## [1.2.2] - 2025-07-03

### Features

- **feature:** Add defaultExpanded support for task @ssebs ([#13](https://github.com/holooooo/markdown-kanban/issues/13))
- **feature:** Add support for header format
- **feature:** Optimize task and step dragging experience @ssebs ([#14](https://github.com/holooooo/markdown-kanban/issues/14))

## [1.2.1] - 2025-07-02

### Fixes

- **fix:** Fix the webview.html not included in the extension package

## [1.2.0] - 2025-07-01

### Features

- **feature:** Add workload support (Easy, Normal, Hard, Extreme) @ssebs ([#10](https://github.com/holooooo/markdown-kanban/issues/10))
- **feature:** Add steps support
- **feature:** Add tag autocomplete with prefix matching for existing tags @ssebs ([#9](https://github.com/holooooo/markdown-kanban/issues/9))

### Refactor

- **refactor:** Separate html code @ssebs ([#12](https://github.com/holooooo/markdown-kanban/pull/12))

## [1.1.1] - 2025-06-23

### Features

- **feature:** Allow to show/hide filter section
- **feature:** Auto save edited files

## [1.1.0] - 2025-06-16

### Features

- **feature:** Add enable/disable file listener command for edit multiple files @ssebs ([#4](https://github.com/holooooo/markdown-kanban/pull/4))

## [1.0.2] - 2025-06-04

### Features

- **fix:** Support CRLF line endings
