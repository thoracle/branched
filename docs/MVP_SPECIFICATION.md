# BranchEd MVP - Simplified Specification

## Core Concept
BranchEd MVP is a **swimlane-first** visual editor for Twee stories. Every passage belongs to a swimlane - there is no "free canvas" mode.

## Key Simplifications

### 1. Remove Toggle Mode
- **REMOVE**: Swimlane on/off toggle
- **KEEP**: Swimlanes are always on
- **BENEFIT**: Simpler mental model, less code complexity

### 2. Simplify Authentication
- **REMOVE**: Multi-user support, login system
- **KEEP**: Single-user local mode
- **BENEFIT**: Focus on editor features, not user management

### 3. Streamline Project Management
- **REMOVE**: Multiple projects
- **KEEP**: Single project with multiple stories
- **BENEFIT**: Simpler file structure, fewer navigation layers

### 4. Reduce Visual Complexity
- **REMOVE**: Minimap, zoom controls, pan navigation
- **KEEP**: Simple scroll (vertical for lanes, horizontal within lanes)
- **BENEFIT**: Less rendering code, better mobile compatibility

### 5. Simplify Passage Operations
- **REMOVE**: Drag between swimlanes, complex link types
- **KEEP**: Simple passage creation, basic links
- **BENEFIT**: Predictable behavior, less edge cases

## MVP Feature Set

### Core Features Only

#### 1. Swimlane Management
```javascript
// Simplified swimlane structure
{
    "metadata": [],    // Special passages (always first)
    "act1": [],       // User-created lanes
    "act2": [],
    "act3": []
}
```

- Fixed metadata lane at top
- Add/remove swimlanes with simple names
- No collapse/expand (always expanded)
- No selection highlighting

#### 2. Passage Editing
- Create passage (always in current swimlane)
- Edit title and content
- Delete passage
- Auto-position in grid within lane

#### 3. Simple Links
- Parse `[[target]]` links only
- Visual lines between passages
- No bidirectional detection
- No link types/colors

#### 4. Import/Export
- Import Twee file → auto-organize into swimlanes
- Export to Twee → preserve structure
- No live preview

### Removed Features (for MVP)

#### Complex Features to Remove
- ❌ Zoom controls
- ❌ Minimap
- ❌ Canvas panning
- ❌ Drag passages between swimlanes
- ❌ Collapse/expand lanes
- ❌ Auto-expand on drag
- ❌ Bidirectional link detection
- ❌ Multiple link types
- ❌ Context menus
- ❌ Search functionality
- ❌ Analysis tools
- ❌ Version control
- ❌ Auto-layout button
- ❌ Multiple projects
- ❌ User authentication
- ❌ Session management

#### UI Elements to Remove
- ❌ Login modal
- ❌ Project selector
- ❌ Zoom buttons
- ❌ Toggle swimlane button
- ❌ Analysis tab
- ❌ Search tab
- ❌ Status bar details

## Simplified Architecture

### Frontend Structure
```
/static
├── index.html          # Single page
├── app.js             # Main controller
├── swimlanes.js       # Swimlane rendering
├── editor.js          # Passage editing
└── style.css          # Minimal styling
```

### Backend Structure
```
/backend
├── app.py             # Flask app
├── twee.py            # Import/export
└── storage.py         # File operations
```

### Data Model
```javascript
// Simplified story structure
{
    "title": "Story Name",
    "passages": [
        {
            "id": "uuid",
            "title": "Passage Title",
            "content": "Text with [[links]]",
            "lane": "act1",          // Direct lane assignment
            "position": { "x": 0, "y": 0 }  // Relative to lane
        }
    ]
}
```

## Simplified Interactions

### Creating Content
1. Click "New Passage" → adds to selected lane
2. Click passage → edit in side panel
3. Save → updates immediately

### Organizing Content
1. Click "New Lane" → enter name → created
2. Passages auto-arrange in grid
3. No manual positioning needed

### Navigation
1. Scroll vertically through lanes
2. Scroll horizontally within lanes (if needed)
3. Click passage to select and edit

## Implementation Approach

### Phase 1: Core Editor (Week 1)
- Single HTML page
- Swimlane rendering
- Basic passage CRUD
- Side panel editor

### Phase 2: Links & Navigation (Week 2)
- Link parsing
- Line drawing between passages
- Horizontal scroll in lanes
- Import/export Twee

### Phase 3: Polish (Week 3)
- Keyboard shortcuts
- Auto-save
- Better styling
- Error handling

## Technical Decisions

