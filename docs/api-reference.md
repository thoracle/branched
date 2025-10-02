# API Reference

## Server API

### Base URL
```
http://localhost:8000
```

### Endpoints

#### GET /api/version
Returns the current server version.

**Response:**
```json
{
  "version": "1.5.3"
}
```

#### GET /api/games
Lists all available games in the games directory.

**Response:**
```json
[
  {
    "id": "game_folder_name",
    "name": "Game Title",
    "version": "1.0.0",
    "path": "games/game_folder_name"
  }
]
```

#### GET /api/game/{game_id}
Retrieves game configuration and story content.

**Parameters:**
- `game_id` - The folder name of the game

**Response:**
```json
{
  "id": "game_id",
  "config": {
    "title": "Game Title",
    "version": "1.0.0",
    "story_settings": {
      "main_story_file": "story.twee"
    }
  },
  "storyContent": ":: Start\\nWelcome!\\n\\n[[Begin]]",
  "files": ["game_config.json", "story.twee"]
}
```

### Static Files
All files in `/static/` are served directly:
- `/` - Main application (index.html)
- `/app.js` - Main application logic
- `/editor.js` - Editor panel functionality
- `/swimlanes.js` - Canvas rendering engine
- `/search.js` - Search functionality
- `/style.css` - Application styles

## JavaScript API

### App Object

The main application controller.

#### Properties

```javascript
App.state = {
  lanes: [],              // Array of lane objects
  passages: Map(),        // Map of passage ID to passage object
  links: [],             // Array of link objects
  loopPassages: Map(),   // Map of LOOP sticky notes
  jumpPassages: Map(),   // Map of JUMP sticky notes
  selectedPassage: null, // Currently selected passage
  activeLaneId: null,    // Currently active lane
  nextPassageId: 1,      // Auto-incrementing ID
  nextLaneId: 1,         // Auto-incrementing ID
  darkMode: false,       // Theme state
  stickyNotesVisible: true, // Sticky notes visibility
  panelEnabled: false    // Editor panel state
}
```

#### Methods

##### Core Functions
```javascript
App.init()                    // Initialize application
App.render()                  // Render canvas
App.saveToStorage()           // Save state to localStorage
App.loadFromStorage()         // Load state from localStorage
```

##### Lane Management
```javascript
App.addLane(name)             // Create new lane
App.selectLane(laneId)        // Set active lane
App.getLaneAtPosition(x, y)   // Get lane at coordinates
App.calculateLaneHeight(lane) // Calculate lane height
App.sortLanes()               // Sort lanes by rules
```

##### Passage Management
```javascript
App.addPassage()              // Add passage to active lane
App.selectPassage(passage)    // Select a passage
App.updatePassage(id, updates) // Update passage data
App.deletePassage(id)         // Delete passage
App.getPassageAtPosition(x, y) // Get passage at coordinates
App.centerOnPassage(passage)  // Scroll to passage
```

##### Import/Export
```javascript
App.importTwee()              // Import Twee file
App.exportTwee()              // Export as Twee
App.parseTwee(content)        // Parse Twee content
App.generateTwee()            // Generate Twee format
```

##### UI Functions
```javascript
App.toggleTheme()             // Switch dark/light mode
App.toggleStickyNotes()       // Show/hide sticky notes
App.togglePanel()             // Show/hide editor panel
App.clearStorage()            // Reset application
```

### Editor Object

Controls the editor panel.

#### Properties
```javascript
Editor.currentPassage = null  // Currently editing passage
Editor.updating = false       // Update lock flag
Editor.panelVisible = false  // Panel visibility
```

#### Methods
```javascript
Editor.init(app)              // Initialize with app reference
Editor.open(passage)          // Open passage for editing
Editor.close()                // Close editor panel
Editor.switchTab(tabName)     // Switch editor tab
Editor.updateLinkButtons(passage) // Update navigation buttons
Editor.updatePassage()        // Save passage changes
Editor.navigateToPassage(title) // Jump to passage
```

### Swimlanes Object

Handles canvas rendering.

#### Methods
```javascript
Swimlanes.renderLanes(ctx, lanes, constants, activeLaneId, heightCalc, colors, imageGetter)
Swimlanes.renderPassages(ctx, passages, selectedPassage, constants, lanes, colors, links, loopPassages, jumpPassages)
Swimlanes.renderLinks(ctx, passages, links, constants, lanes, colors, showCrossLane, loopPassages, stickyNotesVisible)
Swimlanes.drawArrow(ctx, fromX, fromY, toX, toY, color, style)
Swimlanes.drawStickyNote(ctx, x, y, width, height, title, subtitle, type, isHovered)
```

### Search Object

Manages search functionality.

#### Methods
```javascript
Search.init(app)              // Initialize search
Search.open()                 // Open search modal
Search.close()                // Close search modal
Search.search(query)          // Perform search
Search.highlightMatch(text, query) // Highlight results
```

## Data Structures

### Lane Object
```javascript
{
  id: "lane_1",
  name: "Main",
  passages: [],
  collapsed: false,
  isOrphanage: false,
  isMetadata: false
}
```

### Passage Object
```javascript
{
  id: "passage_1",
  title: "Start",
  tags: "$start",
  content: "Welcome!\\n\\n[[Begin]]",
  x: 100,
  y: 100,
  laneId: "lane_1"
}
```

### Link Object
```javascript
{
  fromId: "passage_1",
  toId: "passage_2",
  type: "normal"  // or "loop" or "jump"
}
```

### LOOP/JUMP Passage Object
```javascript
{
  id: "loop_1",
  fromId: "passage_2",
  toId: "passage_1",
  title: "Back to Start",
  subtitle: "From: Decision Point",
  x: 250,
  y: 150
}
```

## Events

### Canvas Events
- `click` - Select passages/lanes
- `dblclick` - Create passages, navigate sticky notes
- `mousemove` - Hover effects

### Keyboard Events
- `Escape` - Close editor/search
- `Ctrl/Cmd+K` - Open search
- `Tab` - Insert tab in editor
- `Enter` - Confirm in search

### Storage Events
- Auto-save on state changes
- Load on page refresh
- Project switching

## Constants

```javascript
App.CONSTANTS = {
  PASSAGE_WIDTH: 180,
  PASSAGE_HEIGHT: 90,
  PASSAGE_MARGIN: 40,
  MIN_PASSAGE_SPACING: 220,
  HEADER_HEIGHT: 40,
  LANES_START_Y: 0,
  STICKY_WIDTH: 140,
  STICKY_HEIGHT: 60,
  STICKY_OFFSET_X: 15,
  STICKY_OFFSET_Y: -10,
  JUMP_STICKY_OFFSET_X: 15,
  JUMP_STICKY_OFFSET_Y: 10,
  TOGGLE_SIZE: 16
}
```

## Local Storage Keys

- `branchEdState` - Complete application state
- `branchEdDarkMode` - Theme preference
- `branchEdVersion` - Storage version

## Browser Requirements

### Required APIs
- Canvas 2D Context
- Local Storage
- File API
- Fetch API

### Recommended Features
- ES6+ JavaScript
- CSS Grid/Flexbox
- RequestAnimationFrame
- Modern event handling