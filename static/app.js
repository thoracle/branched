const App = {
    state: {
        lanes: [], // Start with no lanes until a project is loaded
        passages: new Map(),
        links: [],
        loopPassages: new Map(), // Special LOOP passages for backward links
        jumpPassages: new Map(), // Special JUMP passages for cross-lane links
        selectedPassage: null,
        activeLaneId: null,
        nextPassageId: 1,
        nextLaneId: 1,
        darkMode: false,
        stickyNotesVisible: true,
    },

    colors: {
        light: {
            background: '#f5f5f5',
            laneBackground: '#ffffff',
            laneBackgroundMeta: '#f0f0f0',
            laneBackgroundCollapsed: '#f5f5f5',
            laneBackgroundCollapsedMeta: '#e8e8e8',
            laneBackgroundActive: '#e8f4fd',
            headerBackground: '#333333',
            headerBackgroundMeta: '#666666',
            headerBackgroundActive: '#0066cc',
            headerText: '#ffffff',
            passageBackground: '#ffffff',
            passageBorder: '#999999',
            passageBorderSelected: '#0066cc',
            passageOrphanBorder: '#ff4444',  // Red for orphans in light mode
            passageTitle: '#333333',
            passageContent: '#666666',
            linkColor: '#666666',
            crossLaneLinkColor: '#ff9500',
            borderColor: '#cccccc',
            borderColorActive: '#0066cc'
        },
        dark: {
            background: '#1a1a1a',
            laneBackground: '#2a2a2a',
            laneBackgroundMeta: '#252525',
            laneBackgroundCollapsed: '#222222',
            laneBackgroundCollapsedMeta: '#1f1f1f',
            laneBackgroundActive: '#1e3a5f',
            headerBackground: '#404040',
            headerBackgroundMeta: '#353535',
            headerBackgroundActive: '#0066cc',
            headerText: '#ffffff',
            passageBackground: '#333333',
            passageBorder: '#555555',
            passageBorderSelected: '#4499ff',
            passageOrphanBorder: '#ff6666',  // Lighter red for orphans in dark mode
            passageTitle: '#ffffff',
            passageContent: '#bbbbbb',
            linkColor: '#888888',
            crossLaneLinkColor: '#ffa726',
            borderColor: '#444444',
            borderColorActive: '#4499ff'
        }
    },

    getColors() {
        return this.state.darkMode ? this.colors.dark : this.colors.light;
    },

    canvas: null,
    ctx: null,

    CONSTANTS: {
        LANE_HEIGHT: 200,
        LANE_MIN_HEIGHT: 200,
        HEADER_HEIGHT: 40,
        COLLAPSED_LANE_HEIGHT: 40,
        PASSAGE_WIDTH: 150,
        PASSAGE_HEIGHT: 100,
        STICKY_WIDTH: 90,  // 60% of PASSAGE_WIDTH
        STICKY_HEIGHT: 70, // 70% of PASSAGE_HEIGHT
        PASSAGE_SPACING: 20,
        PASSAGE_PADDING: 10,
        VERTICAL_SPACING: 15,
        CHOICE_INDENT: 180,
        TOGGLE_SIZE: 16
    },

    async fetchVersion() {
        try {
            const response = await fetch('/api/version');
            const data = await response.json();
            console.log(`BranchEd v${data.version}`);
        } catch (e) {
            console.log('BranchEd (version unavailable)');
        }
    },

    init() {
        // Version will be fetched from server
        this.fetchVersion();
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Clear localStorage on startup for fresh start
        localStorage.removeItem('branched-data');
        localStorage.removeItem('branchEdState');

        this.bindEvents();
        // Don't load from storage on startup - start fresh
        // this.loadFromStorage();
        this.resizeCanvas();
        this.render();

        // Initialize Editor and Search
        Editor.init(this);
        Search.init(this);

        // Initialize cross-lane toggle button state
        const crossLaneBtn = document.getElementById('cross-lane-toggle');
        if (crossLaneBtn) {
        }
    },

    cleanupStorage() {
        try {
            // Check both possible keys for backward compatibility
            let stored = localStorage.getItem('branched-data') || localStorage.getItem('branchEdState');
            if (stored) {
                // Try to parse to check if it's valid JSON
                const data = JSON.parse(stored);

                // Check for corrupt or outdated data structures
                if (data.passages) {
                    // Convert old passage format if needed
                    const validPassages = new Map();

                    if (Array.isArray(data.passages)) {
                        // Old array format - convert to Map
                        data.passages.forEach(p => {
                            if (p && p.id && typeof p.title === 'string') {
                                // Ensure title doesn't contain content
                                if (p.title && p.title.includes('\n')) {
                                    p.title = p.title.split('\n')[0].trim();
                                }
                                validPassages.set(p.id, p);
                            }
                        });
                    } else if (data.passages instanceof Object) {
                        // Map-like object - validate entries
                        Object.entries(data.passages).forEach(([key, value]) => {
                            if (value && value[1] && typeof value[1].title === 'string') {
                                const passage = value[1];
                                // Ensure title doesn't contain content
                                if (passage.title && passage.title.includes('\n')) {
                                    passage.title = passage.title.split('\n')[0].trim();
                                }
                                validPassages.set(value[0], passage);
                            }
                        });
                    }

                    // Save cleaned data back
                    data.passages = Array.from(validPassages.entries());
                    localStorage.setItem('branched-data', JSON.stringify(data));
                    // Remove old key if it exists
                    localStorage.removeItem('branchEdState');
                }
            }
        } catch (error) {
            console.warn('Corrupt localStorage data detected, clearing...', error);
            // If data is corrupt, clear it
            localStorage.removeItem('branchEdState');
            localStorage.removeItem('theme');
        }
    },

    resizeCanvas() {
        const container = document.getElementById('canvas-container');

        // Calculate maximum width needed based on passage positions
        let maxWidth = container.clientWidth;
        this.state.passages.forEach(passage => {
            const rightEdge = passage.x + this.CONSTANTS.PASSAGE_WIDTH + this.CONSTANTS.PASSAGE_PADDING;
            maxWidth = Math.max(maxWidth, rightEdge);
        });

        // Also account for LOOP and JUMP passages (sticky notes)
        if (this.state.loopPassages) {
            this.state.loopPassages.forEach(loopPassage => {
                const loopRightEdge = loopPassage.x + this.CONSTANTS.STICKY_WIDTH + this.CONSTANTS.PASSAGE_PADDING;
                maxWidth = Math.max(maxWidth, loopRightEdge);
            });
        }

        if (this.state.jumpPassages) {
            this.state.jumpPassages.forEach(jumpPassage => {
                const jumpRightEdge = jumpPassage.x + this.CONSTANTS.STICKY_WIDTH + this.CONSTANTS.PASSAGE_PADDING;
                maxWidth = Math.max(maxWidth, jumpRightEdge);
            });
        }

        // Add some extra padding to the right
        this.canvas.width = Math.max(container.clientWidth, maxWidth + 100);

        // Calculate total height based on actual lane heights
        let totalHeight = 0;
        this.state.lanes.forEach(lane => {
            const laneHeight = this.calculateLaneHeight(lane);
            totalHeight += laneHeight;
        });

        this.canvas.height = Math.max(600, totalHeight);
    },

    calculateLaneHeight(lane) {
        // If collapsed, return just the header height
        if (lane.collapsed) {
            return this.CONSTANTS.COLLAPSED_LANE_HEIGHT;
        }

        // Find min and max vertical extent of passages in this lane
        let minY = 0;
        let maxY = 0;

        lane.passages.forEach(passageId => {
            const passage = this.state.passages.get(passageId);
            if (passage) {
                const relativeY = passage.relativeY || 0;
                minY = Math.min(minY, relativeY);
                maxY = Math.max(maxY, relativeY + this.CONSTANTS.PASSAGE_HEIGHT);
            }
        });

        // Calculate total height needed
        const contentHeight = maxY - minY;

        // Add header, padding, and extra space for safety
        const totalHeight = this.CONSTANTS.HEADER_HEIGHT +
                          this.CONSTANTS.PASSAGE_PADDING * 3 +
                          contentHeight +
                          20; // Extra buffer to prevent overlap

        return Math.max(this.CONSTANTS.LANE_MIN_HEIGHT, totalHeight);
    },

    bindEvents() {
        document.getElementById('add-lane-btn').addEventListener('click', () => this.addLane());
        document.getElementById('add-passage-btn').addEventListener('click', () => this.addPassage());
        document.getElementById('project-selector').addEventListener('change', (e) => this.handleProjectSelection(e));
        document.getElementById('import-btn').addEventListener('click', () => this.importTwee());
        document.getElementById('export-btn').addEventListener('click', () => this.exportTwee());
        document.getElementById('clear-storage-btn').addEventListener('click', () => this.clearStorage());
        document.getElementById('sticky-notes-toggle').addEventListener('click', () => this.toggleStickyNotes());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Load available projects on init
        this.loadProjectList();

        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleCanvasDoubleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
        });

        // Add keyboard event listeners
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    },

    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if clicked on collapse/expand toggle
        const toggledLane = this.checkToggleClick(x, y);
        if (toggledLane) {
            this.toggleLaneCollapse(toggledLane);
            return;
        }

        const clickedPassage = this.getPassageAtPosition(x, y);

        if (clickedPassage) {
            this.selectPassage(clickedPassage);
            Editor.open(clickedPassage);
        } else {
            // Check if clicked on a sticky note
            const clickedSticky = this.getStickyAtPosition(x, y);
            if (clickedSticky) {
                // Open the editor for the source passage
                const sourcePassage = this.state.passages.get(clickedSticky.fromId);
                if (sourcePassage) {
                    this.selectPassage(sourcePassage);
                    Editor.open(sourcePassage);
                }
            } else {
                const clickedLane = this.getLaneAtPosition(x, y);
                if (clickedLane) {
                    this.selectLane(clickedLane);
                }
                this.selectPassage(null);
                Editor.close();
            }
        }

        this.render();
    },

    checkToggleClick(x, y) {
        let currentY = 0;
        for (const lane of this.state.lanes) {
            const laneHeight = this.calculateLaneHeight(lane);

            // Check if click is in the header area
            if (y >= currentY && y < currentY + this.CONSTANTS.HEADER_HEIGHT) {
                // Check if click is on the toggle button (left side of header)
                if (x >= 10 && x <= 10 + this.CONSTANTS.TOGGLE_SIZE) {
                    return lane;
                }
            }

            currentY += laneHeight;
        }
        return null;
    },

    toggleLaneCollapse(lane) {
        lane.collapsed = !lane.collapsed;
        this.updateAllLanePositions();
        this.render();
        this.saveToStorage();
    },

    handleCanvasMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if hovering over a sticky note
        const hoveredSticky = this.getStickyAtPosition(x, y);
        if (hoveredSticky) {
            this.canvas.style.cursor = 'pointer';
        } else {
            // Check if hovering over a passage
            const hoveredPassage = this.getPassageAtPosition(x, y);
            this.canvas.style.cursor = hoveredPassage ? 'pointer' : 'default';
        }
    },

    handleCanvasDoubleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if double-clicked on a sticky note (LOOP or JUMP)
        const clickedSticky = this.getStickyAtPosition(x, y);
        if (clickedSticky) {
            // Navigate to the target passage
            const targetPassage = this.state.passages.get(clickedSticky.toId);
            if (targetPassage) {
                // If target is in a different lane, switch to it
                if (targetPassage.laneId !== this.state.activeLaneId) {
                    this.selectLane(targetPassage.laneId);
                }

                // Select and center on target passage
                this.selectPassage(targetPassage);
                this.updateAllLanePositions();
                this.render();
                // Call centerOnPassage which now uses requestAnimationFrame internally
                this.centerOnPassage(targetPassage);
            }
            return;
        }

        // Check if double-clicked on a passage
        const clickedPassage = this.getPassageAtPosition(x, y);
        if (clickedPassage) {
            // Double-click on passage opens editor (already handled by single click)
            return;
        }

        // Double-clicked on background - create new passage
        const clickedLane = this.getLaneAtPosition(x, y);
        if (clickedLane && !clickedLane.collapsed) {
            this.addPassageAtPosition(clickedLane, x, y);
        }
    },

    getPassageAtPosition(x, y) {
        for (const passage of this.state.passages.values()) {
            // Check if the passage's lane is collapsed
            const lane = this.state.lanes.find(l => l.id === passage.laneId);
            if (lane && lane.collapsed) continue;

            if (x >= passage.x && x <= passage.x + this.CONSTANTS.PASSAGE_WIDTH &&
                y >= passage.y && y <= passage.y + this.CONSTANTS.PASSAGE_HEIGHT) {
                return passage;
            }
        }
        return null;
    },

    getStickyAtPosition(x, y) {
        // Check LOOP passages
        if (this.state.loopPassages) {
            for (const loopPassage of this.state.loopPassages.values()) {
                // Check if the loop's lane is collapsed
                const lane = this.state.lanes.find(l => l.id === loopPassage.laneId);
                if (lane && lane.collapsed) continue;

                // Skip if not positioned
                if (loopPassage.x === 0 && loopPassage.y === 0) continue;

                if (x >= loopPassage.x && x <= loopPassage.x + this.CONSTANTS.STICKY_WIDTH &&
                    y >= loopPassage.y && y <= loopPassage.y + this.CONSTANTS.STICKY_HEIGHT) {
                    return loopPassage;
                }
            }
        }

        // Check JUMP passages (only if cross-lane links are hidden)
        if (this.state.jumpPassages) {
            for (const jumpPassage of this.state.jumpPassages.values()) {
                // Check if the jump's lane is collapsed
                const lane = this.state.lanes.find(l => l.id === jumpPassage.laneId);
                if (lane && lane.collapsed) continue;

                // Skip if not positioned
                if (jumpPassage.x === 0 && jumpPassage.y === 0) continue;

                if (x >= jumpPassage.x && x <= jumpPassage.x + this.CONSTANTS.STICKY_WIDTH &&
                    y >= jumpPassage.y && y <= jumpPassage.y + this.CONSTANTS.STICKY_HEIGHT) {
                    return jumpPassage;
                }
            }
        }

        return null;
    },

    getLaneAtPosition(x, y) {
        let currentY = 0;
        for (let i = 0; i < this.state.lanes.length; i++) {
            const lane = this.state.lanes[i];
            const laneHeight = this.calculateLaneHeight(lane);
            if (y >= currentY && y < currentY + laneHeight) {
                return lane;
            }
            currentY += laneHeight;
        }
        return null;
    },

    selectLane(lane) {
        this.state.activeLaneId = lane.id;
        this.render();
        this.saveToStorage();
    },

    deleteLane(laneId) {
        const lane = this.state.lanes.find(l => l.id === laneId);
        if (!lane) return;

        // Don't allow deleting the metadata lane
        if (lane.isMetadata) {
            alert('Cannot delete the Metadata lane');
            return;
        }

        // Check if lane has passages
        const hasPassages = lane.passages && lane.passages.length > 0;
        let confirmMessage = `Are you sure you want to delete the "${lane.name}" lane?`;

        if (hasPassages) {
            const passageCount = lane.passages.length;
            confirmMessage = `The "${lane.name}" lane contains ${passageCount} passage${passageCount > 1 ? 's' : ''}. ` +
                           `Deleting this lane will also delete all its passages. Are you sure you want to continue?`;
        }

        if (!confirm(confirmMessage)) return;

        // Delete all passages in the lane
        if (hasPassages) {
            lane.passages.forEach(passageId => {
                this.state.passages.delete(passageId);
            });
        }

        // Remove the lane
        const laneIndex = this.state.lanes.indexOf(lane);
        if (laneIndex > -1) {
            this.state.lanes.splice(laneIndex, 1);
        }

        // Clear active lane if it was the deleted one
        if (this.state.activeLaneId === laneId) {
            this.state.activeLaneId = null;
        }

        // Update links to remove any that reference deleted passages
        this.extractLinks();

        // Update all remaining lanes and render
        this.updateAllLanePositions();
        this.render();
        this.saveToStorage();
    },

    handleKeyPress(event) {
        // Check if editor is open - don't handle keys when editing
        const editorPanel = document.getElementById('editor-panel');
        if (!editorPanel.classList.contains('hidden')) return;

        // Delete key pressed
        if (event.key === 'Delete' || event.key === 'Backspace') {
            // Check if a lane is selected
            if (this.state.activeLaneId) {
                event.preventDefault();
                this.deleteLane(this.state.activeLaneId);
            }
        }
    },

    addLane() {
        const name = prompt('Enter lane name:');
        if (!name) return;

        const lane = {
            id: `lane_${this.state.nextLaneId++}`,
            name: name,
            isMetadata: false,
            passages: [],
            collapsed: false
        };

        this.state.lanes.push(lane);
        this.state.activeLaneId = lane.id;
        this.sortLanes();
        this.updateAllLanePositions();
        this.render();
        this.saveToStorage();
    },

    naturalCompare(a, b) {
        // Natural sorting that handles numeric parts correctly
        // This will sort deck1, deck2, deck8, deck10, deck11 in the correct order
        const ax = [];
        const bx = [];

        // Split strings into parts, converting numeric parts to numbers
        a.replace(/(\d+)|(\D+)/g, function(_, num, str) {
            ax.push([num || Infinity, str || ""]);
        });
        b.replace(/(\d+)|(\D+)/g, function(_, num, str) {
            bx.push([num || Infinity, str || ""]);
        });

        // Compare each part
        while (ax.length && bx.length) {
            const an = ax.shift();
            const bn = bx.shift();
            const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
            if (nn) return nn;
        }

        return ax.length - bx.length;
    },

    sortLanes() {
        // Sort lanes in the desired order: Orphanage, Metadata, Main, then $lane tags alphabetically
        this.state.lanes.sort((a, b) => {
            // Orphanage comes first
            if (a.isOrphanage && !b.isOrphanage) return -1;
            if (!a.isOrphanage && b.isOrphanage) return 1;

            // Then Metadata
            if (a.isMetadata && !b.isMetadata) return -1;
            if (!a.isMetadata && b.isMetadata) return 1;

            // Both orphanage or both metadata, maintain relative order
            if ((a.isOrphanage && b.isOrphanage) || (a.isMetadata && b.isMetadata)) return 0;

            // Then Main lane (usually has id 'main')
            if (a.name === 'Main' && b.name !== 'Main') return -1;
            if (a.name !== 'Main' && b.name === 'Main') return 1;

            // Everything else (custom $lane tags) sorted with natural ordering for numbers
            return this.naturalCompare(a.name, b.name);
        });
    },

    addPassage() {
        let lane;
        if (this.state.activeLaneId) {
            lane = this.state.lanes.find(l => l.id === this.state.activeLaneId);
        }

        if (!lane) {
            // If no active lane, try to find a non-metadata lane
            lane = this.state.lanes.find(l => !l.isMetadata);
        }

        if (!lane) {
            // If still no lane, use metadata lane as last resort
            lane = this.state.lanes[0];
        }

        if (!lane) {
            alert('Please add a lane first');
            return;
        }

        const passage = {
            id: `passage_${this.state.nextPassageId++}`,
            title: 'New Passage',
            tags: '',
            content: '',
            laneId: lane.id,
            x: 0,
            y: 0,
            relativeY: 0
        };

        this.state.passages.set(passage.id, passage);
        lane.passages.push(passage.id);

        this.updateAllLanePositions();
        this.render();
        this.saveToStorage();

        this.selectPassage(passage);
        Editor.open(passage);
    },

    addPassageAtPosition(lane, x, y) {
        // Create passage in the specified lane at the given position
        const passage = {
            id: `passage_${this.state.nextPassageId++}`,
            title: 'New Passage',
            tags: '',
            content: '',
            laneId: lane.id,
            x: x - this.CONSTANTS.PASSAGE_WIDTH / 2, // Center on click position
            y: y - this.CONSTANTS.PASSAGE_HEIGHT / 2,
            relativeY: 0
        };

        // Ensure passage is within reasonable bounds
        passage.x = Math.max(this.CONSTANTS.PASSAGE_PADDING, passage.x);
        passage.x = Math.min(this.canvas.width - this.CONSTANTS.PASSAGE_WIDTH - this.CONSTANTS.PASSAGE_PADDING, passage.x);

        // Calculate relative Y for the lane
        let laneY = 0;
        for (let i = 0; i < this.state.lanes.length; i++) {
            if (this.state.lanes[i].id === lane.id) break;
            laneY += this.calculateLaneHeight(this.state.lanes[i]);
        }
        const laneBaseY = laneY + this.CONSTANTS.HEADER_HEIGHT + this.CONSTANTS.PASSAGE_PADDING;
        passage.relativeY = y - laneBaseY;

        // Ensure passage is within lane bounds
        passage.relativeY = Math.max(0, passage.relativeY);

        this.state.passages.set(passage.id, passage);
        lane.passages.push(passage.id);

        // Don't update all positions since we're placing manually
        this.resizeCanvas();
        this.render();
        this.saveToStorage();

        this.selectPassage(passage);
        Editor.open(passage);
    },

    updatePassagePositions(lane) {
        // Calculate lane's Y position based on previous lanes' heights
        let laneY = 0;
        for (let i = 0; i < this.state.lanes.length; i++) {
            if (this.state.lanes[i].id === lane.id) break;
            laneY += this.calculateLaneHeight(this.state.lanes[i]);
        }

        const baseY = laneY + this.CONSTANTS.HEADER_HEIGHT;

        // Reset all passage positions first
        lane.passages.forEach(passageId => {
            const passage = this.state.passages.get(passageId);
            if (passage) {
                passage.x = 0;
                passage.relativeY = 0;
                passage.y = 0;
            }
        });

        // Special handling for metadata lanes: hybrid approach
        if (lane.isMetadata) {
            // First, check if any metadata passages have links between them
            const hasInternalLinks = lane.passages.some(passageId => {
                const passage = this.state.passages.get(passageId);
                if (!passage) return false;

                // Check if this passage has links to other metadata passages
                return this.state.links.some(link =>
                    link.from === passageId &&
                    lane.passages.includes(link.to)
                );
            });

            // If there are no internal links, position side by side
            if (!hasInternalLinks) {
                let currentX = this.CONSTANTS.PASSAGE_PADDING;
                const verticalSpacing = this.CONSTANTS.PASSAGE_HEIGHT + this.CONSTANTS.PASSAGE_SPACING;
                let currentRow = 0;
                let passagesInRow = 0;
                const maxPerRow = 5; // Maximum passages per row

                lane.passages.forEach(passageId => {
                    const passage = this.state.passages.get(passageId);
                    if (passage) {
                        // Start new row if needed
                        if (passagesInRow >= maxPerRow) {
                            currentRow++;
                            currentX = this.CONSTANTS.PASSAGE_PADDING;
                            passagesInRow = 0;
                        }

                        passage.x = currentX;
                        passage.relativeY = this.CONSTANTS.PASSAGE_PADDING + (currentRow * verticalSpacing);
                        passage.y = baseY + passage.relativeY;

                        currentX += this.CONSTANTS.PASSAGE_WIDTH + this.CONSTANTS.PASSAGE_SPACING * 2;
                        passagesInRow++;
                    }
                });

                return; // Skip the normal depth-based positioning
            }
            // If there are internal links, fall through to normal depth-based positioning
        }

        // Position passages based on their relationships
        const positioned = new Set();
        const passageGraph = this.buildPassageGraph(lane);
        const depths = this.calculatePassageDepths(lane, passageGraph);

        // Group passages by depth
        const depthGroups = {};
        for (const [passageId, depth] of depths.entries()) {
            if (!depthGroups[depth]) depthGroups[depth] = [];
            depthGroups[depth].push(passageId);
        }

        // First, identify direct cross-lane passages and their descendants
        const bottomCrossLaneRoots = new Set();
        const topCrossLaneRoots = new Set();
        const bottomCrossLaneDescendants = new Set();
        const topCrossLaneDescendants = new Set();

        // Cross-lane links are now always hidden, skip this block

        // Now find all descendants of cross-lane roots to exclude them from normal positioning
        const markDescendants = (rootId, targetSet, visited = new Set()) => {
            // Prevent infinite recursion with cycles
            if (visited.has(rootId)) return;
            visited.add(rootId);

            const children = this.state.links
                .filter(link => link.from === rootId)
                .map(link => link.to)
                .filter(childId => {
                    const child = this.state.passages.get(childId);
                    return child && child.laneId === lane.id;
                });

            children.forEach(childId => {
                if (!targetSet.has(childId)) {
                    targetSet.add(childId);
                    markDescendants(childId, targetSet, visited); // Recursively mark grandchildren
                }
            });
        };

        bottomCrossLaneRoots.forEach(rootId => markDescendants(rootId, bottomCrossLaneDescendants, new Set()));
        topCrossLaneRoots.forEach(rootId => markDescendants(rootId, topCrossLaneDescendants, new Set()));

        // Position by depth columns
        const sortedDepths = Object.keys(depthGroups).sort((a, b) => a - b);

        // First position top cross-lane root passages
        // Start with some padding from the top of the content area
        let topY = this.CONSTANTS.PASSAGE_PADDING;
        if (topCrossLaneRoots.size > 0) {
            // Group top root passages by parent AND depth
            const topGroups = {};

            topCrossLaneRoots.forEach(passageId => {
                const depth = depths.get(passageId);

                // Find the cross-lane parent for grouping
                const crossLaneParents = this.findCrossLaneParents(passageId, lane);
                const parentKey = crossLaneParents.length > 0 ? crossLaneParents[0] : 'orphan';

                const groupKey = `${parentKey}_${depth}`;
                if (!topGroups[groupKey]) {
                    topGroups[groupKey] = {
                        depth: depth,
                        parentId: parentKey,
                        passages: []
                    };
                }
                topGroups[groupKey].passages.push(passageId);
            });

            // Sort groups by depth first, then by parent
            const sortedGroups = Object.keys(topGroups).sort((a, b) => {
                const groupA = topGroups[a];
                const groupB = topGroups[b];
                if (groupA.depth !== groupB.depth) {
                    return groupA.depth - groupB.depth;
                }
                // If same depth, group by parent Y position
                const parentA = this.state.passages.get(groupA.parentId);
                const parentB = this.state.passages.get(groupB.parentId);
                return (parentA?.relativeY || 0) - (parentB?.relativeY || 0);
            });

            // Position each group
            sortedGroups.forEach(groupKey => {
                const group = topGroups[groupKey];
                const depthX = this.CONSTANTS.PASSAGE_PADDING +
                              (group.depth * (this.CONSTANTS.PASSAGE_WIDTH + this.CONSTANTS.PASSAGE_SPACING * 8));

                // For each passage in the group, check if it has children
                group.passages.forEach((passageId, index) => {
                    const passage = this.state.passages.get(passageId);
                    if (passage && !positioned.has(passageId)) {
                        // Count how many children this passage has in the same lane
                        const childCount = this.state.links
                            .filter(link => link.from === passageId)
                            .filter(link => {
                                const child = this.state.passages.get(link.to);
                                return child && child.laneId === lane.id;
                            }).length;

                        // If this passage has children and it's not the first in the group,
                        // add extra spacing to position it closer to its children
                        if (childCount > 0 && index > 0) {
                            topY += this.CONSTANTS.PASSAGE_HEIGHT; // Extra space before passages with children
                        }

                        passage.x = depthX;
                        passage.relativeY = topY;
                        positioned.add(passageId);
                        topY += this.CONSTANTS.PASSAGE_HEIGHT + this.CONSTANTS.VERTICAL_SPACING;
                    }
                });

                // Add extra spacing between different parent groups
                if (sortedGroups.indexOf(groupKey) < sortedGroups.length - 1) {
                    const nextGroup = topGroups[sortedGroups[sortedGroups.indexOf(groupKey) + 1]];
                    if (nextGroup.parentId !== group.parentId) {
                        topY += this.CONSTANTS.VERTICAL_SPACING; // Extra gap between parent groups
                    }
                }
            });
        }

        // Then position normal passages (excluding cross-lane passages and their descendants)
        sortedDepths.forEach(depth => {
            // Calculate X position for this depth
            const currentX = this.CONSTANTS.PASSAGE_PADDING +
                           (depth * (this.CONSTANTS.PASSAGE_WIDTH + this.CONSTANTS.PASSAGE_SPACING * 8));

            // Exclude cross-lane roots AND their descendants
            const passagesAtDepth = depthGroups[depth].filter(id =>
                !bottomCrossLaneRoots.has(id) && !topCrossLaneRoots.has(id) &&
                !bottomCrossLaneDescendants.has(id) && !topCrossLaneDescendants.has(id));

            if (passagesAtDepth.length === 0) return; // Skip if all passages are root cross-lane positioned

            // Group passages by their parent for vertical stacking
            const parentGroups = {};
            passagesAtDepth.forEach(passageId => {
                // Find parents in this lane first
                let parents = this.findParentsInLane(passageId, lane);

                // If no parents in this lane, check for cross-lane parents (only if toggle is ON)
                if (parents.length === 0) {
                    parents = this.findCrossLaneParents(passageId, lane);
                }

                const parentKey = parents.length > 0 ? parents[0] : 'root';
                if (!parentGroups[parentKey]) parentGroups[parentKey] = [];
                parentGroups[parentKey].push(passageId);
            });

            // Calculate Y positions for all groups to avoid overlaps
            const groupPositions = [];
            const parentKeys = Object.keys(parentGroups);

            // Sort parent keys to ensure consistent ordering
            parentKeys.sort((a, b) => {
                if (a === 'root') return -1;
                if (b === 'root') return 1;

                const parentA = this.state.passages.get(a);
                const parentB = this.state.passages.get(b);

                // Sort by parent's Y position for non-root passages
                return (parentA?.relativeY || 0) - (parentB?.relativeY || 0);
            });

            let nextAvailableY = topY > 0 ? topY + this.CONSTANTS.VERTICAL_SPACING : this.CONSTANTS.PASSAGE_PADDING;

            parentKeys.forEach((parentKey, groupIndex) => {
                const passages = parentGroups[parentKey];
                const parent = parentKey !== 'root' ? this.state.passages.get(parentKey) : null;

                if (parentKey !== 'root' && parent) {
                    // NEW LOGIC: All children (single or multiple) align with parent when possible
                    // First child aligns with parent, others stack below
                    const desiredStartY = parent.relativeY || 0;
                    const actualStartY = Math.max(desiredStartY, nextAvailableY);

                    let currentY = actualStartY;
                    passages.forEach((passageId, index) => {
                        const passage = this.state.passages.get(passageId);
                        if (passage && !positioned.has(passageId)) {
                            passage.x = currentX;
                            passage.relativeY = currentY;
                            positioned.add(passageId);
                            currentY += this.CONSTANTS.PASSAGE_HEIGHT + this.CONSTANTS.VERTICAL_SPACING;
                        }
                    });

                    // Update next available Y and add group spacing
                    nextAvailableY = currentY;
                    if (groupIndex < parentKeys.length - 1) {
                        // Add extra space between parent groups
                        nextAvailableY += this.CONSTANTS.VERTICAL_SPACING;
                    }
                } else {
                    // Root passages - stack from top
                    let currentY = Math.max(this.CONSTANTS.PASSAGE_PADDING, nextAvailableY);
                    passages.forEach(passageId => {
                        const passage = this.state.passages.get(passageId);
                        if (passage && !positioned.has(passageId)) {
                            passage.x = currentX;
                            passage.relativeY = currentY;
                            positioned.add(passageId);
                            currentY += this.CONSTANTS.PASSAGE_HEIGHT + this.CONSTANTS.VERTICAL_SPACING;
                        }
                    });

                    nextAvailableY = currentY;
                    if (groupIndex < parentKeys.length - 1) {
                        // Add extra space between groups
                        nextAvailableY += this.CONSTANTS.VERTICAL_SPACING;
                    }
                }
            });
        });

        // Now position bottom cross-lane ROOT passages and their children
        if (bottomCrossLaneRoots.size > 0) {
            // Find where to start positioning bottom passages
            const existingPassages = Array.from(this.state.passages.values())
                .filter(p => p.laneId === lane.id && positioned.has(p.id));
            let bottomY = existingPassages.length > 0
                ? Math.max(...existingPassages.map(p => (p.relativeY || 0) + this.CONSTANTS.PASSAGE_HEIGHT))
                : 0;
            bottomY += this.CONSTANTS.PASSAGE_HEIGHT * 2; // Add gap before bottom section

            // Group bottom cross-lane roots by parent
            const bottomGroups = {};
            bottomCrossLaneRoots.forEach(passageId => {
                const crossLaneParents = this.findCrossLaneParents(passageId, lane);
                const parentKey = crossLaneParents.length > 0 ? crossLaneParents[0] : 'orphan';

                if (!bottomGroups[parentKey]) {
                    bottomGroups[parentKey] = [];
                }
                bottomGroups[parentKey].push(passageId);
            });

            // First, calculate the total height needed for each root and its descendants
            const calculateTreeHeight = (rootId) => {
                // Build the complete tree structure
                const buildTree = (passageId, visited = new Set()) => {
                    if (visited.has(passageId)) return { children: [] };
                    visited.add(passageId);

                    const children = this.state.links
                        .filter(link => link.from === passageId)
                        .map(link => link.to)
                        .filter(childId => {
                            const child = this.state.passages.get(childId);
                            return child && child.laneId === lane.id;
                        })
                        .map(childId => buildTree(childId, visited));

                    return { id: passageId, children };
                };

                // Calculate height needed for a tree node and its children
                const calculateNodeHeight = (node) => {
                    if (!node.children || node.children.length === 0) {
                        return this.CONSTANTS.PASSAGE_HEIGHT;
                    }

                    // For each depth level, find the maximum height needed
                    let totalHeight = 0;

                    // Group children by their depth relative to this node
                    const childrenByDepth = {};
                    const addToDepthMap = (child, depth, visited = new Set()) => {
                        // Prevent infinite recursion
                        const childKey = child.id || JSON.stringify(child);
                        if (visited.has(childKey)) return;
                        visited.add(childKey);

                        if (!childrenByDepth[depth]) {
                            childrenByDepth[depth] = [];
                        }
                        childrenByDepth[depth].push(child);

                        child.children.forEach(grandchild => {
                            addToDepthMap(grandchild, depth + 1, visited);
                        });
                    };

                    node.children.forEach(child => addToDepthMap(child, 1, new Set()));

                    // Calculate max height needed at each depth
                    Object.values(childrenByDepth).forEach(nodesAtDepth => {
                        const heightAtDepth = nodesAtDepth.length * this.CONSTANTS.PASSAGE_HEIGHT +
                                            (nodesAtDepth.length - 1) * this.CONSTANTS.VERTICAL_SPACING;
                        totalHeight = Math.max(totalHeight, heightAtDepth);
                    });

                    // Root needs at least its own height
                    return Math.max(this.CONSTANTS.PASSAGE_HEIGHT, totalHeight);
                };

                const tree = buildTree(rootId);
                return calculateNodeHeight(tree);
            };

            // Calculate heights for all roots and position them with proper spacing
            let currentY = bottomY;

            // Track used Y positions at each depth across ALL bottom roots to prevent overlaps
            const usedYByDepth = {};

            Object.keys(bottomGroups).forEach((parentKey) => {
                const rootPassages = bottomGroups[parentKey];

                rootPassages.forEach((rootId) => {
                    const root = this.state.passages.get(rootId);
                    if (!root) return;

                    // Calculate total height needed for this root and all its descendants
                    const treeHeight = calculateTreeHeight(rootId);

                    // Position the root
                    if (!positioned.has(rootId)) {
                        const depth = depths.get(rootId);
                        const depthX = this.CONSTANTS.PASSAGE_PADDING +
                                      (depth * (this.CONSTANTS.PASSAGE_WIDTH + this.CONSTANTS.PASSAGE_SPACING * 8));

                        root.x = depthX;
                        root.relativeY = currentY;
                        positioned.add(rootId);

                        // Track this root's Y position
                        if (!usedYByDepth[depth]) {
                            usedYByDepth[depth] = [];
                        }
                        usedYByDepth[depth].push(currentY);
                    }

                    // Now position all descendants
                    const positionDescendants = (parentId, parentY, visitedInChain = new Set()) => {
                        // Prevent infinite recursion
                        if (visitedInChain.has(parentId)) return;
                        const newVisited = new Set(visitedInChain);
                        newVisited.add(parentId);

                        const children = this.state.links
                            .filter(link => link.from === parentId)
                            .map(link => link.to)
                            .filter(childId => {
                                const child = this.state.passages.get(childId);
                                return child && child.laneId === lane.id && !positioned.has(childId);
                            });

                        if (children.length === 0) return;

                        // Position children starting at parent's Y
                        let childY = parentY;

                        children.forEach((childId, index) => {
                            const child = this.state.passages.get(childId);
                            if (child && !positioned.has(childId)) {
                                const childDepth = depths.get(childId);
                                const childX = this.CONSTANTS.PASSAGE_PADDING +
                                              (childDepth * (this.CONSTANTS.PASSAGE_WIDTH + this.CONSTANTS.PASSAGE_SPACING * 8));

                                // Check if this Y position is already used at this depth
                                if (!usedYByDepth[childDepth]) {
                                    usedYByDepth[childDepth] = [];
                                }

                                // Find the next available Y position at this depth
                                let attemptY = childY;
                                while (usedYByDepth[childDepth].some(y =>
                                    Math.abs(y - attemptY) < this.CONSTANTS.PASSAGE_HEIGHT + this.CONSTANTS.VERTICAL_SPACING)) {
                                    attemptY += this.CONSTANTS.PASSAGE_HEIGHT + this.CONSTANTS.VERTICAL_SPACING;
                                }
                                childY = attemptY;

                                child.x = childX;
                                child.relativeY = childY;
                                positioned.add(childId);
                                usedYByDepth[childDepth].push(childY);

                                // Calculate height needed for this child's subtree
                                const childTreeHeight = calculateTreeHeight(childId);

                                // Recursively position this child's descendants
                                positionDescendants(childId, childY, newVisited);

                                // Move Y for next sibling based on subtree height
                                childY += Math.max(
                                    this.CONSTANTS.PASSAGE_HEIGHT + this.CONSTANTS.VERTICAL_SPACING,
                                    childTreeHeight + this.CONSTANTS.VERTICAL_SPACING
                                );
                            }
                        });
                    };

                    positionDescendants(rootId, root.relativeY);

                    // Move to next root position with the calculated space
                    currentY += treeHeight + this.CONSTANTS.VERTICAL_SPACING * 2;
                });
            });
        }

        // Find the minimum relativeY to normalize positions
        let minRelativeY = 0;
        lane.passages.forEach(passageId => {
            const passage = this.state.passages.get(passageId);
            if (passage && passage.relativeY !== undefined) {
                minRelativeY = Math.min(minRelativeY, passage.relativeY);
            }
        });

        // Apply final Y positions, normalizing to ensure no negative positions
        const yOffset = Math.abs(minRelativeY);
        lane.passages.forEach(passageId => {
            const passage = this.state.passages.get(passageId);
            if (passage) {
                passage.y = baseY + this.CONSTANTS.PASSAGE_PADDING + yOffset + (passage.relativeY || 0);
            }
        });

        // Position LOOP and JUMP passages to the right of their source passages
        // Group sticky notes by their source passage from the start
        const stickyBySource = new Map();

        // Collect all LOOP sticky notes for this lane
        if (this.state.loopPassages) {
            for (const loopPassage of this.state.loopPassages.values()) {
                if (loopPassage.laneId === lane.id) {
                    if (!stickyBySource.has(loopPassage.fromId)) {
                        stickyBySource.set(loopPassage.fromId, []);
                    }
                    stickyBySource.get(loopPassage.fromId).push(loopPassage);
                }
            }
        }

        // Collect all JUMP sticky notes for this lane
        if (this.state.jumpPassages) {
            for (const jumpPassage of this.state.jumpPassages.values()) {
                if (jumpPassage.laneId === lane.id) {
                    if (!stickyBySource.has(jumpPassage.fromId)) {
                        stickyBySource.set(jumpPassage.fromId, []);
                    }
                    stickyBySource.get(jumpPassage.fromId).push(jumpPassage);
                }
            }
        }

        // Position all sticky notes
        if (stickyBySource.size > 0) {
            // Position sticky notes for each source passage
            for (const [sourceId, stickies] of stickyBySource) {
                const sourcePassage = this.state.passages.get(sourceId);
                if (sourcePassage) {
                    // Sort stickies to ensure consistent ordering: loops first, then jumps
                    stickies.sort((a, b) => {
                        if (a.type === 'loop' && b.type === 'jump') return -1;
                        if (a.type === 'jump' && b.type === 'loop') return 1;
                        return 0;
                    });

                    // Create a stacked effect when there are many stickies
                    const maxVisibleStickies = 3;
                    const stackOffset = 8; // Small offset for stack effect

                    stickies.forEach((sticky, index) => {
                        // Position stickies with a small stack offset
                        const visibleIndex = Math.min(index, maxVisibleStickies - 1);
                        sticky.x = sourcePassage.x + this.CONSTANTS.PASSAGE_WIDTH + this.CONSTANTS.PASSAGE_SPACING + (visibleIndex * stackOffset);
                        sticky.y = sourcePassage.y + (visibleIndex * stackOffset);

                        // Mark if this sticky is part of a stack
                        sticky.stackIndex = index;
                        sticky.totalInStack = stickies.length;
                        sticky.isVisible = index < maxVisibleStickies;
                    });
                }
            }
        }
    },

    calculatePassageDepths(lane, graph) {
        const depths = new Map();
        const visited = new Set();

        // First pass: identify likely backward links by detecting cycles
        const detectBackwardLinks = () => {
            const backwardLinks = new Set();
            const tempDepths = new Map();
            const tempVisited = new Set();
            const tempQueue = [];

            // Find initial roots
            lane.passages.forEach(passageId => {
                const passage = this.state.passages.get(passageId);
                if (!passage) return;

                const isStart = passage.title === 'Start' || (passage.tags && passage.tags.includes('$start'));
                if (isStart) {
                    tempQueue.push(passageId);
                    tempDepths.set(passageId, 0);
                    tempVisited.add(passageId);
                }
            });

            // If no Start found, use orphans as roots
            if (tempQueue.length === 0) {
                const hasIncoming = new Set();
                this.state.links.forEach(link => {
                    if (this.state.passages.get(link.to)?.laneId === lane.id) {
                        hasIncoming.add(link.to);
                    }
                });
                lane.passages.forEach(passageId => {
                    if (!hasIncoming.has(passageId)) {
                        tempQueue.push(passageId);
                        tempDepths.set(passageId, 0);
                        tempVisited.add(passageId);
                    }
                });
            }

            // BFS to assign temporary depths
            while (tempQueue.length > 0) {
                const current = tempQueue.shift();
                const currentDepth = tempDepths.get(current) || 0;

                // Check all outgoing links
                this.state.links.forEach(link => {
                    if (link.from !== current) return;

                    const to = this.state.passages.get(link.to);
                    if (!to || to.laneId !== lane.id) return;

                    if (!tempVisited.has(link.to)) {
                        tempDepths.set(link.to, currentDepth + 1);
                        tempVisited.add(link.to);
                        tempQueue.push(link.to);
                    } else {
                        // Already visited - check if this is a backward link
                        const toDepth = tempDepths.get(link.to) || 0;
                        if (toDepth <= currentDepth) {
                            // This is a backward or same-level link
                            backwardLinks.add(`${link.from}->${link.to}`);
                        }
                    }
                });
            }

            return backwardLinks;
        };

        const backwardLinks = detectBackwardLinks();

        // Build a forward-only graph (ignore backward links)
        const buildForwardGraph = () => {
            const forwardLinks = new Map(); // passageId -> Set of children
            const incomingCount = new Map(); // passageId -> count of incoming edges

            // Initialize
            lane.passages.forEach(passageId => {
                forwardLinks.set(passageId, new Set());
                incomingCount.set(passageId, 0);
            });

            // Build the graph
            this.state.links.forEach(link => {
                // Skip backward links
                if (backwardLinks.has(`${link.from}->${link.to}`)) {
                    return;
                }

                const from = this.state.passages.get(link.from);
                const to = this.state.passages.get(link.to);

                if (!from || !to) return;

                // Skip if both passages are not in this lane (unless cross-lane links are enabled)
                const fromInLane = from.laneId === lane.id;
                const toInLane = to.laneId === lane.id;

                if (!fromInLane && !toInLane) return;
                if (!fromInLane || !toInLane) return;

                // Add to forward graph (only if from passage is in this lane)
                if (fromInLane && forwardLinks.has(link.from)) {
                    forwardLinks.get(link.from).add(link.to);
                }

                // Update incoming count (only if to passage is in this lane)
                if (toInLane && incomingCount.has(link.to)) {
                    incomingCount.set(link.to, incomingCount.get(link.to) + 1);
                }
            });

            return { forwardLinks, incomingCount };
        };

        const { forwardLinks, incomingCount } = buildForwardGraph();


        // Topological sort with BFS to assign depths
        const queue = [];

        // Find all root nodes (no incoming edges or Start passages)
        let rootCount = 0;
        lane.passages.forEach(passageId => {
            const passage = this.state.passages.get(passageId);
            if (!passage) return;

            const isStart = passage.title === 'Start' || (passage.tags && passage.tags.includes('$start'));
            const hasNoIncoming = incomingCount.get(passageId) === 0;

            if (isStart || hasNoIncoming) {
                queue.push(passageId);
                depths.set(passageId, 0);
                visited.add(passageId);
                rootCount++;
            }
        });


        // Process queue with safety limit
        let iterations = 0;
        const maxIterations = 1000;
        const processing = new Set(); // Track what's currently being processed

        while (queue.length > 0 && iterations < maxIterations) {
            iterations++;
            const current = queue.shift();
            processing.delete(current); // No longer processing this node

            const currentDepth = depths.get(current);

            // Process all children
            const children = forwardLinks.get(current) || new Set();
            children.forEach(childId => {
                // Skip if this would create a backward link (child depth would be less than parent)
                const childPassage = this.state.passages.get(childId);
                const currentPassage = this.state.passages.get(current);

                if (!visited.has(childId)) {
                    // First time visiting this node
                    depths.set(childId, currentDepth + 1);
                    visited.add(childId);

                    // Only queue if not already processing
                    if (!processing.has(childId)) {
                        queue.push(childId);
                        processing.add(childId);
                    }
                } else {
                    // Already visited - only update depth if we found a longer path
                    // BUT don't re-process to avoid infinite loops
                    const existingDepth = depths.get(childId);
                    if (currentDepth + 1 > existingDepth) {
                        depths.set(childId, currentDepth + 1);
                        // Don't re-queue! This prevents infinite loops
                    }
                }
            });
        }

        if (iterations >= maxIterations) {
            console.error(`Depth calculation stopped after ${maxIterations} iterations to prevent infinite loop`);
        }

        // Handle any remaining unvisited nodes (shouldn't happen in a well-formed graph)
        lane.passages.forEach(passageId => {
            if (!depths.has(passageId)) {
                depths.set(passageId, 0);
            }
        });

        // Debug logging
        for (const [passageId, passage] of this.state.passages) {
            if (passage.title === 'TestLinks' && passage.laneId === lane.id) {
            }
            if (passage.title === 'SimpleTarget' && passage.laneId === lane.id) {
            }
        }

        return depths;
    },

    calculatePassageDepths_OLD(lane, graph) {
        // Keep old implementation for reference
        const depths = new Map();
        const calculating = new Set();

        const calculateDepth = (passageId) => {
            if (depths.has(passageId)) return depths.get(passageId);

            if (calculating.has(passageId)) {
                depths.set(passageId, 0);
                return 0;
            }

            calculating.add(passageId);

            const passage = this.state.passages.get(passageId);
            const passageTitle = passage ? passage.title : 'unknown';
            if (passage && (passage.title === 'Start' || (passage.tags && passage.tags.includes('$start')))) {
                depths.set(passageId, 0);
                calculating.delete(passageId);
                return 0;
            }

            const allParents = this.state.links
                .filter(link => link.to === passageId)
                .map(link => this.state.passages.get(link.from))
                .filter(parent => {
                    if (!parent) return false;
                    if (parent.laneId === lane.id) return true;
                    return false; // Cross-lane links always hidden
                });

            if (allParents.length === 0) {
                depths.set(passageId, 0);
                calculating.delete(passageId);
                return 0;
            }

            const parentDepths = allParents.map(parent => {
                const parentDepth = calculateDepth(parent.id);
                return parentDepth;
            });

            const depth = Math.max(...parentDepths) + 1;
            depths.set(passageId, depth);
            calculating.delete(passageId);

            if (passageTitle === 'TestLinks' || passageTitle === 'SimpleTarget') {
                const parentNames = allParents.map(p => p.title).join(', ');
            }

            return depth;
        };

        // Calculate depth for all passages in the lane
        lane.passages.forEach(passageId => {
            if (!depths.has(passageId)) {
                calculateDepth(passageId);
            }
        });

        return depths;
    },

    getPassageDepth(passage) {
        // Calculate depth by finding the longest path from any root
        const visited = new Set();
        const findDepth = (p) => {
            if (visited.has(p.id)) return 0;
            visited.add(p.id);

            const parents = this.state.links
                .filter(link => link.to === p.id)
                .map(link => this.state.passages.get(link.from))
                .filter(parent => parent);

            if (parents.length === 0) return 0;

            return 1 + Math.max(...parents.map(parent => findDepth(parent)));
        };

        return findDepth(passage);
    },

    findParentsInLane(passageId, lane) {
        return this.state.links
            .filter(link => {
                const fromPassage = this.state.passages.get(link.from);
                return link.to === passageId && fromPassage && fromPassage.laneId === lane.id;
            })
            .map(link => link.from);
    },

    findCrossLaneParents(passageId, lane) {
        // Find parents from other lanes
        return this.state.links
            .filter(link => {
                const fromPassage = this.state.passages.get(link.from);
                return link.to === passageId && fromPassage && fromPassage.laneId !== lane.id;
            })
            .map(link => link.from);
    },

    buildPassageGraph(lane) {
        const graph = {};
        lane.passages.forEach(passageId => {
            graph[passageId] = [];
        });

        this.state.links.forEach(link => {
            const fromPassage = this.state.passages.get(link.from);
            const toPassage = this.state.passages.get(link.to);

            // Include links where the TO passage is in this lane
            // This ensures we track children properly even if parent is cross-lane
            if (toPassage && toPassage.laneId === lane.id) {
                // If the FROM passage is in this lane, add to its children list
                if (fromPassage && fromPassage.laneId === lane.id) {
                    if (!graph[link.from]) graph[link.from] = [];
                    graph[link.from].push(link.to);
                } else {
                    // Parent is cross-lane, but we still need to track this for depth calculation
                    // This will be handled by the depth calculation logic
                }
            }
        });

        return graph;
    },

    // Removed old positionPassageTree method as it's replaced by the new depth-based algorithm

    selectPassage(passage) {
        this.state.selectedPassage = passage;
    },

    centerOnPassage(passage) {
        if (!passage) return;

        // First ensure the lane is expanded if it's collapsed
        const targetLane = this.state.lanes.find(l => l.id === passage.laneId);
        if (targetLane && targetLane.collapsed) {
            targetLane.collapsed = false;
            this.updateAllLanePositions();
            this.render();
        }

        // Use requestAnimationFrame to ensure DOM updates are complete
        requestAnimationFrame(() => {
            // Calculate the passage's absolute position on canvas
            let laneY = 0;
            for (const lane of this.state.lanes) {
                if (lane.id === passage.laneId) {
                    // Found the target lane
                    break;
                }
                laneY += this.calculateLaneHeight(lane);
            }

            // The passage.y is already the absolute Y position on the canvas
            // It already includes all lane offsets, so we use it directly
            const passageX = passage.x;
            const passageY = passage.y;

            // Get container dimensions
            const container = document.getElementById('canvas-container');
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            // Check if editor panel is open and adjust available width
            const editorPanel = document.getElementById('editor-panel');
            const isEditorOpen = editorPanel && !editorPanel.classList.contains('hidden');
            const editorWidth = isEditorOpen ? 370 : 0; // 350px width + 20px margin
            const availableWidth = containerWidth - editorWidth;

            // Calculate scroll position to center the passage in available space
            const targetX = passageX + this.CONSTANTS.PASSAGE_WIDTH / 2;
            const targetY = passageY + this.CONSTANTS.PASSAGE_HEIGHT / 2;

            // Center in the available left area (not covered by editor panel)
            const scrollX = targetX - availableWidth / 2;
            // Center positioning works better when passages have coordinates that might result in negative scroll
            const scrollY = targetY - containerHeight / 2;

            // Apply scroll with bounds checking
            container.scrollLeft = Math.max(0, Math.min(scrollX, container.scrollWidth - containerWidth));
            container.scrollTop = Math.max(0, Math.min(scrollY, container.scrollHeight - containerHeight));
        });
    },

    getParentPassage(passageId) {
        // Find the first parent (could be in same lane or different lane)
        const parentLink = this.state.links.find(link => link.to === passageId);
        if (parentLink) {
            return this.state.passages.get(parentLink.from);
        }
        return null;
    },

    goToParentPassage(passageId) {
        const parent = this.getParentPassage(passageId);
        if (parent) {
            // Close current editor
            Editor.close();

            // If parent is in a different lane, switch to it
            if (parent.laneId !== this.state.activeLaneId) {
                this.selectLane(parent.laneId);
            }

            // Select and open parent passage
            this.selectPassage(parent);
            this.updateAllLanePositions(); // Ensure positions are current
            this.render();
            // Open editor first, then center on the passage
            Editor.open(parent);
            // Call centerOnPassage after opening editor to account for changed viewport
            this.centerOnPassage(parent);
        }
    },

    deletePassage(passageId) {
        const passage = this.state.passages.get(passageId);
        if (!passage) return;

        const lane = this.state.lanes.find(l => l.id === passage.laneId);
        if (lane) {
            lane.passages = lane.passages.filter(id => id !== passageId);
        }

        this.state.passages.delete(passageId);
        this.state.selectedPassage = null;

        this.updateAllLanePositions();
        this.render();
        this.saveToStorage();
    },

    updatePassage(passageId, updates) {
        const passage = this.state.passages.get(passageId);
        if (passage) {
            // Check if tags are being updated and handle $lane: tag
            if (updates.tags !== undefined) {
                const tagArray = updates.tags.split(/\s+/).filter(t => t);
                const regularTags = [];
                let newLaneId = null;

                tagArray.forEach(tag => {
                    if (tag.startsWith('$lane:')) {
                        const laneName = tag.substring(6);
                        // Find the lane with this name
                        const targetLane = this.state.lanes.find(l => l.name === laneName);
                        if (targetLane) {
                            newLaneId = targetLane.id;
                        }
                    } else {
                        regularTags.push(tag);
                    }
                });

                // Update tags without the $lane: tag (it's implicit from laneId)
                updates.tags = regularTags.join(' ');

                // If lane was changed, move the passage
                if (newLaneId && newLaneId !== passage.laneId) {
                    // Remove from old lane
                    const oldLane = this.state.lanes.find(l => l.id === passage.laneId);
                    if (oldLane) {
                        oldLane.passages = oldLane.passages.filter(id => id !== passageId);
                    }

                    // Add to new lane
                    const newLane = this.state.lanes.find(l => l.id === newLaneId);
                    if (newLane) {
                        newLane.passages.push(passageId);
                        passage.laneId = newLaneId;
                    }
                }
            }

            Object.assign(passage, updates);

            // Only do expensive operations if content or title changed (might affect links)
            if (updates.content !== undefined || updates.title !== undefined) {
                this.extractLinks();
                this.autoCreateLinkedPassages(passage);
                this.updateAllLanePositions();
            }

            this.render();
            this.saveToStorage();
        }
    },

    extractLinks() {
        this.state.links = [];
        this.state.loopPassages = new Map(); // Store special LOOP passages
        this.state.jumpPassages = new Map(); // Store special JUMP passages for cross-lane links

        // First pass: collect all normal links
        for (const passage of this.state.passages.values()) {
            const linkRegex = /\[\[([^\]]+)\]\]/g;
            let match;

            while ((match = linkRegex.exec(passage.content)) !== null) {
                const linkText = match[1];
                let targetTitle;

                // Handle both [[passage]] and [[display|passage]] formats
                if (linkText.includes('|')) {
                    // Format: [[display text|passage name]]
                    const parts = linkText.split('|');
                    targetTitle = parts[parts.length - 1].trim();
                } else {
                    // Format: [[passage name]]
                    targetTitle = linkText.trim();
                }

                // First try to find passage in the same lane (lane-scoped)
                let targetPassage = Array.from(this.state.passages.values())
                    .find(p => p.title === targetTitle && p.laneId === passage.laneId);

                // If not found in same lane, look in other lanes
                if (!targetPassage) {
                    targetPassage = Array.from(this.state.passages.values())
                        .find(p => p.title === targetTitle);
                }

                if (targetPassage) {
                    this.state.links.push({
                        from: passage.id,
                        to: targetPassage.id
                    });
                }
            }
        }

        // Second pass: identify backward links and cross-lane links
        const depths = new Map();

        // Calculate depths for all passages across all lanes
        for (const lane of this.state.lanes) {
            const laneDepths = this.calculatePassageDepths(lane, null);
            for (const [passageId, depth] of laneDepths) {
                depths.set(passageId, depth);
            }
        }

        // Find backward links and cross-lane links
        const backwardLinks = [];
        const crossLaneLinks = [];

        for (const link of this.state.links) {
            const fromPassage = this.state.passages.get(link.from);
            const toPassage = this.state.passages.get(link.to);

            if (fromPassage && toPassage) {
                // Check if it's a cross-lane link
                if (fromPassage.laneId !== toPassage.laneId) {
                    crossLaneLinks.push(link);
                } else {
                    // Check if it's a backward link within the same lane
                    const fromDepth = depths.get(link.from) || 0;
                    const toDepth = depths.get(link.to) || 0;

                    if (fromDepth >= toDepth && toDepth === 0) { // Only for links back to root passages
                        backwardLinks.push(link);
                    }
                }
            }
        }

        // Create LOOP passages for backward links
        for (const link of backwardLinks) {
            const fromPassage = this.state.passages.get(link.from);
            const toPassage = this.state.passages.get(link.to);

            if (fromPassage && toPassage) {
                // Create a unique ID for the loop passage
                const loopId = `loop_${link.from}_${link.to}`;

                // Store loop passage info (will be rendered specially)
                this.state.loopPassages.set(loopId, {
                    id: loopId,
                    type: 'loop',
                    fromId: link.from,
                    toId: link.to,
                    toTitle: toPassage.title,
                    laneId: fromPassage.laneId,
                    x: 0, // Will be positioned relative to source passage
                    y: 0
                });
            }
        }

        // Create JUMP passages for cross-lane links (when toggle is OFF)
        // Always skip cross-lane connections
        {
            for (const link of crossLaneLinks) {
                const fromPassage = this.state.passages.get(link.from);
                const toPassage = this.state.passages.get(link.to);
                const toLane = this.state.lanes.find(l => l.id === toPassage.laneId);

                if (fromPassage && toPassage && toLane) {
                    // Create a unique ID for the jump passage
                    const jumpId = `jump_${link.from}_${link.to}`;

                    // Store jump passage info (will be rendered specially)
                    this.state.jumpPassages.set(jumpId, {
                        id: jumpId,
                        type: 'jump',
                        fromId: link.from,
                        toId: link.to,
                        toTitle: toPassage.title,
                        toLaneName: toLane.name,
                        laneId: fromPassage.laneId,
                        x: 0, // Will be positioned relative to source passage
                        y: 0
                    });
                }
            }
        }

        // Update orphanage after extracting links
        this.createOrphanageIfNeeded();
    },

    autoCreateLinkedPassages(sourcePassage) {
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        let match;
        const passagesToCreate = [];

        while ((match = linkRegex.exec(sourcePassage.content)) !== null) {
            const linkText = match[1];
            let targetTitle;

            // Handle both [[passage]] and [[display|passage]] formats
            if (linkText.includes('|')) {
                // Format: [[display text|passage name]]
                const parts = linkText.split('|');
                targetTitle = parts[parts.length - 1].trim();
            } else {
                // Format: [[passage name]]
                targetTitle = linkText.trim();
            }

            // Check if passage already exists in the same lane (lane-scoped)
            const existingInLane = Array.from(this.state.passages.values())
                .find(p => p.title === targetTitle && p.laneId === sourcePassage.laneId);

            if (!existingInLane && targetTitle) {
                // Don't create if it exists in another lane - that's a cross-lane link
                const existingElsewhere = Array.from(this.state.passages.values())
                    .find(p => p.title === targetTitle);

                if (!existingElsewhere) {
                    passagesToCreate.push(targetTitle);
                }
            }
        }

        // Create missing passages in the same lane as the source
        const lane = this.state.lanes.find(l => l.id === sourcePassage.laneId);
        if (lane && passagesToCreate.length > 0) {
            const createdPassages = [];
            passagesToCreate.forEach(title => {
                const newPassage = {
                    id: `passage_${this.state.nextPassageId++}`,
                    title: title,
                    tags: '',
                    content: '',
                    laneId: lane.id,
                    x: 0,
                    y: 0,
                    relativeY: 0
                };

                this.state.passages.set(newPassage.id, newPassage);
                lane.passages.push(newPassage.id);
                createdPassages.push(newPassage);
            });

            // Update positions after all passages are created
            // Need to extract links first to build proper graph
            this.extractLinks();
            this.updateAllLanePositions();
            this.resizeCanvas();
        }
    },

    updateAllLanePositions() {
        // Update positions for all lanes to ensure proper Y positioning
        this.state.lanes.forEach(lane => {
            this.updatePassagePositions(lane);
        });
        this.resizeCanvas();
    },

    render() {
        const colors = this.getColors();

        // Set canvas background
        this.ctx.fillStyle = colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Check if there's any content to display
        if (this.state.lanes.length === 0 || this.state.passages.size === 0) {
            // Show welcome message when no project is loaded
            this.ctx.fillStyle = colors.text;
            this.ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;

            this.ctx.fillText('Welcome to BranchEd', centerX, centerY - 30);

            this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
            this.ctx.fillStyle = colors.secondaryText || '#666';
            this.ctx.fillText('Select a project from the dropdown above to get started', centerX, centerY + 10);

            // Reset text alignment
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'alphabetic';
        } else {
            // Render normal content
            Swimlanes.renderLanes(this.ctx, this.state.lanes, this.CONSTANTS, this.state.activeLaneId, (lane) => this.calculateLaneHeight(lane), colors, (lane) => this.getLaneImage(lane));

            // Pass sticky notes visibility to the renderer
            const loopPassages = this.state.stickyNotesVisible ? this.state.loopPassages : null;
            const jumpPassages = this.state.stickyNotesVisible ? this.state.jumpPassages : null;

            Swimlanes.renderPassages(this.ctx, this.state.passages, this.state.selectedPassage, this.CONSTANTS, this.state.lanes, colors, this.state.links, loopPassages, jumpPassages);
            Swimlanes.renderLinks(this.ctx, this.state.passages, this.state.links, this.CONSTANTS, this.state.lanes, colors, false, this.state.stickyNotesVisible ? this.state.loopPassages : null, this.state.stickyNotesVisible);
        }
    },

    clearStorage() {
        const confirmed = confirm('This will clear all local data including passages, lanes, and settings.\n\nAre you sure you want to continue?');

        if (confirmed) {
            // Clear all localStorage
            localStorage.clear();

            // Reset to initial state
            this.state = {
                lanes: [],
                passages: new Map(),
                links: [],
                activeLaneId: null,
                selectedPassage: null,
                darkMode: false,
                stickyNotesVisible: true
            };

            // Create default lanes
            const mainLane = {
                id: 'main',
                name: 'Main',
                passages: [],
                collapsed: false,
                y: 0
            };

            const metadataLane = {
                id: 'metadata',
                name: 'Metadata',
                passages: [],
                isMetadata: true,
                collapsed: false,
                y: 0
            };

            this.state.lanes = [mainLane, metadataLane];
            this.state.activeLaneId = mainLane.id;

            // Reset current project config
            this.currentProjectConfig = {};

            // Update UI
            this.updateAllLanePositions();
            this.render();
            this.saveToStorage();

            // Reset project dropdown
            this.resetProjectDropdownSelection();

            // Show notification
            this.showNotification('All local data cleared successfully');
        }
    },


    toggleTheme() {
        this.state.darkMode = !this.state.darkMode;

        // Update button emoji
        const btn = document.getElementById('theme-toggle');
        btn.textContent = this.state.darkMode ? '☀️' : '🌙';

        // Update body background and editor styles
        document.body.classList.toggle('dark-mode', this.state.darkMode);

        this.render();
        this.saveToStorage();
    },

    toggleStickyNotes() {
        this.state.stickyNotesVisible = !this.state.stickyNotesVisible;

        // Update button appearance
        const btn = document.getElementById('sticky-notes-toggle');
        btn.textContent = this.state.stickyNotesVisible ? '📝 Notes' : '📝̶ Notes';
        btn.style.opacity = this.state.stickyNotesVisible ? '1' : '0.5';

        this.render();
        this.saveToStorage();
    },

    async loadProjectList() {
        const selector = document.getElementById('project-selector');

        try {
            // Fetch games list from server
            const response = await fetch('/api/games');
            const games = await response.json();

            // Clear existing options
            selector.innerHTML = '<option value="">📁 Select Project...</option>';

            if (games.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No projects found';
                option.disabled = true;
                selector.appendChild(option);
                return;
            }

            // Add project options
            games.forEach(game => {
                const option = document.createElement('option');
                option.value = game.id;
                option.textContent = `${game.name} (v${game.version})`;
                selector.appendChild(option);
            });

        } catch (error) {
            console.error('Error fetching games:', error);
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Error loading projects';
            option.disabled = true;
            selector.appendChild(option);
        }
    },

    updateProjectDropdownSelection(projectName) {
        const selector = document.getElementById('project-selector');
        // Update the first option (empty value) to show the selected project
        const firstOption = selector.querySelector('option[value=""]');
        if (firstOption) {
            firstOption.textContent = `📁 ${projectName}`;
        }
        // Set the dropdown value to empty to show the updated first option
        selector.value = '';
    },

    resetProjectDropdownSelection() {
        const selector = document.getElementById('project-selector');
        // Reset the first option to the default text
        const firstOption = selector.querySelector('option[value=""]');
        if (firstOption) {
            firstOption.textContent = '📁 Select Project...';
        }
        // Set the dropdown value to empty
        selector.value = '';
    },

    handleProjectSelection(event) {
        const gameId = event.target.value;
        if (gameId) {
            this.loadProjectFromServer(gameId);
        }
    },

    async loadProjectFromServer(gameId) {
        try {
            // Fetch game data from server
            const response = await fetch(`/api/game/${gameId}`);
            const gameData = await response.json();

            if (!gameData.config) {
                this.showNotification('No game configuration found', 'error');
                return;
            }

            // Store the config
            this.currentProjectConfig = gameData.config;

            // Set project title
            if (gameData.config.game_name) {
                document.title = `BranchEd - ${gameData.config.game_name}`;
            }

            // Check if story content was loaded
            if (gameData.storyContent) {
                // Parse the story content directly
                this.parseTwee(gameData.storyContent);
                this.render();
                this.saveToStorage();

                this.showNotification(`Loaded project: ${gameData.config.title || gameData.config.game_name}`, 'success');

                // Update dropdown to show selected project
                this.updateProjectDropdownSelection(gameData.config.title || gameData.config.game_name);
            } else {
                // Story file not found on server
                const storyFile = gameData.config.story_settings?.main_story_file;
                if (!storyFile) {
                    this.showNotification('No story file specified in game config', 'error');
                    return;
                }
                this.showNotification(`Story file not found: ${storyFile}`, 'error');
            }

        } catch (error) {
            console.error('Error loading project:', error);
            this.showNotification(`Error loading project: ${error.message}`, 'error');
        }
    },

    promptForProjectFiles(gameId, config, availableFiles) {
        const storyFileName = config.story_settings.main_story_file.split('/').pop();

        const message = `Project: ${config.game_name}
Version: ${config.version}

Now navigate to the games/${gameId}/ folder and select:
- ${storyFileName} (required)
${availableFiles.includes('npcs.json') ? '- npcs.json (optional for character images)\n' : ''}
Use Ctrl/Cmd+click to select multiple files`;

        alert(message);

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = '.json,.twee,.tw';

        fileInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;

            this.loadProjectFiles(config, files, storyFileName);
        };

        fileInput.click();
    },

    autoLoadProject(gameConfig, availableFiles) {
        // Store the config
        this.currentProjectConfig = gameConfig;

        // Set project title
        if (gameConfig.game_name) {
            document.title = `BranchEd - ${gameConfig.game_name}`;
        }


        // Get the story file name from config
        const storyFile = gameConfig.story_settings?.main_story_file;
        if (!storyFile) {
            alert('No story file specified in game config');
            return;
        }

        // Find story file in available files
        const storyFileName = storyFile.split('/').pop();
        const foundStoryFile = availableFiles.find(f =>
            f.name === storyFileName ||
            f.webkitRelativePath?.endsWith(storyFileName)
        );

        if (!foundStoryFile) {
            alert(`Story file "${storyFileName}" not found in project directory`);
            return;
        }

        // Find data files (we'll load NPCs for lane images)
        const dataFiles = {
            npcs: availableFiles.find(f =>
                f.name === 'npcs.json' ||
                f.webkitRelativePath?.endsWith('npcs.json')
            ),
            // Load other data files if present
            items: availableFiles.find(f =>
                f.name === 'items.json' ||
                f.webkitRelativePath?.endsWith('items.json')
            ),
            monsters: availableFiles.find(f =>
                f.name === 'monsters.json' ||
                f.webkitRelativePath?.endsWith('monsters.json')
            ),
            factions: availableFiles.find(f =>
                f.name === 'factions.json' ||
                f.webkitRelativePath?.endsWith('factions.json')
            )
        };

        // Load story file first
        const storyReader = new FileReader();
        storyReader.onload = (e) => {
            this.parseTwee(e.target.result);

            // Load data files
            this.loadDataFiles(dataFiles, () => {
                this.render();
                this.saveToStorage();

                // Show success

                const loadedDataFiles = Object.keys(dataFiles)
                    .filter(key => dataFiles[key])
                    .map(key => dataFiles[key].name);

                if (loadedDataFiles.length > 0) {
                }

                this.showNotification(`Project "${gameConfig.game_name}" loaded successfully`);
            });
        };
        storyReader.readAsText(foundStoryFile);
    },

    loadProjectFiles(gameConfig, files, expectedStoryFile) {
        // Find the story file
        const storyFile = files.find(f =>
            f.name === expectedStoryFile ||
            f.name.endsWith('.twee') ||
            f.name.endsWith('.tw')
        );

        if (!storyFile) {
            alert(`Story file "${expectedStoryFile}" not found in selected files.`);
            return;
        }

        // Find data files
        const dataFiles = {
            items: files.find(f => f.name === 'items.json'),
            monsters: files.find(f => f.name === 'monsters.json'),
            npcs: files.find(f => f.name === 'npcs.json'),
            factions: files.find(f => f.name === 'factions.json')
        };

        // Load story file first
        const storyReader = new FileReader();
        storyReader.onload = (e) => {
            this.parseTwee(e.target.result);

            // Load data files
            this.loadDataFiles(dataFiles, () => {
                this.render();
                this.saveToStorage();

                // Show success

                const loadedDataFiles = Object.keys(dataFiles)
                    .filter(key => dataFiles[key])
                    .map(key => dataFiles[key].name);

                if (loadedDataFiles.length > 0) {
                }

                this.showNotification(`Project "${gameConfig.game_name}" loaded successfully`);
            });
        };
        storyReader.readAsText(storyFile);
    },

    loadDataFiles(dataFiles, callback) {
        // Initialize project data storage
        if (!this.currentProjectConfig.projectData) {
            this.currentProjectConfig.projectData = {};
        }

        let loadCount = 0;
        const totalFiles = Object.values(dataFiles).filter(f => f).length;

        if (totalFiles === 0) {
            callback();
            return;
        }

        // Load each data file
        Object.keys(dataFiles).forEach(type => {
            const file = dataFiles[type];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.currentProjectConfig.projectData[type] = data;
                } catch (error) {
                    console.error(`✗ Failed to parse ${file.name}:`, error.message);
                }

                loadCount++;
                if (loadCount === totalFiles) {
                    callback();
                }
            };
            reader.readAsText(file);
        });
    },

    // Access loaded project data
    getProjectData(type) {
        return this.currentProjectConfig?.projectData?.[type] || null;
    },

    // Get items data if loaded
    getItems() {
        const itemsData = this.getProjectData('items');
        return itemsData?.items || {};
    },

    // Get monsters data if loaded
    getMonsters() {
        const monstersData = this.getProjectData('monsters');
        return monstersData?.monsters || {};
    },

    // Get NPCs data if loaded
    getNPCs() {
        const npcsData = this.getProjectData('npcs');
        return npcsData?.npcs || [];
    },

    // Get factions data if loaded
    getFactions() {
        const factionsData = this.getProjectData('factions');
        return factionsData?.factions || {};
    },

    // Get NPC image for a lane by matching $lane:{npc_id} to NPC data
    getLaneImage(lane) {
        if (!lane || lane.isMetadata || lane.name === 'Main') {
            return null;
        }

        const npcs = this.getNPCs();
        if (!npcs || npcs.length === 0) {
            return null;
        }

        // Look for an NPC with ID matching the lane name
        const npc = npcs.find(n => n.id === lane.name);
        return npc?.image_url || null;
    },

    showNotification(message, type = 'success') {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.textContent = message;

        const backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    openProjectFallback() {
        const projectFileInput = document.getElementById('project-file-input');
        projectFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const gameConfig = JSON.parse(e.target.result);
                    // For fallback, we'll need to prompt for the story file
                    this.handleProjectConfig(gameConfig);
                } catch (error) {
                    alert('Error parsing JSON config file: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        projectFileInput.click();
    },

    loadSingleConfigFile(configFile, availableFiles) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const gameConfig = JSON.parse(e.target.result);
                this.handleProjectConfig(gameConfig);
            } catch (error) {
                alert('Error parsing JSON config file: ' + error.message);
            }
        };
        reader.readAsText(configFile);
    },

    async loadProjectFromConfig(gameConfig, availableFiles) {
        // Validate that story_settings exists
        if (!gameConfig.story_settings || !gameConfig.story_settings.main_story_file) {
            alert('Invalid game config: missing story_settings.main_story_file');
            return;
        }

        const mainStoryFileName = gameConfig.story_settings.main_story_file;

        // If availableFiles is an array (from file selection), look for the story file
        if (Array.isArray(availableFiles) && availableFiles.length > 0) {
            // Extract just the filename from the path (e.g., "data/world_expanded.twee" -> "world_expanded.twee")
            const storyFileName = mainStoryFileName.split('/').pop();


            // Find the story file by matching the filename
            const storyFile = availableFiles.find(f => {
                return f.name === storyFileName;
            });

            if (storyFile) {
                // Load the story file directly
                this.currentProjectConfig = gameConfig;
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.parseTwee(e.target.result);

                    // Set project title if available
                    if (gameConfig.game_name) {
                        document.title = `BranchEd - ${gameConfig.game_name}`;
                    }

                    this.render();
                    this.saveToStorage();

                };
                reader.readAsText(storyFile);
                return;
            }
        }

        // Fall back to prompting for file if not found
        const confirmLoad = confirm(
            `Found project: ${gameConfig.game_name || 'Unnamed Game'}\n` +
            `Story file: ${mainStoryFileName}\n\n` +
            `The story file was not found in the selected folder. Please select it manually.`
        );

        if (confirmLoad) {
            this.currentProjectConfig = gameConfig;
            this.promptForStoryFile(mainStoryFileName.split('/').pop());
        }
    },

    promptForStoryFile(expectedFileName) {
        const fileInput = document.getElementById('file-input');
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Check if the filename matches (case-insensitive)
            if (file.name.toLowerCase() !== expectedFileName.toLowerCase()) {
                const proceed = confirm(
                    `Selected file "${file.name}" doesn't match expected "${expectedFileName}". ` +
                    `Continue anyway?`
                );
                if (!proceed) return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.parseTwee(e.target.result);

                // Set project title if available
                if (this.currentProjectConfig && this.currentProjectConfig.game_name) {
                    document.title = `BranchEd - ${this.currentProjectConfig.game_name}`;
                }

                this.render();
                this.saveToStorage();

            };
            reader.readAsText(file);
        };
        fileInput.click();
    },

    importTwee() {
        const fileInput = document.getElementById('file-input');
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                this.parseTwee(e.target.result);
                this.render();
                this.saveToStorage();
            };
            reader.readAsText(file);
        };
        fileInput.click();
    },

    createOrphanageIfNeeded() {
        // Find orphan passages (no incoming or outgoing links)
        // BUT exclude metadata passages - they should stay in metadata lane
        const orphanPassages = [];
        const metadataLane = this.state.lanes.find(l => l.isMetadata);

        for (const passage of this.state.passages.values()) {
            // Skip metadata passages - they belong in metadata lane even if orphaned
            if (metadataLane && passage.laneId === metadataLane.id) {
                continue;
            }

            const hasIncoming = this.state.links.some(l => l.to === passage.id);
            const hasOutgoing = this.state.links.some(l => l.from === passage.id);
            if (!hasIncoming && !hasOutgoing) {
                orphanPassages.push(passage);
            }
        }

        // If we have orphans, create or update the Orphanage lane
        if (orphanPassages.length > 0) {
            let orphanageLane = this.state.lanes.find(l => l.isOrphanage);

            if (!orphanageLane) {
                orphanageLane = {
                    id: 'orphanage',
                    name: 'Orphanage',
                    isOrphanage: true,
                    passages: [],
                    collapsed: false
                };
                // Add orphanage lane and sort to ensure proper ordering
                this.state.lanes.push(orphanageLane);
                this.sortLanes();
            }

            // Move orphan passages to the Orphanage lane
            orphanPassages.forEach(passage => {
                // Remove from current lane
                const currentLane = this.state.lanes.find(l => l.id === passage.laneId);
                if (currentLane) {
                    const index = currentLane.passages.indexOf(passage.id);
                    if (index > -1) {
                        currentLane.passages.splice(index, 1);
                    }
                }

                // Add to Orphanage lane
                passage.laneId = orphanageLane.id;
                if (!orphanageLane.passages.includes(passage.id)) {
                    orphanageLane.passages.push(passage.id);
                }
            });
        } else {
            // Remove Orphanage lane if no orphans
            const orphanageIndex = this.state.lanes.findIndex(l => l.isOrphanage);
            if (orphanageIndex > -1) {
                this.state.lanes.splice(orphanageIndex, 1);
            }
        }
    },

    parseTwee(content) {
        this.state.passages.clear();
        // Start with just metadata lane, orphanage will be added if needed
        this.state.lanes = [
            { id: 'metadata', name: 'Metadata', isMetadata: true, passages: [], collapsed: false }
        ];

        // Split content into passages first
        // Each passage starts with ":: " at the beginning of a line
        const passageChunks = content.split(/^:: /m).filter(chunk => chunk.trim());

        passageChunks.forEach(chunk => {
            // Each chunk now starts with the passage name
            // Format: PassageName [optional tags]\ncontent
            const lines = chunk.split('\n');
            const headerLine = lines[0];

            // Parse the header line for name and tags
            const headerMatch = headerLine.match(/^([^\[\n\r]+?)(?:\s*\[([^\]]*)\])?\s*$/);
            if (!headerMatch) return; // Skip malformed passages

            const title = headerMatch[1].trim();
            const tagString = headerMatch[2] ? headerMatch[2].trim() : '';

            // Everything after the first line is content
            const passageContent = lines.slice(1).join('\n').trim();

            // Parse tags - look for $lane: prefix for lane assignment
            const tagArray = tagString.split(/\s+/).filter(t => t);
            let laneName = 'Main';
            const passageTags = [];

            // Check for lane assignment and separate from regular tags
            tagArray.forEach(tag => {
                if (tag.startsWith('$lane:')) {
                    laneName = tag.substring(6);
                } else {
                    passageTags.push(tag);
                }
            });

            // Determine if it's metadata - check for $metadata tag
            const isMetadata = passageTags.includes('$metadata');

            let lane = isMetadata ? this.state.lanes[0] : null;

            if (!isMetadata) {
                lane = this.state.lanes.find(l => l.name === laneName);

                if (!lane) {
                    lane = {
                        id: `lane_${this.state.nextLaneId++}`,
                        name: laneName,
                        isMetadata: false,
                        passages: [],
                        collapsed: false
                    };
                    this.state.lanes.push(lane);
                }
            }

            const passage = {
                id: `passage_${this.state.nextPassageId++}`,
                title: title,
                tags: passageTags.join(' '),
                content: passageContent,
                laneId: lane.id,
                x: 0,
                y: 0,
                relativeY: 0
            };


            this.state.passages.set(passage.id, passage);
            lane.passages.push(passage.id);
        });

        this.extractLinks();

        // Auto-create linked passages for imported content
        for (const passage of this.state.passages.values()) {
            this.autoCreateLinkedPassages(passage);
        }

        // Create Orphanage lane if there are orphan passages
        this.createOrphanageIfNeeded();

        // Sort lanes to ensure proper order after import
        this.sortLanes();
        this.updateAllLanePositions();
    },

    exportTwee() {
        let twee = '';

        for (const passage of this.state.passages.values()) {
            const lane = this.state.lanes.find(l => l.id === passage.laneId);

            // Build tags string
            const tagArray = [];

            // Add passage tags
            if (passage.tags) {
                tagArray.push(...passage.tags.split(/\s+/).filter(t => t));
            }

            // Add lane tag if not metadata lane
            if (lane && !lane.isMetadata && lane.name !== 'Main') {
                tagArray.push(`$lane:${lane.name}`);
            }

            const tagString = tagArray.length > 0 ? ` [${tagArray.join(' ')}]` : '';

            twee += `:: ${passage.title}${tagString}\n${passage.content}\n\n`;
        }

        const blob = new Blob([twee], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'story.twee';
        a.click();
        URL.revokeObjectURL(url);
    },

    saveToStorage() {
        const data = {
            lanes: this.state.lanes,
            passages: Array.from(this.state.passages.entries()),
            activeLaneId: this.state.activeLaneId,
            nextPassageId: this.state.nextPassageId,
            nextLaneId: this.state.nextLaneId,
            darkMode: this.state.darkMode
        };
        localStorage.setItem('branched-data', JSON.stringify(data));
    },

    loadFromStorage() {
        const stored = localStorage.getItem('branched-data');
        if (!stored) return;

        try {
            const data = JSON.parse(stored);

            // Validate and fix lane data
            if (data.lanes && Array.isArray(data.lanes)) {
                this.state.lanes = data.lanes;
            }

            // Validate and fix passage data
            if (data.passages && Array.isArray(data.passages)) {
                this.state.passages = new Map(data.passages);
            }

            this.state.activeLaneId = data.activeLaneId || null;
            this.state.nextPassageId = data.nextPassageId || 1;
            this.state.nextLaneId = data.nextLaneId || 1;
            this.state.darkMode = data.darkMode || false;
            this.state.stickyNotesVisible = data.stickyNotesVisible !== undefined ? data.stickyNotesVisible : true;

            // Apply theme
            if (this.state.darkMode) {
                document.body.classList.add('night-mode');
                document.body.classList.add('dark-mode');
                const themeBtn = document.getElementById('theme-toggle');
                if (themeBtn) themeBtn.textContent = '☀️';
            }

            // Update sticky notes button
            const stickyBtn = document.getElementById('sticky-notes-toggle');
            if (stickyBtn) {
                stickyBtn.textContent = this.state.stickyNotesVisible ? '📝 Notes' : '📝̶ Notes';
                stickyBtn.style.opacity = this.state.stickyNotesVisible ? '1' : '0.5';
            }

            // Rebuild links but DON'T call updateAllLanePositions here to avoid recursion
            this.state.links = [];
            this.extractLinks();

            // Sort lanes to ensure proper order after loading
            this.sortLanes();
        } catch (e) {
            console.error('Failed to load data:', e);
            // Clear corrupt data
            localStorage.removeItem('branched-data');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());