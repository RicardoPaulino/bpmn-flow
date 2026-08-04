import React, { useState, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  diagramAtom,
  simulationStateAtom,
  activeModalAtom,
} from '../store/atoms';
import { Play, Pause, RotateCcw, SkipForward, X, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export function ProcessSimulatorModal() {
  const [diagram] = useAtom(diagramAtom);
  const [simulationState, setSimulationState] = useAtom(simulationStateAtom);
  const [, setActiveModal] = useAtom(activeModalAtom);

  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize Simulator on start node
  const startSimulation = () => {
    const startNode = diagram.nodes.find((n) => n.type === 'START_EVENT');
    if (!startNode) {
      alert('No Start Event found in diagram. Add a Start Event to simulate execution.');
      return;
    }

    setSimulationState({
      currentNodeId: startNode.id,
      activePathEdgeIds: [],
      visitedNodeIds: [startNode.id],
      logs: [`Started process execution at: ${startNode.label}`],
      status: 'running',
      variableState: { orderAmount: 1250, creditScore: 720 },
    });
  };

  const stepForward = () => {
    if (!simulationState || simulationState.status === 'completed') return;

    const currentNode = diagram.nodes.find((n) => n.id === simulationState.currentNodeId);
    if (!currentNode) return;

    // Outgoing edges from current node
    const outgoingEdges = diagram.edges.filter((e) => e.sourceRef === currentNode.id);

    if (outgoingEdges.length === 0) {
      // Reached End Event or terminal node
      setSimulationState((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              logs: [...prev.logs, `Completed process execution at: ${currentNode.label}`],
            }
          : null
      );
      setIsPlaying(false);
      return;
    }

    // Pick next edge (handle gateway conditions or pick first)
    let selectedEdge = outgoingEdges[0];

    if (currentNode.type === 'GATEWAY_EXCLUSIVE' && outgoingEdges.length > 1) {
      // Exclusive gateway branch evaluation
      const trueConditionEdge = outgoingEdges.find((e) => {
        if (e.label?.includes('Yes') || e.conditionExpression?.includes('>=')) return true;
        return false;
      });
      if (trueConditionEdge) selectedEdge = trueConditionEdge;
    }

    const nextNode = diagram.nodes.find((n) => n.id === selectedEdge.targetRef);
    if (!nextNode) return;

    setSimulationState((prev) =>
      prev
        ? {
            ...prev,
            currentNodeId: nextNode.id,
            activePathEdgeIds: [...prev.activePathEdgeIds, selectedEdge.id],
            visitedNodeIds: [...prev.visitedNodeIds, nextNode.id],
            logs: [
              ...prev.logs,
              `Flow [${selectedEdge.label || selectedEdge.id}] -> Moved to: ${nextNode.label}`,
            ],
            status: nextNode.type === 'END_EVENT' ? 'completed' : 'running',
          }
        : null
    );
  };

  useEffect(() => {
    if (!simulationState) {
      startSimulation();
    }
  }, []);

  // Auto-play timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && simulationState?.status === 'running') {
      interval = setInterval(() => {
        stepForward();
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simulationState]);

  const currentNode = diagram.nodes.find((n) => n.id === simulationState?.currentNodeId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-500/10">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
            <Play className="w-5 h-5 fill-current" />
            <h3 className="font-semibold text-base">BPMN Interactive Process Simulator</h3>
          </div>
          <button
            onClick={() => {
              setSimulationState(null);
              setActiveModal(null);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm">
          {/* Active Status Badge */}
          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Current Active Element</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                {currentNode?.label || 'Initializing...'}
              </span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                simulationState?.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
              }`}
            >
              {simulationState?.status === 'completed' ? 'Completed' : 'Running...'}
            </span>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-center space-x-3 bg-slate-100 dark:bg-slate-800/60 p-2 rounded-xl">
            <button
              onClick={startSimulation}
              className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-medium flex items-center space-x-1 shadow-xs"
              title="Reset Execution"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-2 shadow-sm transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
            </button>

            <button
              onClick={stepForward}
              disabled={simulationState?.status === 'completed'}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-1.5 shadow-sm disabled:opacity-40 transition-all"
            >
              <span>Next Step</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Execution Trace Logs */}
          <div>
            <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider block mb-2">
              Execution Trace Logs
            </span>
            <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs h-36 overflow-y-auto space-y-1 shadow-inner">
              {simulationState?.logs.map((log, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-emerald-400">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
