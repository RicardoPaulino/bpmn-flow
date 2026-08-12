import React, { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  diagramAtom,
  historyStackAtom,
  historyIndexAtom,
  activeModalAtom,
  canvasThemeAtom,
  isCollaboratingAtom,
  activeToolAtom,
  handDrawnFontAtom,
  showGridAtom,
  snapGridAtom,
  currentViewAtom,
} from '../store/atoms';
import {
  Play,
  Share2,
  Download,
  Upload,
  FolderOpen,
  Sun,
  Moon,
  FileCode2,
  Grid,
  Magnet,
  Type,
  Plus,
  Keyboard,
  Home,
  Workflow,
} from 'lucide-react';
import { exportToBpmnXml, parseBpmnXml } from '../utils/bpmnXml';

export function HeaderNav() {
  const [diagram, setDiagram] = useAtom(diagramAtom);
  const [, setActiveModal] = useAtom(activeModalAtom);
  const [theme, setTheme] = useAtom(canvasThemeAtom);
  const [isCollaborating] = useAtom(isCollaboratingAtom);
  const [showGrid, setShowGrid] = useAtom(showGridAtom);
  const [snapGrid, setSnapGrid] = useAtom(snapGridAtom);
  const [handDrawnFont, setHandDrawnFont] = useAtom(handDrawnFontAtom);
  const [currentView, setCurrentView] = useAtom(currentViewAtom);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(diagram.title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleText.trim()) {
      setDiagram((prev) => ({ ...prev, title: titleText.trim(), lastModified: Date.now() }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.bpmn') || file.name.endsWith('.xml')) {
        try {
          const parsed = parseBpmnXml(content);
          setDiagram(parsed);
          setCurrentView('canvas');
        } catch (err) {
          alert('Failed to parse BPMN XML file. Ensure it is valid BPMN 2.0.');
        }
      } else if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          setDiagram(parsed);
          setCurrentView('canvas');
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between z-20 select-none shadow-xs">
      {/* Left: Home Brand Logo & View Switcher */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center space-x-2 text-left group cursor-pointer"
          title="Ir para a Home do Projeto"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold italic shadow-md shadow-indigo-200 dark:shadow-none group-hover:bg-indigo-700 transition-colors">
            B
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold tracking-tight text-slate-800 dark:text-slate-100 uppercase leading-none">
              BPMN Hub
            </span>
            <span className="text-[10px] text-slate-400 font-medium leading-tight">Home & Studio</span>
          </div>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setCurrentView('home')}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition-all ${
              currentView === 'home'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Início</span>
          </button>

          <button
            onClick={() => setCurrentView('canvas')}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition-all ${
              currentView === 'canvas'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Criador de Fluxo</span>
          </button>
        </div>

        {/* Title display when on canvas view */}
        {currentView === 'canvas' && (
          <div className="hidden lg:flex items-center text-xs text-slate-400">
            <span className="mx-1 text-slate-300 dark:text-slate-700">/</span>
            {isEditingTitle ? (
              <input
                type="text"
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                className="text-xs font-normal italic px-2 py-0.5 rounded border border-indigo-500 bg-slate-50 dark:bg-slate-800 focus:outline-none dark:text-slate-100"
                autoFocus
              />
            ) : (
              <button
                onClick={() => {
                  setTitleText(diagram.title);
                  setIsEditingTitle(true);
                }}
                className="text-slate-500 dark:text-slate-400 font-medium italic hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[160px]"
              >
                {diagram.title || 'untitled-process.bpmn'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center Options: View & Grid toggles (Shown when in Canvas) */}
      {currentView === 'canvas' ? (
        <div className="hidden lg:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 font-medium transition-all ${
              showGrid
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>

          <button
            onClick={() => setSnapGrid(!snapGrid)}
            className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 font-medium transition-all ${
              snapGrid
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Toggle Snap to Grid"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>Snap</span>
          </button>

          <button
            onClick={() => setHandDrawnFont(!handDrawnFont)}
            className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 font-medium transition-all ${
              handDrawnFont
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Toggle Hand-drawn Sketch Font"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="font-serif italic">Hand</span>
          </button>
        </div>
      ) : (
        <div className="hidden md:flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-100 dark:border-indigo-900">
            Hub de Projetos Dev & PM
          </span>
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center space-x-2">
        {/* Quick Launch Canvas CTA when on Home */}
        {currentView === 'home' && (
          <button
            onClick={() => setCurrentView('canvas')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Abrir Criador de Fluxo</span>
          </button>
        )}

        {/* Diagrams Manager */}
        <button
          onClick={() => {
            setCurrentView('canvas');
            setActiveModal('diagrams');
          }}
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1 text-xs font-medium"
          title="Diagrams Manager"
        >
          <FolderOpen className="w-4 h-4 text-amber-500" />
          <span className="hidden xl:inline">Diagrams</span>
        </button>

        {/* Import BPMN File */}
        <label className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 text-xs font-medium">
          <Upload className="w-4 h-4 text-emerald-500" />
          <span className="hidden xl:inline">Import</span>
          <input type="file" accept=".bpmn,.xml,.json" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Process Simulator Button */}
        <button
          onClick={() => {
            setCurrentView('canvas');
            setActiveModal('simulation');
          }}
          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center space-x-1.5 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Simulate</span>
        </button>

        {/* Primary Export Button */}
        <button
          onClick={() => {
            setCurrentView('canvas');
            setActiveModal('export');
          }}
          className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-md font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs"
        >
          Export
        </button>

        {/* Shortcuts Button */}
        <button
          onClick={() => setActiveModal('shortcuts')}
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4 text-indigo-500" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
}

