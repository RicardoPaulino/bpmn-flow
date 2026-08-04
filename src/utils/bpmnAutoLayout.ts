import { DiagramData, BPMNNode, SequenceFlow } from '../types/bpmn';
import { calculateEdgeWaypoints, getBestAnchors } from './bpmnRouting';

export interface AutoLayoutOptions {
  direction: 'horizontal' | 'vertical';
  nodeIdsToLayout?: string[];
  hSpacing?: number;
  vSpacing?: number;
}

/**
 * Automatically calculates positions for nodes in a clear flow layout
 * and updates edge waypoints & anchors.
 */
export function applyAutoLayout(
  diagram: DiagramData,
  options: AutoLayoutOptions
): DiagramData {
  const { direction, nodeIdsToLayout, hSpacing = 80, vSpacing = 60 } = options;

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

  // Compute in-degree & out-neighbors
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();

  targetNodeIds.forEach((id) => {
    inDegree.set(id, 0);
    outEdges.set(id, []);
  });

  relevantEdges.forEach((e) => {
    inDegree.set(e.targetRef, (inDegree.get(e.targetRef) || 0) + 1);
    outEdges.get(e.sourceRef)?.push(e.targetRef);
  });

  // Assign ranks using BFS / topological topological ordering
  const ranks = new Map<string, number>();
  const queue: string[] = [];

  // Roots (in-degree 0)
  targetNodeIds.forEach((id) => {
    if (inDegree.get(id) === 0) {
      ranks.set(id, 0);
      queue.push(id);
    }
  });

  // If no root found (e.g. fully cyclic graph), pick node with min X or Y as start
  if (queue.length === 0 && targetNodeIds.length > 0) {
    const sortedByPos = [...targetNodeIds].sort((a, b) => {
      const na = nodeMap.get(a)!;
      const nb = nodeMap.get(b)!;
      return direction === 'horizontal' ? na.bounds.x - nb.bounds.x : na.bounds.y - nb.bounds.y;
    });
    const startId = sortedByPos[0];
    ranks.set(startId, 0);
    queue.push(startId);
  }

  const visited = new Set<string>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);

    const currRank = ranks.get(curr) || 0;
    const neighbors = outEdges.get(curr) || [];

    neighbors.forEach((nbr) => {
      const existingRank = ranks.get(nbr) ?? -1;
      const nextRank = Math.max(existingRank, currRank + 1);
      ranks.set(nbr, nextRank);
      queue.push(nbr);
    });
  }

  // Assign rank 0 to any remaining unvisited disconnected nodes
  targetNodeIds.forEach((id) => {
    if (!ranks.has(id)) {
      ranks.set(id, 0);
    }
  });

  // Group node IDs by rank
  const rankGroups = new Map<number, string[]>();
  targetNodeIds.forEach((id) => {
    const r = ranks.get(id) || 0;
    if (!rankGroups.has(r)) {
      rankGroups.set(r, []);
    }
    rankGroups.get(r)!.push(id);
  });

  // Sort ranks ascending
  const sortedRankKeys = Array.from(rankGroups.keys()).sort((a, b) => a - b);

  // Find bounding box origin of the target nodes to preserve context position
  const minX = Math.min(...Array.from(nodeMap.values()).map((n) => n.bounds.x));
  const minY = Math.min(...Array.from(nodeMap.values()).map((n) => n.bounds.y));

  const updatedNodeMap = new Map<string, BPMNNode>();

  if (direction === 'horizontal') {
    let currentX = minX;

    sortedRankKeys.forEach((rankKey) => {
      const groupNodeIds = rankGroups.get(rankKey)!;
      // Sort group nodes by their original Y coordinate for natural ordering
      groupNodeIds.sort((a, b) => nodeMap.get(a)!.bounds.y - nodeMap.get(b)!.bounds.y);

      let maxRankWidth = 0;
      let currentY = minY;

      groupNodeIds.forEach((id) => {
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
    // Vertical Layout Flow
    let currentY = minY;

    sortedRankKeys.forEach((rankKey) => {
      const groupNodeIds = rankGroups.get(rankKey)!;
      // Sort group nodes by their original X coordinate for natural ordering
      groupNodeIds.sort((a, b) => nodeMap.get(a)!.bounds.x - nodeMap.get(b)!.bounds.x);

      let maxRankHeight = 0;
      let currentX = minX;

      groupNodeIds.forEach((id) => {
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

  // Merge back updated node positions
  const updatedNodes = diagram.nodes.map((node) => {
    return updatedNodeMap.get(node.id) || node;
  });

  // Re-calculate edge waypoints and anchors for affected connections
  const updatedEdges = diagram.edges.map((edge) => {
    const srcNode = updatedNodes.find((n) => n.id === edge.sourceRef);
    const tgtNode = updatedNodes.find((n) => n.id === edge.targetRef);

    if (srcNode && tgtNode && (targetNodeIds.includes(edge.sourceRef) || targetNodeIds.includes(edge.targetRef))) {
      const sourceAnchor: 'top' | 'right' | 'bottom' | 'left' = direction === 'horizontal' ? 'right' : 'bottom';
      const targetAnchor: 'top' | 'right' | 'bottom' | 'left' = direction === 'horizontal' ? 'left' : 'top';

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
