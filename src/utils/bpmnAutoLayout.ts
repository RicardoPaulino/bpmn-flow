import { DiagramData, BPMNNode } from '../types/bpmn';
import { calculateEdgeWaypoints, getBestAnchors } from './bpmnRouting';

export interface AutoLayoutOptions {
  direction: 'horizontal' | 'vertical';
  nodeIdsToLayout?: string[];
  hSpacing?: number;
  vSpacing?: number;
}

/**
 * Automatically rearranges nodes and edges in a clear flow layout
 * using topological longest-path ranking and barycenter cross reduction.
 */
export function applyAutoLayout(
  diagram: DiagramData,
  options: AutoLayoutOptions
): DiagramData {
  const { direction, nodeIdsToLayout, hSpacing = 110, vSpacing = 70 } = options;

  // Determine which nodes to layout
  const targetNodeIds =
    nodeIdsToLayout && nodeIdsToLayout.length >= 2
      ? nodeIdsToLayout
      : diagram.nodes.map((n) => n.id);

  if (targetNodeIds.length < 2) return diagram;

  const nodeMap = new Map<string, BPMNNode>(
    diagram.nodes.filter((n) => targetNodeIds.includes(n.id)).map((n) => [n.id, n])
  );

  // Filter edges within the target set
  const relevantEdges = diagram.edges.filter(
    (e) => nodeMap.has(e.sourceRef) && nodeMap.has(e.targetRef)
  );

  // Build adjacency list
  const inEdgesMap = new Map<string, string[]>();
  const outEdgesMap = new Map<string, string[]>();

  targetNodeIds.forEach((id) => {
    inEdgesMap.set(id, []);
    outEdgesMap.set(id, []);
  });

  relevantEdges.forEach((e) => {
    outEdgesMap.get(e.sourceRef)?.push(e.targetRef);
    inEdgesMap.get(e.targetRef)?.push(e.sourceRef);
  });

  // 1. Assign Ranks using Longest-Path Layering
  const ranks = new Map<string, number>();

  // Find root nodes (in-degree 0)
  const roots = targetNodeIds.filter((id) => (inEdgesMap.get(id) || []).length === 0);

  if (roots.length === 0 && targetNodeIds.length > 0) {
    // If cyclic, pick node with smallest X/Y coordinate as root
    const sorted = [...targetNodeIds].sort((a, b) => {
      const na = nodeMap.get(a)!;
      const nb = nodeMap.get(b)!;
      return direction === 'horizontal' ? na.bounds.x - nb.bounds.x : na.bounds.y - nb.bounds.y;
    });
    roots.push(sorted[0]);
  }

  // Topological rank relaxation
  const memoRank = (nodeId: string, visited: Set<string>): number => {
    if (ranks.has(nodeId)) return ranks.get(nodeId)!;
    if (visited.has(nodeId)) return 0; // Break cycles

    visited.add(nodeId);
    const inNeighbors = inEdgesMap.get(nodeId) || [];

    if (inNeighbors.length === 0) {
      ranks.set(nodeId, 0);
      return 0;
    }

    let maxPredRank = -1;
    for (const predId of inNeighbors) {
      const predRank = memoRank(predId, new Set(visited));
      if (predRank > maxPredRank) maxPredRank = predRank;
    }

    const calculatedRank = maxPredRank + 1;
    ranks.set(nodeId, calculatedRank);
    return calculatedRank;
  };

  targetNodeIds.forEach((id) => memoRank(id, new Set()));

  // Ensure all nodes have a rank
  targetNodeIds.forEach((id) => {
    if (!ranks.has(id)) ranks.set(id, 0);
  });

  // 2. Group nodes by rank
  const rankGroups = new Map<number, string[]>();
  targetNodeIds.forEach((id) => {
    const r = ranks.get(id) || 0;
    if (!rankGroups.has(r)) rankGroups.set(r, []);
    rankGroups.get(r)!.push(id);
  });

  const sortedRankKeys = Array.from(rankGroups.keys()).sort((a, b) => a - b);

  // 3. Barycenter Sorting within Ranks (Cross Reduction)
  sortedRankKeys.forEach((rankKey, idx) => {
    const group = rankGroups.get(rankKey)!;
    if (idx === 0) {
      // Sort first rank by natural coordinate
      group.sort((a, b) => {
        const na = nodeMap.get(a)!;
        const nb = nodeMap.get(b)!;
        return direction === 'horizontal' ? na.bounds.y - nb.bounds.y : na.bounds.x - nb.bounds.x;
      });
    } else {
      // Sort rank by average position of predecessor nodes in previous ranks
      group.sort((a, b) => {
        const getBarycenter = (id: string) => {
          const preds = inEdgesMap.get(id) || [];
          if (preds.length === 0) return 0;
          let sum = 0;
          preds.forEach((pId) => {
            const pNode = nodeMap.get(pId)!;
            sum += direction === 'horizontal' ? pNode.bounds.y : pNode.bounds.x;
          });
          return sum / preds.length;
        };

        return getBarycenter(a) - getBarycenter(b);
      });
    }
  });

  // 4. Calculate Origin bounding box
  const minX = Math.min(...Array.from(nodeMap.values()).map((n) => n.bounds.x));
  const minY = Math.min(...Array.from(nodeMap.values()).map((n) => n.bounds.y));

  // Compute total layout dimensions per rank for vertical/horizontal centering
  const rankDimensions = new Map<number, number>();
  sortedRankKeys.forEach((rankKey) => {
    const group = rankGroups.get(rankKey)!;
    let totalDim = 0;
    group.forEach((id, index) => {
      const node = nodeMap.get(id)!;
      const dim = direction === 'horizontal' ? node.bounds.height : node.bounds.width;
      totalDim += dim;
      if (index < group.length - 1) {
        totalDim += direction === 'horizontal' ? vSpacing : hSpacing;
      }
    });
    rankDimensions.set(rankKey, totalDim);
  });

  const maxRankDimension = Math.max(...Array.from(rankDimensions.values()), 0);

  // 5. Position nodes on grid
  const updatedNodeMap = new Map<string, BPMNNode>();

  if (direction === 'horizontal') {
    let currentX = minX;

    sortedRankKeys.forEach((rankKey) => {
      const group = rankGroups.get(rankKey)!;
      let maxRankWidth = 0;

      // Center this rank column vertically relative to max rank dimension
      const columnHeight = rankDimensions.get(rankKey) || 0;
      let currentY = minY + (maxRankDimension - columnHeight) / 2;

      group.forEach((id) => {
        const node = nodeMap.get(id)!;
        maxRankWidth = Math.max(maxRankWidth, node.bounds.width);

        updatedNodeMap.set(id, {
          ...node,
          bounds: {
            ...node.bounds,
            x: currentX,
            y: currentY,
          },
        });

        currentY += node.bounds.height + vSpacing;
      });

      currentX += maxRankWidth + hSpacing;
    });
  } else {
    // Vertical Layout
    let currentY = minY;

    sortedRankKeys.forEach((rankKey) => {
      const group = rankGroups.get(rankKey)!;
      let maxRankHeight = 0;

      // Center this rank row horizontally relative to max rank dimension
      const rowWidth = rankDimensions.get(rankKey) || 0;
      let currentX = minX + (maxRankDimension - rowWidth) / 2;

      group.forEach((id) => {
        const node = nodeMap.get(id)!;
        maxRankHeight = Math.max(maxRankHeight, node.bounds.height);

        updatedNodeMap.set(id, {
          ...node,
          bounds: {
            ...node.bounds,
            x: currentX,
            y: currentY,
          },
        });

        currentX += node.bounds.width + hSpacing;
      });

      currentY += maxRankHeight + vSpacing;
    });
  }

  // Merge updated node positions into diagram
  const updatedNodes = diagram.nodes.map((node) => updatedNodeMap.get(node.id) || node);

  // 6. Recalculate Edge Waypoints & Anchors
  const updatedEdges = diagram.edges.map((edge) => {
    const srcNode = updatedNodes.find((n) => n.id === edge.sourceRef);
    const tgtNode = updatedNodes.find((n) => n.id === edge.targetRef);

    if (srcNode && tgtNode && (targetNodeIds.includes(edge.sourceRef) || targetNodeIds.includes(edge.targetRef))) {
      const { sourceAnchor, targetAnchor } = getBestAnchors(srcNode, tgtNode);

      const waypoints = calculateEdgeWaypoints(
        srcNode,
        tgtNode,
        sourceAnchor,
        targetAnchor,
        edge.routingStyle || 'orthogonal'
      );

      return {
        ...edge,
        sourceAnchor,
        targetAnchor,
        waypoints,
      };
    }
    return edge;
  });

  return {
    ...diagram,
    nodes: updatedNodes,
    edges: updatedEdges,
    lastModified: Date.now(),
  };
}

