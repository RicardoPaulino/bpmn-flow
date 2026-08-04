import { BPMNNode, Waypoint, RoutingStyle } from '../types/bpmn';
import { getAnchorPositions } from '../canvas/bpmnDrawers';

export type AnchorDirection = 'top' | 'right' | 'bottom' | 'left';

/**
 * Calculates the optimal source and target anchor positions based on relative node positions.
 */
export function getBestAnchors(
  sourceNode: BPMNNode,
  targetNode: BPMNNode
): { sourceAnchor: AnchorDirection; targetAnchor: AnchorDirection } {
  const srcCenter = {
    x: sourceNode.bounds.x + sourceNode.bounds.width / 2,
    y: sourceNode.bounds.y + sourceNode.bounds.height / 2,
  };
  const tgtCenter = {
    x: targetNode.bounds.x + targetNode.bounds.width / 2,
    y: targetNode.bounds.y + targetNode.bounds.height / 2,
  };

  const dx = tgtCenter.x - srcCenter.x;
  const dy = tgtCenter.y - srcCenter.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceAnchor: 'right', targetAnchor: 'left' }
      : { sourceAnchor: 'left', targetAnchor: 'right' };
  } else {
    return dy >= 0
      ? { sourceAnchor: 'bottom', targetAnchor: 'top' }
      : { sourceAnchor: 'top', targetAnchor: 'bottom' };
  }
}

/**
 * Calculates waypoints for an edge based on anchor selections and routing style.
 */
export function calculateEdgeWaypoints(
  sourceNode: BPMNNode,
  targetNode: BPMNNode,
  sourceAnchor?: AnchorDirection,
  targetAnchor?: AnchorDirection,
  routingStyle: RoutingStyle = 'orthogonal'
): Waypoint[] {
  const srcAnchors = getAnchorPositions(sourceNode);
  const tgtAnchors = getAnchorPositions(targetNode);

  const finalSrcAnchor = sourceAnchor || 'right';
  const finalTgtAnchor = targetAnchor || 'left';

  const srcPt = srcAnchors[finalSrcAnchor];
  const tgtPt = tgtAnchors[finalTgtAnchor];

  // Straight line routing
  if (routingStyle === 'straight') {
    return [srcPt, tgtPt];
  }

  // Curved (Bezier) line routing
  if (routingStyle === 'curved') {
    return generateCurvedWaypoints(srcPt, tgtPt, finalSrcAnchor, finalTgtAnchor);
  }

  // Orthogonal (Manhattan 90-degree) line routing
  return generateOrthogonalWaypoints(srcPt, tgtPt, finalSrcAnchor, finalTgtAnchor);
}

function generateOrthogonalWaypoints(
  srcPt: Waypoint,
  tgtPt: Waypoint,
  srcAnchor: AnchorDirection,
  tgtAnchor: AnchorDirection
): Waypoint[] {
  const isSrcHorizontal = srcAnchor === 'left' || srcAnchor === 'right';
  const isTgtHorizontal = tgtAnchor === 'left' || tgtAnchor === 'right';

  if (isSrcHorizontal && isTgtHorizontal) {
    const midX = (srcPt.x + tgtPt.x) / 2;
    return [
      srcPt,
      { x: midX, y: srcPt.y },
      { x: midX, y: tgtPt.y },
      tgtPt,
    ];
  }

  if (!isSrcHorizontal && !isTgtHorizontal) {
    const midY = (srcPt.y + tgtPt.y) / 2;
    return [
      srcPt,
      { x: srcPt.x, y: midY },
      { x: tgtPt.x, y: midY },
      tgtPt,
    ];
  }

  if (isSrcHorizontal && !isTgtHorizontal) {
    return [
      srcPt,
      { x: tgtPt.x, y: srcPt.y },
      tgtPt,
    ];
  }

  // !isSrcHorizontal && isTgtHorizontal
  return [
    srcPt,
    { x: srcPt.x, y: tgtPt.y },
    tgtPt,
  ];
}

function generateCurvedWaypoints(
  srcPt: Waypoint,
  tgtPt: Waypoint,
  srcAnchor: AnchorDirection,
  tgtAnchor: AnchorDirection
): Waypoint[] {
  const dist = Math.hypot(tgtPt.x - srcPt.x, tgtPt.y - srcPt.y) * 0.4;

  const getOffset = (anchor: AnchorDirection): { dx: number; dy: number } => {
    switch (anchor) {
      case 'right': return { dx: dist, dy: 0 };
      case 'left': return { dx: -dist, dy: 0 };
      case 'bottom': return { dx: 0, dy: dist };
      case 'top': return { dx: 0, dy: -dist };
    }
  };

  const offsetSrc = getOffset(srcAnchor);
  const offsetTgt = getOffset(tgtAnchor);

  const p0 = srcPt;
  const p1 = { x: srcPt.x + offsetSrc.dx, y: srcPt.y + offsetSrc.dy };
  const p2 = { x: tgtPt.x + offsetTgt.dx, y: tgtPt.y + offsetTgt.dy };
  const p3 = tgtPt;

  const points: Waypoint[] = [];
  const segments = 12;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const invT = 1 - t;

    const x =
      invT * invT * invT * p0.x +
      3 * invT * invT * t * p1.x +
      3 * invT * t * t * p2.x +
      t * t * t * p3.x;

    const y =
      invT * invT * invT * p0.y +
      3 * invT * invT * t * p1.y +
      3 * invT * t * t * p2.y +
      t * t * t * p3.y;

    points.push({ x, y });
  }

  return points;
}
