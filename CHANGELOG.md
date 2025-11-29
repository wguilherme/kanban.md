# Changelog

All notable changes to the "Kanban.md" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### UX Improvements

- **Priority indicator redesign**: Cards now display priority as a colored left border (Trello-style)
  - High priority: red border
  - Medium priority: yellow border
  - Low priority: green border

- **Task modal badges**: Priority and workload now display as outline badges with icons
  - Priority uses arrow icons (↑ High, → Medium, ↓ Low)
  - Workload uses diamond icons (◇ Easy, ◈ Normal, ◆ Hard, ◆◆ Extreme)
  - Badges have colored borders instead of solid backgrounds for better readability

- **Fixed warning color**: Medium priority now correctly displays yellow instead of blue

### Bug Fixes

- **Tags merging fix**: Inline hashtag tags now correctly merge with array-format tags instead of being overwritten

### Sidebar

- **Edit markdown button**: Added pencil icon to sidebar items to open the raw markdown file directly
- **Removed redundant preview icon**: Clicking on file name already opens the Kanban view

### Developer Experience

- **Fixed build tasks**: F5 now runs full build before starting watchers
- **Fixed task scripts**: Corrected watch task references in `.vscode/tasks.json`

### Documentation

- Added `CLAUDE.md` with project architecture documentation

## [0.1.1] - 2025-11-25

### Bug Fixes

- **Race condition fix**: Prevent cards from reverting when dragging multiple cards quickly
  - Implemented Promise queue to serialize save operations
  - Added pending operations counter for proper flag management

### Performance

- **UI Optimization**: Improved drag-and-drop with cross-column preview
  - Added fingerprint comparison to prevent unnecessary re-renders
  - Implemented optimistic updates for smoother UX
  - Added automated tests for render behavior

### Chore

- Remove development documentation from `.vscodeignore` to enable Changelog tab in marketplace

## [0.0.1] - 2025-11-21

### Features

- **Sidebar Integration**: Activity Bar icon with dedicated sidebar view
  - TreeView displaying all `.kanban.md` files in workspace
  - Quick access to open kanban boards directly from sidebar
  - **New Kanban Board** button to create new boards instantly
  - Refresh button and auto-refresh on file changes

- **Quick Board Creation**: One-click board creation with pre-filled template

- **Drag & Drop**: Full drag-and-drop support for tasks using DnD Kit
  - Move tasks between columns
  - Reorder tasks within columns
  - Real-time visual feedback with semantic styles

- **Task Features**:
  - Inline hashtags support for tags
  - Task steps/checklist support
  - Priority and workload indicators
  - Due dates
  - Default expanded state

- **Column Features**:
  - Archive columns support
  - Configurable task header format (title or list)

- **Webview**: React-based Kanban board with VSCode API integration

- **Build System**: Modern Vite 7 build tooling with TypeScript 5.9

- **Developer Tools**: Added Makefile for build, check, clean, and install tasks

---
