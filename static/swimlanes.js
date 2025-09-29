const Swimlanes = {
    renderLanes(ctx, lanes, constants, activeLaneId, getLaneHeight, colors, getLaneImage) {
        let currentY = 0;

        lanes.forEach((lane, index) => {
            const laneHeight = getLaneHeight ? getLaneHeight(lane) : constants.LANE_HEIGHT;
            const isActive = lane.id === activeLaneId;
            const isCollapsed = lane.collapsed || false;

            // Draw lane background
            if (lane.isOrphanage) {
                // Slightly red-tinted background for Orphanage lane
                ctx.fillStyle = isCollapsed ? '#ffe8e8' : '#fff0f0';
                if (colors.laneBackground === '#2a2a2a') { // dark mode
                    ctx.fillStyle = isCollapsed ? '#3a2020' : '#402020';
                }
            } else if (lane.isMetadata) {
                // Slightly blue-tinted background for Metadata lane
                ctx.fillStyle = isCollapsed ? '#e8f0ff' : '#f0f5ff';
                if (colors.laneBackground === '#2a2a2a') { // dark mode
                    ctx.fillStyle = isCollapsed ? '#202a3a' : '#202840';
                }
            } else if (isActive) {
                ctx.fillStyle = colors.laneBackgroundActive;
            } else if (isCollapsed) {
                ctx.fillStyle = colors.laneBackgroundCollapsed;
            } else {
                ctx.fillStyle = colors.laneBackground;
            }
            ctx.fillRect(0, currentY, ctx.canvas.width, laneHeight);

            // Draw lane border
            ctx.strokeStyle = isActive ? colors.borderColorActive : colors.borderColor;
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(0, currentY + laneHeight);
            ctx.lineTo(ctx.canvas.width, currentY + laneHeight);
            ctx.stroke();

            // Draw header background
            if (lane.isOrphanage) {
                // Red background for Orphanage lane (like the Delete button)
                ctx.fillStyle = '#dc3545';
            } else if (lane.isMetadata) {
                // Royal blue background for Metadata lane
                ctx.fillStyle = '#4169E1';
            } else if (isActive) {
                ctx.fillStyle = colors.headerBackgroundActive;
            } else {
                ctx.fillStyle = colors.headerBackground;
            }
            ctx.fillRect(0, currentY, ctx.canvas.width, constants.HEADER_HEIGHT);

            // Draw collapse/expand toggle
            ctx.strokeStyle = colors.headerText;
            ctx.lineWidth = 2;
            ctx.beginPath();

            const toggleX = 10;
            const toggleY = currentY + constants.HEADER_HEIGHT / 2;
            const toggleSize = constants.TOGGLE_SIZE || 12;

            // Draw triangle pointing right if collapsed, down if expanded
            if (isCollapsed) {
                // Right-pointing triangle
                ctx.moveTo(toggleX, toggleY - toggleSize / 2);
                ctx.lineTo(toggleX + toggleSize * 0.75, toggleY);
                ctx.lineTo(toggleX, toggleY + toggleSize / 2);
            } else {
                // Down-pointing triangle
                ctx.moveTo(toggleX - toggleSize / 2, toggleY - toggleSize / 3);
                ctx.lineTo(toggleX + toggleSize / 2, toggleY - toggleSize / 3);
                ctx.lineTo(toggleX, toggleY + toggleSize / 3);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = colors.headerText;
            ctx.fill();

            // Draw NPC image if available
            let textStartX = 35;
            if (getLaneImage && !lane.isMetadata && lane.name !== 'Main') {
                const imageUrl = getLaneImage(lane);
                if (imageUrl) {
                    const img = new Image();
                    img.onload = () => {
                        // Draw image when it loads (async)
                        const imageSize = constants.HEADER_HEIGHT - 4;
                        const imageX = textStartX;
                        const imageY = currentY + 2;

                        ctx.save();
                        // Create circular clip
                        ctx.beginPath();
                        ctx.arc(imageX + imageSize/2, imageY + imageSize/2, imageSize/2, 0, 2 * Math.PI);
                        ctx.clip();

                        // Draw image
                        ctx.drawImage(img, imageX, imageY, imageSize, imageSize);
                        ctx.restore();

                        // Draw border around image
                        ctx.strokeStyle = colors.headerText;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(imageX + imageSize/2, imageY + imageSize/2, imageSize/2, 0, 2 * Math.PI);
                        ctx.stroke();
                    };
                    img.onerror = () => {
                        // Image failed to load, draw placeholder
                        const imageSize = constants.HEADER_HEIGHT - 4;
                        const imageX = textStartX;
                        const imageY = currentY + 2;

                        ctx.strokeStyle = colors.headerText;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.arc(imageX + imageSize/2, imageY + imageSize/2, imageSize/2, 0, 2 * Math.PI);
                        ctx.stroke();

                        // Draw "?" in center
                        ctx.fillStyle = colors.headerText;
                        ctx.font = '12px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('?', imageX + imageSize/2, imageY + imageSize/2);
                    };
                    img.src = imageUrl;
                    textStartX += constants.HEADER_HEIGHT + 5; // Make room for image
                }
            }

            // Draw lane name (offset to make room for toggle and image)
            ctx.fillStyle = colors.headerText;
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(lane.name, textStartX, currentY + constants.HEADER_HEIGHT / 2);

            // Show passage count if collapsed
            if (isCollapsed && lane.passages && lane.passages.length > 0) {
                ctx.fillStyle = colors.headerText;
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'right';
                const passageText = `${lane.passages.length} passage${lane.passages.length > 1 ? 's' : ''}`;
                ctx.fillText(passageText, ctx.canvas.width - 20, currentY + constants.HEADER_HEIGHT / 2);
            }

            currentY += laneHeight;
        });
    },

    renderPassages(ctx, passages, selectedPassage, constants, lanes, colors, links, loopPassages, jumpPassages) {
        // Pre-calculate orphan passages (no incoming or outgoing links)
        const orphanPassages = new Set();
        for (const passage of passages.values()) {
            const hasIncoming = links && links.some(l => l.to === passage.id);
            const hasOutgoing = links && links.some(l => l.from === passage.id);
            if (!hasIncoming && !hasOutgoing) {
                orphanPassages.add(passage.id);
            }
        }

        for (const passage of passages.values()) {
            // Check if the passage's lane is collapsed
            const lane = lanes ? lanes.find(l => l.id === passage.laneId) : null;
            if (lane && lane.collapsed) continue;

            const isSelected = selectedPassage && selectedPassage.id === passage.id;
            const isOrphan = orphanPassages.has(passage.id);

            ctx.fillStyle = colors.passageBackground;
            ctx.fillRect(passage.x, passage.y, constants.PASSAGE_WIDTH, constants.PASSAGE_HEIGHT);

            // Different border style for orphan passages
            if (isOrphan) {
                ctx.strokeStyle = colors.passageOrphanBorder || '#ff0000';  // Red border for orphans
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 3]);  // Dashed line
            } else if (isSelected) {
                ctx.strokeStyle = colors.passageBorderSelected;
                ctx.lineWidth = 2;
                ctx.setLineDash([]);
            } else {
                ctx.strokeStyle = colors.passageBorder;
                ctx.lineWidth = 1;
                ctx.setLineDash([]);
            }
            ctx.strokeRect(passage.x, passage.y, constants.PASSAGE_WIDTH, constants.PASSAGE_HEIGHT);
            ctx.setLineDash([]);  // Reset dash pattern

            // Set up clipping region to prevent text overflow
            ctx.save();
            ctx.beginPath();
            ctx.rect(passage.x + 5, passage.y + 5, constants.PASSAGE_WIDTH - 10, constants.PASSAGE_HEIGHT - 10);
            ctx.clip();

            // Render title
            ctx.fillStyle = colors.passageTitle;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            const titleText = this.truncateText(ctx, passage.title, constants.PASSAGE_WIDTH - 20);
            ctx.fillText(titleText, passage.x + constants.PASSAGE_WIDTH / 2, passage.y + 10);

            // Render tags if present
            if (passage.tags) {
                const tags = passage.tags.split(/\s+/).filter(t => t);
                if (tags.length > 0) {
                    ctx.font = '9px monospace';
                    ctx.textAlign = 'center';

                    // Show first few tags that fit
                    let tagText = tags.slice(0, 3).join(' ');
                    if (tags.length > 3) tagText += '...';

                    // Draw tag background
                    const metrics = ctx.measureText(tagText);
                    const tagX = passage.x + constants.PASSAGE_WIDTH / 2 - metrics.width / 2 - 3;
                    const tagY = passage.y + 24;
                    const tagHeight = 12;

                    ctx.fillStyle = colors.passageBorder;
                    ctx.globalAlpha = 0.2;
                    ctx.fillRect(tagX, tagY, metrics.width + 6, tagHeight);
                    ctx.globalAlpha = 1;

                    // Draw tag text
                    ctx.fillStyle = colors.passageContent;
                    ctx.fillText(tagText, passage.x + constants.PASSAGE_WIDTH / 2, tagY + 2);
                }
            }

            // Render content preview
            if (passage.content) {
                ctx.fillStyle = colors.passageContent;
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'left';

                // Remove line breaks and extra spaces for preview
                const cleanContent = passage.content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

                // Position for content (below title and tags)
                const contentY = passage.y + (passage.tags ? 45 : 35);
                const contentWidth = constants.PASSAGE_WIDTH - 20;
                const lineHeight = 12;
                const maxLines = 4;

                // Get words to wrap properly
                const words = cleanContent.split(' ');
                const lines = [];
                let currentLine = '';

                // Build lines word by word
                for (const word of words) {
                    const testLine = currentLine ? `${currentLine} ${word}` : word;
                    const testWidth = ctx.measureText(testLine).width;

                    if (testWidth <= contentWidth) {
                        currentLine = testLine;
                    } else {
                        if (currentLine) {
                            lines.push(currentLine);
                            if (lines.length >= maxLines) break;
                        }
                        currentLine = word;
                    }
                }

                // Add remaining line if within limit
                if (currentLine && lines.length < maxLines) {
                    lines.push(currentLine);
                }

                // Render the lines
                let y = contentY;
                for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
                    let lineText = lines[i];

                    // Add ellipsis to last line if there's more content
                    if (i === maxLines - 1 && (i < lines.length - 1 || currentLine.length > 0)) {
                        lineText = this.truncateText(ctx, lineText, contentWidth, true);
                    } else {
                        // Still truncate to ensure it fits, but without ellipsis for middle lines
                        lineText = this.truncateText(ctx, lineText, contentWidth, false);
                    }

                    ctx.fillText(lineText, passage.x + 10, y);
                    y += lineHeight;
                }
            }

            // Restore clipping region
            ctx.restore();
        }

        // Render LOOP passages (special sticky note style)
        if (loopPassages) {
            for (const loopPassage of loopPassages.values()) {
                // Check if the loop's lane is collapsed
                const lane = lanes ? lanes.find(l => l.id === loopPassage.laneId) : null;
                if (lane && lane.collapsed) continue;

                // Skip if loop passage hasn't been positioned yet (x and y are still 0)
                if (loopPassage.x === 0 && loopPassage.y === 0) continue;

                // First, draw connector from source passage to LOOP sticky
                const sourcePassage = passages.get(loopPassage.fromId);
                if (sourcePassage) {
                    // Draw a dotted line from right side of source to left side of LOOP
                    ctx.strokeStyle = '#999999';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 3]);

                    const fromX = sourcePassage.x + constants.PASSAGE_WIDTH;
                    const fromY = sourcePassage.y + constants.PASSAGE_HEIGHT / 2;
                    const toX = loopPassage.x;
                    const toY = loopPassage.y + constants.STICKY_HEIGHT / 2;

                    ctx.beginPath();
                    ctx.moveTo(fromX, fromY);
                    ctx.lineTo(toX, toY);
                    ctx.stroke();

                    // Draw small arrowhead
                    const angle = Math.atan2(toY - fromY, toX - fromX);
                    const arrowLength = 6;
                    const arrowAngle = Math.PI / 6;

                    ctx.beginPath();
                    ctx.moveTo(toX, toY);
                    ctx.lineTo(
                        toX - arrowLength * Math.cos(angle - arrowAngle),
                        toY - arrowLength * Math.sin(angle - arrowAngle)
                    );
                    ctx.moveTo(toX, toY);
                    ctx.lineTo(
                        toX - arrowLength * Math.cos(angle + arrowAngle),
                        toY - arrowLength * Math.sin(angle + arrowAngle)
                    );
                    ctx.stroke();
                    ctx.setLineDash([]); // Reset dash
                }

                // Draw pale yellow sticky note style
                ctx.fillStyle = '#FFFACD'; // LemonChiffon - classic sticky note yellow
                ctx.fillRect(loopPassage.x, loopPassage.y, constants.STICKY_WIDTH, constants.STICKY_HEIGHT);

                // Draw subtle border
                ctx.strokeStyle = '#F0E68C'; // Khaki border - subtle
                ctx.lineWidth = 1;
                ctx.strokeRect(loopPassage.x, loopPassage.y, constants.STICKY_WIDTH, constants.STICKY_HEIGHT);

                // Draw "LOOP" text at top
                ctx.fillStyle = '#666666'; // Gray text for better readability on pale yellow
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText('← LOOP', loopPassage.x + constants.STICKY_WIDTH / 2, loopPassage.y + 8);

                // Draw target passage title
                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#444444'; // Dark gray
                const targetText = this.truncateText(ctx, loopPassage.toTitle, constants.STICKY_WIDTH - 10);
                ctx.fillText(targetText, loopPassage.x + constants.STICKY_WIDTH / 2, loopPassage.y + 25);

                // Reset text alignment
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
            }
        }

        // Render JUMP passages (special sticky note style for cross-lane links)
        if (jumpPassages) {
            for (const jumpPassage of jumpPassages.values()) {
                // Check if the jump's lane is collapsed
                const lane = lanes ? lanes.find(l => l.id === jumpPassage.laneId) : null;
                if (lane && lane.collapsed) continue;

                // Skip if jump passage hasn't been positioned yet (x and y are still 0)
                if (jumpPassage.x === 0 && jumpPassage.y === 0) continue;

                // First, draw connector from source passage to JUMP sticky
                const sourcePassage = passages.get(jumpPassage.fromId);
                if (sourcePassage) {
                    // Draw a dotted line from right side of source to left side of JUMP
                    ctx.strokeStyle = '#999999'; // Gray (matching LOOP connector)
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 3]);

                    const fromX = sourcePassage.x + constants.PASSAGE_WIDTH;
                    const fromY = sourcePassage.y + constants.PASSAGE_HEIGHT / 2;
                    const toX = jumpPassage.x;
                    const toY = jumpPassage.y + constants.STICKY_HEIGHT / 2;

                    ctx.beginPath();
                    ctx.moveTo(fromX, fromY);
                    ctx.lineTo(toX, toY);
                    ctx.stroke();

                    // Draw small arrowhead
                    const angle = Math.atan2(toY - fromY, toX - fromX);
                    const arrowLength = 6;
                    const arrowAngle = Math.PI / 6;

                    ctx.beginPath();
                    ctx.moveTo(toX, toY);
                    ctx.lineTo(
                        toX - arrowLength * Math.cos(angle - arrowAngle),
                        toY - arrowLength * Math.sin(angle - arrowAngle)
                    );
                    ctx.moveTo(toX, toY);
                    ctx.lineTo(
                        toX - arrowLength * Math.cos(angle + arrowAngle),
                        toY - arrowLength * Math.sin(angle + arrowAngle)
                    );
                    ctx.stroke();
                    ctx.setLineDash([]); // Reset dash
                }

                // Draw orange sticky note style for JUMP
                ctx.fillStyle = '#FFD4A3'; // Peach/Light orange - distinct from yellow LOOP
                ctx.fillRect(jumpPassage.x, jumpPassage.y, constants.STICKY_WIDTH, constants.STICKY_HEIGHT);

                // Draw subtle orange border
                ctx.strokeStyle = '#FF9500'; // Orange border
                ctx.lineWidth = 1;
                ctx.strokeRect(jumpPassage.x, jumpPassage.y, constants.STICKY_WIDTH, constants.STICKY_HEIGHT);

                // Draw "JUMP" text at top
                ctx.fillStyle = '#666666'; // Gray text for better readability on pale yellow
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText('↗ JUMP', jumpPassage.x + constants.STICKY_WIDTH / 2, jumpPassage.y + 8);

                // Draw target passage title (including lane name)
                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#444444'; // Dark gray
                const targetText = this.truncateText(ctx, jumpPassage.toTitle, constants.STICKY_WIDTH - 10);
                ctx.fillText(targetText, jumpPassage.x + constants.STICKY_WIDTH / 2, jumpPassage.y + 25);

                // Reset text alignment
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
            }
        }
    },

    truncateText(ctx, text, maxWidth, addEllipsis = true) {
        if (!text) return '';

        const ellipsis = addEllipsis ? '...' : '';
        let width = ctx.measureText(text).width;

        if (width <= maxWidth) {
            return text;
        }

        // Need to truncate
        let truncated = text;
        let targetWidth = addEllipsis ? maxWidth - ctx.measureText(ellipsis).width : maxWidth;

        // Binary search for the right length
        let low = 0;
        let high = text.length;
        let bestFit = '';

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const testText = text.substring(0, mid);
            const testWidth = ctx.measureText(testText).width;

            if (testWidth <= targetWidth) {
                bestFit = testText;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return bestFit + ellipsis;
    },

    renderLinks(ctx, passages, links, constants, lanes, colors, showCrossLaneLinks = false, loopPassages) {
        // showCrossLaneLinks parameter kept for compatibility but always treated as false
        // Build set of backward links that have LOOP passages
        const backwardLinkSet = new Set();
        if (loopPassages) {
            for (const loopPassage of loopPassages.values()) {
                backwardLinkSet.add(`${loopPassage.fromId}_${loopPassage.toId}`);
            }
        }

        links.forEach(link => {
            // Skip backward links that have LOOP passages
            if (backwardLinkSet.has(`${link.from}_${link.to}`)) {
                return;
            }

            const fromPassage = passages.get(link.from);
            const toPassage = passages.get(link.to);

            // Check if either lane is collapsed
            if (lanes) {
                const fromLane = lanes.find(l => l.id === fromPassage?.laneId);
                const toLane = lanes.find(l => l.id === toPassage?.laneId);
                if ((fromLane && fromLane.collapsed) || (toLane && toLane.collapsed)) return;
            }

            if (!fromPassage || !toPassage) return;

            // Check if this is a cross-lane connection
            const isCrossLane = fromPassage.laneId !== toPassage.laneId;

            // Always skip cross-lane links (handled by sticky notes)
            if (isCrossLane) return;

            // Determine if this is a backward link (right to left)
            const isBackwardLink = fromPassage.x > toPassage.x;

            // Set style based on connection type
            if (isCrossLane) {
                ctx.strokeStyle = colors.crossLaneLinkColor || '#ff9500';  // Orange for cross-lane
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);  // Dashed line
            } else if (isBackwardLink) {
                ctx.strokeStyle = '#000080';  // Navy blue for backward links
                ctx.lineWidth = 1.5;
                ctx.setLineDash([]);  // Solid line
            } else {
                ctx.strokeStyle = colors.linkColor;
                ctx.lineWidth = 1;
                ctx.setLineDash([]);  // Solid line
            }

            // For backward links, start from left side; for forward links, from right side
            const fromX = isBackwardLink ?
                          fromPassage.x :
                          (fromPassage.x + constants.PASSAGE_WIDTH);
            const fromY = fromPassage.y + constants.PASSAGE_HEIGHT / 2;

            // For backward links, arrow points to right side; for forward links, to left side
            const toX = isBackwardLink ?
                        (toPassage.x + constants.PASSAGE_WIDTH) :
                        toPassage.x;
            const toY = toPassage.y + constants.PASSAGE_HEIGHT / 2;

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);

            if (!isCrossLane) {
                // Same lane - use curved connection
                const midX = fromX + (toX - fromX) / 2;
                ctx.bezierCurveTo(
                    midX, fromY,
                    midX, toY,
                    toX, toY
                );
            } else {
                // Different lanes - use straight line with slight curve for aesthetics
                const midX = fromX + (toX - fromX) / 2;
                ctx.quadraticCurveTo(midX, (fromY + toY) / 2, toX, toY);
            }

            ctx.stroke();
            ctx.setLineDash([]);  // Reset line dash for arrowhead

            // Draw arrowhead at the destination
            const arrowLength = 8;
            const arrowAngle = Math.PI / 6;

            if (isBackwardLink) {
                // For backward links, calculate angle from a point just outside the right edge
                const angle = Math.atan2(toY - fromY, toX - (fromX + 10));

                ctx.beginPath();
                ctx.moveTo(toX, toY);
                ctx.lineTo(
                    toX + arrowLength * Math.cos(angle - arrowAngle),
                    toY + arrowLength * Math.sin(angle - arrowAngle)
                );
                ctx.moveTo(toX, toY);
                ctx.lineTo(
                    toX + arrowLength * Math.cos(angle + arrowAngle),
                    toY + arrowLength * Math.sin(angle + arrowAngle)
                );
            } else {
                // For forward links, arrow points into left edge
                const angle = Math.atan2(toY - fromY, toX - fromX);

                ctx.beginPath();
                ctx.moveTo(toX, toY);
                ctx.lineTo(
                    toX - arrowLength * Math.cos(angle - arrowAngle),
                    toY - arrowLength * Math.sin(angle - arrowAngle)
                );
                ctx.moveTo(toX, toY);
                ctx.lineTo(
                    toX - arrowLength * Math.cos(angle + arrowAngle),
                    toY - arrowLength * Math.sin(angle + arrowAngle)
                );
            }
            ctx.stroke();
        });
    },

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }
};