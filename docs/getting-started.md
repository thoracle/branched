# Getting Started with BranchEd

## Installation

BranchEd is a standalone Python application that serves a web-based editor.

### Prerequisites

- Python 3.6 or higher
- A modern web browser
- Games directory structure (optional)

### Running BranchEd

1. **Start the Server**
   ```bash
   ./branched
   ```
   Or with a custom port:
   ```bash
   ./branched 8080
   ```

2. **Open the Editor**
   Navigate to `http://localhost:8000` in your browser

3. **Select or Import a Project**
   - Use the project dropdown to select an existing game
   - Or click "Import Twee" to load a `.twee` file
   - Or start fresh and build from scratch

## First Steps

### Creating Your First Story

1. **Add a Lane**
   - Click "Add Lane" button
   - Name it (e.g., "Main" or a character name)
   - Lanes organize parallel storylines

2. **Create a Passage**
   - Click "Add Passage" or double-click on the canvas
   - The editor panel will open automatically
   - Enter a title and content

3. **Add the Start Tag**
   - In the tags field, add `$start` to mark your starting passage
   - This tells the story engine where to begin

4. **Create Links Between Passages**
   - In passage content, use `[[Next Passage]]` to create a link
   - Or use `[[Click here|Next Passage]]` for custom link text
   - Links automatically create visual connections

### Understanding the Interface

#### Canvas Area
- **Scroll**: Use mouse wheel or scrollbars
- **Click**: Select passages or lanes
- **Double-click**: Create new passage at position
- **Drag**: Coming soon!

#### Toolbar Buttons

**Left Section:**
- **Add Lane**: Create a new swimlane
- **Add Passage**: Add passage to active lane
- **Edit**: Toggle the editor panel
- **Notes**: Show/hide sticky note connections

**Right Section:**
- **Search** (🔍): Quick passage search
- **Project Selector**: Choose active project
- **Import/Export**: Twee file operations
- **Clear** (🗑️): Reset local storage
- **Theme** (🌙/☀️): Toggle dark mode

#### Editor Panel (3 Tabs)

1. **Edit Passage Tab**
   - Title field
   - Tags field (space-separated)
   - Content area (Twee/Markdown format)
   - Link buttons for navigation
   - Delete passage button

2. **Co-Author Tab**
   - AI assistance placeholder
   - Future integration point

3. **Story Preview Tab**
   - Interactive story preview
   - "From Start" - Begin at `$start` passage
   - "From Current" - Start from selected passage
   - Click links to navigate the story

## Working with Projects

### Project Structure

BranchEd expects projects in the `../games/` directory:

```
games/
├── project1/
│   ├── game_config.json
│   └── story.twee
└── project2/
    ├── game_config.json
    └── chapters.twee
```

### Importing Twee Files

1. Click "Import Twee"
2. Select a `.tw` or `.twee` file
3. BranchEd will parse and display the story structure
4. Passages are automatically organized into lanes

### Exporting Your Work

1. Click "Export Twee"
2. Your story will download as a `.twee` file
3. Compatible with Twine and other Twee tools

## Tips for New Users

### Organization
- Use lanes to separate character arcs or parallel plots
- Color-coding: Main (white), Metadata (gray), custom lanes (white)
- Orphaned passages automatically go to "Orphanage" lane

### Navigation
- Click passage links in the editor to jump to targets
- Use the Search function (Cmd/Ctrl+K) for quick access
- Parent button (green) navigates to linking passage

### Visual Indicators
- **Green arrows**: Forward story progression
- **Yellow sticky notes**: Backward references (LOOPs)
- **Orange sticky notes**: Cross-lane connections (JUMPs)
- **Selected passage**: Blue highlight

### Best Practices
1. Always set a `$start` passage
2. Use descriptive passage titles
3. Organize related passages in the same lane
4. Test your story flow in Preview mode
5. Save/export regularly

## Next Steps

- Read the [UI Guide](ui-guide.md) for detailed interface information
- Learn about [Story Editing](story-editing.md) techniques
- Explore [Twee Format](twee-format.md) capabilities
- Check [Keyboard Shortcuts](keyboard-shortcuts.md) for faster editing