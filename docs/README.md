# BranchEd Documentation

BranchEd is a visual story editor for creating and managing interactive fiction using the Twee format. It provides a modern, intuitive interface for organizing branching narratives with swimlanes, visual connections, and powerful editing features.

## Version: 1.5.3

## Table of Contents

1. [Getting Started](getting-started.md)
2. [User Interface Guide](ui-guide.md)
3. [Features Overview](features.md)
4. [Story Editing](story-editing.md)
5. [Twee Format Support](twee-format.md)
6. [API Reference](api-reference.md)
7. [Keyboard Shortcuts](keyboard-shortcuts.md)

## Quick Start

### Running BranchEd

1. Start the server:
   ```bash
   ./branched
   ```

2. Open your browser to `http://localhost:8000`

3. Select a project from the dropdown or import a Twee file

### Basic Workflow

1. **Create Lanes**: Click "Add Lane" to create story branches
2. **Add Passages**: Click "Add Passage" or double-click on the canvas
3. **Edit Content**: Click any passage to open the editor
4. **Create Links**: Use `[[Link Text]]` or `[[Display|Target]]` in passage content
5. **Preview Story**: Use the Story Preview tab to test your narrative flow

## Core Concepts

### Swimlanes
- **Main Lane**: Primary story thread
- **Character Lanes**: Parallel storylines for different characters or paths
- **Metadata Lane**: Hidden passages for game configuration
- **Orphanage Lane**: Automatically created for unconnected passages

### Passage Types
- **Regular Passages**: Standard story nodes
- **LOOP Passages**: Yellow sticky notes for backward links
- **JUMP Passages**: Orange sticky notes for cross-lane connections

### Visual Indicators
- **Green Links**: Forward progression
- **Yellow LOOP Notes**: Backward references within a lane
- **Orange JUMP Notes**: Cross-lane connections
- **Green Parent Button**: Navigate to the source passage

## Main Features

- **Visual Editing**: Drag-and-drop interface with automatic layout
- **Tabbed Editor Panel**: Edit, Co-Author, and Story Preview modes
- **Smart Organization**: Automatic lane sorting and passage arrangement
- **Sticky Notes**: Visual indicators for complex story connections
- **Dark Mode**: Toggle between day and night themes
- **Search**: Quick passage search with Ctrl/Cmd+K
- **Import/Export**: Full Twee format support

## Browser Compatibility

BranchEd works best in modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Support

For issues or feature requests, visit the [GitHub repository](https://github.com/thoracle/branched).