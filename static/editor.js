const Editor = {
    app: null,
    currentPassage: null,
    updating: false, // Flag to prevent recursive updates

    init(app) {
        this.app = app;
        this.bindEvents();
    },

    bindEvents() {
        const closeBtn = document.getElementById('close-editor');
        const deleteBtn = document.getElementById('delete-passage');
        const parentBtn = document.getElementById('goto-parent');
        const titleInput = document.getElementById('passage-title');
        const tagsInput = document.getElementById('passage-tags');
        const contentInput = document.getElementById('passage-content');

        closeBtn.addEventListener('click', () => this.close());

        deleteBtn.addEventListener('click', () => {
            if (this.currentPassage && confirm('Delete this passage?')) {
                this.app.deletePassage(this.currentPassage.id);
                this.close();
            }
        });

        parentBtn.addEventListener('click', () => {
            if (this.currentPassage) {
                this.app.goToParentPassage(this.currentPassage.id);
            }
        });

        titleInput.addEventListener('input', (e) => {
            if (this.currentPassage && !this.updating) {
                this.app.updatePassage(this.currentPassage.id, {
                    title: e.target.value
                });
            }
        });

        tagsInput.addEventListener('input', (e) => {
            if (this.currentPassage && !this.updating) {
                this.app.updatePassage(this.currentPassage.id, {
                    tags: e.target.value
                });
            }
        });

        contentInput.addEventListener('input', (e) => {
            if (this.currentPassage && !this.updating) {
                this.app.updatePassage(this.currentPassage.id, {
                    content: e.target.value
                });
            }
        });

        // Add click handler to detect clicks on links
        contentInput.addEventListener('click', (e) => {
            this.handleContentClick(e);
        });

        // Add mousemove handler to change cursor over links
        contentInput.addEventListener('mousemove', (e) => {
            this.handleContentMouseMove(e);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentPassage) {
                this.close();
            }
        });
    },

    open(passage) {
        this.currentPassage = passage;
        this.updating = true; // Prevent recursive updates during initialization

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

        // Check if passage has a parent and enable/disable parent button
        const hasParent = this.app.getParentPassage(passage.id);
        parentBtn.disabled = !hasParent;
        if (hasParent) {
            // Just show the parent's title, not content
            const parentTitle = hasParent.title || 'Untitled';
            parentBtn.textContent = `Parent: ${parentTitle}`;
        } else {
            parentBtn.textContent = 'No Parent';
        }

        panel.classList.remove('hidden');
        titleInput.focus();

        // Re-enable updates after initialization
        this.updating = false;
    },

    close() {
        const panel = document.getElementById('editor-panel');
        panel.classList.add('hidden');
        this.currentPassage = null;
        this.app.selectPassage(null);
        this.app.render();
    },

    handleContentClick(e) {
        const textarea = e.target;
        const clickPos = textarea.selectionStart;
        const content = textarea.value;

        // Find if we clicked on a link
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            const linkStart = match.index;
            const linkEnd = match.index + match[0].length;

            // Check if click was within this link
            if (clickPos >= linkStart && clickPos <= linkEnd) {
                const linkText = match[1];
                let targetPassage = linkText;

                // Handle pipe notation [[display|target]]
                if (linkText.includes('|')) {
                    const parts = linkText.split('|');
                    targetPassage = parts[1].trim();
                }

                // Navigate to the target passage
                this.navigateToPassage(targetPassage);
                break;
            }
        }
    },

    handleContentMouseMove(e) {
        const textarea = e.target;

        // Simple approach: just set cursor to pointer for entire textarea if it contains links
        // More precise detection in textareas is very complex
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        const hasLinks = linkRegex.test(textarea.value);

        if (!hasLinks) {
            textarea.style.cursor = 'text';
            return;
        }

        // Get approximate position based on mouse coordinates
        const rect = textarea.getBoundingClientRect();
        const x = e.clientX - rect.left - parseInt(window.getComputedStyle(textarea).paddingLeft);
        const y = e.clientY - rect.top - parseInt(window.getComputedStyle(textarea).paddingTop);

        // Get font metrics
        const style = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.43;
        const charWidth = parseFloat(style.fontSize) * 0.55; // Approximate for monospace

        // Calculate approximate character position
        const col = Math.round(x / charWidth);
        const row = Math.floor((y + textarea.scrollTop) / lineHeight);

        // Find position in text
        const lines = textarea.value.split('\n');
        let textPos = 0;

        for (let i = 0; i < row && i < lines.length; i++) {
            textPos += lines[i].length + 1; // +1 for newline
        }

        if (row < lines.length) {
            textPos += Math.min(col, lines[row].length);
        }

        // Check if this position is within a link
        let overLink = false;
        linkRegex.lastIndex = 0; // Reset regex

        let match;
        while ((match = linkRegex.exec(textarea.value)) !== null) {
            if (textPos >= match.index && textPos <= match.index + match[0].length) {
                overLink = true;
                break;
            }
        }

        textarea.style.cursor = overLink ? 'pointer' : 'text';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
            // Close current editor
            this.close();

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
                this.app.centerOnPassage(targetPassage);
            }, 10);
            this.open(targetPassage);
        } else {
            // Passage doesn't exist yet - offer to create it
            if (confirm(`Passage "${targetTitle}" doesn't exist yet. Create it now?`)) {
                // Store current lane before closing
                const currentPassageLaneId = this.currentPassage.laneId;

                // Close current editor
                this.close();

                // Create the new passage in the same lane
                const newPassage = {
                    id: `passage_${this.app.state.nextPassageId++}`,
                    title: targetTitle,
                    tags: '',
                    content: '',
                    laneId: currentPassageLaneId,
                    x: 0,
                    y: 0
                };

                this.app.state.passages.set(newPassage.id, newPassage);

                // Add to lane
                const lane = this.app.state.lanes.find(l => l.id === currentPassageLaneId);
                if (lane) {
                    lane.passages.push(newPassage.id);
                }

                // Update positions and open the new passage
                this.app.updateAllLanePositions();
                this.app.render();
                this.app.saveToStorage();

                this.app.selectPassage(newPassage);
                this.app.centerOnPassage(newPassage);
                this.open(newPassage);
            }
        }
    }
};