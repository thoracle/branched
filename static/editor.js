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

        // Handle clicks on tag examples
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'CODE' && e.target.closest('.tag-help')) {
                const tag = e.target.textContent;
                const currentTags = tagsInput.value.trim();

                // For $lane: tag, prompt for lane name
                if (tag === '$lane:Name') {
                    const laneName = prompt('Enter lane name:');
                    if (laneName) {
                        const newTag = `$lane:${laneName}`;
                        tagsInput.value = currentTags ? `${currentTags} ${newTag}` : newTag;
                    }
                } else {
                    // Add tag if not already present
                    if (!currentTags.split(/\s+/).includes(tag)) {
                        tagsInput.value = currentTags ? `${currentTags} ${tag}` : tag;
                    }
                }

                // Trigger input event to save
                tagsInput.dispatchEvent(new Event('input'));
            }
        });

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
        tagsInput.value = passage.tags || '';
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