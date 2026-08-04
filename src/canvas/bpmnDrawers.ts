import rough from 'roughjs/bin/rough';
import { RoughCanvas } from 'roughjs/bin/canvas';
import { BPMNNode, SequenceFlow, Waypoint, EventDefinitionType, CanvasTheme } from '../types/bpmn';

/**
 * High Performance Rough.js BPMN Shape Drawer
 */

export function drawNode(
  rc: RoughCanvas,
  ctx: CanvasRenderingContext2D,
  node: BPMNNode,
  isSelected: boolean,
  isHovered: boolean,
  isHighlighted: boolean, // for simulator
  handDrawnFont: boolean,
  theme: CanvasTheme
) {
  const { x, y, width, height } = node.bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const style = {
    roughness: node.roughStyle.roughness,
    stroke: isHighlighted ? '#10b981' : isSelected ? '#2563eb' : node.roughStyle.stroke,
    strokeWidth: isHighlighted ? 3.5 : isSelected ? node.roughStyle.strokeWidth + 1 : node.roughStyle.strokeWidth,
    fill: node.roughStyle.fill,
    fillStyle: node.roughStyle.fillStyle,
  };

  switch (node.type) {
    case 'START_EVENT':
      // Single thin circle
      rc.ellipse(cx, cy, width, height, style);
      if (node.eventDefinition && node.eventDefinition !== 'none') {
        drawEventIcon(ctx, cx, cy, node.eventDefinition, style.stroke);
      }
      break;

    case 'END_EVENT':
      // Outer circle
      rc.ellipse(cx, cy, width, height, { ...style, strokeWidth: style.strokeWidth + 1 });
      // Inner circle for thick border look
      rc.ellipse(cx, cy, width - 6, height - 6, style);
      if (node.eventDefinition && node.eventDefinition !== 'none') {
        drawEventIcon(ctx, cx, cy, node.eventDefinition, style.stroke);
      }
      break;

    case 'INTERMEDIATE_CATCH_EVENT':
    case 'INTERMEDIATE_THROW_EVENT':
      // Double thin circle
      rc.ellipse(cx, cy, width, height, style);
      rc.ellipse(cx, cy, width - 8, height - 8, style);
      if (node.eventDefinition && node.eventDefinition !== 'none') {
        drawEventIcon(ctx, cx, cy, node.eventDefinition, style.stroke);
      }
      break;

    case 'TASK':
    case 'USER_TASK':
    case 'SERVICE_TASK':
    case 'SCRIPT_TASK':
    case 'SEND_TASK':
    case 'RECEIVE_TASK':
    case 'BUSINESS_RULE_TASK':
    case 'SUB_PROCESS':
      // Rounded rectangle shape
      rc.rectangle(x, y, width, height, style);
      // Task Icon in top-left
      drawTaskHeaderIcon(ctx, node.type, x + 10, y + 10, style.stroke);
      break;

    case 'GATEWAY_EXCLUSIVE':
    case 'GATEWAY_PARALLEL':
    case 'GATEWAY_INCLUSIVE':
    case 'GATEWAY_EVENT_BASED':
    case 'GATEWAY_COMPLEX':
      // Diamond / Losango shape
      const diamondPoints: [number, number][] = [
        [cx, y],
        [x + width, cy],
        [cx, y + height],
        [x, cy],
      ];
      rc.polygon(diamondPoints, style);
      // Gateway symbol in center
      drawGatewayMarker(rc, ctx, cx, cy, node.type, style.stroke);
      break;

    case 'TEXT_ANNOTATION': {
      // Sticky note background with folded corner
      const noteFill =
        node.roughStyle.fill && node.roughStyle.fill !== 'none'
          ? node.roughStyle.fill
          : theme === 'dark'
          ? '#1e293b'
          : '#fef9c3';

      const foldSize = 12;

      // Polygon for sticky note with top-right folded corner
      const stickyPoints: [number, number][] = [
        [x, y],
        [x + width - foldSize, y],
        [x + width, y + foldSize],
        [x + width, y + height],
        [x, y + height],
      ];

      rc.polygon(stickyPoints, {
        roughness: style.roughness,
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        fill: noteFill,
        fillStyle: 'solid',
      });

      // Folded corner inner fold line
      rc.linearPath(
        [
          [x + width - foldSize, y],
          [x + width - foldSize, y + foldSize],
          [x + width, y + foldSize],
        ],
        {
          roughness: style.roughness,
          stroke: style.stroke,
          strokeWidth: 1.5,
        }
      );

      // Left bracket accent line (BPMN annotation marker)
      rc.line(x, y, x, y + height, {
        stroke: style.stroke,
        strokeWidth: style.strokeWidth + 1,
        roughness: style.roughness,
      });
      break;
    }
  }

  // Draw Label Text
  drawNodeText(ctx, node.label, x, y, width, height, node.type, handDrawnFont, theme);

  // Hover or Active Glow
  if (isHovered && !isSelected) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x - 4, y - 4, width + 8, height + 8);
    ctx.setLineDash([]);
  }
}

