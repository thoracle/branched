# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BranchEd MVP - A visual editor for Twee stories (interactive fiction format). This is a simplified version focusing on swimlane-based organization of story passages.

## Current Project Status

**Implemented and Working** - BranchEd v1.3.1 is fully functional with advanced features beyond MVP.

## Architecture

### Core Concept: Swimlane-First Design
- Every passage belongs to a swimlane (no free canvas)
- Fixed metadata lane at top for Start/Info passages
- User-created lanes for story organization
- Grid-based auto-positioning within lanes

### Technology Stack
- **Frontend**: Single-page application with HTML5 Canvas
- **Rendering**: Canvas-based with full redraw on changes
- **Storage**: LocalStorage for preferences, optional backend for files
- **Backend** (optional): Python Flask for file operations

### Planned Project Structure
```
/static/
  index.html       # Single page application
  app.js          # Main controller and state management
  swimlanes.js    # Lane rendering and management
  editor.js       # Passage editing functionality
  style.css       # Minimal styling

/backend/
  app.py          # Flask application
  twee.py         # Twee format import/export
  storage.py      # File operations
```

## Development Commands

```bash
# Start the server
./branched

# Run tests
./run-tests

# The app will be available at http://localhost:8000/
```

## IMPORTANT DEVELOPMENT NOTES

### VERSION MANAGEMENT
**ALWAYS increment the version number when making changes!**
- Location: `/static/app.js` line ~86
- Format: `console.log('BranchEd vX.Y.Z');`
- Current version: 1.3.1
- Increment patch (Z) for bug fixes
- Increment minor (Y) for new features
- Increment major (X) for breaking changes

### Testing
- Run `./run-tests` after every change
- Verify all 44 tests pass before considering work complete
- Tests check for: file structure, API endpoints, JS syntax, CSS validity, twee files

## Key Implementation Guidelines

### MVP Scope Constraints
Focus on these core features only:
- Swimlane creation and management
- Passage editing (title, content, position in lane)
- Simple linking with `[[target]]` format
- Twee import/export
- LocalStorage for preferences

### Explicitly Excluded from MVP
Do not implement:
- Zoom, pan, minimap
- Drag between swimlanes
- Multiple projects
- User authentication
- Search functionality
- Advanced analysis tools

### Technical Decisions
- **Single Canvas**: One canvas element, redraw everything on change
- **Fixed Dimensions**: Lane height 200px, passages 150x100px
- **Global State**: Direct manipulation, no complex state management
- **Simple Event Handling**: Single click handler routing

### Development Phases
1. **Week 1**: Core editor (lanes, passages, basic editing)
2. **Week 2**: Links and navigation
3. **Week 3**: Import/export and polish

## Important Files

- `/docs/MVP_SPECIFICATION.md`: Complete specification with code examples and architecture decisions
- Review this specification before implementing any feature

## Code Style Guidelines

When implementing:
- Prioritize simplicity over optimization
- Use direct manipulation over complex patterns
- Implement features incrementally
- Keep all functionality in single HTML page for MVP
- Use minimal external dependencies