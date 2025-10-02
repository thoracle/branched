# Story Editing Guide

## Creating Interactive Stories

### Story Structure

#### Passages
The basic unit of your story. Each passage represents:
- A scene or moment
- A choice point
- A location
- A character interaction

#### Links
Connect passages to create flow:
- Player choices
- Story progression
- Conditional branches
- Loop-backs

#### Lanes
Organize your narrative:
- Main plot line
- Character perspectives
- Parallel timelines
- Alternative paths

## Writing Passages

### Basic Format

```twee
:: Passage Title [tags]
This is the passage content.

[[Continue to next passage]]
```

### Creating Links

#### Simple Link
```twee
[[Go to the garden]]
```
Creates a link labeled "Go to the garden" that leads to a passage titled "Go to the garden"

#### Custom Text Link
```twee
[[Enter the mysterious door|Garden Gate]]
```
Shows "Enter the mysterious door" but links to "Garden Gate" passage

#### Arrow Format Links
```twee
[[Open the door->Garden Gate]]
[[Garden Gate<-Open the door]]
```
Alternative syntax for custom text links

### Using Tags

#### System Tags
- `$start` - Marks the beginning passage
- `$lane:CharacterName` - Assigns to a specific lane

#### Custom Tags
```twee
:: Mountain Peak [location outdoor cold]
```
Use for categorization and styling

## Advanced Techniques

### Managing Complex Narratives

#### Hub and Spoke
Create a central location with multiple branches:
```twee
:: Town Square
The bustling town square offers many destinations.

[[Visit the Blacksmith|Blacksmith Shop]]
[[Enter the Tavern|Tavern]]
[[Browse the Market|Market Stalls]]
[[Leave Town|Town Gates]]
```

#### Linear with Branches
Main path with optional explorations:
```twee
:: Forest Path
You walk along the winding forest path.

[[Investigate the strange sound|Side Quest]]
[[Continue on the main path|Next Scene]]
```

#### Parallel Storylines
Use lanes to show simultaneous events:
- Lane 1: Hero's journey
- Lane 2: Villain's plot
- Lane 3: Side character's arc

### Creating Choices

#### Binary Choices
```twee
:: Moral Dilemma
The prisoner begs for mercy.

[[Show mercy|Mercy Path]]
[[Execute justice|Justice Path]]
```

#### Multiple Options
```twee
:: Conversation
"What would you like to know?"

[[Ask about the quest|Quest Info]]
[[Inquire about the town|Town Info]]
[[Question about rumors|Rumors]]
[[Say goodbye|End Conversation]]
```

#### Conditional Text (Twee)
```twee
<<if $hasKey>>
  [[Unlock the door|Secret Room]]
<<else>>
  The door is locked.
<<endif>>
```

## Organization Strategies

### Using Lanes Effectively

#### Character Lanes
Create a lane for each major character:
- Shows their individual journey
- Easy to track character arcs
- Identifies interaction points

#### Timeline Lanes
Organize by time periods:
- Past events lane
- Present action lane
- Future consequences lane

#### Location Lanes
Group by geographical areas:
- Castle lane
- Forest lane
- Village lane

### Passage Naming Conventions

#### Descriptive Names
- `Garden_Entrance`
- `First_Meeting_Alice`
- `Boss_Battle_Dragon`

#### Systematic Naming
- `Ch1_Scene1_Opening`
- `Act2_Climax`
- `Ending_Good_01`

#### Prefixes for Organization
- `CHOICE_SavePrincess`
- `INFO_BackgroundLore`
- `PUZZLE_DoorRiddle`

## Visual Organization

### Using Sticky Notes

#### LOOP Notes (Yellow)
Indicate circular story elements:
- Returning to earlier locations
- Repeating encounters
- Time loops
- Dream sequences

#### JUMP Notes (Orange)
Show cross-character interactions:
- Character meetings
- Parallel events
- Perspective switches
- Converging storylines

### Color Coding Strategy
Use tags to categorize passages:
- Combat scenes: `[combat]`
- Dialogue: `[dialogue]`
- Puzzles: `[puzzle]`
- Cutscenes: `[cutscene]`

## Testing Your Story

### Using Story Preview

#### Check Story Flow
1. Start from beginning with "From Start"
2. Follow each path to completion
3. Note any dead ends
4. Verify all choices work

#### Test Specific Sections
1. Select starting passage
2. Click "From Current"
3. Play through that branch
4. Check link functionality

### Common Issues to Check

#### Dead Ends
- Passages with no links out
- Use search to find isolated passages
- Add appropriate connections

#### Broken Links
- Links to non-existent passages
- Preview shows error alerts
- Create missing passages or fix names

#### Circular Logic
- Infinite loops without progression
- Use LOOP notes to track
- Add exit conditions

## Best Practices

### Writing Tips
1. **Keep passages focused** - One scene/choice per passage
2. **Use clear link text** - Players should understand choices
3. **Maintain consistent tone** - Match your story's voice
4. **Test every path** - Ensure all routes work

### Organization Tips
1. **Plan your structure** - Outline before building
2. **Use meaningful names** - Easy to find later
3. **Group related content** - Lanes for organization
4. **Regular exports** - Backup your work

### Efficiency Tips
1. **Use search** (Ctrl/Cmd+K) - Quick navigation
2. **Link buttons** - Jump between connected passages
3. **Preview mode** - Test as you write
4. **Keyboard shortcuts** - Faster editing

## Troubleshooting

### Common Problems

#### Passages in Wrong Lane
- Add `$lane:LaneName` tag
- Save and reload
- Passage moves to correct lane

#### Lost Passages
- Check Orphanage lane
- Use search to find by content
- May be collapsed lane

#### Links Not Working
- Check passage title spelling
- Ensure target passage exists
- Verify link syntax

### Recovery Options
1. **Export regularly** - Save `.twee` backups
2. **Clear storage** - If corruption occurs
3. **Import backup** - Restore from `.twee` file
4. **Check browser console** - For error messages