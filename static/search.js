const Search = {
    app: null,
    overlay: null,
    input: null,
    resultsContainer: null,
    currentResults: [],
    selectedIndex: -1,

    init(app) {
        this.app = app;
        this.overlay = document.getElementById('search-overlay');
        this.input = document.getElementById('search-input');
        this.resultsContainer = document.getElementById('search-results');
        this.bindEvents();
    },

    bindEvents() {
        // Search button
        document.getElementById('search-btn').addEventListener('click', () => this.open());

        // Close button
        document.getElementById('close-search').addEventListener('click', () => this.close());

        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Open search with Cmd+K or Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.open();
            }

            // Close with Escape
            if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
                this.close();
            }

            // Navigate results
            if (!this.overlay.classList.contains('hidden')) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.selectNext();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.selectPrev();
                } else if (e.key === 'Enter' && this.selectedIndex >= 0) {
                    e.preventDefault();
                    this.openResult(this.currentResults[this.selectedIndex]);
                }
            }
        });

        // Search input
        this.input.addEventListener('input', () => {
            this.performSearch(this.input.value);
        });
    },

    open() {
        this.overlay.classList.remove('hidden');
        this.input.value = '';
        this.input.focus();
        this.performSearch('');
    },

    close() {
        this.overlay.classList.add('hidden');
        this.currentResults = [];
        this.selectedIndex = -1;
    },

    performSearch(query) {
        const results = [];
        const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(t => t);

        if (searchTerms.length === 0) {
            // Show all passages when no search term
            for (const passage of this.app.state.passages.values()) {
                results.push({
                    passage,
                    score: 0,
                    matches: []
                });
            }
        } else {
            // Search through all passages
            for (const passage of this.app.state.passages.values()) {
                let score = 0;
                const matches = [];

                // Search in title (highest weight)
                searchTerms.forEach(term => {
                    if (passage.title && passage.title.toLowerCase().includes(term)) {
                        score += 10;
                        matches.push({ type: 'title', term });
                    }
                });

                // Search in tags (high weight)
                if (passage.tags) {
                    const tags = passage.tags.toLowerCase();
                    searchTerms.forEach(term => {
                        if (tags.includes(term)) {
                            score += 7;
                            matches.push({ type: 'tag', term });
                        }
                    });
                }

                // Search in lane name (medium weight)
                const lane = this.app.state.lanes.find(l => l.id === passage.laneId);
                if (lane) {
                    searchTerms.forEach(term => {
                        if (lane.name.toLowerCase().includes(term)) {
                            score += 5;
                            matches.push({ type: 'lane', term });
                        }
                    });
                }

                // Search in content (lower weight)
                if (passage.content) {
                    const content = passage.content.toLowerCase();
                    searchTerms.forEach(term => {
                        if (content.includes(term)) {
                            score += 3;
                            // Count occurrences
                            const regex = new RegExp(term, 'gi');
                            const matchCount = (content.match(regex) || []).length;
                            score += matchCount;
                            matches.push({ type: 'content', term, count: matchCount });
                        }
                    });
                }

                if (score > 0) {
                    results.push({
                        passage,
                        score,
                        matches
                    });
                }
            }
        }

        // Sort by score (highest first)
        results.sort((a, b) => b.score - a.score);

        this.currentResults = results;
        this.selectedIndex = -1;
        this.renderResults(results, searchTerms);
    },

    renderResults(results, searchTerms = []) {
        if (results.length === 0 && searchTerms.length > 0) {
            this.resultsContainer.innerHTML = '<div class="no-results">No passages found</div>';
            return;
        }

        this.resultsContainer.innerHTML = '';

        results.slice(0, 50).forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.dataset.index = index;

            const passage = result.passage;
            const lane = this.app.state.lanes.find(l => l.id === passage.laneId);

            // Title
            const title = document.createElement('div');
            title.className = 'search-result-title';
            title.innerHTML = this.highlightText(passage.title || 'Untitled', searchTerms);
            item.appendChild(title);

            // Meta info (lane and tags)
            const meta = document.createElement('div');
            meta.className = 'search-result-meta';

            if (lane) {
                const laneSpan = document.createElement('span');
                laneSpan.className = 'search-result-lane';
                laneSpan.textContent = lane.name;
                meta.appendChild(laneSpan);
            }

            if (passage.tags) {
                const tags = passage.tags.split(/\s+/).filter(t => t);
                tags.slice(0, 3).forEach(tag => {
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'search-result-tag';
                    tagSpan.textContent = tag;
                    meta.appendChild(tagSpan);
                });
            }

            if (meta.children.length > 0) {
                item.appendChild(meta);
            }

            // Content preview
            if (passage.content) {
                const preview = document.createElement('div');
                preview.className = 'search-result-preview';

                // Try to show relevant snippet
                let snippet = passage.content;
                if (searchTerms.length > 0) {
                    // Find first occurrence of any search term
                    for (const term of searchTerms) {
                        const index = passage.content.toLowerCase().indexOf(term);
                        if (index >= 0) {
                            const start = Math.max(0, index - 30);
                            const end = Math.min(passage.content.length, index + term.length + 50);
                            snippet = (start > 0 ? '...' : '') +
                                     passage.content.substring(start, end) +
                                     (end < passage.content.length ? '...' : '');
                            break;
                        }
                    }
                }

                preview.innerHTML = this.highlightText(snippet.substring(0, 150), searchTerms);
                item.appendChild(preview);
            }

            // Click to open
            item.addEventListener('click', () => {
                this.openResult(result);
            });

            // Hover to select
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection();
            });

            this.resultsContainer.appendChild(item);
        });
    },

    highlightText(text, terms) {
        if (!text || terms.length === 0) return text;

        let highlighted = text;
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlighted = highlighted.replace(regex, '<span class="search-highlight">$1</span>');
        });

        return highlighted;
    },

    selectNext() {
        if (this.currentResults.length === 0) return;

        this.selectedIndex = (this.selectedIndex + 1) % this.currentResults.length;
        this.updateSelection();
        this.scrollToSelected();
    },

    selectPrev() {
        if (this.currentResults.length === 0) return;

        this.selectedIndex = this.selectedIndex <= 0
            ? this.currentResults.length - 1
            : this.selectedIndex - 1;
        this.updateSelection();
        this.scrollToSelected();
    },

    updateSelection() {
        const items = this.resultsContainer.querySelectorAll('.search-result-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    scrollToSelected() {
        const items = this.resultsContainer.querySelectorAll('.search-result-item');
        if (items[this.selectedIndex]) {
            items[this.selectedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    },

    openResult(result) {
        const passage = result.passage;
        this.close();

        // Switch to the passage's lane if needed
        if (passage.laneId !== this.app.state.activeLaneId) {
            this.app.selectLane(passage.laneId);
        }

        // Select and edit the passage
        this.app.selectPassage(passage);
        this.app.updateAllLanePositions(); // Ensure positions are current
        this.app.render();
        // Use setTimeout to ensure render completes before centering
        setTimeout(() => {
            this.app.centerOnPassage(passage);
        }, 10);
        Editor.open(passage);
    }
};