import rough from 'roughjs/bin/rough';
import {
  DiagramData,
  CanvasTransform,
  CanvasTheme,
  ConnectionDraft,
  AlignmentGuide,
  RemoteUser,
  BPMNNode,
  SelectionBox,
} from '../types/bpmn';
import { drawNode, drawEdge, drawAnchorPoints, getAnchorPositions } from './bpmnDrawers';

export function renderMasterCanvas(
  canvas: HTMLCanvasElement,
  diagram: DiagramData,
  transform: CanvasTransform,
  selectedNodeIds: string[],
  selectedEdgeIds: string[],
  hoveredNodeId: string | null,
  hoveredAnchor: string | null,
  connectionDraft: ConnectionDraft | null,
  selectionBox: SelectionBox | null,
  alignmentGuides: AlignmentGuide[],
  simulationActiveNodeId: string | null,
  simulationActiveEdgeIds: string[],
  remoteUsers: RemoteUser[],
  theme: CanvasTheme,
  showGrid: boolean,
  handDrawnFont: boolean
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear viewport canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background Fill by Theme
  ctx.fillStyle = getBackgroundColor(theme);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  // Apply Transform Matrix (Pan and Zoom)
  ctx.translate(transform.panX, transform.panY);
  ctx.scale(transform.zoom, transform.zoom);

  // Draw Background Grid Pattern
  if (showGrid) {
    drawCanvasGrid(ctx, canvas.width, canvas.height, transform, theme);
  }

  const rc = rough.canvas(canvas);

  // 1. Render Edges (Sequence Flows, Message Flows)
  diagram.edges.forEach((edge) => {
    const isSelected = selectedEdgeIds.includes(edge.id);
    const isHighlighted = simulationActiveEdgeIds.includes(edge.id);
    drawEdge(rc, ctx, edge, isSelected, isHighlighted, handDrawnFont);
  });

  // 2. Render Connection Draft (Dragging line from an anchor)
  if (connectionDraft) {
    const sourceNode = diagram.nodes.find((n) => n.id === connectionDraft.sourceNodeId);
    if (sourceNode) {
      const sourceAnchorPt = getAnchorPositions(sourceNode)[connectionDraft.sourceAnchor];
      ctx.save();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(sourceAnchorPt.x, sourceAnchorPt.y);
      ctx.lineTo(connectionDraft.currentPoint.x, connectionDraft.currentPoint.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 3. Render Nodes (Events, Tasks, Gateways, Pools, Text)
  diagram.nodes.forEach((node) => {
    const isSelected = selectedNodeIds.includes(node.id);
    const isHovered = hoveredNodeId === node.id;
    const isHighlighted = simulationActiveNodeId === node.id;

    drawNode(
      rc,
      ctx,
      node,
      isSelected,
      isHovered,
      isHighlighted,
      handDrawnFont,
      theme
    );

    // If node is selected or hovered, show anchor points
    if (isSelected || isHovered) {
      drawAnchorPoints(ctx, node, isHovered ? hoveredAnchor : null);
    }
  });

  // 4. Draw Bounding Selection Handles on Selected Nodes
  if (selectedNodeIds.length === 1) {
    const selectedNode = diagram.nodes.find((n) => n.id === selectedNodeIds[0]);
    if (selectedNode) {
      drawSelectionHandles(ctx, selectedNode.bounds);
    }
  } else if (selectedNodeIds.length > 1) {
    // Multi-select bounding box
    const selectedNodes = diagram.nodes.filter((n) => selectedNodeIds.includes(n.id));
    if (selectedNodes.length > 0) {
      const minX = Math.min(...selectedNodes.map((n) => n.bounds.x));
      const minY = Math.min(...selectedNodes.map((n) => n.bounds.y));
      const maxX = Math.max(...selectedNodes.map((n) => n.bounds.x + n.bounds.width));
      const maxY = Math.max(...selectedNodes.map((n) => n.bounds.y + n.bounds.height));

      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX - 8, minY - 8, maxX - minX + 16, maxY - minY + 16);
      ctx.restore();
    }
  }

  // 5. Draw Lasso Selection Box
  if (selectionBox && (selectionBox.width > 2 || selectionBox.height > 2)) {
    ctx.save();
    ctx.fillStyle = theme === 'dark' ? 'rgba(129, 140, 248, 0.18)' : 'rgba(79, 70, 229, 0.12)';
    ctx.strokeStyle = theme === 'dark' ? '#818cf8' : '#4f46e5';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
    ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
    ctx.restore();
  }

  // 6. Draw Alignment Smart Guides
  alignmentGuides.forEach((guide) => {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (guide.type === 'vertical') {
      ctx.moveTo(guide.position, guide.start);
      ctx.lineTo(guide.position, guide.end);
    } else {
      ctx.moveTo(guide.start, guide.position);
      ctx.lineTo(guide.end, guide.position);
    }
    ctx.stroke();
    ctx.restore();
  });

  // 6. Draw Remote User Collaborative Cursors
  remoteUsers.forEach((user) => {
    drawRemoteCursor(ctx, user);
  });

  ctx.restore();
}

function getBackgroundColor(theme: CanvasTheme): string {
  switch (theme) {
    case 'dark':
      return '#0f172a'; // Zinc/Slate dark
    case 'paper':
      return '#fbfbfa'; // Warm paper
    case 'blueprint':
      return '#1e3a8a'; // Blueprint blue
    case 'light':
    default:
      return '#ffffff';
  }
}

function drawCanvasGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  transform: CanvasTransform,
  theme: CanvasTheme
) {
  const gridSize = 20;
  const startX = Math.floor(-transform.panX / transform.zoom / gridSize) * gridSize;
  const endX = startX + width / transform.zoom + gridSize * 2;
  const startY = Math.floor(-transform.panY / transform.zoom / gridSize) * gridSize;
  const endY = startY + height / transform.zoom + gridSize * 2;

  ctx.save();
  ctx.fillStyle = theme === 'dark' ? '#334155' : theme === 'blueprint' ? '#3b82f6' : '#cbd5e1';

  for (let x = startX; x < endX; x += gridSize) {
    for (let y = startY; y < endY; y += gridSize) {
      ctx.fillRect(x, y, 1.2 / transform.zoom, 1.2 / transform.zoom);
    }
  }
  ctx.restore();
}

function drawSelectionHandles(ctx: CanvasRenderingContext2D, bounds: BPMNNode['bounds']) {
  const { x, y, width, height } = bounds;
  const handleSize = 7;

  const handles = [
    { x: x - handleSize / 2, y: y - handleSize / 2 },
    { x: x + width / 2 - handleSize / 2, y: y - handleSize / 2 },
    { x: x + width - handleSize / 2, y: y - handleSize / 2 },
    { x: x + width - handleSize / 2, y: y + height / 2 - handleSize / 2 },
    { x: x + width - handleSize / 2, y: y + height - handleSize / 2 },
    { x: x + width / 2 - handleSize / 2, y: y + height - handleSize / 2 },
    { x: x - handleSize / 2, y: y + height - handleSize / 2 },
    { x: x - handleSize / 2, y: y + height / 2 - handleSize / 2 },
  ];

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1.5;

  handles.forEach((h) => {
    ctx.fillRect(h.x, h.y, handleSize, handleSize);
    ctx.strokeRect(h.x, h.y, handleSize, handleSize);
  });

  ctx.restore();
}

function drawRemoteCursor(ctx: CanvasRenderingContext2D, user: RemoteUser) {
  ctx.save();
  ctx.translate(user.x, user.y);

  // Pointer triangle
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(12, 16);
  ctx.lineTo(6, 16);
  ctx.lineTo(0, 22);
  ctx.closePath();
  ctx.fillStyle = user.color || '#ec4899';
  ctx.fill();

  // User Name Pill
  ctx.font = '500 11px system-ui, sans-serif';
  ctx.fillStyle = user.color || '#ec4899';
  ctx.fillRect(14, 12, ctx.measureText(user.name).width + 8, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(user.name, 18, 24);

  ctx.restore();
}
