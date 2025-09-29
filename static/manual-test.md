# BranchEd Manual Test Checklist

## Setup
1. Open http://localhost:8000/static/
2. Clear localStorage if needed: Open console and run `localStorage.clear()`

## Feature Tests

### ✅ 1. Basic Functionality
- [ ] Canvas displays correctly
- [ ] Toolbar buttons are visible
- [ ] Main lane exists
- [ ] Metadata lane exists

### ✅ 2. Lane Management
- [ ] Click "Add Lane" - new lane appears
- [ ] Click on lane header - lane is selected
- [ ] Double-click in lane - passage created at position

### ✅ 3. Passage Management
- [ ] Click "Add Passage" - new passage appears
- [ ] Click on passage - opens editor
- [ ] Edit title in editor - updates immediately
- [ ] Edit content in editor - updates immediately
- [ ] Edit tags in editor - updates immediately
- [ ] Click "Delete Passage" - passage is removed

### ✅ 4. Twee Import/Export
- [ ] Click "Import Twee" and select test file
- [ ] Verify passages appear with correct titles (no content in title)
- [ ] Verify tags are preserved
- [ ] Verify $lane: tags create/assign lanes
- [ ] Click "Export Twee" - downloads file with all passages

### ✅ 5. Orphan Detection
- [ ] Create passage with no links - shows red dashed border
- [ ] Add link to passage - border becomes normal
- [ ] Remove all links - border becomes red dashed again

### ✅ 6. Parent Navigation
- [ ] Open passage that has incoming link
- [ ] "Parent: [name]" button is enabled
- [ ] Click parent button - navigates to parent passage
- [ ] Open orphan passage - parent button shows "No Parent" and is disabled

### ✅ 7. Search Feature (Ctrl/Cmd+K)
- [ ] Press Ctrl+K (or Cmd+K on Mac) - search overlay opens
- [ ] Type search term - results appear instantly
- [ ] Use arrow keys - navigate results
- [ ] Press Enter - opens selected passage
- [ ] Press Escape - closes search
- [ ] Click result - opens passage
- [ ] Empty search - shows all passages

### ✅ 8. Open Project
- [ ] Click "Open Project"
- [ ] Select game_config.json from games/wasted/
- [ ] When prompted, select world_expanded.twee
- [ ] Green notification appears
- [ ] Title changes to "BranchEd - [Game Name]"
- [ ] Passages load correctly

### ✅ 9. Theme Toggle
- [ ] Click moon/sun icon - toggles between day/night mode
- [ ] Refresh page - theme persists

### ✅ 10. Cross-lane Links
- [ ] Create passages in different lanes
- [ ] Add links between them
- [ ] Verify connection lines draw correctly
- [ ] Verify arrows point in correct direction

## Test Files

### Simple Twee Test
```twee
:: Start
This is the start.
[[Go to Room1]]
[[Go to Room2]]

:: Room1 [tag1 tag2]
You are in room 1.
[[Back|Start]]

:: Room2 [$lane:TestLane]
You are in room 2 in TestLane.
[[Back|Start]]
```

### Orphan Test
```twee
:: Connected1
[[Link to Connected2|Connected2]]

:: Connected2
[[Back to Connected1|Connected1]]

:: Orphan
This passage has no links in or out.
```

## Known Issues to Verify Fixed
- [x] Passage titles should not include content
- [x] Parent button should show only title, not content
- [x] Tags should be visible in editor
- [x] Search should be case-insensitive
- [x] Orphans should have red dashed borders
- [x] Open Project should handle new directory structure