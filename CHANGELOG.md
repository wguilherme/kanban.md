# Changelog

All notable changes to the "Kanban.md" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [0.0.1] - 2025-11-21

### Features

- **Sidebar Integration**: Activity Bar icon with dedicated sidebar view
  - TreeView displaying all `.kanban.md` files in workspace
  - Quick access to open kanban boards directly from sidebar
  - **New Kanban Board** button to create new boards instantly
  - Refresh button and auto-refresh on file changes

- **Quick Board Creation**: One-click board creation with pre-filled template

- **Drag & Drop**: Full drag-and-drop support for tasks
  - Move tasks between columns
  - Reorder tasks within columns
  - Real-time visual feedback with DnD Kit

- **Task Features**:
  - Inline hashtags support for tags
  - Task steps/checklist support
  - Priority and workload indicators
  - Due dates
  - Default expanded state

- **Column Features**:
  - Archive columns support
  - Configurable task header format (title or list)

- **Build System**: Modern Vite 7 build tooling with TypeScript 5.9

---
