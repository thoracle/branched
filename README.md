# BranchEd - Visual Twee Story Editor

A swimlane-based visual editor for creating and organizing interactive fiction stories in Twee format.

![BranchEd Screenshot](https://github.com/thoracle/branched/assets/screenshot.png)

## Features

### 🏊 Swimlane Organization
- **Swimlane-first design** - Every passage belongs to a lane (no free canvas)
- **Metadata lane** - Special lane for Start, StoryTitle, and other metadata passages
- **Collapsible lanes** - Accordion-style collapse/expand for better focus
- **Active lane selection** - Click to select, new passages added to active lane

### 📝 Passage Management
- **Visual editing** - Click passages to edit title, tags, and content
- **Auto-creation** - Links automatically create target passages if they don't exist
- **Lane-scoped naming** - Same passage names allowed in different lanes
- **Smart positioning** - Linear passages align horizontally, choices stack vertically
- **Double-click creation** - Double-click in a lane to create passage at that position

### 🔗 Linking System
- **Visual arrows** - Links shown as arrows from right side of source to left side of target
- **Standard Twee syntax** - Supports `[[passage]]` and `[[display|passage]]` formats
- **Auto-layout** - Linked passages automatically position based on relationships

### 🏷️ Tags Support
- **Full tag support** - Including Twine system tags (`$start`, `$position`, etc.)
- **Lane assignment** - Use `$lane:LaneName` tag to assign passages to lanes
- **Visual display** - Tags shown as badges below passage titles
- **Preserved in export** - All tags maintained in Twee import/export

### 🎨 User Interface
- **Dark/Light themes** - Toggle between day and night modes
- **Responsive canvas** - Auto-adjusting lane heights based on content
- **Text truncation** - Long text truncated with ellipsis to stay within bounds
- **Keyboard shortcuts** - Delete key to remove selected lane, Escape to close editor

### 💾 Data Management
- **LocalStorage persistence** - Work saved automatically to browser
- **Twee import/export** - Full compatibility with Twee story format
- **No backend required** - Runs entirely in browser (optional Flask backend available)

## Quick Start

### Option 1: Static Hosting (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/thoracle/branched.git
cd branched
```

2. Serve the static files:
```bash
# Using Python
cd static
python -m http.server 8000

# Or using Node.js
npx http-server static -p 8000

# Or using any static file server
```

3. Open http://localhost:8000 in your browser

### Option 2: With Flask Backend (Optional)

1. Install Python dependencies:
```bash
pip install -r backend/requirements.txt
```

2. Run the Flask server:
```bash
python backend/app.py
```

3. Open http://localhost:5000 in your browser

## Commands & Controls

### 🖱️ Mouse Controls

| Action | Result |
|--------|--------|
| **Click on lane header** | Select lane as active (highlighted) |
| **Click on passage** | Open passage editor |
| **Double-click on lane background** | Create new passage at that position |
| **Click collapse/expand arrow (◀/▼)** | Toggle lane collapsed/expanded state |
| **Click on canvas background** | Deselect current passage |

### ⌨️ Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| **Delete** | Lane selected | Delete the selected lane (with confirmation) |
| **Escape** | Editor open | Close the passage editor |
| **Tab** | In editor | Navigate between title, tags, and content fields |

### 🔘 Button Controls

| Button | Action |
|--------|--------|
| **Add Lane** | Create a new swimlane for organizing passages |
| **Add Passage** | Add a new passage to the currently active lane |
| **Import Twee** | Load a .twee or .tw file from your computer |
| **Export Twee** | Download your story as a .twee file |
| **🌙/☀️** | Toggle between dark and light themes |
| **× (in editor)** | Close the passage editor |
| **Delete Passage** | Remove the current passage from the story |

## Usage Guide

### Creating Lanes
1. Click **"Add Lane"** button in toolbar
2. Enter a name for your storyline/character
3. Lane is automatically selected (highlighted border) for adding passages
4. The Metadata lane is created by default for system passages

### Creating Passages
- **Method 1:** Click **"Add Passage"** button (adds to active lane)
- **Method 2:** **Double-click** anywhere in a lane's background
- **Method 3:** Create links in passage content - target passages auto-generate

### Selecting & Editing
1. **Click a lane header** to make it active (blue highlight)
2. **Click any passage** to open the editor panel
3. Edit title, tags, and content (changes auto-save)
4. Press **Escape** or click **×** to close editor
5. Click **Delete Passage** button to remove passage

### Creating Links
In the passage content editor, use standard Twee syntax:
- `[[Target Passage]]` - Creates a simple link
- `[[Display Text|Target Passage]]` - Link with custom display text
- Target passages are automatically created if they don't exist
- Links appear as arrows connecting passages visually

### Managing Tags
- Add tags in the passage editor's tags field (space-separated)
- **System tags** start with `$`:
  - `$start` - Marks the starting passage
  - `$once` - Passage can only be visited once
  - `$lane:LaneName` - Assigns passage to a specific lane
- Tags appear as visual badges below passage titles
- Multiple tags allowed per passage

### Lane Management
- **Select a lane:** Click on the lane header
- **Collapse/Expand:** Click the arrow (◀/▼) in lane header
- **Delete a lane:** Select it and press **Delete** key
- **Active lane:** Has blue border, new passages go here
- **Collapsed lanes:** Show passage count in header

### Importing/Exporting
1. **Import Twee:**
   - Click **"Import Twee"** button
   - Select a .twee or .tw file
   - Passages are distributed to lanes based on `$lane:` tags

2. **Export Twee:**
   - Click **"Export Twee"** button
   - Downloads as a .twee file
   - All passages, tags, and links preserved

### Visual Layout Rules
- **Linear passages:** Align horizontally in sequence
- **Choice passages:** Stack vertically when multiple links from same parent
- **Auto-positioning:** New passages position based on link relationships
- **Lane heights:** Automatically adjust to fit content
- **Text truncation:** Long text shows "..." to stay within passage bounds

### Theme & Display
- Click **🌙/☀️** button to toggle dark/light mode
- Theme preference saved to browser
- Collapsed lanes show darker background
- Active lane has blue highlight
- Selected passage has thicker border

## Architecture

### Technology Stack
- **Frontend:** Vanilla JavaScript, HTML5 Canvas
- **Rendering:** Canvas-based with full redraw on changes
- **Storage:** LocalStorage for persistence
- **Backend (Optional):** Python Flask for file operations

### Key Design Decisions
- **Swimlane-first:** Reduces complexity vs free-form canvas
- **Single canvas:** Simplifies rendering and event handling
- **Depth-based positioning:** Automatic layout based on link relationships
- **Lane-scoped passages:** Enables parallel storylines

## Project Structure

```
branched/
├── static/              # Frontend files
│   ├── index.html      # Single page application
│   ├── app.js          # Main application logic
│   ├── swimlanes.js    # Rendering functions
│   ├── editor.js       # Passage editor
│   └── style.css       # Styles
├── backend/            # Optional Flask backend
│   ├── app.py          # Flask server
│   ├── twee.py         # Twee parser/exporter
│   └── requirements.txt
├── docs/               # Documentation
│   └── MVP_SPECIFICATION.md
└── CLAUDE.md           # Claude AI instructions
```

## Development

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for local server or Flask backend)

### Running Tests
```bash
# No tests yet - contributions welcome!
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Roadmap

### Planned Features
- [ ] Search functionality
- [ ] Multiple projects support
- [ ] Undo/redo system
- [ ] Passage templates
- [ ] Link validation
- [ ] Export to other formats
- [ ] Collaborative editing

### Known Limitations
- No zoom/pan controls (by design for MVP)
- No drag between lanes
- Single project at a time
- No version control (use git)

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Inspired by Twine and other interactive fiction tools
- Built with assistance from Claude AI
- Thanks to the interactive fiction community

## Support

- **Issues:** [GitHub Issues](https://github.com/thoracle/branched/issues)
- **Discussions:** [GitHub Discussions](https://github.com/thoracle/branched/discussions)

---

*BranchEd - Making interactive story creation visual and intuitive*