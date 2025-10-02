# Keyboard Shortcuts

## Global Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl/Cmd + K** | Open quick search |
| **Escape** | Close current modal/panel |

## Search Modal

| Shortcut | Action |
|----------|--------|
| **↑ / Up Arrow** | Navigate to previous result |
| **↓ / Down Arrow** | Navigate to next result |
| **Enter** | Open selected passage |
| **Escape** | Close search |

## Editor Panel

| Shortcut | Action |
|----------|--------|
| **Tab** | Insert tab character in content area |
| **Escape** | Close editor panel |

## Canvas Navigation

Currently, most canvas operations use mouse controls:

| Action | Mouse Control |
|--------|--------------|
| **Select Passage** | Single click |
| **Open Editor** | Click on passage |
| **Create Passage** | Double-click on empty space |
| **Navigate Sticky** | Double-click on sticky note |
| **Select Lane** | Click on lane header |
| **Collapse/Expand** | Click on lane toggle |

## Planned Shortcuts (Future)

These shortcuts are planned for future releases:

### Editing
- **Ctrl/Cmd + S** - Save/Export
- **Ctrl/Cmd + Z** - Undo
- **Ctrl/Cmd + Y** - Redo
- **Ctrl/Cmd + N** - New passage
- **Ctrl/Cmd + L** - New lane
- **Delete** - Delete selected passage

### Navigation
- **Arrow Keys** - Move between passages
- **Page Up/Down** - Scroll canvas
- **Home** - Go to start passage
- **Ctrl/Cmd + G** - Go to passage

### Selection
- **Ctrl/Cmd + A** - Select all passages
- **Shift + Click** - Multi-select
- **Ctrl/Cmd + Click** - Add to selection

### View
- **Ctrl/Cmd + 0** - Reset zoom
- **Ctrl/Cmd + Plus** - Zoom in
- **Ctrl/Cmd + Minus** - Zoom out
- **F11** - Fullscreen

## Tips

### Efficient Workflow

1. **Quick Search is Fastest**
   - Use Ctrl/Cmd+K to jump to any passage
   - Type partial names for fuzzy matching
   - Search includes content, not just titles

2. **Tab in Editor**
   - Tab key works in content area
   - Useful for formatting dialogue
   - Preserves indentation

3. **Escape to Close**
   - Works on editor panel
   - Works on search overlay
   - Quick way to return to canvas

### Mouse + Keyboard Combo

Best workflow combines both:
1. **Ctrl/Cmd+K** to search
2. **Arrow keys** to select
3. **Enter** to open
4. **Type** to edit
5. **Escape** to close
6. **Click** for visual navigation

## Accessibility

### Keyboard Navigation
- Most UI elements are keyboard accessible
- Tab order follows logical flow
- Focus indicators show current element
- Buttons have keyboard activation

### Screen Reader Support
- Semantic HTML structure
- ARIA labels where needed
- Alt text for visual elements
- Logical heading hierarchy

### Visual Aids
- High contrast mode (dark theme)
- Clear focus indicators
- Consistent color coding
- Large click targets

## Customization

Currently, keyboard shortcuts are not customizable. This feature is planned for a future release.

### Future Customization Options
- User-defined shortcuts
- Shortcut profiles
- Import/export settings
- Conflict detection

## Platform Differences

### Windows/Linux
- **Ctrl** for command modifier
- **Alt** for menu access
- Standard Windows shortcuts

### macOS
- **Cmd** for command modifier
- **Option** for alternates
- Standard macOS shortcuts

### Browser Conflicts
Some shortcuts may conflict with browser defaults:
- **Ctrl/Cmd+S** - Browser save
- **Ctrl/Cmd+N** - New window
- **F11** - Browser fullscreen

BranchEd tries to override when appropriate, but some browser shortcuts take precedence.

## Troubleshooting

### Shortcuts Not Working

1. **Check Focus**
   - Click in the application area
   - Some shortcuts need specific focus

2. **Browser Extensions**
   - Some extensions capture shortcuts
   - Try disabling extensions

3. **Platform Issues**
   - Verify correct modifier key
   - Check keyboard language settings

### Performance

For best performance:
- Close unnecessary panels
- Use shortcuts instead of mouse when possible
- Keep passage count reasonable
- Regular exports for backup