export function drawEdge(
  rc: RoughCanvas,
  ctx: CanvasRenderingContext2D,
  edge: SequenceFlow,
  isSelected: boolean,
  isHighlighted: boolean,
  handDrawnFont: boolean
) {
  const waypoints = edge.waypoints;
  if (!waypoints || waypoints.length < 2) return;

  const strokeColor = isHighlighted ? '#10b981' : isSelected ? '#2563eb' : edge.roughStyle.stroke;
  const strokeWidth = isHighlighted ? 3.5 : isSelected ? edge.roughStyle.strokeWidth + 1 : edge.roughStyle.strokeWidth;

  const pathPoints: [number, number][] = waypoints.map((wp) => [wp.x, wp.y]);

  let dashArray: number[] | undefined = undefined;
  if (edge.lineDash === 'dashed' || edge.type === 'MESSAGE_FLOW') {
    dashArray = [6, 6];
  } else if (edge.lineDash === 'dotted' || edge.type === 'ASSOCIATION') {
    dashArray = [2, 4];
  }

  if (dashArray) {
    rc.linearPath(pathPoints, {
      roughness: edge.roughStyle.roughness,
      stroke: strokeColor,
      strokeWidth,
      strokeLineDash: dashArray,
    });
  } else {
    rc.linearPath(pathPoints, {
      roughness: edge.roughStyle.roughness,
      stroke: strokeColor,
      strokeWidth,
    });
  }

  // Arrowhead at target waypoint
  const last = waypoints[waypoints.length - 1];
  const secondLast = waypoints[waypoints.length - 2] || waypoints[0];
  drawArrowhead(rc, ctx, secondLast, last, strokeColor, edge.type);

  // If selected, draw anchor connection handles on ends
  if (isSelected) {
    const first = waypoints[0];
    ctx.save();
    [first, last].forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 ? '#3b82f6' : '#22c55e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  // Label text along path
  if (edge.label || edge.conditionExpression) {
    const labelText = edge.label || edge.conditionExpression || '';
    const midIndex = Math.floor((waypoints.length - 1) / 2);
    const p1 = waypoints[midIndex];
    const p2 = waypoints[midIndex + 1] || p1;
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;

    drawEdgeLabel(ctx, labelText, mx, my, handDrawnFont);
  }
}

function drawArrowhead(
  rc: RoughCanvas,
  ctx: CanvasRenderingContext2D,
  p1: Waypoint,
  p2: Waypoint,
  color: string,
  type: string
) {
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const headLength = 12;

  const x1 = p2.x - headLength * Math.cos(angle - Math.PI / 6);
  const y1 = p2.y - headLength * Math.sin(angle - Math.PI / 6);
  const x2 = p2.x - headLength * Math.cos(angle + Math.PI / 6);
  const y2 = p2.y - headLength * Math.sin(angle + Math.PI / 6);

  if (type === 'MESSAGE_FLOW') {
    // Hollow open arrow
    rc.polygon([[p2.x, p2.y], [x1, y1], [x2, y2]], {
      stroke: color,
      fill: '#ffffff',
      fillStyle: 'solid',
      roughness: 0.8,
    });
  } else {
    // Filled arrow
    rc.polygon([[p2.x, p2.y], [x1, y1], [x2, y2]], {
      stroke: color,
      fill: color,
      fillStyle: 'solid',
      roughness: 0.8,
    });
  }
}

function drawEventIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, type: EventDefinitionType, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;

  if (type === 'message') {
    // Envelope
    ctx.strokeRect(cx - 8, cy - 6, 16, 12);
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 6);
    ctx.lineTo(cx, cy + 1);
    ctx.lineTo(cx + 8, cy - 6);
    ctx.stroke();
  } else if (type === 'timer') {
    // Clock
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 5);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 4, cy);
    ctx.stroke();
  } else if (type === 'error') {
    // Lightning flash
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 8);
    ctx.lineTo(cx - 4, cy + 1);
    ctx.lineTo(cx, cy + 1);
    ctx.lineTo(cx - 2, cy + 8);
    ctx.lineTo(cx + 4, cy - 1);
    ctx.lineTo(cx, cy - 1);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'signal') {
    // Triangle
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx + 7, cy + 6);
    ctx.lineTo(cx - 7, cy + 6);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

