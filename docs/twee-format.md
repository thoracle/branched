# Twee Format Support

## Overview

BranchEd supports Twee 3 format, the standard text format for Twine stories. This allows for easy import/export and compatibility with other Twine tools.

## Twee Syntax

### Basic Passage Structure

```twee
:: Passage Title [tags] <position>
Passage content goes here.

Links to [[other passages]].
```

#### Components
- `::` - Passage marker (required)
- `Passage Title` - Unique passage name (required)
- `[tags]` - Space-separated tags (optional)
- `<position>` - X,Y coordinates (optional, auto-generated)
- Content - The passage text with links and macros

### Links

#### Simple Link
```twee
[[Next Passage]]
```
Creates a clickable link to "Next Passage"

#### Link with Custom Text
```twee
[[Click here to continue|Next Passage]]
```
Shows "Click here to continue" but links to "Next Passage"

#### Arrow Syntax
```twee
[[Continue->Next Passage]]
[[Next Passage<-Continue]]
```
Alternative formats for custom text links

### Tags

#### System Tags
- `$start` - Marks the starting passage
- `$lane:Name` - Assigns passage to a specific lane in BranchEd

#### Custom Tags
```twee
:: Kitchen [room indoor warm]
```
Used for categorization and can be searched

### Macros (Preview Support)

BranchEd's Story Preview understands and processes common Twee/Twine macros:

#### Variable Assignment
```twee
<<set $score = 0>>
<<set $hasKey to true>>
<<set $playerName to "Hero">>
```
*Hidden in preview*

#### Conditional Display
```twee
<<if $score >= 10>>
  You win!
<<elseif $score >= 5>>
  You're doing okay.
<<else>>
  Try harder!
<<endif>>
```
*Shown as indicators in preview*

#### Print Variables
```twee
Your score is <<print $score>>.
Welcome, <<print $playerName>>!
```
*Displayed as [value: variable] in preview*

#### Other Macros
```twee
<<display "Another Passage">>
<<click "Open door">><<goto "Next Room">><</click>>
```
*Processed appropriately in preview*

## Import Behavior

### Passage Organization
When importing a Twee file, BranchEd:
1. Parses all passages and their connections
2. Identifies lanes from `$lane:` tags
3. Creates necessary lanes automatically
4. Positions passages to avoid overlaps
5. Generates sticky notes for complex connections

### Lane Assignment Rules
1. Passages with `$lane:Name` go to that lane
2. Passages without lane tags go to "Main"
3. Unconnected passages go to "Orphanage"
4. Metadata passages go to "Metadata" lane

### Position Handling
- If Twee includes positions, they're used as hints
- BranchEd adjusts positions to prevent overlaps
- Missing positions are auto-calculated
- Maintains visual hierarchy

## Export Behavior

### What's Exported
- All passages with content
- All tags (including system tags)
- Calculated positions for each passage
- Proper Twee 3 format structure

### What's Preserved
- Passage titles and content
- All link formats
- Custom and system tags
- Lane assignments (as tags)
- Macros and special syntax

### Export Format Example
```twee
:: Start [start $start] <100,100>
Welcome to the adventure!

[[Begin your journey|First Choice]]

:: First Choice [$lane:Main] <200,100>
You stand at a crossroads.

[[Go left|Left Path]]
[[Go right|Right Path]]

:: Left Path [$lane:Main] <150,200>
You chose the left path.
<<set $path = "left">>

[[Continue|Meeting Point]]

:: Right Path [$lane:Main] <250,200>
You chose the right path.
<<set $path = "right">>

[[Continue|Meeting Point]]

:: Meeting Point [$lane:Main] <200,300>
<<if $path == "left">>
  You arrive from the left.
<<else>>
  You arrive from the right.
<<endif>>

[[The End]]
```

## Compatibility

### Twine 2
- Full compatibility with Twine 2.x
- Works with all story formats (Harlowe, SugarCube, Chapbook)
- Preserves format-specific macros

### Twine 1
- Basic compatibility
- May need minor adjustments for older macros
- Position format differences handled

### Other Tools
- Compatible with Tweego
- Works with Twee2
- Can import from Twine HTML exports (via Twee conversion)

## Best Practices

### For Import
1. **Check lane tags** - Add `$lane:` tags before import for organization
2. **Use standard format** - Stick to Twee 3 conventions
3. **Test macros** - Verify story-format specific macros
4. **Backup original** - Keep source files safe

### For Export
1. **Regular exports** - Save your work frequently
2. **Version control** - Track changes in `.twee` files
3. **Test in Twine** - Verify exported stories work correctly
4. **Document macros** - Note any special syntax used

## Limitations

### In BranchEd Editor
- Macros are shown but not executed
- Complex JavaScript not evaluated
- Story format specific features not rendered
- CSS styling not applied

### In Story Preview
- Simplified macro handling
- Conditionals shown as indicators
- Variables not actually tracked
- Interactive elements limited

### Workarounds
- Use Twine for final testing
- Export regularly for full preview
- Keep macro usage simple
- Document complex logic

## Advanced Usage

### Multi-File Projects
While BranchEd works with single files:
1. Can import multiple files sequentially
2. Merges passages into single project
3. Handles duplicate titles (last wins)
4. Maintains lane organization

### Custom Extensions
BranchEd recognizes special tags:
- `$lane:Name` - Lane assignment
- `$hidden` - Future: hidden passages
- `$template` - Future: template passages
- Custom tags for your organization

### Integration Workflow
1. **Author in BranchEd** - Visual editing
2. **Export to Twee** - Standard format
3. **Process with Tweego** - Add styling/scripts
4. **Build with Twine** - Final compilation
5. **Deploy** - Share your story

## Troubleshooting

### Import Issues
- **Missing passages**: Check for `::` markers
- **Wrong lanes**: Add `$lane:` tags
- **Broken links**: Verify passage titles match
- **Lost formatting**: Some HTML may need escaping

### Export Issues
- **Large files**: Break into chapters
- **Special characters**: May need encoding
- **Position data**: Auto-calculated if missing
- **Tag preservation**: All tags exported

### Preview Issues
- **Macros not working**: Normal - preview is simplified
- **Links broken**: Check passage titles
- **Formatting lost**: Preview uses basic rendering
- **Variables ignored**: Preview doesn't track state