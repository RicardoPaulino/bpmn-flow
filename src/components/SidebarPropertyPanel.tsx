import React from 'react';
import { useAtom } from 'jotai';
import {
  diagramAtom,
  selectedNodeIdsAtom,
  selectedEdgeIdsAtom,
  historyStackAtom,
  historyIndexAtom,
} from '../store/atoms';
import { EventDefinitionType } from '../types/bpmn';
import { getAnchorPositions } from '../canvas/bpmnDrawers';
import { calculateEdgeWaypoints, getBestAnchors } from '../utils/bpmnRouting';
import { applyAutoLayout } from '../utils/bpmnAutoLayout';
import {
  X,
  Trash2,
  Tag,
  FileText,
  Sliders,
  Palette,
  Code2,
  Clock,
  Send,
  GitBranch,
  LayoutGrid,
  Sparkles,
  Spline,
  MoveRight,
  MoveDown,
  Wand2,
  Compass,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
} from 'lucide-react';

export function SidebarPropertyPanel() {
  const [diagram, setDiagram] = useAtom(diagramAtom);
  const [selectedNodeIds, setSelectedNodeIds] = useAtom(selectedNodeIdsAtom);
  const [selectedEdgeIds, setSelectedEdgeIds] = useAtom(selectedEdgeIdsAtom);
  const [historyStack, setHistoryStack] = useAtom(historyStackAtom);
  const [historyIndex, setHistoryIndex] = useAtom(historyIndexAtom);

  const selectedNode = diagram.nodes.find((n) => selectedNodeIds.includes(n.id));
  const selectedEdge = diagram.edges.find((e) => selectedEdgeIds.includes(e.id));

  if (!selectedNode && !selectedEdge) return null;

  const pushHistory = (newDiagram: typeof diagram) => {
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newDiagram);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  const handleNodeUpdate = (fields: Partial<typeof selectedNode>) => {
    if (selectedNodeIds.length === 0) return;
    const selectedSet = new Set(selectedNodeIds);
    const updatedNodes = diagram.nodes.map((node) => {
      if (selectedSet.has(node.id)) {
        if (fields.roughStyle && node.roughStyle) {
          return {
            ...node,
            ...fields,
            roughStyle: {
              ...node.roughStyle,
              ...fields.roughStyle,
            },
          };
        }
        return { ...node, ...fields };
      }
      return node;
    });

    const updated = { ...diagram, nodes: updatedNodes, lastModified: Date.now() };
    setDiagram(updated);
  };

  const handleEdgeUpdate = (fields: Partial<typeof selectedEdge>) => {
    if (!selectedEdge) return;
    const updatedEdges = diagram.edges.map((edge) => {
      if (edge.id === selectedEdge.id) {
        const mergedEdge = { ...edge, ...fields };
        const sourceNode = diagram.nodes.find((n) => n.id === mergedEdge.sourceRef);
        const targetNode = diagram.nodes.find((n) => n.id === mergedEdge.targetRef);

        if (sourceNode && targetNode) {
          mergedEdge.waypoints = calculateEdgeWaypoints(
            sourceNode,
            targetNode,
            mergedEdge.sourceAnchor,
            mergedEdge.targetAnchor,
            mergedEdge.routingStyle || 'orthogonal'
          );
        }
        return mergedEdge;
      }
      return edge;
    });

    const updated = { ...diagram, edges: updatedEdges, lastModified: Date.now() };
    setDiagram(updated);
  };

  const handleAutoReanchor = () => {
    if (!selectedEdge) return;
    const sourceNode = diagram.nodes.find((n) => n.id === selectedEdge.sourceRef);
    const targetNode = diagram.nodes.find((n) => n.id === selectedEdge.targetRef);
    if (!sourceNode || !targetNode) return;

    const { sourceAnchor, targetAnchor } = getBestAnchors(sourceNode, targetNode);
    handleEdgeUpdate({ sourceAnchor, targetAnchor });
  };

  const handleDelete = () => {
    if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
      const updatedNodes = diagram.nodes.filter((n) => !selectedNodeIds.includes(n.id));
      const updatedEdges = diagram.edges.filter(
        (e) =>
          !selectedEdgeIds.includes(e.id) &&
          !selectedNodeIds.includes(e.sourceRef) &&
          !selectedNodeIds.includes(e.targetRef)
      );

      const updated = {
        ...diagram,
        nodes: updatedNodes,
        edges: updatedEdges,
        lastModified: Date.now(),
      };

      setDiagram(updated);
      pushHistory(updated);
      setSelectedNodeIds([]);
      setSelectedEdgeIds([]);
    }
  };

  const handleAlignNodes = (
    alignment: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom' | 'distribute-h' | 'distribute-v'
  ) => {
    if (selectedNodeIds.length < 2) return;

    const targetNodes = diagram.nodes.filter((n) => selectedNodeIds.includes(n.id));
    if (targetNodes.length < 2) return;

    const minX = Math.min(...targetNodes.map((n) => n.bounds.x));
    const maxX = Math.max(...targetNodes.map((n) => n.bounds.x + n.bounds.width));
    const minY = Math.min(...targetNodes.map((n) => n.bounds.y));
    const maxY = Math.max(...targetNodes.map((n) => n.bounds.y + n.bounds.height));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    let updatedNodes = diagram.nodes.map((node) => {
      if (!selectedNodeIds.includes(node.id)) return node;

      let newX = node.bounds.x;
      let newY = node.bounds.y;

      if (alignment === 'left') {
        newX = minX;
      } else if (alignment === 'center-x') {
        newX = centerX - node.bounds.width / 2;
      } else if (alignment === 'right') {
        newX = maxX - node.bounds.width;
      } else if (alignment === 'top') {
        newY = minY;
      } else if (alignment === 'center-y') {
        newY = centerY - node.bounds.height / 2;
      } else if (alignment === 'bottom') {
        newY = maxY - node.bounds.height;
      }

      return {
        ...node,
        bounds: {
          ...node.bounds,
          x: newX,
          y: newY,
        },
      };
    });

    if (alignment === 'distribute-h' && targetNodes.length > 2) {
      const sorted = [...targetNodes].sort((a, b) => a.bounds.x - b.bounds.x);
      const totalWidths = sorted.reduce((sum, n) => sum + n.bounds.width, 0);
      const totalSpan = maxX - minX;
      const remainingSpace = totalSpan - totalWidths;
      const gap = remainingSpace / (sorted.length - 1);

      let currentX = minX;
      const xPosMap = new Map<string, number>();
      sorted.forEach((n) => {
        xPosMap.set(n.id, currentX);
        currentX += n.bounds.width + gap;
      });

      updatedNodes = updatedNodes.map((n) => {
        if (xPosMap.has(n.id)) {
          return {
            ...n,
            bounds: { ...n.bounds, x: xPosMap.get(n.id)! },
          };
        }
        return n;
      });
    } else if (alignment === 'distribute-v' && targetNodes.length > 2) {
      const sorted = [...targetNodes].sort((a, b) => a.bounds.y - b.bounds.y);
      const totalHeights = sorted.reduce((sum, n) => sum + n.bounds.height, 0);
      const totalSpan = maxY - minY;
      const remainingSpace = totalSpan - totalHeights;
      const gap = remainingSpace / (sorted.length - 1);

      let currentY = minY;
      const yPosMap = new Map<string, number>();
      sorted.forEach((n) => {
        yPosMap.set(n.id, currentY);
        currentY += n.bounds.height + gap;
      });

      updatedNodes = updatedNodes.map((n) => {
        if (yPosMap.has(n.id)) {
          return {
            ...n,
            bounds: { ...n.bounds, y: yPosMap.get(n.id)! },
          };
        }
        return n;
      });
    }

    const updatedEdges = diagram.edges.map((edge) => {
      const srcNode = updatedNodes.find((n) => n.id === edge.sourceRef);
      const tgtNode = updatedNodes.find((n) => n.id === edge.targetRef);

      if (
        srcNode &&
        tgtNode &&
        (selectedNodeIds.includes(edge.sourceRef) || selectedNodeIds.includes(edge.targetRef))
      ) {
        const srcAnchors = getAnchorPositions(srcNode);
        const tgtAnchors = getAnchorPositions(tgtNode);
        const srcPt = srcAnchors[edge.sourceAnchor || 'right'];
        const tgtPt = tgtAnchors[edge.targetAnchor || 'left'];

        return {
          ...edge,
          waypoints: [srcPt, tgtPt],
        };
      }
      return edge;
    });

    const updatedDiagram = {
      ...diagram,
      nodes: updatedNodes,
      edges: updatedEdges,
      lastModified: Date.now(),
    };

    setDiagram(updatedDiagram);
    pushHistory(updatedDiagram);
  };

  const handleAutoLayoutFlow = (direction: 'horizontal' | 'vertical') => {
    const updated = applyAutoLayout(diagram, {
      direction,
      nodeIdsToLayout: selectedNodeIds,
    });
    setDiagram(updated);
    pushHistory(updated);
  };

  const SKETCH_PALETTES = [
    {
      id: 'graphite',
      name: 'Graphite',
      stroke: '#334155',
      fill: '#f8fafc',
      label: 'Muted Slate & Parchment',
    },
    {
      id: 'cobalt',
      name: 'Cobalt',
      stroke: '#1e40af',
      fill: '#eff6ff',
      label: 'Blueprint Ink & Ice',
    },
    {
      id: 'sage',
      name: 'Sage Moss',
      stroke: '#166534',
      fill: '#f0fdf4',
      label: 'Botanical Pine & Mint',
    },
    {
      id: 'terracotta',
      name: 'Terracotta',
      stroke: '#9a3412',
      fill: '#fff7ed',
      label: 'Earthy Clay & Cream',
    },
    {
      id: 'sepia',
      name: 'Sepia Gold',
      stroke: '#854d0e',
      fill: '#fefce8',
      label: 'Parchment Gold',
    },
    {
      id: 'plum',
      name: 'Plum Indigo',
      stroke: '#5b21b6',
      fill: '#f5f3ff',
      label: 'Plum & Soft Lavender',
    },
    {
      id: 'rosewood',
      name: 'Dusty Rose',
      stroke: '#9f1239',
      fill: '#fff1f2',
      label: 'Muted Rose & Blush',
    },
    {
      id: 'charcoal',
      name: 'Charcoal',
      stroke: '#0f172a',
      fill: '#e2e8f0',
      label: 'Midnight Slate',
    },
  ];

  const DESATURATED_STROKES = [
    { name: 'Graphite', hex: '#334155' },
    { name: 'Blueprint', hex: '#1e40af' },
    { name: 'Sage', hex: '#166534' },
    { name: 'Terracotta', hex: '#9a3412' },
    { name: 'Sepia', hex: '#854d0e' },
    { name: 'Plum', hex: '#5b21b6' },
    { name: 'Rosewood', hex: '#9f1239' },
    { name: 'Charcoal', hex: '#0f172a' },
  ];

  const DESATURATED_FILLS = [
    { name: 'Parchment', hex: '#f8fafc' },
    { name: 'Ice', hex: '#eff6ff' },
    { name: 'Mint', hex: '#f0fdf4' },
    { name: 'Cream', hex: '#fff7ed' },
    { name: 'Gold', hex: '#fefce8' },
    { name: 'Lavender', hex: '#f5f3ff' },
    { name: 'Blush', hex: '#fff1f2' },
    { name: 'Pure White', hex: '#ffffff' },
  ];

  const HATCH_STYLES = [
    { id: 'hachure', label: 'Hachure' },
    { id: 'cross-hatch', label: 'Cross-hatch' },
    { id: 'zigzag', label: 'Zigzag' },
    { id: 'dots', label: 'Dotted' },
    { id: 'solid', label: 'Solid' },
  ];

  return (
    <aside className="absolute top-16 right-4 bottom-4 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-20 flex flex-col overflow-hidden text-xs select-none">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {selectedNodeIds.length > 1
              ? `Batch Selected (${selectedNodeIds.length} Elements)`
              : selectedNode
              ? 'Element Properties'
              : 'Sequence Flow'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleDelete}
            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
            title="Delete Selected"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedNodeIds([]);
              setSelectedEdgeIds([]);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Node Properties */}
        {selectedNode && (
          <>
            {/* ID & Type Badge */}
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-mono text-[10px] text-slate-400">{selectedNode.id}</span>
                <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                  {selectedNode.type}
                </span>
              </div>
            </div>

            {/* Label / Name */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Element Name / Label</span>
              </label>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) => handleNodeUpdate({ label: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Event Definition Config (for Events) */}
            {selectedNode.type.includes('EVENT') && (
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Event Definition Marker</span>
                </label>
                <select
                  value={selectedNode.eventDefinition || 'none'}
                  onChange={(e) => handleNodeUpdate({ eventDefinition: e.target.value as EventDefinitionType })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None (Standard)</option>
                  <option value="message">Message Event</option>
                  <option value="timer">Timer Event</option>
                  <option value="error">Error Event</option>
                  <option value="signal">Signal Event</option>
                </select>
              </div>
            )}

            {/* Documentation / Notes */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Documentation / SOP Notes</span>
              </label>
              <textarea
                value={selectedNode.documentation || ''}
                onChange={(e) => handleNodeUpdate({ documentation: e.target.value })}
                rows={3}
                placeholder="Add operational notes or business description..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Auto Layout Flow Section */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Automatic Flow Layout</span>
                </div>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                  {selectedNodeIds.length >= 2 ? `${selectedNodeIds.length} Selected` : 'Entire Diagram'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleAutoLayoutFlow('horizontal')}
                  title="Auto-arrange nodes left to right based on process sequence"
                  className="p-2 flex flex-col items-center justify-center bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded-xl transition-all shadow-2xs group"
                >
                  <div className="flex items-center space-x-1 font-semibold text-xs">
                    <MoveRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                    <span>Horizontal Flow</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Left to Right</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAutoLayoutFlow('vertical')}
                  title="Auto-arrange nodes top to bottom based on process sequence"
                  className="p-2 flex flex-col items-center justify-center bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-xl transition-all shadow-2xs group"
                >
                  <div className="flex items-center space-x-1 font-semibold text-xs">
                    <MoveDown className="w-4 h-4 text-emerald-500 group-hover:translate-y-0.5 transition-transform" />
                    <span>Vertical Flow</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Top to Bottom</span>
                </button>
              </div>
            </div>

            {/* Auto Align & Distribute Section */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
                  <span>Align & Distribute Nodes</span>
                </div>
                {selectedNodeIds.length > 1 && (
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                    {selectedNodeIds.length} Nodes
                  </span>
                )}
              </div>

              {selectedNodeIds.length < 2 && (
                <p className="text-[11px] text-slate-400 italic">
                  Select 2+ nodes (drag canvas lasso or Shift+click) to align.
                </p>
              )}

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  disabled={selectedNodeIds.length < 2}
                  onClick={() => handleAlignNodes('left')}
                  title="Align Left"
                  className="p-1.5 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="2" x2="4" y2="22" />
                    <rect x="8" y="5" width="12" height="5" rx="1" fill="currentColor" fillOpacity="0.2" />
                    <rect x="8" y="14" width="8" height="5" rx="1" fill="currentColor" fillOpacity="0.2" />
                  </svg>
                  <span className="text-[9px] mt-1 font-medium">Left</span>
                </button>

                <button
                  disabled={selectedNodeIds.length < 2}
                  onClick={() => handleAlignNodes('center-x')}
                  title="Align Horizontal Center"
                  className="p-1.5 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" />
                    <rect x="5" y="5" width="14" height="5" rx="1" fill="currentColor" fillOpacity="0.2" />
                    <rect x="7" y="14" width="10" height="5" rx="1" fill="currentColor" fillOpacity="0.2" />
                  </svg>
                  <span className="text-[9px] mt-1 font-medium">Center X</span>
                </button>

                <button
                  disabled={selectedNodeIds.length < 2}
                  onClick={() => handleAlignNodes('right')}
                  title="Align Right"
                  className="p-1.5 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="20" y1="2" x2="20" y2="22" />
                    <rect x="4" y="5" width="12" height="5" rx="1" fill="currentColor" fillOpacity="0.2" />
                    <rect x="8" y="14" width="8" height="5" rx="1" fill="currentColor" fillOpacity="0.2" />
                  </svg>
                  <span className="text-[9px] mt-1 font-medium">Right</span>
                </button>

                <button
                  disabled={selectedNodeIds.length < 2}
                  onClick={() => handleAlignNodes('top')}
                  title="Align Top"
                  className="p-1.5 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="4" x2="22" y2="4" />
                    <rect x="5" y="8" width="5" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
                    <rect x="14" y="8" width="5" height="8" rx="1" fill="currentColor" fillOpacity="0.2" />
                  </svg>
                  <span className="text-[9px] mt-1 font-medium">Top</span>
                </button>

                <button
                  disabled={selectedNodeIds.length < 2}
                  onClick={() => handleAlignNodes('center-y')}
                  title="Align Vertical Center"
                  className="p-1.5 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="2 2" />
                    <rect x="5" y="5" width="5" height="14" rx="1" fill="currentColor" fillOpacity="0.2" />
                    <rect x="14" y="7" width="5" height="10" rx="1" fill="currentColor" fillOpacity="0.2" />
                  </svg>
                  <span className="text-[9px] mt-1 font-medium">Center Y</span>
                </button>

                <button
                  disabled={selectedNodeIds.length < 2}
                  onClick={() => handleAlignNodes('bottom')}
                  title="Align Bottom"
                  className="p-1.5 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="20" x2="22" y2="20" />
                    <rect x="5" y="4" width="5" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
                    <rect x="14" y="8" width="5" height="8" rx="1" fill="currentColor" fillOpacity="0.2" />
                  </svg>
                  <span className="text-[9px] mt-1 font-medium">Bottom</span>
                </button>

                <button
                  disabled={selectedNodeIds.length < 3}
                  onClick={() => handleAlignNodes('distribute-h')}
                  title="Distribute Horizontally (Requires 3+ nodes)"
                  className="p-1.5 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="6" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
                    <rect x="10" y="6" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
                    <rect x="17" y="6" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
                  </svg>
                  <span className="text-[9px] mt-1 font-medium">Space H</span>
                </button>

                <button
                  disabled={selectedNodeIds.length < 3}
                  onClick={() => handleAlignNodes('distribute-v')}
                  title="Distribute Vertically (Requires 3+ nodes)"
                  className="p-1.5 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:hover:bg-slate-50 dark:disabled:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="3" width="12" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
                    <rect x="6" y="10" width="12" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
                    <rect x="6" y="17" width="12" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
                  </svg>
                  <span className="text-[9px] mt-1 font-medium">Space V</span>
                </button>
              </div>
            </div>

            {/* Visual Styling */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Artistic Sketch Styling</span>
                </div>
                <span className="text-[10px] uppercase font-mono text-slate-400">Hand-Drawn</span>
              </div>

              {/* Preset Sketch Palettes */}
              <div>
                <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Artisan Color Palettes
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SKETCH_PALETTES.map((p) => {
                    const isSelected =
                      selectedNode.roughStyle.stroke === p.stroke && selectedNode.roughStyle.fill === p.fill;
                    return (
                      <button
                        key={p.id}
                        onClick={() =>
                          handleNodeUpdate({
                            roughStyle: {
                              ...selectedNode.roughStyle,
                              stroke: p.stroke,
                              fill: p.fill,
                            },
                          })
                        }
                        className={`p-1.5 rounded-lg border text-left transition-all flex items-center space-x-2 ${
                          isSelected
                            ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-md border-2 shrink-0 shadow-2xs"
                          style={{ borderColor: p.stroke, backgroundColor: p.fill }}
                        />
                        <div className="truncate min-w-0">
                          <div className="font-semibold text-[11px] text-slate-700 dark:text-slate-200 truncate">
                            {p.name}
                          </div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{p.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Individual Stroke Color Swatches */}
              <div>
                <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Muted Ink Stroke
                </span>
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                  {DESATURATED_STROKES.map((s) => (
                    <button
                      key={s.hex}
                      onClick={() =>
                        handleNodeUpdate({
                          roughStyle: {
                            ...selectedNode.roughStyle,
                            stroke: s.hex,
                          },
                        })
                      }
                      title={s.name}
                      className={`w-6 h-6 rounded-md border transition-transform shrink-0 flex items-center justify-center ${
                        selectedNode.roughStyle.stroke === s.hex
                          ? 'scale-110 ring-2 ring-indigo-500 border-white'
                          : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: s.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Individual Paper Fill Swatches */}
              <div>
                <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Desaturated Fill Wash
                </span>
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                  {DESATURATED_FILLS.map((f) => (
                    <button
                      key={f.hex}
                      onClick={() =>
                        handleNodeUpdate({
                          roughStyle: {
                            ...selectedNode.roughStyle,
                            fill: f.hex,
                          },
                        })
                      }
                      title={f.name}
                      className={`w-6 h-6 rounded-md border transition-transform shrink-0 ${
                        selectedNode.roughStyle.fill === f.hex
                          ? 'scale-110 ring-2 ring-indigo-500 border-indigo-600'
                          : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: f.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Fill Hatch Style */}
              <div>
                <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Hatch Fill Style
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {HATCH_STYLES.map((h) => {
                    const isSelected = selectedNode.roughStyle.fillStyle === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() =>
                          handleNodeUpdate({
                            roughStyle: {
                              ...selectedNode.roughStyle,
                              fillStyle: h.id as any,
                            },
                          })
                        }
                        className={`px-2 py-1 text-[10px] font-medium rounded-md border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {h.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Roughness Slider */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  <span>Sketch Roughness</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {selectedNode.roughStyle.roughness === 0
                      ? '0 (Vector Clean)'
                      : selectedNode.roughStyle.roughness <= 1.5
                      ? `${selectedNode.roughStyle.roughness} (Hand Sketch)`
                      : `${selectedNode.roughStyle.roughness} (Rough Chalk)`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.5"
                  value={selectedNode.roughStyle.roughness}
                  onChange={(e) =>
                    handleNodeUpdate({
                      roughStyle: {
                        ...selectedNode.roughStyle,
                        roughness: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </>
        )}

        {/* Edge Properties */}
        {selectedEdge && (
          <>
            <div>
              <span className="font-mono text-[10px] text-slate-400">{selectedEdge.id}</span>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Flow Label</span>
              </label>
              <input
                type="text"
                value={selectedEdge.label || ''}
                onChange={(e) => handleEdgeUpdate({ label: e.target.value })}
                placeholder="e.g., Approved / Yes"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1 flex items-center space-x-1">
                <GitBranch className="w-3.5 h-3.5 text-amber-500" />
                <span>Condition Expression</span>
              </label>
              <input
                type="text"
                value={selectedEdge.conditionExpression || ''}
                onChange={(e) => handleEdgeUpdate({ conditionExpression: e.target.value })}
                placeholder="${amount >= 1000}"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Line Routing Type */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Spline className="w-3.5 h-3.5 text-blue-500" />
                <span>Line Routing & Geometry</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleEdgeUpdate({ routingStyle: 'orthogonal' })}
                  className={`p-2 flex flex-col items-center justify-center rounded-xl border text-[11px] font-medium transition-all ${
                    (selectedEdge.routingStyle || 'orthogonal') === 'orthogonal'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <svg className="w-4 h-4 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h8v12h8" />
                  </svg>
                  <span>Orthogonal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEdgeUpdate({ routingStyle: 'straight' })}
                  className={`p-2 flex flex-col items-center justify-center rounded-xl border text-[11px] font-medium transition-all ${
                    selectedEdge.routingStyle === 'straight'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <MoveRight className="w-4 h-4 mb-1" />
                  <span>Straight</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEdgeUpdate({ routingStyle: 'curved' })}
                  className={`p-2 flex flex-col items-center justify-center rounded-xl border text-[11px] font-medium transition-all ${
                    selectedEdge.routingStyle === 'curved'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Spline className="w-4 h-4 mb-1" />
                  <span>Curved</span>
                </button>
              </div>
            </div>

            {/* Line Stroke Style */}
            <div className="pt-2 space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                <span>Line Stroke Pattern</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleEdgeUpdate({ lineDash: 'solid' })}
                  className={`p-1.5 flex flex-col items-center justify-center rounded-xl border text-[10px] font-medium transition-all ${
                    (selectedEdge.lineDash || (selectedEdge.type === 'MESSAGE_FLOW' ? 'dashed' : selectedEdge.type === 'ASSOCIATION' ? 'dotted' : 'solid')) === 'solid'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="w-8 h-0.5 bg-current my-1 rounded-full" />
                  <span>Solid</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEdgeUpdate({ lineDash: 'dashed' })}
                  className={`p-1.5 flex flex-col items-center justify-center rounded-xl border text-[10px] font-medium transition-all ${
                    (selectedEdge.lineDash || (selectedEdge.type === 'MESSAGE_FLOW' ? 'dashed' : selectedEdge.type === 'ASSOCIATION' ? 'dotted' : 'solid')) === 'dashed'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="w-8 h-0.5 my-1 border-t-2 border-dashed border-current" />
                  <span>Dashed</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEdgeUpdate({ lineDash: 'dotted' })}
                  className={`p-1.5 flex flex-col items-center justify-center rounded-xl border text-[10px] font-medium transition-all ${
                    (selectedEdge.lineDash || (selectedEdge.type === 'MESSAGE_FLOW' ? 'dashed' : selectedEdge.type === 'ASSOCIATION' ? 'dotted' : 'solid')) === 'dotted'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="w-8 h-0.5 my-1 border-t-2 border-dotted border-current" />
                  <span>Dotted</span>
                </button>
              </div>
            </div>

            {/* Node Attachment Anchors Section */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  <span>Connection Anchor Fixation</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoReanchor}
                  title="Auto-calculate best anchors based on relative node position"
                  className="px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center space-x-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Smart Fix</span>
                </button>
              </div>

              {/* Source Anchor Selector */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/70">
                <span className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                  <span>Source Anchor (Output)</span>
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {(['top', 'right', 'bottom', 'left'] as const).map((anchor) => {
                    const active = (selectedEdge.sourceAnchor || 'right') === anchor;
                    const Icon = anchor === 'top' ? ArrowUp : anchor === 'right' ? ArrowRight : anchor === 'bottom' ? ArrowDown : ArrowLeft;
                    return (
                      <button
                        key={`src-${anchor}`}
                        type="button"
                        onClick={() => handleEdgeUpdate({ sourceAnchor: anchor })}
                        className={`p-1.5 flex flex-col items-center justify-center rounded-lg border text-[10px] capitalize transition-all ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="mt-0.5">{anchor}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Anchor Selector */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/70">
                <span className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Target Anchor (Input)</span>
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {(['top', 'right', 'bottom', 'left'] as const).map((anchor) => {
                    const active = (selectedEdge.targetAnchor || 'left') === anchor;
                    const Icon = anchor === 'top' ? ArrowUp : anchor === 'right' ? ArrowRight : anchor === 'bottom' ? ArrowDown : ArrowLeft;
                    return (
                      <button
                        key={`tgt-${anchor}`}
                        type="button"
                        onClick={() => handleEdgeUpdate({ targetAnchor: anchor })}
                        className={`p-1.5 flex flex-col items-center justify-center rounded-lg border text-[10px] capitalize transition-all ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="mt-0.5">{anchor}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Edge Sketch Styling */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
                <span>Flow Line Ink & Sketch</span>
              </div>

              <div>
                <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Ink Stroke Color
                </span>
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                  {DESATURATED_STROKES.map((s) => (
                    <button
                      key={s.hex}
                      type="button"
                      onClick={() =>
                        handleEdgeUpdate({
                          roughStyle: {
                            ...(selectedEdge.roughStyle || {
                              roughness: 1.2,
                              strokeWidth: 2,
                              fill: '#ffffff',
                              fillStyle: 'hachure',
                            }),
                            stroke: s.hex,
                          },
                        })
                      }
                      title={s.name}
                      className={`w-6 h-6 rounded-md border transition-transform shrink-0 ${
                        selectedEdge.roughStyle?.stroke === s.hex
                          ? 'scale-110 ring-2 ring-indigo-500 border-white'
                          : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: s.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  <span>Line Roughness</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {selectedEdge.roughStyle?.roughness ?? 1.2}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.5"
                  value={selectedEdge.roughStyle?.roughness ?? 1.2}
                  onChange={(e) =>
                    handleEdgeUpdate({
                      roughStyle: {
                        ...(selectedEdge.roughStyle || {
                          stroke: '#334155',
                          strokeWidth: 2,
                          fill: '#ffffff',
                          fillStyle: 'hachure',
                        }),
                        roughness: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
