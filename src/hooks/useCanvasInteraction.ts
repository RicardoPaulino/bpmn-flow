import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  diagramAtom,
  historyStackAtom,
  historyIndexAtom,
  selectedNodeIdsAtom,
  selectedEdgeIdsAtom,
  activeToolAtom,
  transformAtom,
  snapGridAtom,
  connectionDraftAtom,
  alignmentGuidesAtom,
  activeRoughnessAtom,
  activeStrokeColorAtom,
  activeFillColorAtom,
  selectionBoxAtom,
} from '../store/atoms';
import { BPMNNode, SequenceFlow, Waypoint, AlignmentGuide, BPMNElementType, SelectionBox, ResizeHandleType } from '../types/bpmn';
import { getAnchorPositions } from '../canvas/bpmnDrawers';
import { calculateEdgeWaypoints, getBestAnchors } from '../utils/bpmnRouting';
import { getResizeHandleAtPoint } from '../canvas/renderer';

export function useCanvasInteraction(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [diagram, setDiagram] = useAtom(diagramAtom);
  const [historyStack, setHistoryStack] = useAtom(historyStackAtom);
  const [historyIndex, setHistoryIndex] = useAtom(historyIndexAtom);
  const [selectedNodeIds, setSelectedNodeIds] = useAtom(selectedNodeIdsAtom);
  const [selectedEdgeIds, setSelectedEdgeIds] = useAtom(selectedEdgeIdsAtom);
  const [activeTool, setActiveTool] = useAtom(activeToolAtom);
  const [transform, setTransform] = useAtom(transformAtom);
  const [snapGrid] = useAtom(snapGridAtom);
  const [connectionDraft, setConnectionDraft] = useAtom(connectionDraftAtom);
  const setAlignmentGuides = useSetAtom(alignmentGuidesAtom);
  const [, setSelectionBox] = useAtom(selectionBoxAtom);

  const [activeRoughness] = useAtom(activeRoughnessAtom);
  const [activeStrokeColor] = useAtom(activeStrokeColorAtom);
  const [activeFillColor] = useAtom(activeFillColorAtom);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<'top' | 'right' | 'bottom' | 'left' | null>(null);
  const [hoveredResizeHandle, setHoveredResizeHandle] = useState<ResizeHandleType | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isResizingNode, setIsResizingNode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isSelectingBox, setIsSelectingBox] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Keyboard spacebar listener for panning viewport
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    const onBlur = () => {
      setIsSpacePressed(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Dragging / Interaction refs
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const selectionStartPtRef = useRef<Waypoint | null>(null);
  const initialNodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const resizeHandleRef = useRef<ResizeHandleType | null>(null);
  const initialResizeBoundsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Push State to History
  const pushHistory = useCallback(
    (newDiagram: typeof diagram) => {
      const newStack = historyStack.slice(0, historyIndex + 1);
      newStack.push(newDiagram);
      setHistoryStack(newStack);
      setHistoryIndex(newStack.length - 1);
    },
    [historyStack, historyIndex, setHistoryStack, setHistoryIndex]
  );

  // Transform screen coordinate to canvas world coordinate
  const screenToWorld = useCallback(
    (clientX: number, clientY: number): Waypoint => {
      if (!canvasRef.current) return { x: clientX, y: clientY };
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      return {
        x: (screenX - transform.panX) / transform.zoom,
        y: (screenY - transform.panY) / transform.zoom,
      };
    },
    [transform, canvasRef]
  );

  // Snap position to 20px grid
  const snapToGridVal = useCallback((val: number, gridSize = 20) => {
    return Math.round(val / gridSize) * gridSize;
  }, []);

  // Handle Mouse Down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button === 1 || isSpacePressed || activeTool === 'hand') {
        // Pan Canvas
        e.preventDefault();
        setIsPanning(true);
        dragStartRef.current = { x: e.clientX - transform.panX, y: e.clientY - transform.panY };
        return;
      }

      const worldPt = screenToWorld(e.clientX, e.clientY);

      // 1. If placing a shape tool
      const nonShapeTools: string[] = ['select', 'hand', 'eraser', 'connect', 'SEQUENCE_FLOW', 'MESSAGE_FLOW', 'ASSOCIATION'];
      if (!nonShapeTools.includes(activeTool)) {
        const isEvent = activeTool.includes('EVENT');
        const isGateway = activeTool.includes('GATEWAY');
        const isAnnotation = activeTool === 'TEXT_ANNOTATION';
        const width = isEvent ? 50 : isGateway ? 60 : isAnnotation ? 150 : 140;
        const height = isEvent ? 50 : isGateway ? 60 : isAnnotation ? 90 : 80;

        const newNode: BPMNNode = {
          id: `node_${Date.now()}`,
          type: activeTool as BPMNElementType,
          label: getDefaultLabel(activeTool),
          bounds: {
            x: snapGrid ? snapToGridVal(worldPt.x - width / 2) : worldPt.x - width / 2,
            y: snapGrid ? snapToGridVal(worldPt.y - height / 2) : worldPt.y - height / 2,
            width,
            height,
          },
          roughStyle: {
            roughness: activeRoughness,
            stroke: activeStrokeColor,
            strokeWidth: 2,
            fill: isAnnotation ? '#fef9c3' : activeFillColor,
            fillStyle: 'solid',
          },
          properties: {},
        };

        const updated = {
          ...diagram,
          nodes: [...diagram.nodes, newNode],
          lastModified: Date.now(),
        };

        setDiagram(updated);
        pushHistory(updated);
        setSelectedNodeIds([newNode.id]);
        setActiveTool('select');
        return;
      }

      // 2. Eraser Tool
      if (activeTool === 'eraser') {
        const targetNode = diagram.nodes.find((n) => isPointInBounds(worldPt, n.bounds));
        if (targetNode) {
          const updated = {
            ...diagram,
            nodes: diagram.nodes.filter((n) => n.id !== targetNode.id),
            edges: diagram.edges.filter((e) => e.sourceRef !== targetNode.id && e.targetRef !== targetNode.id),
          };
          setDiagram(updated);
          pushHistory(updated);
        }
        return;
      }

      // 3. Anchor Point Click -> Start Connector Draft
      if (hoveredNodeId && hoveredAnchor) {
        setConnectionDraft({
          sourceNodeId: hoveredNodeId,
          sourceAnchor: hoveredAnchor,
          currentPoint: worldPt,
        });
        return;
      }

      // 3.5. Resize Handle Click -> Start Resizing Node
      if (selectedNodeIds.length === 1) {
        const selectedNode = diagram.nodes.find((n) => n.id === selectedNodeIds[0]);
        if (selectedNode) {
          const handleType = getResizeHandleAtPoint(worldPt, selectedNode.bounds, transform.zoom);
          if (handleType) {
            setIsResizingNode(true);
            resizeHandleRef.current = handleType;
            initialResizeBoundsRef.current = { ...selectedNode.bounds };
            dragStartRef.current = worldPt;
            return;
          }
        }
      }

      // 4. Clicked Node Selection & Drag Setup
      const clickedNode = [...diagram.nodes]
        .reverse()
        .find((n) => isPointInBounds(worldPt, n.bounds));

      if (clickedNode) {
        if (e.shiftKey) {
          setSelectedNodeIds((prev) =>
            prev.includes(clickedNode.id) ? prev.filter((id) => id !== clickedNode.id) : [...prev, clickedNode.id]
          );
        } else {
          if (!selectedNodeIds.includes(clickedNode.id)) {
            setSelectedNodeIds([clickedNode.id]);
          }
        }
        setSelectedEdgeIds([]);
        setIsDraggingNode(true);
        dragStartRef.current = worldPt;

        // Save initial positions of all selected nodes for relative movement
        const selectedSet = new Set(
          selectedNodeIds.includes(clickedNode.id) ? selectedNodeIds : [clickedNode.id]
        );
        const map = new Map<string, { x: number; y: number }>();
        diagram.nodes.forEach((n) => {
          if (selectedSet.has(n.id)) {
            map.set(n.id, { x: n.bounds.x, y: n.bounds.y });
          }
        });
        initialNodePositionsRef.current = map;
        return;
      }

      // 5. Clicked Edge
      const clickedEdge = diagram.edges.find((edge) => isPointNearEdge(worldPt, edge));
      if (clickedEdge) {
        setSelectedEdgeIds([clickedEdge.id]);
        setSelectedNodeIds([]);
        return;
      }

      // 6. Clicked Canvas Background -> Start Selection Box (Lasso Multi-Select)
      setIsSelectingBox(true);
      selectionStartPtRef.current = worldPt;
      setSelectionBox({
        x: worldPt.x,
        y: worldPt.y,
        width: 0,
        height: 0,
      });

      if (!e.shiftKey) {
        setSelectedNodeIds([]);
        setSelectedEdgeIds([]);
      }
    },
    [
      activeTool,
      diagram,
      hoveredAnchor,
      hoveredNodeId,
      pushHistory,
      screenToWorld,
      selectedNodeIds,
      setActiveTool,
      setConnectionDraft,
      setDiagram,
      setSelectedEdgeIds,
      setSelectedNodeIds,
      setSelectionBox,
      snapGrid,
      snapToGridVal,
      transform,
      activeRoughness,
      activeStrokeColor,
      activeFillColor,
      isSpacePressed,
    ]
  );

  // Handle Mouse Move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // 1. Panning
      if (isPanning) {
        setTransform((prev) => ({
          ...prev,
          panX: e.clientX - dragStartRef.current.x,
          panY: e.clientY - dragStartRef.current.y,
        }));
        return;
      }

      const worldPt = screenToWorld(e.clientX, e.clientY);

      // 2. Dragging Connection Draft Line
      if (connectionDraft) {
        setConnectionDraft((prev) => (prev ? { ...prev, currentPoint: worldPt } : null));

        // Check if hovering target node to snap connection
        const targetNode = diagram.nodes.find(
          (n) => n.id !== connectionDraft.sourceNodeId && isPointInBounds(worldPt, n.bounds)
        );
        if (targetNode) {
          setHoveredNodeId(targetNode.id);
        }
        return;
      }

      // 3. Selection Box Dragging (Lasso Rectangle)
      if (isSelectingBox && selectionStartPtRef.current) {
        const startPt = selectionStartPtRef.current;
        const minX = Math.min(startPt.x, worldPt.x);
        const minY = Math.min(startPt.y, worldPt.y);
        const width = Math.abs(worldPt.x - startPt.x);
        const height = Math.abs(worldPt.y - startPt.y);

        const box = { x: minX, y: minY, width, height };
        setSelectionBox(box);

        // Filter nodes that overlap selection box
        const selected = diagram.nodes
          .filter((node) => {
            return (
              node.bounds.x < box.x + box.width &&
              node.bounds.x + node.bounds.width > box.x &&
              node.bounds.y < box.y + box.height &&
              node.bounds.y + node.bounds.height > box.y
            );
          })
          .map((n) => n.id);

        if (e.shiftKey) {
          setSelectedNodeIds((prev) => Array.from(new Set([...prev, ...selected])));
        } else {
          setSelectedNodeIds(selected);
        }
        setSelectedEdgeIds([]);
        return;
      }

      // 3.5. Dragging Resize Handle
      if (isResizingNode && resizeHandleRef.current && initialResizeBoundsRef.current && selectedNodeIds.length === 1) {
        const handle = resizeHandleRef.current;
        const initBounds = initialResizeBoundsRef.current;
        const targetNode = diagram.nodes.find((n) => n.id === selectedNodeIds[0]);
        if (!targetNode) return;

        const isEventOrGateway = targetNode.type.includes('EVENT') || targetNode.type.includes('GATEWAY');
        const minW = isEventOrGateway ? 30 : 50;
        const minH = isEventOrGateway ? 30 : 40;

        const dx = worldPt.x - dragStartRef.current.x;
        const dy = worldPt.y - dragStartRef.current.y;

        const rightEdge = initBounds.x + initBounds.width;
        const bottomEdge = initBounds.y + initBounds.height;

        let newX = initBounds.x;
        let newY = initBounds.y;
        let newW = initBounds.width;
        let newH = initBounds.height;

        // Horizontal sizing
        if (handle.includes('e')) {
          const rawW = initBounds.width + dx;
          newW = Math.max(minW, snapGrid ? snapToGridVal(rawW) : rawW);
          newX = initBounds.x;
        } else if (handle.includes('w')) {
          const rawX = initBounds.x + dx;
          const constrainedX = Math.min(rawX, rightEdge - minW);
          newX = snapGrid ? snapToGridVal(constrainedX) : constrainedX;
          newW = rightEdge - newX;
        }

        // Vertical sizing
        if (handle.includes('s')) {
          const rawH = initBounds.height + dy;
          newH = Math.max(minH, snapGrid ? snapToGridVal(rawH) : rawH);
          newY = initBounds.y;
        } else if (handle.includes('n')) {
          const rawY = initBounds.y + dy;
          const constrainedY = Math.min(rawY, bottomEdge - minH);
          newY = snapGrid ? snapToGridVal(constrainedY) : constrainedY;
          newH = bottomEdge - newY;
        }

        const updatedNodes = diagram.nodes.map((node) => {
          if (node.id === targetNode.id) {
            return {
              ...node,
              bounds: {
                x: newX,
                y: newY,
                width: newW,
                height: newH,
              },
            };
          }
          return node;
        });

        const updatedEdges = updateConnectedWaypoints(diagram.edges, updatedNodes);

        setDiagram((prev) => ({
          ...prev,
          nodes: updatedNodes,
          edges: updatedEdges,
        }));

        return;
      }

      // 4. Dragging Selected Nodes
      if (isDraggingNode && initialNodePositionsRef.current.size > 0) {
        const dx = worldPt.x - dragStartRef.current.x;
        const dy = worldPt.y - dragStartRef.current.y;

        const updatedNodes = diagram.nodes.map((node) => {
          const initPos = initialNodePositionsRef.current.get(node.id);
          if (initPos) {
            let newX = initPos.x + dx;
            let newY = initPos.y + dy;

            if (snapGrid) {
              newX = snapToGridVal(newX);
              newY = snapToGridVal(newY);
            }

            return {
              ...node,
              bounds: {
                ...node.bounds,
                x: newX,
                y: newY,
              },
            };
          }
          return node;
        });

        // Auto update connected edge waypoints
        const updatedEdges = updateConnectedWaypoints(diagram.edges, updatedNodes);

        setDiagram((prev) => ({
          ...prev,
          nodes: updatedNodes,
          edges: updatedEdges,
        }));

        // Calculate Smart Guides
        calculateSmartGuides(updatedNodes, selectedNodeIds, setAlignmentGuides);
        return;
      }


      // 4. Hover Detection over Selected Node Resize Handles
      if (selectedNodeIds.length === 1 && !isDraggingNode && !connectionDraft && !isSelectingBox && !isResizingNode) {
        const selectedNode = diagram.nodes.find((n) => n.id === selectedNodeIds[0]);
        if (selectedNode) {
          const handleType = getResizeHandleAtPoint(worldPt, selectedNode.bounds, transform.zoom);
          setHoveredResizeHandle(handleType);
          if (handleType) {
            setHoveredNodeId(null);
            setHoveredAnchor(null);
            return;
          }
        } else {
          setHoveredResizeHandle(null);
        }
      } else {
        setHoveredResizeHandle(null);
      }

      // Hover Detection over Nodes and Anchor Points
      const hovered = [...diagram.nodes].reverse().find((n) => isPointInBounds(worldPt, n.bounds));
      if (hovered) {
        setHoveredNodeId(hovered.id);

        // Check proximity to anchors (strictly close to border anchor circles)
        const anchors = getAnchorPositions(hovered);
        let closestAnchor: 'top' | 'right' | 'bottom' | 'left' | null = null;
        let minDist = Math.min(10, 12 / transform.zoom); // px threshold in world units

        (Object.keys(anchors) as Array<'top' | 'right' | 'bottom' | 'left'>).forEach((key) => {
          const anchorPt = anchors[key];
          const dist = Math.hypot(worldPt.x - anchorPt.x, worldPt.y - anchorPt.y);
          if (dist < minDist) {
            minDist = dist;
            closestAnchor = key;
          }
        });

        setHoveredAnchor(closestAnchor);
      } else {
        setHoveredNodeId(null);
        setHoveredAnchor(null);
      }
    },
    [
      connectionDraft,
      diagram,
      isDraggingNode,
      isResizingNode,
      isPanning,
      isSelectingBox,
      screenToWorld,
      selectedNodeIds,
      setAlignmentGuides,
      setConnectionDraft,
      setDiagram,
      setTransform,
      snapGrid,
      snapToGridVal,
      transform.zoom,
    ]
  );

  // Handle Mouse Up
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isSelectingBox) {
      setIsSelectingBox(false);
      setSelectionBox(null);
      selectionStartPtRef.current = null;
    }

    if (isDraggingNode) {
      setIsDraggingNode(false);
      initialNodePositionsRef.current.clear();
      setAlignmentGuides([]);
      pushHistory(diagram);
    }

    if (isResizingNode) {
      setIsResizingNode(false);
      resizeHandleRef.current = null;
      initialResizeBoundsRef.current = null;
      pushHistory(diagram);
    }

    // Finish Connection Draft (Complete sequence flow creation)
    if (connectionDraft) {
      if (hoveredNodeId && hoveredNodeId !== connectionDraft.sourceNodeId) {
        const sourceNode = diagram.nodes.find((n) => n.id === connectionDraft.sourceNodeId);
        const targetNode = diagram.nodes.find((n) => n.id === hoveredNodeId);

        if (sourceNode && targetNode) {
          const bestAnchors = getBestAnchors(sourceNode, targetNode);
          const sourceAnchor = connectionDraft.sourceAnchor || bestAnchors.sourceAnchor;
          const targetAnchor = hoveredAnchor || bestAnchors.targetAnchor;

          const waypoints = calculateEdgeWaypoints(sourceNode, targetNode, sourceAnchor, targetAnchor, 'orthogonal');

          const newEdge: SequenceFlow = {
            id: `flow_${Date.now()}`,
            type: 'SEQUENCE_FLOW',
            sourceRef: sourceNode.id,
            targetRef: targetNode.id,
            sourceAnchor,
            targetAnchor,
            routingStyle: 'orthogonal',
            lineDash: 'solid',
            waypoints,
            roughStyle: {
              roughness: activeRoughness,
              stroke: '#475569',
              strokeWidth: 2,
              fill: 'none',
              fillStyle: 'solid',
            },
          };

          const updated = {
            ...diagram,
            edges: [...diagram.edges, newEdge],
            lastModified: Date.now(),
          };

          setDiagram(updated);
          pushHistory(updated);
        }
      }

      setConnectionDraft(null);
    }
  }, [
    connectionDraft,
    diagram,
    hoveredNodeId,
    isDraggingNode,
    isPanning,
    isSelectingBox,
    pushHistory,
    setConnectionDraft,
    setDiagram,
    setAlignmentGuides,
    setSelectionBox,
    activeRoughness,
  ]);

  // Handle Wheel Zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setTransform((prev) => {
        const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.2), 3.0);
        return {
          ...prev,
          zoom: newZoom,
        };
      });
    },
    [setTransform]
  );

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    canvasEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvasEl.removeEventListener('wheel', handleWheel);
    };
  }, [canvasRef, handleWheel]);

  // Global window listeners so dragging nodes/panning/selection never gets stuck if cursor moves outside canvas
  useEffect(() => {
    if (!isDraggingNode && !isPanning && !connectionDraft && !isSelectingBox && !isResizingNode) return;

    const onWindowMouseMove = (e: MouseEvent) => {
      const syntheticEvent = {
        clientX: e.clientX,
        clientY: e.clientY,
        shiftKey: e.shiftKey,
      } as React.MouseEvent<HTMLCanvasElement>;
      handleMouseMove(syntheticEvent);
    };

    const onWindowMouseUp = () => {
      handleMouseUp();
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [isDraggingNode, isPanning, connectionDraft, isSelectingBox, isResizingNode, handleMouseMove, handleMouseUp]);


  // Dynamic cursor calculation
  let cursorStyle = 'cursor-default';
  if (isPanning || activeTool === 'hand' || isSpacePressed) {
    cursorStyle = isPanning ? 'cursor-grabbing' : 'cursor-grab';
  } else if (isResizingNode || hoveredResizeHandle) {
    const handle = hoveredResizeHandle || resizeHandleRef.current;
    if (handle === 'nw' || handle === 'se') cursorStyle = 'cursor-nwse-resize';
    else if (handle === 'ne' || handle === 'sw') cursorStyle = 'cursor-nesw-resize';
    else if (handle === 'n' || handle === 's') cursorStyle = 'cursor-ns-resize';
    else if (handle === 'e' || handle === 'w') cursorStyle = 'cursor-ew-resize';
  } else if (isDraggingNode) {
    cursorStyle = 'cursor-grabbing';
  } else if (hoveredAnchor) {
    cursorStyle = 'cursor-pointer';
  } else if (hoveredNodeId && activeTool === 'select') {
    cursorStyle = 'cursor-move';
  } else if (activeTool === 'eraser') {
    cursorStyle = 'cursor-pointer';
  } else if (activeTool !== 'select') {
    cursorStyle = 'cursor-crosshair';
  }

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    hoveredNodeId,
    hoveredAnchor,
    hoveredResizeHandle,
    isDraggingNode,
    isResizingNode,
    cursorStyle,
  };
}

