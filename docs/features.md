# Features Overview

## Core Features

### Visual Story Mapping
- **Swimlane Organization**: Separate parallel storylines visually
- **Automatic Layout**: Passages arrange themselves intelligently
- **Connection Visualization**: See all story links at a glance
- **Sticky Note System**: Special indicators for complex connections

### Smart Organization

#### Automatic Lane Sorting
1. Orphanage (unconnected passages)
2. Metadata (system passages)
3. Main (primary storyline)
4. Custom lanes (alphabetical with natural number sorting)

#### Passage Management
- Automatic positioning in lanes
- Smart spacing prevents overlaps
- Visual hierarchy based on connections
- Orphan detection and collection

### Editing Capabilities

#### Three-Tab Editor Panel
1. **Edit Passage**: Full passage editing
2. **Co-Author**: AI assistance (coming soon)
3. **Story Preview**: Interactive testing

#### Passage Editor Features
- Rich text area with tab support
- Tag management with system tags
- Dynamic link navigation buttons
- Parent passage tracking
- Quick delete with confirmation

### Navigation Tools

#### Quick Search (Ctrl/Cmd+K)
- Search across titles, tags, and content
- Real-time results
- Keyboard navigation
- Jump to passage on selection

#### Visual Navigation
- Click passages to select and edit
- Double-click sticky notes to jump
- Parent/child navigation buttons
- Cross-lane jumping

### Import/Export

#### Twee Support
- Full Twee 3 format compatibility
- Preserves all passage data
- Maintains lane assignments
- Handles special tags

#### Project Management
- Multiple project support
- Game configuration loading
- Local storage persistence
- Project switching without data loss

## Advanced Features

### Sticky Note System

#### LOOP Passages (Yellow)
- Automatically created for backward links
- Shows source passage info
- Double-click to navigate
- Toggle visibility with Notes button

#### JUMP Passages (Orange)
- Created for cross-lane connections
- Maintains lane context
- Visual cross-reference
- Helps track complex narratives

### Story Preview

#### Interactive Preview Mode
- Start from any passage
- Click links to navigate
- Twee macro processing
- Visual formatting support

#### Macro Handling
- `<<set>>` variables removed
- `<<if>>` conditionals shown as indicators
- `<<print>>` displays variable references
- Clean reading experience

### Theme System

#### Dark Mode
- Full UI theme switching
- Persistent preference
- Optimized contrast
- Reduced eye strain

#### Visual Consistency
- Coordinated color schemes
- Smooth transitions
- Maintains readability
- Accessibility considered

## Workflow Features

### Auto-Enable Edit Panel
When clicking on any passage:
- Panel automatically opens
- Previous passage remembered
- Seamless editing experience
- Toggle to hide when done

### Smart Tag System

#### System Tags
- `$start`: Marks beginning passage
- `$lane:Name`: Assigns to specific lane
- Custom tags for organization

#### Tag Processing
- Automatic lane assignment
- Visual tag display
- Search integration
- Export preservation

### Connection Management

#### Automatic Link Detection
- Parses `[[links]]` in content
- Creates visual connections
- Handles multiple formats
- Updates dynamically

#### Link Formats Supported
- `[[Target]]` - Simple link
- `[[Display|Target]]` - Pipe format
- `[[Display->Target]]` - Arrow format
- `[[Target<-Display]]` - Reverse arrow

## Performance Features

### Optimized Rendering
- Canvas-based drawing
- Efficient updates
- Smooth scrolling
- Hardware acceleration

### Local Storage
- Automatic saving
- Instant recovery
- No server required
- Browser-based persistence

### Responsive Design
- Adapts to screen size
- Touch-friendly interface
- Sliding panel system
- Flexible layout

## Quality of Life

### Visual Feedback
- Hover effects
- Selection indicators
- Active states
- Clear affordances

### Error Prevention
- Confirmation dialogs
- Validation checks
- Safe deletion
- Undo preparation (coming soon)

### Keyboard Support
- Escape to close
- Tab navigation
- Enter to confirm
- Search shortcuts

## Planned Features

### Coming Soon
- Drag and drop passages
- Bulk operations
- Undo/redo system
- Advanced search filters
- Real AI co-authoring
- Export to multiple formats
- Collaborative editing
- Version control integration

### Under Consideration
- Mobile app
- Cloud sync
- Template library
- Analytics dashboard
- Publishing integration
- Custom themes
- Plugin system
- Automation tools