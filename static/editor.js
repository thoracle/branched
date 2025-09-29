const Editor = {
    currentPassage: null,
    updating: false,

    init(app) {
        this.app = app;

        const closeBtn = document.getElementById('close-editor');
        const deleteBtn = document.getElementById('delete-passage');
        const titleInput = document.getElementById('passage-title');
        const tagsInput = document.getElementById('passage-tags');
        const contentInput = document.getElementById('passage-content');
        const parentBtn = document.getElementById('goto-parent');

        closeBtn.addEventListener('click', () => this.close());
        deleteBtn.addEventListener('click', () => {
            if (this.currentPassage && confirm('Are you sure you want to delete this passage?')) {
                this.app.deletePassage(this.currentPassage.id);
                this.close();
            }
        });

        parentBtn.addEventListener('click', () => {
            if (this.currentPassage) {
                this.app.goToParentPassage(this.currentPassage.id);
            }
        });

        // Update passage data on input
        titleInput.addEventListener('input', () => this.updatePassage());
        tagsInput.addEventListener('input', () => this.updatePassage());
        contentInput.addEventListener('input', () => {
            this.updatePassage();
            // Update link buttons when content changes
            if (this.currentPassage) {
                this.updateLinkButtons(this.currentPassage);
            }
        });

        // Allow Tab key in content textarea
        contentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = contentInput.selectionStart;
                const end = contentInput.selectionEnd;
                const value = contentInput.value;

                // Insert tab character
                contentInput.value = value.substring(0, start) + '\t' + value.substring(end);

                // Move cursor after the tab
                contentInput.selectionStart = contentInput.selectionEnd = start + 1;

                // Trigger input event to save changes
                contentInput.dispatchEvent(new Event('input'));
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentPassage) {
                this.close();
            }
        });
    },

    open(passage) {
        if (!passage) return;

        // Set updating flag to prevent recursive updates
        this.updating = true;

        this.currentPassage = passage;
        const panel = document.getElementById('editor-panel');
        const titleInput = document.getElementById('passage-title');
        const tagsInput = document.getElementById('passage-tags');
        const contentInput = document.getElementById('passage-content');
        const parentBtn = document.getElementById('goto-parent');

        titleInput.value = passage.title || '';

        // Build complete tags string including system tags
        const tagArray = [];

        // Add existing passage tags
        if (passage.tags) {
            tagArray.push(...passage.tags.split(/\s+/).filter(t => t && !t.startsWith('$lane:')));
        }

        // Add lane tag if not in Metadata or Main lane
        const lane = this.app.state.lanes.find(l => l.id === passage.laneId);
        if (lane && !lane.isMetadata && lane.name !== 'Main') {
            tagArray.push(`$lane:${lane.name}`);
        }

        tagsInput.value = tagArray.join(' ');
        contentInput.value = passage.content || '';

        // Hide the old parent button since we'll add it to link buttons
        parentBtn.style.display = 'none';

        // Create link buttons for all links in the passage (including parent)
        this.updateLinkButtons(passage);

        panel.classList.remove('hidden');
        titleInput.focus();

        // Re-enable updates after initialization
        this.updating = false;
    },

    updateLinkButtons(passage) {
        const linkButtonsContainer = document.getElementById('link-buttons-container');
        linkButtonsContainer.innerHTML = ''; // Clear existing buttons

        // First, add parent button if exists
        const hasParent = this.app.getParentPassage(passage.id);
        if (hasParent) {
            const parentBtn = document.createElement('button');
            parentBtn.className = 'link-button parent-button';
            const parentTitle = hasParent.title || 'Untitled';
            parentBtn.textContent = `PARENT: ${parentTitle}`;
            parentBtn.style.backgroundColor = '#90EE90'; // Light green
            parentBtn.style.borderColor = '#228B22'; // Forest green
            parentBtn.style.color = '#333';
            parentBtn.addEventListener('click', () => {
                this.app.goToParentPassage(passage.id);
            });
            linkButtonsContainer.appendChild(parentBtn);
        }

        // Extract links from content
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        let match;
        const links = [];

        while ((match = linkRegex.exec(passage.content)) !== null) {
            const linkText = match[1];
            let displayText = linkText;
            let targetTitle = linkText;

            // Handle [[display|target]] format
            if (linkText.includes('|')) {
                const parts = linkText.split('|');
                displayText = parts[0].trim();
                targetTitle = parts[1].trim();
            }

            // Avoid duplicates
            if (!links.some(l => l.target === targetTitle)) {
                links.push({ display: displayText, target: targetTitle });
            }
        }

        // Create a button for each link
        links.forEach(link => {
            const linkBtn = document.createElement('button');
            linkBtn.className = 'link-button';

            // Check if this is a LOOP or JUMP link
            const currentPassageId = passage.id;
            const targetPassage = Array.from(this.app.state.passages.values()).find(p => p.title === link.target);

            if (targetPassage) {
                // Check if it's a LOOP link (backward link)
                const isLoop = this.app.state.loopPassages &&
                    Array.from(this.app.state.loopPassages.values()).some(loop =>
                        loop.fromId === currentPassageId && loop.toId === targetPassage.id
                    );

                // Check if it's a JUMP link (cross-lane link)
                const isJump = this.app.state.jumpPassages &&
                    Array.from(this.app.state.jumpPassages.values()).some(jump =>
                        jump.fromId === currentPassageId && jump.toId === targetPassage.id
                    );

                if (isLoop) {
                    linkBtn.textContent = `LOOP: ${link.display}`;
                    linkBtn.classList.add('loop-button');
                    linkBtn.style.backgroundColor = '#FFFACD'; // Pale yellow like sticky note
                    linkBtn.style.borderColor = '#FFD700';
                    linkBtn.style.color = '#333';
                } else if (isJump) {
                    linkBtn.textContent = `JUMP: ${link.display}`;
                    linkBtn.classList.add('jump-button');
                    linkBtn.style.backgroundColor = '#FFD4A3'; // Peach/Light orange like JUMP sticky
                    linkBtn.style.borderColor = '#FF9500'; // Orange border
                    linkBtn.style.color = '#333';
                } else {
                    linkBtn.textContent = `LINK: ${link.display}`;
                }
            } else {
                linkBtn.textContent = `LINK: ${link.display}`;
            }

            linkBtn.addEventListener('click', () => {
                this.navigateToPassage(link.target);
            });
            linkButtonsContainer.appendChild(linkBtn);
        });
    },

    close() {
        const panel = document.getElementById('editor-panel');
        panel.classList.add('hidden');
        this.currentPassage = null;
        this.app.selectPassage(null);
        this.app.render();
    },

    navigateToPassage(targetTitle) {
        // Find the passage by title
        let targetPassage = null;
        for (const [id, passage] of this.app.state.passages) {
            if (passage.title === targetTitle) {
                targetPassage = passage;
                break;
            }
        }

        if (targetPassage) {
            // If target is in a different lane, switch to it
            if (targetPassage.laneId !== this.app.state.activeLaneId) {
                this.app.selectLane(targetPassage.laneId);
            }

            // Select and open target passage (same as Parent button behavior)
            this.app.selectPassage(targetPassage);
            this.app.updateAllLanePositions(); // Ensure positions are current
            this.app.render();
            // Use setTimeout to ensure render completes before centering
            setTimeout(() => {
                this.app.centerOnPassage(targetPassage.id);
            }, 0);
            this.open(targetPassage);
        } else {
            // Passage not found - silent fail
        }
    },

    updatePassage() {
        // Don't update if we're in the process of opening (prevents recursion)
        if (this.updating || !this.currentPassage) return;

        const titleInput = document.getElementById('passage-title');
        const tagsInput = document.getElementById('passage-tags');
        const contentInput = document.getElementById('passage-content');

        const newTitle = titleInput.value.trim();
        const tags = tagsInput.value.trim();
        const content = contentInput.value;

        // Parse tags - extract lane tag and regular tags
        const tagArray = tags.split(/\s+/).filter(t => t);
        let laneTag = null;
        const regularTags = [];

        tagArray.forEach(tag => {
            if (tag.startsWith('$lane:')) {
                laneTag = tag.substring(6);
            } else {
                regularTags.push(tag);
            }
        });

        const updates = {};

        // Check if title changed
        if (newTitle !== this.currentPassage.title) {
            updates.title = newTitle;
        }

        // Check if tags changed
        const newTags = regularTags.join(' ');
        if (newTags !== this.currentPassage.tags) {
            updates.tags = newTags;
        }

        // Check if content changed
        if (content !== this.currentPassage.content) {
            updates.content = content;

            // If content changed, we need to re-extract links to update LOOP passages
            // This will be handled after the passage update
        }

        // Check if lane changed
        if (laneTag) {
            let targetLane = this.app.state.lanes.find(l => l.name === laneTag && !l.isMetadata);

            if (!targetLane) {
                // Create new lane if it doesn't exist (unless trying to use metadata lane)
                targetLane = this.app.addLane(laneTag);
            }

            if (targetLane && targetLane.id !== this.currentPassage.laneId) {
                updates.laneId = targetLane.id;
            }
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
            this.app.updatePassage(this.currentPassage.id, updates);
        }
    }
};