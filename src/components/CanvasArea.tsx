import React, { useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  diagramAtom,
  transformAtom,
  selectedNodeIdsAtom,
  selectedEdgeIdsAtom,
  connectionDraftAtom,
  alignmentGuidesAtom,
  simulationStateAtom,
  simulationTokenAnimAtom,
  autoFocusSimulationAtom,
  remoteUsersAtom,
  canvasThemeAtom,
  showGridAtom,
  handDrawnFontAtom,
  selectionBoxAtom,
} from '../store/atoms';
import { renderMasterCanvas } from '../canvas/renderer';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { NodeMiniToolbar } from './NodeMiniToolbar';
import { ZoomIn, ZoomOut, Maximize2, Layers } from 'lucide-react';

export function CanvasArea() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [diagram] = useAtom(diagramAtom);
  const [transform, setTransform] = useAtom(transformAtom);
  const [selectedNodeIds] = useAtom(selectedNodeIdsAtom);
  const [selectedEdgeIds] = useAtom(selectedEdgeIdsAtom);
  const [connectionDraft] = useAtom(connectionDraftAtom);
  const [selectionBox] = useAtom(selectionBoxAtom);
  const [alignmentGuides] = useAtom(alignmentGuidesAtom);
  const [simulationState] = useAtom(simulationStateAtom);
  const [simulationTokenAnim] = useAtom(simulationTokenAnimAtom);
  const [autoFocus] = useAtom(autoFocusSimulationAtom);
  const [remoteUsers] = useAtom(remoteUsersAtom);
  const [theme] = useAtom(canvasThemeAtom);
  const [showGrid] = useAtom(showGridAtom);
  const [handDrawnFont] = useAtom(handDrawnFontAtom);

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    hoveredNodeId,
    hoveredAnchor,
    hoveredResizeHandle,
    isResizingNode,
    cursorStyle,
  } = useCanvasInteraction(canvasRef);

  // Auto-Focus camera on active simulation node
  useEffect(() => {
    if (!simulationState?.currentNodeId || !autoFocus) return;
    const targetNode = diagram.nodes.find((n) => n.id === simulationState.currentNodeId);
    const container = containerRef.current;
    if (!targetNode || !container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const nodeCenterX = targetNode.bounds.x + targetNode.bounds.width / 2;
    const nodeCenterY = targetNode.bounds.y + targetNode.bounds.height / 2;

    const desiredPanX = width / 2 - nodeCenterX * transform.zoom;
    const desiredPanY = height / 2 - nodeCenterY * transform.zoom;

    setTransform((prev) => ({
      ...prev,
      panX: desiredPanX,
      panY: desiredPanY,
    }));
  }, [simulationState?.currentNodeId, autoFocus]);

  // ResizeObserver for dynamic full-screen responsiveness
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // High DPI scaling support
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Main Render Loop Effect with requestAnimationFrame support for token animations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;

    const render = () => {
      const activeSimNodeId = simulationState?.currentNodeId || null;
      const activeSimEdgeIds = simulationState?.activePathEdgeIds || [];

      renderMasterCanvas(
        canvas,
        diagram,
        transform,
        selectedNodeIds,
        selectedEdgeIds,
        hoveredNodeId,
        hoveredAnchor,
        connectionDraft,
        selectionBox,
        alignmentGuides,
        activeSimNodeId,
        activeSimEdgeIds,
        remoteUsers,
        theme,
        showGrid,
        handDrawnFont,
        hoveredResizeHandle,
        isResizingNode,
        simulationTokenAnim
      );

      // If token is animating or simulation is running, keep requestAnimationFrame loop active for continuous smooth pulse
      if (simulationTokenAnim || simulationState?.status === 'running') {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [
    diagram,
    transform,
    selectedNodeIds,
    selectedEdgeIds,
    hoveredNodeId,
    hoveredAnchor,
    hoveredResizeHandle,
    isResizingNode,
    connectionDraft,
    selectionBox,
    alignmentGuides,
    simulationState,
    simulationTokenAnim,
    remoteUsers,
    theme,
    showGrid,
    handDrawnFont,
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#f8fafc] dark:bg-slate-950 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`w-full h-full touch-none ${cursorStyle}`}
      />

      {/* Mini Floating Context Toolbar for Selected Node */}
      <NodeMiniToolbar />

      {/* Floating Canvas Controls (Artistic Theme) */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 shadow-lg select-none z-20">
        <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-800 pr-3">
          <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">{diagram.nodes.length} Elements</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setTransform((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.15, 0.2) }))}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] w-12 text-center text-slate-700 dark:text-slate-300">
            {Math.round(transform.zoom * 100)}%
          </span>
          <button
            onClick={() => setTransform((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.15, 3.0) }))}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTransform({ zoom: 1.0, panX: 0, panY: 0 })}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

