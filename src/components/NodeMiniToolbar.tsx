import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  diagramAtom,
  transformAtom,
  selectedNodeIdsAtom,
  connectionDraftAtom,
  activeRoughnessAtom,
  activeStrokeColorAtom,
  activeFillColorAtom,
  historyStackAtom,
  historyIndexAtom,
} from '../store/atoms';
import { BPMNElementType, BPMNNode, SequenceFlow } from '../types/bpmn';
import { getAnchorPositions } from '../canvas/bpmnDrawers';
import { calculateEdgeWaypoints } from '../utils/bpmnRouting';
import {
  User,
  Cog,
  GitFork,
  Plus,
  Circle,
  Clock,
  ArrowRight,
  Copy,
  Trash2,
  Box,
  StickyNote,
} from 'lucide-react';

export function NodeMiniToolbar() {
  const [diagram, setDiagram] = useAtom(diagramAtom);
  const [transform] = useAtom(transformAtom);
  const [selectedNodeIds, setSelectedNodeIds] = useAtom(selectedNodeIdsAtom);
  const setConnectionDraft = useSetAtom(connectionDraftAtom);

  const [activeRoughness] = useAtom(activeRoughnessAtom);
  const [activeStrokeColor] = useAtom(activeStrokeColorAtom);
  const [activeFillColor] = useAtom(activeFillColorAtom);

  const [historyStack, setHistoryStack] = useAtom(historyStackAtom);
  const [historyIndex, setHistoryIndex] = useAtom(historyIndexAtom);

  // Show only if exactly 1 node is selected
  if (selectedNodeIds.length !== 1) {
    return null;
  }

  const selectedNode = diagram.nodes.find((n) => n.id === selectedNodeIds[0]);
  if (!selectedNode) {
    return null;
  }

  const pushHistory = (newDiagram: typeof diagram) => {
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newDiagram);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  // Convert node world bounds to screen coordinates
  const nodeScreenX = selectedNode.bounds.x * transform.zoom + transform.panX;
  const nodeScreenY = selectedNode.bounds.y * transform.zoom + transform.panY;
  const nodeScreenWidth = selectedNode.bounds.width * transform.zoom;

  // Screen positioning for mini toolbar floating above selected node
  const toolbarLeft = nodeScreenX + nodeScreenWidth / 2;
  const toolbarTop = Math.max(16, nodeScreenY - 12);

  // Function to create a new connected node and edge
  const handleAppendNode = (targetType: BPMNElementType, defaultLabel: string) => {
    const isEvent = targetType.includes('EVENT');
    const isGateway = targetType.includes('GATEWAY');
    const isAnnotation = targetType === 'TEXT_ANNOTATION';

    const newWidth = isEvent ? 50 : isGateway ? 60 : isAnnotation ? 150 : 140;
    const newHeight = isEvent ? 50 : isGateway ? 60 : isAnnotation ? 90 : 80;

    // Position 130px to the right of selected node
    let newX = selectedNode.bounds.x + selectedNode.bounds.width + 120;
    let newY = selectedNode.bounds.y + (selectedNode.bounds.height - newHeight) / 2;

    // Shift down if another node overlaps
    const hasOverlap = diagram.nodes.some(
      (n) => Math.abs(n.bounds.x - newX) < 80 && Math.abs(n.bounds.y - newY) < 60
    );
    if (hasOverlap) {
      newY += selectedNode.bounds.height + 40;
    }

    const newNode: BPMNNode = {
      id: `node_${Date.now()}`,
      type: targetType,
      label: defaultLabel,
      bounds: { x: newX, y: newY, width: newWidth, height: newHeight },
      roughStyle: {
        roughness: activeRoughness,
        stroke: activeStrokeColor,
        strokeWidth: 2,
        fill: isAnnotation ? '#fef9c3' : activeFillColor,
        fillStyle: 'solid',
      },
      properties: {},
    };

    const waypoints = calculateEdgeWaypoints(
      selectedNode,
      newNode,
      'right',
      'left',
      'orthogonal'
    );

    const newEdge: SequenceFlow = {
      id: `flow_${Date.now()}`,
      type: isAnnotation ? 'ASSOCIATION' : 'SEQUENCE_FLOW',
      sourceRef: selectedNode.id,
      targetRef: newNode.id,
      sourceAnchor: 'right',
      targetAnchor: 'left',
      routingStyle: 'orthogonal',
      lineDash: isAnnotation ? 'dotted' : 'solid',
      waypoints,
      roughStyle: {
        roughness: activeRoughness,
        stroke: '#475569',
        strokeWidth: 2,
        fill: 'none',
        fillStyle: 'solid',
      },
    };

    const updatedDiagram = {
      ...diagram,
      nodes: [...diagram.nodes, newNode],
      edges: [...diagram.edges, newEdge],
      lastModified: Date.now(),
    };

    setDiagram(updatedDiagram);
    pushHistory(updatedDiagram);
    setSelectedNodeIds([newNode.id]);
  };

  const handleStartConnection = () => {
    const rightAnchor = getAnchorPositions(selectedNode)['right'];
    setConnectionDraft({
      sourceNodeId: selectedNode.id,
      sourceAnchor: 'right',
      currentPoint: rightAnchor,
    });
  };

  const handleDuplicate = () => {
    const newNode: BPMNNode = {
      ...selectedNode,
      id: `node_${Date.now()}`,
      bounds: {
        ...selectedNode.bounds,
        x: selectedNode.bounds.x + 30,
        y: selectedNode.bounds.y + 30,
      },
    };
    const updated = {
      ...diagram,
      nodes: [...diagram.nodes, newNode],
      lastModified: Date.now(),
    };
    setDiagram(updated);
    pushHistory(updated);
    setSelectedNodeIds([newNode.id]);
  };

  const handleDelete = () => {
    const updated = {
      ...diagram,
      nodes: diagram.nodes.filter((n) => n.id !== selectedNode.id),
      edges: diagram.edges.filter((e) => e.sourceRef !== selectedNode.id && e.targetRef !== selectedNode.id),
      lastModified: Date.now(),
    };
    setDiagram(updated);
    pushHistory(updated);
    setSelectedNodeIds([]);
  };

  const quickNodeOptions: Array<{
    type: BPMNElementType;
    label: string;
    icon: React.ReactNode;
    title: string;
  }> = [
    { type: 'USER_TASK', label: 'User Task', icon: <User className="w-3.5 h-3.5 text-blue-500" />, title: 'Add User Task' },
    { type: 'SERVICE_TASK', label: 'Service Task', icon: <Cog className="w-3.5 h-3.5 text-emerald-500" />, title: 'Add Service Task' },
    { type: 'GATEWAY_EXCLUSIVE', label: 'XOR Gateway', icon: <GitFork className="w-3.5 h-3.5 text-amber-500" />, title: 'Add Exclusive Gateway' },
    { type: 'GATEWAY_PARALLEL', label: 'AND Gateway', icon: <Plus className="w-3.5 h-3.5 text-indigo-500" />, title: 'Add Parallel Gateway' },
    { type: 'TEXT_ANNOTATION', label: 'Sticky Note', icon: <StickyNote className="w-3.5 h-3.5 text-amber-500" />, title: 'Add Sticky Note Annotation' },
    { type: 'END_EVENT', label: 'End Event', icon: <Circle className="w-3.5 h-3.5 text-rose-500 fill-rose-100" />, title: 'Add End Event' },
    { type: 'INTERMEDIATE_CATCH_EVENT', label: 'Timer Event', icon: <Clock className="w-3.5 h-3.5 text-purple-500" />, title: 'Add Timer Event' },
  ];

  return (
    <div
      className="absolute pointer-events-auto z-40 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-2xl transition-all duration-150 select-none animate-in fade-in zoom-in-95"
      style={{
        left: `${toolbarLeft}px`,
        top: `${toolbarTop}px`,
        transform: 'translate(-50%, -100%)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Node Type Badge */}
      <div className="flex items-center space-x-1 px-2 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
        <Box className="w-3 h-3 text-indigo-500" />
        <span className="truncate max-w-[80px]">{selectedNode.label || selectedNode.type}</span>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

      {/* Quick Add Flow Buttons */}
      <div className="flex items-center gap-1">
        {quickNodeOptions.map((opt) => (
          <button
            key={opt.type}
            onClick={() => handleAppendNode(opt.type, opt.label)}
            className="group relative p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hover:scale-105 active:scale-95 text-slate-700 dark:text-slate-200"
            title={`${opt.title} (Auto-Connect)`}
          >
            {opt.icon}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-0.5 bg-slate-900 text-white text-[10px] font-medium rounded-md whitespace-nowrap shadow-md z-50 pointer-events-none">
              + {opt.label}
            </span>
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

      {/* Actions: Connect, Duplicate, Delete */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleStartConnection}
          className="group relative p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all hover:scale-105 active:scale-95"
          title="Draw Flow Line from Right Anchor"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-0.5 bg-slate-900 text-white text-[10px] font-medium rounded-md whitespace-nowrap shadow-md z-50 pointer-events-none">
            Connect Flow
          </span>
        </button>

        <button
          onClick={handleDuplicate}
          className="group relative p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition-all hover:scale-105 active:scale-95"
          title="Duplicate Node"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-0.5 bg-slate-900 text-white text-[10px] font-medium rounded-md whitespace-nowrap shadow-md z-50 pointer-events-none">
            Duplicate
          </span>
        </button>

        <button
          onClick={handleDelete}
          className="group relative p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-all hover:scale-105 active:scale-95"
          title="Delete Node"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-0.5 bg-slate-900 text-white text-[10px] font-medium rounded-md whitespace-nowrap shadow-md z-50 pointer-events-none">
            Delete
          </span>
        </button>
      </div>
    </div>
  );
}