function isPointInBounds(pt: Waypoint, bounds: BPMNNode['bounds']): boolean {
  return (
    pt.x >= bounds.x &&
    pt.x <= bounds.x + bounds.width &&
    pt.y >= bounds.y &&
    pt.y <= bounds.y + bounds.height
  );
}

function isPointNearEdge(pt: Waypoint, edge: SequenceFlow): boolean {
  for (let i = 0; i < edge.waypoints.length - 1; i++) {
    const p1 = edge.waypoints[i];
    const p2 = edge.waypoints[i + 1];
    const dist = distToSegment(pt, p1, p2);
    if (dist < 8) return true;
  }
  return false;
}

function distToSegment(p: Waypoint, v: Waypoint, w: Waypoint) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function updateConnectedWaypoints(edges: SequenceFlow[], nodes: BPMNNode[]): SequenceFlow[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.sourceRef);
    const targetNode = nodeMap.get(edge.targetRef);

    if (sourceNode && targetNode) {
      const waypoints = calculateEdgeWaypoints(
        sourceNode,
        targetNode,
        edge.sourceAnchor,
        edge.targetAnchor,
        edge.routingStyle || 'orthogonal'
      );

      return {
        ...edge,
        waypoints,
      };
    }

    return edge;
  });
}

function calculateSmartGuides(
  nodes: BPMNNode[],
  selectedIds: string[],
  setGuides: (guides: AlignmentGuide[]) => void
) {
  if (selectedIds.length === 0) return;
  const selectedNode = nodes.find((n) => n.id === selectedIds[0]);
  if (!selectedNode) return;

  const guides: AlignmentGuide[] = [];
  const threshold = 5;

  const sCenterX = selectedNode.bounds.x + selectedNode.bounds.width / 2;
  const sCenterY = selectedNode.bounds.y + selectedNode.bounds.height / 2;

  nodes.forEach((other) => {
    if (selectedIds.includes(other.id)) return;

    const oCenterX = other.bounds.x + other.bounds.width / 2;
    const oCenterY = other.bounds.y + other.bounds.height / 2;

    // Vertical alignment (center X)
    if (Math.abs(sCenterX - oCenterX) < threshold) {
      guides.push({
        type: 'vertical',
        position: oCenterX,
        start: Math.min(selectedNode.bounds.y, other.bounds.y) - 20,
        end: Math.max(selectedNode.bounds.y + selectedNode.bounds.height, other.bounds.y + other.bounds.height) + 20,
      });
    }

    // Horizontal alignment (center Y)
    if (Math.abs(sCenterY - oCenterY) < threshold) {
      guides.push({
        type: 'horizontal',
        position: oCenterY,
        start: Math.min(selectedNode.bounds.x, other.bounds.x) - 20,
        end: Math.max(selectedNode.bounds.x + selectedNode.bounds.width, other.bounds.x + other.bounds.width) + 20,
      });
    }
  });

  setGuides(guides);
}

function getDefaultLabel(type: string): string {
  switch (type) {
    case 'START_EVENT': return 'Start Event';
    case 'END_EVENT': return 'End Event';
    case 'USER_TASK': return 'User Task';
    case 'SERVICE_TASK': return 'Service Task';
    case 'SCRIPT_TASK': return 'Script Task';
    case 'GATEWAY_EXCLUSIVE': return 'Gateway (XOR)';
    case 'GATEWAY_PARALLEL': return 'Gateway (AND)';
    case 'TEXT_ANNOTATION': return 'Note: Enter comment...';
    default: return 'New Task';
  }
}