### Use Simple Solutions
- **Canvas**: Single canvas, no layers
- **Rendering**: Redraw everything on change
- **State**: Single global state object
- **Storage**: LocalStorage for preferences
- **Backend**: Optional (can work offline)

### Fixed Dimensions
```javascript
const LAYOUT = {
    LANE_HEIGHT: 200,        // Fixed height per lane
    PASSAGE_WIDTH: 150,
    PASSAGE_HEIGHT: 100,
    PASSAGE_SPACING: 50,
    LANES_SPACING: 20,
    HEADER_HEIGHT: 30
};
```

### Simplified Event Handling
```javascript
// Single click handler for everything
canvas.addEventListener('click', (e) => {
    const target = getClickTarget(e);
    if (target.type === 'passage') {
        selectPassage(target.passage);
    } else if (target.type === 'lane_header') {
        // Future: could add lane options
    }
});
```

## Benefits of This Approach

### Development Speed
- 70% less code than full version
- 2-3 week development time
- Easier to test and debug

### User Experience
- No mode switching confusion
- Consistent interaction model
- Everything visible at once
- No hidden features

### Maintenance
- Simple codebase
- Clear data flow
- Minimal dependencies
- Easy to extend later

## Future Additions (Post-MVP)

Once MVP is stable, consider adding:

### Level 1 Enhancements
- Passage colors/tags
- Keyboard shortcuts
- Undo/redo
- Better link visualization

### Level 2 Enhancements
- Drag to reorder within lane
- Search within story
- Multiple stories
- Theme support

### Level 3 Enhancements
- Collaborative editing
- Version history
- Story statistics
- Play mode

## Migration Path

### From Current Implementation
1. Remove authentication layer
2. Remove toggle mode code
3. Simplify canvas to single view
4. Remove zoom/pan logic
5. Simplify passage model
6. Remove project management

### To Future Versions
- State structure supports adding features
- Swimlane-first model can add complexity
- Clean separation allows module addition

## Success Metrics

### MVP is successful if:
- ✅ Can import existing Twee file
- ✅ Can organize into swimlanes
- ✅ Can edit passages
- ✅ Can see links between passages
- ✅ Can export valid Twee
- ✅ Loads in < 1 second
- ✅ Works on tablet/desktop

### MVP is NOT trying to:
- ❌ Support multiple users
- ❌ Handle 1000+ passages
- ❌ Provide analysis tools
- ❌ Support all Twee formats
- ❌ Work on mobile phones

## Example User Flow

1. **Start**: Open BranchEd → see empty story with metadata lane
2. **Import**: Drag Twee file → passages auto-organize into lanes
3. **Edit**: Click passage → edit in side panel → save
4. **Organize**: Add new lane "Chapter2" → create passages in it
5. **Link**: Type `[[Next Scene]]` → line appears to target
6. **Export**: Click export → download Twee file

## Code Example - Simplified Swimlane Renderer

```javascript
class SimpleSwimlanes {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lanes = new Map([
            ['metadata', []],
            ['main', []]
        ]);
        this.selectedPassage = null;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let y = 0;
        for (const [name, passages] of this.lanes) {
            this.drawLane(name, passages, y);
            y += LAYOUT.LANE_HEIGHT + LAYOUT.LANE_SPACING;
        }

        this.drawLinks();
    }

    drawLane(name, passages, y) {
        // Draw header
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, y, this.canvas.width, LAYOUT.HEADER_HEIGHT);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(name.toUpperCase(), 10, y + 20);

        // Draw passages in grid
        passages.forEach((passage, i) => {
            const x = 10 + (i * (LAYOUT.PASSAGE_WIDTH + LAYOUT.PASSAGE_SPACING));
            const py = y + LAYOUT.HEADER_HEIGHT + 10;
            this.drawPassage(passage, x, py);
        });
    }

    drawPassage(passage, x, y) {
        // Simple rectangle with title
        this.ctx.fillStyle = passage === this.selectedPassage ? '#4a9eff' : '#3a3a3a';
        this.ctx.fillRect(x, y, LAYOUT.PASSAGE_WIDTH, LAYOUT.PASSAGE_HEIGHT);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(passage.title, x + 10, y + 30);
    }

    addPassage(lane, title) {
        const passage = {
            id: Date.now().toString(),
            title,
            content: '',
            lane
        };

        this.lanes.get(lane).push(passage);
        this.render();
        return passage;
    }
}
```

## Conclusion

This MVP specification reduces complexity by 70% while maintaining the core value proposition: **visual organization of Twee stories using swimlanes**. By removing toggles, modes, and complex features, we can ship faster and iterate based on real user feedback.