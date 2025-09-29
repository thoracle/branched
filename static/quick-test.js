// Quick automated test script
// Run in browser console at http://localhost:8000/static/

console.log('🧪 Starting Quick E2E Tests...');

function assert(condition, message) {
    if (condition) {
        console.log('✅', message);
        return true;
    } else {
        console.error('❌', message);
        return false;
    }
}

// Test 1: App initialization
console.group('1. App Initialization');
assert(typeof App !== 'undefined', 'App object exists');
assert(App.state !== undefined, 'App state exists');
assert(App.canvas !== undefined, 'Canvas exists');
assert(App.state.lanes.length >= 2, 'Default lanes created');
console.groupEnd();

// Test 2: Twee parsing
console.group('2. Twee Parsing');
App.state.passages.clear();
const testTwee = `:: Start
Start content here.
[[Link to Next|Next]]

:: Next [tag1 tag2]
Next passage content.

:: Orphan
No links here.`;

App.parseTwee(testTwee);
const passages = Array.from(App.state.passages.values());
assert(passages.length === 3, 'Three passages created');
assert(passages[0].title === 'Start', 'First passage title correct');
assert(!passages[0].title.includes('content'), 'Title does not include content');
assert(passages[1].tags.includes('tag1'), 'Tags parsed correctly');
console.groupEnd();

// Test 3: Link extraction
console.group('3. Link Extraction');
const links = App.extractLinks();
assert(links.length > 0, 'Links extracted');
const startPassage = passages.find(p => p.title === 'Start');
const hasLink = links.some(l => l.from === startPassage.id);
assert(hasLink, 'Link from Start passage found');
console.groupEnd();

// Test 4: Orphan detection
console.group('4. Orphan Detection');
const orphan = passages.find(p => p.title === 'Orphan');
const orphanHasIncoming = links.some(l => l.to === orphan.id);
const orphanHasOutgoing = links.some(l => l.from === orphan.id);
assert(!orphanHasIncoming && !orphanHasOutgoing, 'Orphan correctly identified');
console.groupEnd();

// Test 5: Parent detection
console.group('5. Parent Navigation');
const nextPassage = passages.find(p => p.title === 'Next');
const parent = App.getParentPassage(nextPassage.id);
assert(parent !== null, 'Parent found for linked passage');
assert(parent.title === 'Start', 'Correct parent identified');
console.groupEnd();

// Test 6: Search functionality
console.group('6. Search Feature');
assert(typeof Search !== 'undefined', 'Search module loaded');
Search.init(App);
Search.performSearch('Start');
assert(Search.currentResults.length > 0, 'Search finds results');
Search.performSearch('');
assert(Search.currentResults.length === passages.length, 'Empty search shows all');
console.groupEnd();

// Test 7: Theme toggle
console.group('7. Theme Toggle');
const initialTheme = document.body.classList.contains('night-mode');
App.toggleTheme();
const newTheme = document.body.classList.contains('night-mode');
assert(initialTheme !== newTheme, 'Theme toggled successfully');
App.toggleTheme(); // Toggle back
console.groupEnd();

// Test 8: Lane management
console.group('8. Lane Management');
const initialLaneCount = App.state.lanes.length;
App.addLane();
assert(App.state.lanes.length === initialLaneCount + 1, 'Lane added successfully');
console.groupEnd();

// Test 9: Passage updates
console.group('9. Passage Updates');
const testPassage = passages[0];
App.updatePassage(testPassage.id, { title: 'Updated Title' });
const updated = App.state.passages.get(testPassage.id);
assert(updated.title === 'Updated Title', 'Passage updated successfully');
console.groupEnd();

// Test 10: Storage
console.group('10. Local Storage');
App.saveToStorage();
const saved = localStorage.getItem('branchEdState');
assert(saved !== null, 'State saved to localStorage');
const parsed = JSON.parse(saved);
assert(parsed.passages !== undefined, 'Passages saved');
assert(parsed.lanes !== undefined, 'Lanes saved');
console.groupEnd();

console.log('🎉 Quick E2E Tests Complete!');
console.log('For full testing, open test-e2e.html or follow manual-test.md');