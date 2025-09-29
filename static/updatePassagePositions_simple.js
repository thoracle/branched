// Simple positioning algorithm for passages
// Rules:
// 1. Place parents at their depth column
// 2. First child goes to the right at parent's Y level
// 3. Additional children stack vertically below the first child

function updatePassagePositionsSimple(lane, state, CONSTANTS) {
    // Calculate lane's Y position
    let laneY = 0;
    for (let i = 0; i < state.lanes.length; i++) {
        if (state.lanes[i].id === lane.id) break;
        laneY += calculateLaneHeight(state.lanes[i], state, CONSTANTS);
    }

    const baseY = laneY + CONSTANTS.HEADER_HEIGHT;

    // Reset all positions
    lane.passages.forEach(passageId => {
        const passage = state.passages.get(passageId);
        if (passage) {
            passage.x = 0;
            passage.relativeY = 0;
            passage.y = 0;
        }
    });

    // Build parent-child relationships
    const childrenMap = new Map();
    const parentsMap = new Map();

    state.links.forEach(link => {
        const from = state.passages.get(link.from);
        const to = state.passages.get(link.to);

        if (from?.laneId === lane.id && to?.laneId === lane.id) {
            if (!childrenMap.has(link.from)) childrenMap.set(link.from, []);
            childrenMap.get(link.from).push(link.to);

            if (!parentsMap.has(link.to)) parentsMap.set(link.to, []);
            parentsMap.get(link.to).push(link.from);
        }
    });

    // Calculate depth
    const depths = new Map();
    const getDepth = (id, visited = new Set()) => {
        if (depths.has(id)) return depths.get(id);
        if (visited.has(id)) return 0;
        visited.add(id);

        const parents = parentsMap.get(id) || [];
        if (parents.length === 0) {
            depths.set(id, 0);
            return 0;
        }

        const depth = Math.max(...parents.map(p => getDepth(p, new Set(visited)))) + 1;
        depths.set(id, depth);
        return depth;
    };

    lane.passages.forEach(id => getDepth(id));

    // Group by depth
    const byDepth = {};
    depths.forEach((d, id) => {
        if (!byDepth[d]) byDepth[d] = [];
        byDepth[d].push(id);
    });

    // Position passages
    const positioned = new Set();
    let nextY = CONSTANTS.PASSAGE_PADDING;

    Object.keys(byDepth).sort((a, b) => a - b).forEach(depth => {
        const x = CONSTANTS.PASSAGE_PADDING + depth * (CONSTANTS.PASSAGE_WIDTH + CONSTANTS.PASSAGE_SPACING * 2);

        byDepth[depth].forEach(passageId => {
            if (positioned.has(passageId)) return;

            const passage = state.passages.get(passageId);
            if (!passage) return;

            const parents = parentsMap.get(passageId) || [];
            const children = childrenMap.get(passageId) || [];

            if (parents.length > 0) {
                // Has parent - try to align with first parent
                const parent = state.passages.get(parents[0]);
                if (parent && positioned.has(parents[0])) {
                    // Check if we're the first child
                    const siblings = childrenMap.get(parents[0]) || [];
                    const isFirstChild = siblings.indexOf(passageId) === 0;

                    if (isFirstChild) {
                        // First child - same Y as parent
                        passage.relativeY = parent.relativeY;
                    } else {
                        // Additional child - stack below previous sibling
                        const prevSibling = state.passages.get(siblings[siblings.indexOf(passageId) - 1]);
                        if (prevSibling && positioned.has(siblings[siblings.indexOf(passageId) - 1])) {
                            passage.relativeY = prevSibling.relativeY + CONSTANTS.PASSAGE_HEIGHT + CONSTANTS.VERTICAL_SPACING;
                        } else {
                            passage.relativeY = nextY;
                            nextY += CONSTANTS.PASSAGE_HEIGHT + CONSTANTS.VERTICAL_SPACING;
                        }
                    }
                } else {
                    // Parent not positioned yet or doesn't exist
                    passage.relativeY = nextY;
                    nextY += CONSTANTS.PASSAGE_HEIGHT + CONSTANTS.VERTICAL_SPACING;
                }
            } else {
                // No parent - root passage
                passage.relativeY = nextY;
                nextY += CONSTANTS.PASSAGE_HEIGHT + CONSTANTS.VERTICAL_SPACING;
            }

            passage.x = x;
            passage.y = baseY + passage.relativeY;
            positioned.add(passageId);
        });
    });
}

function calculateLaneHeight(lane, state, CONSTANTS) {
    if (lane.collapsed) {
        return CONSTANTS.COLLAPSED_LANE_HEIGHT;
    }

    let maxY = 0;
    lane.passages.forEach(passageId => {
        const passage = state.passages.get(passageId);
        if (passage) {
            maxY = Math.max(maxY, passage.relativeY || 0);
        }
    });

    return Math.max(
        CONSTANTS.HEADER_HEIGHT + CONSTANTS.PASSAGE_HEIGHT * 2,
        CONSTANTS.HEADER_HEIGHT + maxY + CONSTANTS.PASSAGE_HEIGHT + CONSTANTS.PASSAGE_PADDING * 2
    );
}