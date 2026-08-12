import React, { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import {
  diagramAtom,
  simulationStateAtom,
  simulationTokenAnimAtom,
  autoFocusSimulationAtom,
  activeModalAtom,
} from '../store/atoms';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  X,
  Terminal,
  Focus,
  Sliders,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
} from 'lucide-react';

export function ProcessSimulatorModal() {
  const [diagram] = useAtom(diagramAtom);
  const [simulationState, setSimulationState] = useAtom(simulationStateAtom);
  const [, setSimulationTokenAnim] = useAtom(simulationTokenAnimAtom);
  const [autoFocus, setAutoFocus] = useAtom(autoFocusSimulationAtom);
  const [, setActiveModal] = useAtom(activeModalAtom);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState<number>(1000);
  const [showLogs, setShowLogs] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [isStepping, setIsStepping] = useState(false);

  // Variable payload state for gateways
  const [variablesText, setVariablesText] = useState('{\n  "orderAmount": 1250,\n  "creditApproved": true\n}');

  // Initialize Simulator on start node
  const startSimulation = () => {
    const startNode = diagram.nodes.find((n) => n.type === 'START_EVENT');
    if (!startNode) {
      alert('Nenhum Evento de Início (Start Event) foi encontrado no diagrama. Adicione um evento de início para simular.');
      return;
    }

    setSimulationTokenAnim(null);
    setIsStepping(false);
    setSimulationState({
      currentNodeId: startNode.id,
      activePathEdgeIds: [],
      visitedNodeIds: [startNode.id],
      logs: [`Iniciou execução do processo em: ${startNode.label}`],
      status: 'running',
      variableState: { orderAmount: 1250, creditApproved: true },
    });
  };

  const stepForward = () => {
    if (!simulationState || simulationState.status === 'completed' || isStepping) return;

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
              logs: [...prev.logs, `Processo finalizado com sucesso em: ${currentNode.label}`],
            }
          : null
      );
      setIsPlaying(false);
      return;
    }

    // Pick next edge (handle gateway conditions or pick first)
    let selectedEdge = outgoingEdges[0];

    if (currentNode.type === 'GATEWAY_EXCLUSIVE' && outgoingEdges.length > 1) {
      // Parse variable payload if possible
      let parsedVars: Record<string, any> = {};
      try {
        parsedVars = JSON.parse(variablesText);
      } catch (err) {
        // fallback
      }

      // Find branch matching condition or label
      const matchedEdge = outgoingEdges.find((e) => {
        const label = (e.label || '').toLowerCase();
        const expr = (e.conditionExpression || '').toLowerCase();

        if (parsedVars.creditApproved === false && (label.includes('no') || label.includes('não') || label.includes('rejeitad'))) {
          return true;
        }
        if (parsedVars.orderAmount >= 1000 && (label.includes('yes') || label.includes('sim') || label.includes('aprovad') || expr.includes('>='))) {
          return true;
        }
        return false;
      });

      if (matchedEdge) selectedEdge = matchedEdge;
    }

    const nextNode = diagram.nodes.find((n) => n.id === selectedEdge.targetRef);
    if (!nextNode) return;

    // Trigger Token Smooth Movement Animation along sequence flow edge
    setIsStepping(true);
    const startTime = performance.now();
    const duration = Math.min(300, speedMs * 0.35);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      setSimulationTokenAnim({ edgeId: selectedEdge.id, progress });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSimulationTokenAnim(null);
        setIsStepping(false);

        // Update active node state
        setSimulationState((prev) =>
          prev
            ? {
                ...prev,
                currentNodeId: nextNode.id,
                activePathEdgeIds: Array.from(new Set([...prev.activePathEdgeIds, selectedEdge.id])),
                visitedNodeIds: Array.from(new Set([...prev.visitedNodeIds, nextNode.id])),
                logs: [
                  ...prev.logs,
                  `Transição [${selectedEdge.label || selectedEdge.id}] ➔ ${nextNode.label}`,
                ],
                status: nextNode.type === 'END_EVENT' ? 'completed' : 'running',
              }
            : null
        );
      }
    };

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!simulationState) {
      startSimulation();
    }
  }, []);

  // Auto-play timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && simulationState?.status === 'running' && !isStepping) {
      interval = setInterval(() => {
        stepForward();
      }, speedMs);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simulationState, speedMs, isStepping]);

  const currentNode = diagram.nodes.find((n) => n.id === simulationState?.currentNodeId);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-3 pointer-events-none">
      <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2.5 flex flex-col gap-2 transition-all select-none">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Simulador Executável</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    simulationState?.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                  }`}
                >
                  {simulationState?.status === 'completed' ? 'Finalizado' : 'Em Execução'}
                </span>
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 block">
                {currentNode?.label || 'Iniciando...'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Auto-Focus Camera Toggle */}
            <button
              onClick={() => setAutoFocus(!autoFocus)}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                autoFocus
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 hover:text-slate-800'
              }`}
              title="Acompanhamento Automático de Câmera"
            >
              <Focus className="w-4 h-4" />
            </button>

            {/* Toggle Variables Editor */}
            <button
              onClick={() => setShowVariables(!showVariables)}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                showVariables
                  ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 hover:text-slate-800'
              }`}
              title="Variáveis da Simulação"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Toggle Trace Logs */}
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                showLogs
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 hover:text-slate-800'
              }`}
              title="Ver Logs de Execução"
            >
              <Terminal className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                setSimulationState(null);
                setSimulationTokenAnim(null);
                setActiveModal(null);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Fechar Simulador"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floating Action Controls */}
        <div className="flex items-center justify-between bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-xl text-xs font-medium">
          <div className="flex items-center space-x-2">
            <button
              onClick={startSimulation}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg font-semibold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
              title="Reiniciar Simulação"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pausar' : 'Rodar Automático'}</span>
            </button>

            <button
              onClick={stepForward}
              disabled={simulationState?.status === 'completed' || isStepping}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs disabled:opacity-40 transition-all cursor-pointer"
            >
              <span>Avançar Passinho</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-white/80 dark:bg-slate-900/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {[
              { label: '0.5x', ms: 1600 },
              { label: '1x', ms: 1000 },
              { label: '2x', ms: 500 },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setSpeedMs(s.ms)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  speedMs === s.ms
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible Variables Editor Drawer */}
        {showVariables && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">
              Payload de Variáveis (JSON para Tomadas de Decisão)
            </span>
            <textarea
              value={variablesText}
              onChange={(e) => setVariablesText(e.target.value)}
              className="w-full h-20 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Collapsible Log Terminal Drawer */}
        {showLogs && (
          <div className="bg-slate-950 text-slate-200 p-2.5 rounded-xl font-mono text-xs h-32 overflow-y-auto space-y-1 shadow-inner border border-slate-800">
            {simulationState?.logs.map((log, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
