# User Interface Guide

## Layout Overview

BranchEd uses a modern, responsive layout with three main areas:

1. **Toolbar** - Top control bar
2. **Canvas** - Main editing area with swimlanes
3. **Editor Panel** - Sliding side panel (when enabled)

## Toolbar Controls

### Left Section

#### Add Lane Button
- Creates a new swimlane for organizing passages
- Prompts for lane name
- Automatically sorted: Orphanage → Metadata → Main → Custom (alphabetical)
- Natural number sorting (deck1, deck2, deck10, deck11)

#### Add Passage Button
- Adds a new passage to the currently active lane
- Opens editor automatically
- Default position based on existing passages

#### Edit Button (✏️)
- Toggles the editor panel on/off
- Shows checkmark when active (✏️✓)
- Auto-enables when clicking passages
- Opens current/selected passage when enabled

#### Notes Button (📝)
- Toggles sticky note visibility
- Shows/hides LOOP and JUMP connections
- Strikethrough when disabled (📝̶)

### Right Section

#### Search Button (🔍)
- Opens quick search overlay
- Keyboard shortcut: Ctrl/Cmd+K
- Search by title, tags, or content
- Navigate with arrow keys

#### Project Selector
- Dropdown menu of available games
- Loads from `../games/` directory
- Shows project name and version

#### Import Twee
- Upload `.twee` or `.tw` files
- Automatically parses and organizes content
- Preserves tags and lane assignments

#### Export Twee
- Downloads current story as `.twee` file
- Includes all passages and metadata
- Standard Twee 3 format

#### Clear Button (🗑️)
- Resets local storage
- Prompts for confirmation
- Useful for troubleshooting

#### Theme Toggle (🌙/☀️)
- Switches between light and dark modes
- Persists preference in local storage

## Canvas Area

### Swimlanes

#### Lane Header
- Shows lane name
- Dark background for active lane
- Collapse/expand toggle (▼/▶)
- Passage count indicator

#### Lane Types
1. **Orphanage**: Unconnected passages (auto-created)
2. **Metadata**: System/config passages (gray background)
3. **Main**: Primary story thread
4. **Custom**: Character or branch lanes

#### Lane Interactions
- **Click header**: Select/activate lane
- **Click toggle**: Collapse/expand lane
- **Double-click canvas**: Create passage at position

### Passages

#### Visual Elements
- **Rectangle box**: Passage container
- **Title**: Bold text at top
- **Tags**: Below title (if present)
- **Preview**: First ~50 characters of content
- **Selection**: Blue border when selected

#### Passage Colors
- **White**: Regular passages
- **Blue highlight**: Selected passage
- **Connected**: Has links to/from other passages

### Connections

#### Link Types
- **Green arrows**: Forward progression
- **Backward links**: Create LOOP sticky notes
- **Cross-lane links**: Create JUMP sticky notes

#### Sticky Notes
- **LOOP (Yellow)**: Backward reference within lane
- **JUMP (Orange)**: Cross-lane connection
- **Double-click**: Navigate to target passage
- **Toggle**: Use Notes button to show/hide

## Editor Panel

### Panel Behavior
- Slides in from right side
- Pushes canvas to the left
- Three tabbed sections
- Auto-opens when selecting passages

### Edit Passage Tab

#### Fields
- **Title**: Passage name (required)
- **Tags**: Space-separated tags
  - System tags: `$start`, `$lane:Name`
  - Custom tags for organization
- **Content**: Main text area
  - Supports Twee/Twine syntax
  - Tab key inserts actual tabs

#### Link Buttons
Dynamic buttons for passage navigation:
- **PARENT (Green)**: Navigate to linking passage
- **LINK**: Forward connections
- **LOOP (Yellow)**: Backward connections
- **JUMP (Orange)**: Cross-lane connections

#### Delete Button
- Red button at bottom
- Confirms before deletion
- Removes passage and all connections

### Co-Author Tab
- Placeholder for AI integration
- Text prompt area
- Generate suggestions button
- Results display area

### Story Preview Tab

#### Controls
- **From Start**: Begin at `$start` passage
- **From Current**: Start from selected passage

#### Display
- Shows formatted passage content
- Removes Twee macros (`<<set>>`, `<<if>>`, etc.)
- Clickable links for navigation
- Visual indicators for conditionals

#### Supported Syntax
- Links: `[[target]]`, `[[display|target]]`
- Bold: `**text**`
- Italic: `//text//`
- Macros shown as `[indicator]` text

## Search Overlay

### Interface
- Modal overlay with search box
- Real-time results as you type
- Shows passage title, lane, tags
- Content preview with highlighting

### Navigation
- **↑↓**: Navigate results
- **Enter**: Open selected passage
- **Esc**: Close search
- **Click**: Open specific result

## Visual Feedback

### Hover States
- Passages: Pointer cursor
- Buttons: Highlight effect
- Links: Underline text
- Sticky notes: Pointer cursor

### Selection States
- Active lane: Dark header
- Selected passage: Blue border
- Active tab: Blue underline
- Enabled buttons: Full opacity

### Connection Indicators
- Solid lines: Direct links
- Arrow heads: Direction of flow
- Sticky notes: Special connections

## Responsive Design

### Adaptations
- Canvas scrolls independently
- Editor panel responsive width
- Toolbar wraps on small screens
- Touch-friendly on tablets

### Performance
- Smooth transitions (0.3s)
- Hardware-accelerated canvas
- Efficient rendering updates
- Local storage caching

## Accessibility

### Keyboard Support
- Tab navigation through controls
- Escape closes modals/editor
- Enter confirms actions
- Arrow keys in search

### Visual Aids
- High contrast borders
- Clear hover states
- Consistent color coding
- Dark mode support

## Tips and Tricks

1. **Quick Edit**: Click any passage to edit
2. **Fast Search**: Cmd/Ctrl+K from anywhere
3. **Bulk Select**: Coming in future update
4. **Auto-organize**: Passages arrange themselves
5. **Smart Lanes**: Use `$lane:Name` tag to move passages
6. **Preview Test**: Check story flow before export