function drawGatewayMarker(
  rc: RoughCanvas,
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  type: string,
  color: string
) {
  const size = 12;
  if (type === 'GATEWAY_EXCLUSIVE') {
    // 'X'
    rc.line(cx - size, cy - size, cx + size, cy + size, { stroke: color, strokeWidth: 2.5, roughness: 0.8 });
    rc.line(cx + size, cy - size, cx - size, cy + size, { stroke: color, strokeWidth: 2.5, roughness: 0.8 });
  } else if (type === 'GATEWAY_PARALLEL') {
    // '+'
    rc.line(cx, cy - size - 2, cx, cy + size + 2, { stroke: color, strokeWidth: 3, roughness: 0.8 });
    rc.line(cx - size - 2, cy, cx + size + 2, cy, { stroke: color, strokeWidth: 3, roughness: 0.8 });
  } else if (type === 'GATEWAY_INCLUSIVE') {
    // 'O'
    rc.ellipse(cx, cy, size * 2, size * 2, { stroke: color, strokeWidth: 2.5, roughness: 0.8 });
  }
}

function drawTaskHeaderIcon(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;

  if (type === 'USER_TASK') {
    // User silhouette icon
    ctx.beginPath();
    ctx.arc(x + 6, y + 4, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 6, y + 14, 6, Math.PI, 0);
    ctx.stroke();
  } else if (type === 'SERVICE_TASK') {
    // Gear icon
    ctx.beginPath();
    ctx.arc(x + 6, y + 6, 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'SCRIPT_TASK') {
    // Document scroll icon
    ctx.strokeRect(x, y, 10, 12);
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 4);
    ctx.lineTo(x + 8, y + 4);
    ctx.moveTo(x + 2, y + 8);
    ctx.lineTo(x + 8, y + 8);
    ctx.stroke();
  } else if (type === 'SUB_PROCESS') {
    // Plus box in bottom center
    // handled separately
  }

  ctx.restore();
}

function drawNodeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  type: string,
  handDrawnFont: boolean,
  theme: CanvasTheme
) {
  if (!text) return;

  ctx.save();
  ctx.font = handDrawnFont
    ? '14px "Caveat", "Comic Sans MS", cursive, sans-serif'
    : '500 13px system-ui, -apple-system, sans-serif';

  ctx.fillStyle = theme === 'dark' || theme === 'blueprint' ? '#f1f5f9' : '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text positioning based on shape type
  if (type.includes('EVENT')) {
    // Place below event circle
    ctx.fillText(text, x + w / 2, y + h + 16);
  } else if (type.includes('GATEWAY')) {
    // Place below gateway diamond
    ctx.fillText(text, x + w / 2, y + h + 18);
  } else if (type === 'TEXT_ANNOTATION') {
    // Left-aligned sticky note text starting from top
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = theme === 'dark' ? '#f8fafc' : '#1e293b';

    const words = text.split(' ');
    let line = '';
    const lines = [];
    const maxWidth = w - 20;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const lineHeight = 17;
    const startY = y + 10;

    lines.forEach((l, i) => {
      ctx.fillText(l.trim(), x + 10, startY + i * lineHeight);
    });
  } else {
    // Center inside Task rectangle with line wrapping
    const words = text.split(' ');
    let line = '';
    const lines = [];
    const maxWidth = w - 16;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const lineHeight = 16;
    const startY = y + h / 2 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((l, i) => {
      ctx.fillText(l.trim(), x + w / 2, startY + i * lineHeight);
    });
  }

  ctx.restore();
}

function drawEdgeLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  handDrawnFont: boolean
) {
  ctx.save();
  ctx.font = handDrawnFont
    ? '13px "Caveat", "Comic Sans MS", cursive, sans-serif'
    : '500 12px system-ui, -apple-system, sans-serif';

  const metrics = ctx.measureText(text);
  const paddingX = 6;
  const paddingY = 4;
  const bw = metrics.width + paddingX * 2;
  const bh = 18;

  // Background pill for label contrast
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);

  ctx.restore();
}

/**
 * Draw Interactive Anchor Points for quick connection dragging
 */
export function drawAnchorPoints(
  ctx: CanvasRenderingContext2D,
  node: BPMNNode,
  hoveredAnchor: string | null
) {
  const anchors = getAnchorPositions(node);
  const keys: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];

  keys.forEach((key) => {
    const pt = anchors[key];
    const isHovered = hoveredAnchor === key;

    ctx.save();
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, isHovered ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#2563eb' : '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

export function getAnchorPositions(node: BPMNNode): Record<'top' | 'right' | 'bottom' | 'left', Waypoint> {
  const { x, y, width, height } = node.bounds;
  return {
    top: { x: x + width / 2, y },
    right: { x: x + width, y: y + height / 2 },
    bottom: { x: x + width / 2, y: y + height },
    left: { x, y: y + height / 2 },
  };
}
