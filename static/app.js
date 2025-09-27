const App = {
    state: {
        lanes: [
            { id: 'metadata', name: 'Metadata', isMetadata: true, passages: [], collapsed: false }
        ],
        passages: new Map(),
        links: [],
        selectedPassage: null,
        activeLaneId: null,
        nextPassageId: 1,
        nextLaneId: 1,
        darkMode: false
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
        PASSAGE_SPACING: 20,
        PASSAGE_PADDING: 10,
        VERTICAL_SPACING: 15,
        CHOICE_INDENT: 180,
        TOGGLE_SIZE: 16
    },

    init() {
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.bindEvents();
        this.loadFromStorage();
        this.resizeCanvas();
        this.render();
    },

    resizeCanvas() {
        const container = document.getElementById('canvas-container');
        this.canvas.width = container.clientWidth;

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
        document.getElementById('import-btn').addEventListener('click', () => this.importTwee());
        document.getElementById('export-btn').addEventListener('click', () => this.exportTwee());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleCanvasDoubleClick(e));
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
        });

        // Add keyboard event listeners
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        Editor.init(this);
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
            const clickedLane = this.getLaneAtPosition(x, y);
            if (clickedLane) {
                this.selectLane(clickedLane);
            }
            this.selectPassage(null);
            Editor.close();
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

    handleCanvasDoubleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

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
        this.updateAllLanePositions();
        this.render();
        this.saveToStorage();
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

        // Position by depth columns
        let currentX = this.CONSTANTS.PASSAGE_PADDING;
        const sortedDepths = Object.keys(depthGroups).sort((a, b) => a - b);

        sortedDepths.forEach(depth => {
            const passagesAtDepth = depthGroups[depth];

            // Group passages by their parent for vertical stacking
            const parentGroups = {};
            passagesAtDepth.forEach(passageId => {
                // Find parents in this lane first
                let parents = this.findParentsInLane(passageId, lane);

                // If no parents in this lane, check for cross-lane parents
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
                // Sort by parent's Y position for non-root passages
                const parentA = this.state.passages.get(a);
                const parentB = this.state.passages.get(b);
                return (parentA?.relativeY || 0) - (parentB?.relativeY || 0);
            });

            let nextAvailableY = -Infinity;

            parentKeys.forEach(parentKey => {
                const passages = parentGroups[parentKey];

                if (passages.length === 1 && parentKey !== 'root') {
                    // Single child - try to align with parent Y but avoid overlaps
                    const parent = this.state.passages.get(parentKey);
                    const passage = this.state.passages.get(passages[0]);
                    if (parent && passage && !positioned.has(passages[0])) {
                        const desiredY = parent.relativeY || 0;
                        const actualY = Math.max(desiredY, nextAvailableY);

                        // For cross-lane links, match parent's X position
                        if (parent.laneId !== lane.id) {
                            passage.x = parent.x;
                        } else {
                            passage.x = currentX;
                        }
                        passage.relativeY = actualY;
                        positioned.add(passages[0]);

                        nextAvailableY = actualY + this.CONSTANTS.PASSAGE_HEIGHT + this.CONSTANTS.VERTICAL_SPACING;
                    }
                } else if (passages.length > 1 && parentKey !== 'root') {
                    // Multiple children - stack vertically centered on parent but avoid overlaps
                    const parent = this.state.passages.get(parentKey);
                    if (parent) {
                        const totalHeight = passages.length * this.CONSTANTS.PASSAGE_HEIGHT +
                                          (passages.length - 1) * this.CONSTANTS.VERTICAL_SPACING;
                        const desiredStartY = (parent.relativeY || 0) - totalHeight / 2 + this.CONSTANTS.PASSAGE_HEIGHT / 2;
                        const actualStartY = Math.max(desiredStartY, nextAvailableY);
                        let currentY = actualStartY;

                        // Determine X position based on parent lane
                        const xPosition = parent.laneId !== lane.id ? parent.x : currentX;

                        passages.forEach(passageId => {
                            const passage = this.state.passages.get(passageId);
                            if (passage && !positioned.has(passageId)) {
                                passage.x = xPosition;
                                passage.relativeY = currentY;
                                positioned.add(passageId);
                                currentY += this.CONSTANTS.PASSAGE_HEIGHT + this.CONSTANTS.VERTICAL_SPACING;
                            }
                        });

                        nextAvailableY = currentY;
                    }
                } else {
                    // Root passages or orphans - stack from top but avoid overlaps
                    let currentY = Math.max(0, nextAvailableY);
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
                }
            });

            // Move to next column
            currentX += this.CONSTANTS.PASSAGE_WIDTH + this.CONSTANTS.PASSAGE_SPACING;
            if (depth < sortedDepths[sortedDepths.length - 1]) {
                currentX += this.CONSTANTS.PASSAGE_SPACING;
            }
        });

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
    },

    calculatePassageDepths(lane, graph) {
        const depths = new Map();
        const visited = new Set();

        // Find roots
        const roots = lane.passages.filter(passageId => {
            const incomingFromLane = this.state.links.filter(link => {
                const fromPassage = this.state.passages.get(link.from);
                return link.to === passageId && fromPassage && fromPassage.laneId === lane.id;
            });
            return incomingFromLane.length === 0;
        });

        // BFS to calculate depths
        const queue = roots.map(id => ({ id, depth: 0 }));

        while (queue.length > 0) {
            const { id, depth } = queue.shift();

            if (visited.has(id)) continue;
            visited.add(id);

            depths.set(id, depth);

            const children = graph[id] || [];
            children.forEach(childId => {
                if (!visited.has(childId)) {
                    queue.push({ id: childId, depth: depth + 1 });
                }
            });
        }

        // Handle unvisited passages (cycles or disconnected)
        lane.passages.forEach(passageId => {
            if (!depths.has(passageId)) {
                depths.set(passageId, 0);
            }
        });

        return depths;
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
            if (fromPassage && toPassage &&
                fromPassage.laneId === lane.id &&
                toPassage.laneId === lane.id) {
                if (!graph[link.from]) graph[link.from] = [];
                graph[link.from].push(link.to);
            }
        });

        return graph;
    },

    // Removed old positionPassageTree method as it's replaced by the new depth-based algorithm

    selectPassage(passage) {
        this.state.selectedPassage = passage;
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
            this.extractLinks();
            this.autoCreateLinkedPassages(passage);
            this.updateAllLanePositions();
            this.render();
            this.saveToStorage();
        }
    },

    extractLinks() {
        this.state.links = [];

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

        Swimlanes.renderLanes(this.ctx, this.state.lanes, this.CONSTANTS, this.state.activeLaneId, (lane) => this.calculateLaneHeight(lane), colors);
        Swimlanes.renderPassages(this.ctx, this.state.passages, this.state.selectedPassage, this.CONSTANTS, this.state.lanes, colors);
        Swimlanes.renderLinks(this.ctx, this.state.passages, this.state.links, this.CONSTANTS, this.state.lanes, colors);
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

    parseTwee(content) {
        this.state.passages.clear();
        this.state.lanes = [
            { id: 'metadata', name: 'Metadata', isMetadata: true, passages: [], collapsed: false }
        ];

        const passageRegex = /:: ([^\[]+)(?:\[([^\]]*)\])?\n([\s\S]*?)(?=\n:: |\n*$)/g;
        let match;

        while ((match = passageRegex.exec(content)) !== null) {
            const title = match[1].trim();
            const tagString = match[2] ? match[2].trim() : '';
            const passageContent = match[3].trim();

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

            // Determine if it's metadata
            const isMetadata = title === 'Start' || title === 'StoryTitle' || title === 'StoryAuthor' ||
                              passageTags.includes('info') || passageTags.includes('$start');

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
        }

        this.extractLinks();

        // Auto-create linked passages for imported content
        for (const passage of this.state.passages.values()) {
            this.autoCreateLinkedPassages(passage);
        }

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
            this.state.lanes = data.lanes || this.state.lanes;
            this.state.passages = new Map(data.passages || []);
            this.state.activeLaneId = data.activeLaneId || null;
            this.state.nextPassageId = data.nextPassageId || 1;
            this.state.nextLaneId = data.nextLaneId || 1;
            this.state.darkMode = data.darkMode || false;

            // Apply theme
            if (this.state.darkMode) {
                document.body.classList.add('dark-mode');
                document.getElementById('theme-toggle').textContent = '☀️';
            }

            // Rebuild links and recalculate all positions
            this.extractLinks();
            this.updateAllLanePositions();
        } catch (e) {
            console.error('Failed to load data:', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());