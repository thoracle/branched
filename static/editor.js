const Editor = {
    app: null,
    currentPassage: null,

    init(app) {
        this.app = app;
        this.bindEvents();
    },

    bindEvents() {
        const closeBtn = document.getElementById('close-editor');
        const deleteBtn = document.getElementById('delete-passage');
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

        titleInput.addEventListener('input', (e) => {
            if (this.currentPassage) {
                this.app.updatePassage(this.currentPassage.id, {
                    title: e.target.value
                });
            }
        });

        tagsInput.addEventListener('input', (e) => {
            if (this.currentPassage) {
                this.app.updatePassage(this.currentPassage.id, {
                    tags: e.target.value
                });
            }
        });

        contentInput.addEventListener('input', (e) => {
            if (this.currentPassage) {
                this.app.updatePassage(this.currentPassage.id, {
                    content: e.target.value
                });
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentPassage) {
                this.close();
            }
        });
    },

    open(passage) {
        this.currentPassage = passage;

        const panel = document.getElementById('editor-panel');
        const titleInput = document.getElementById('passage-title');
        const tagsInput = document.getElementById('passage-tags');
        const contentInput = document.getElementById('passage-content');

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

        panel.classList.remove('hidden');
        titleInput.focus();
    },

    close() {
        const panel = document.getElementById('editor-panel');
        panel.classList.add('hidden');
        this.currentPassage = null;
        this.app.selectPassage(null);
        this.app.render();
    }
};