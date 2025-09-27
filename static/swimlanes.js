const Swimlanes = {
    renderLanes(ctx, lanes, constants, activeLaneId, getLaneHeight, colors) {
        let currentY = 0;

        lanes.forEach((lane, index) => {
            const laneHeight = getLaneHeight ? getLaneHeight(lane) : constants.LANE_HEIGHT;
            const isActive = lane.id === activeLaneId;
            const isCollapsed = lane.collapsed || false;

            // Draw lane background
            if (isActive) {
                ctx.fillStyle = colors.laneBackgroundActive;
            } else if (isCollapsed) {
                ctx.fillStyle = lane.isMetadata ? colors.laneBackgroundCollapsedMeta : colors.laneBackgroundCollapsed;
            } else {
                ctx.fillStyle = lane.isMetadata ? colors.laneBackgroundMeta : colors.laneBackground;
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
            if (isActive) {
                ctx.fillStyle = colors.headerBackgroundActive;
            } else {
                ctx.fillStyle = lane.isMetadata ? colors.headerBackgroundMeta : colors.headerBackground;
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

            // Draw lane name (offset to make room for toggle)
            ctx.fillStyle = colors.headerText;
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(lane.name, 35, currentY + constants.HEADER_HEIGHT / 2);

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

    renderPassages(ctx, passages, selectedPassage, constants, lanes, colors) {
        for (const passage of passages.values()) {
            // Check if the passage's lane is collapsed
            const lane = lanes ? lanes.find(l => l.id === passage.laneId) : null;
            if (lane && lane.collapsed) continue;

            const isSelected = selectedPassage && selectedPassage.id === passage.id;

            ctx.fillStyle = colors.passageBackground;
            ctx.fillRect(passage.x, passage.y, constants.PASSAGE_WIDTH, constants.PASSAGE_HEIGHT);

            ctx.strokeStyle = isSelected ? colors.passageBorderSelected : colors.passageBorder;
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(passage.x, passage.y, constants.PASSAGE_WIDTH, constants.PASSAGE_HEIGHT);

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

    renderLinks(ctx, passages, links, constants, lanes, colors) {
        ctx.strokeStyle = colors.linkColor;
        ctx.lineWidth = 1;

        links.forEach(link => {
            const fromPassage = passages.get(link.from);
            const toPassage = passages.get(link.to);

            // Check if either lane is collapsed
            if (lanes) {
                const fromLane = lanes.find(l => l.id === fromPassage?.laneId);
                const toLane = lanes.find(l => l.id === toPassage?.laneId);
                if ((fromLane && fromLane.collapsed) || (toLane && toLane.collapsed)) return;
            }

            if (!fromPassage || !toPassage) return;

            // Arrow originates from right side of parent, centered vertically
            const fromX = fromPassage.x + constants.PASSAGE_WIDTH;
            const fromY = fromPassage.y + constants.PASSAGE_HEIGHT / 2;

            // Arrow points to left side of child, centered vertically
            const toX = toPassage.x;
            const toY = toPassage.y + constants.PASSAGE_HEIGHT / 2;

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);

            if (fromPassage.laneId === toPassage.laneId) {
                // Same lane - use curved connection
                const midX = fromX + (toX - fromX) / 2;
                ctx.bezierCurveTo(
                    midX, fromY,
                    midX, toY,
                    toX, toY
                );
            } else {
                // Different lanes - use straight line
                ctx.lineTo(toX, toY);
            }

            ctx.stroke();

            // Draw arrowhead at the destination
            const angle = Math.atan2(toY - fromY, toX - fromX);
            const arrowLength = 8;
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