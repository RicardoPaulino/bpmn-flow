import React, { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  activeToolAtom,
  transformAtom,
  historyStackAtom,
  historyIndexAtom,
  diagramAtom,
  activeRoughnessAtom,
  activeStrokeColorAtom,
  activeFillColorAtom,
  selectedNodeIdsAtom,
} from '../store/atoms';
import { BPMNToolType } from '../types/bpmn';
import { applyAutoLayout } from '../utils/bpmnAutoLayout';
import {
  MousePointer,
  Hand,
  Eraser,
  Circle,
  Square,
  GitFork,
  ArrowRight,
  Type,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  User,
  Cog,
  FileCode,
  Wand2,
  MoveRight,
  MoveDown,
} from 'lucide-react';

export function TopToolbar() {
  const [activeTool, setActiveTool] = useAtom(activeToolAtom);
  const [transform, setTransform] = useAtom(transformAtom);
  const [historyStack, setHistoryStack] = useAtom(historyStackAtom);
  const [historyIndex, setHistoryIndex] = useAtom(historyIndexAtom);
  const setDiagram = useSetAtom(diagramAtom);

  const [activeRoughness, setActiveRoughness] = useAtom(activeRoughnessAtom);
  const [activeStrokeColor, setActiveStrokeColor] = useAtom(activeStrokeColorAtom);
  const [activeFillColor, setActiveFillColor] = useAtom(activeFillColorAtom);

  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
  const [gatewayDropdownOpen, setGatewayDropdownOpen] = useState(false);
  const [autoLayoutDropdownOpen, setAutoLayoutDropdownOpen] = useState(false);
  const [selectedNodeIds] = useAtom(selectedNodeIdsAtom);

  const handleAutoLayout = (direction: 'horizontal' | 'vertical') => {
    setDiagram((prev) => {
      const updated = applyAutoLayout(prev, { direction, nodeIdsToLayout: selectedNodeIds });
      const newStack = historyStack.slice(0, historyIndex + 1);
      newStack.push(updated);
      setHistoryStack(newStack);
      setHistoryIndex(newStack.length - 1);
      return updated;
    });
    setAutoLayoutDropdownOpen(false);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setDiagram(historyStack[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setDiagram(historyStack[nextIndex]);
    }
  };

  const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0f172a'];
  const fillColors = ['#eff6ff', '#f0fdf4', '#fffbeb', '#fff1f2', '#f5f3ff', '#ffffff'];

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-xl select-none">
      {/* 1. Pointer / Select */}
      <button
        onClick={() => setActiveTool('select')}
        className={`w-9 h-9 rounded-lg font-medium text-xs flex items-center justify-center transition-all ${
          activeTool === 'select'
            ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Select & Drag (V)"
      >
        <MousePointer className="w-4 h-4" />
      </button>

      {/* 2. Hand / Pan */}
      <button
        onClick={() => setActiveTool('hand')}
        className={`w-9 h-9 rounded-lg font-medium text-xs flex items-center justify-center transition-all ${
          activeTool === 'hand'
            ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Pan Canvas (H / Space)"
      >
        <Hand className="w-4 h-4" />
      </button>

      {/* 3. Eraser */}
      <button
        onClick={() => setActiveTool('eraser')}
        className={`w-9 h-9 rounded-lg font-medium text-xs flex items-center justify-center transition-all ${
          activeTool === 'eraser'
            ? 'bg-rose-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Eraser (E)"
      >
        <Eraser className="w-4 h-4" />
      </button>

      <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* BPMN Shapes */}
      {/* Start Event */}
      <button
        onClick={() => setActiveTool('START_EVENT')}
        className={`px-2.5 h-9 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition-all ${
          activeTool === 'START_EVENT'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Start Event"
      >
        <Circle className="w-4 h-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
        <span className="hidden sm:inline">Start</span>
      </button>

      {/* End Event */}
      <button
        onClick={() => setActiveTool('END_EVENT')}
        className={`px-2.5 h-9 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition-all ${
          activeTool === 'END_EVENT'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="End Event"
      >
        <Circle className="w-4 h-4 text-rose-600 stroke-[3]" />
        <span className="hidden sm:inline">End</span>
      </button>

      {/* Task Dropdown */}
      <div className="relative">
        <button
          onClick={() => setTaskDropdownOpen(!taskDropdownOpen)}
          className={`px-2.5 h-9 rounded-lg font-medium text-xs flex items-center space-x-1 transition-all ${
            activeTool.includes('TASK')
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Task / Activity"
        >
          <Square className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">
            {activeTool === 'USER_TASK' ? 'User Task' : activeTool === 'SERVICE_TASK' ? 'Service Task' : 'Task'}
          </span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {taskDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
            <button
              onClick={() => {
                setActiveTool('USER_TASK');
                setTaskDropdownOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
            >
              <User className="w-4 h-4 text-indigo-500" />
              <span>User Task</span>
            </button>
            <button
              onClick={() => {
                setActiveTool('SERVICE_TASK');
                setTaskDropdownOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
            >
              <Cog className="w-4 h-4 text-violet-500" />
              <span>Service Task</span>
            </button>
            <button
              onClick={() => {
                setActiveTool('SCRIPT_TASK');
                setTaskDropdownOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
            >
              <FileCode className="w-4 h-4 text-amber-500" />
              <span>Script Task</span>
            </button>
          </div>
        )}
      </div>

      {/* Gateway Dropdown */}
      <div className="relative">
        <button
          onClick={() => setGatewayDropdownOpen(!gatewayDropdownOpen)}
          className={`px-2.5 h-9 rounded-lg font-medium text-xs flex items-center space-x-1 transition-all ${
            activeTool.includes('GATEWAY')
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Gateway"
        >
          <GitFork className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">Gateway</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {gatewayDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
            <button
              onClick={() => {
                setActiveTool('GATEWAY_EXCLUSIVE');
                setGatewayDropdownOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Exclusive (XOR)</span>
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono">X</span>
            </button>
            <button
              onClick={() => {
                setActiveTool('GATEWAY_PARALLEL');
                setGatewayDropdownOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Parallel (AND)</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono">+</span>
            </button>
            <button
              onClick={() => {
                setActiveTool('GATEWAY_INCLUSIVE');
                setGatewayDropdownOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Inclusive (OR)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">O</span>
            </button>
          </div>
        )}
      </div>

      {/* Sequence Flow Connector */}
      <button
        onClick={() => setActiveTool('SEQUENCE_FLOW')}
        className={`w-9 h-9 rounded-lg font-medium text-xs flex items-center justify-center transition-all ${
          activeTool === 'SEQUENCE_FLOW'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Sequence Flow Connector"
      >
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Text Annotation */}
      <button
        onClick={() => setActiveTool('TEXT_ANNOTATION')}
        className={`w-9 h-9 rounded-lg font-medium text-xs flex items-center justify-center transition-all ${
          activeTool === 'TEXT_ANNOTATION'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Text Annotation"
      >
        <Type className="w-4 h-4" />
      </button>

      {/* Auto Layout Dropdown */}
      <div className="relative">
        <button
          onClick={() => setAutoLayoutDropdownOpen(!autoLayoutDropdownOpen)}
          className="px-2.5 h-9 rounded-lg font-medium text-xs flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 transition-all shadow-2xs"
          title="Auto-Layout Nodes (Flow Alignment)"
        >
          <Wand2 className="w-4 h-4 text-blue-500" />
          <span className="hidden md:inline font-semibold">Auto-Layout</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {autoLayoutDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 z-50">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {selectedNodeIds.length >= 2 ? `Layout ${selectedNodeIds.length} Selected Nodes` : 'Layout Entire Diagram'}
            </div>
            <button
              onClick={() => handleAutoLayout('horizontal')}
              className="w-full text-left px-2.5 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors text-slate-700 dark:text-slate-200"
            >
              <div className="flex items-center space-x-2">
                <MoveRight className="w-4 h-4 text-blue-500" />
                <span>Horizontal Flow</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">L → R</span>
            </button>
            <button
              onClick={() => handleAutoLayout('vertical')}
              className="w-full text-left px-2.5 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors text-slate-700 dark:text-slate-200"
            >
              <div className="flex items-center space-x-2">
                <MoveDown className="w-4 h-4 text-emerald-500" />
                <span>Vertical Flow</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">T → B</span>
            </button>
          </div>
        )}
      </div>

      <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Style Quick Options: Roughness */}
      <div className="flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800 p-0.5 rounded-lg">
        <button
          onClick={() => setActiveRoughness(0)}
          className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
            activeRoughness === 0 ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
          }`}
          title="Clean Vector Lines"
        >
          Clean
        </button>
        <button
          onClick={() => setActiveRoughness(1.2)}
          className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
            activeRoughness === 1.2 ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
          }`}
          title="Hand Sketch"
        >
          Sketch
        </button>
        <button
          onClick={() => setActiveRoughness(2.5)}
          className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
            activeRoughness === 2.5 ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
          }`}
          title="Rough Chalk"
        >
          Rough
        </button>
      </div>

      <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Undo & Redo */}
      <button
        onClick={handleUndo}
        disabled={historyIndex <= 0}
        className="w-9 h-9 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent"
        title="Undo (Ctrl+Z)"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      <button
        onClick={handleRedo}
        disabled={historyIndex >= historyStack.length - 1}
        className="w-9 h-9 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent"
        title="Redo (Ctrl+Y)"
      >
        <RotateCw className="w-4 h-4" />
      </button>
    </div>
  );
}
