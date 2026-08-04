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
} from '../store/atoms';
import {
  Sparkles,
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
        } catch (err) {
          alert('Failed to parse BPMN XML file. Ensure it is valid BPMN 2.0.');
        }
      } else if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          setDiagram(parsed);
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-20 select-none shadow-xs">
      {/* Left: Artistic Logo & Diagram Title */}
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold italic shadow-lg shadow-indigo-200 dark:shadow-none">
          B
        </div>

        <h1 className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-200 uppercase flex items-center">
          <span>BPMN Canvas App</span>
          <span className="mx-2 text-slate-300 dark:text-slate-700">/</span>
          {isEditingTitle ? (
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              className="text-sm font-normal italic lowercase px-2 py-0.5 rounded border border-indigo-500 bg-slate-50 dark:bg-slate-800 focus:outline-none dark:text-slate-100"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setTitleText(diagram.title);
                setIsEditingTitle(true);
              }}
              className="text-slate-400 dark:text-slate-400 font-normal italic lowercase hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {diagram.title || 'untitled-process.bpmn'}
            </button>
          )}
        </h1>
      </div>

      {/* Center Options: View & Grid toggles */}
      <div className="hidden md:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-3 py-1 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
            showGrid
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>

        <button
          onClick={() => setSnapGrid(!snapGrid)}
          className={`px-3 py-1 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
            snapGrid
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          title="Toggle Snap to Grid"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span>Snap</span>
        </button>

        <button
          onClick={() => setHandDrawnFont(!handDrawnFont)}
          className={`px-3 py-1 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
            handDrawnFont
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          title="Toggle Hand-drawn Sketch Font"
        >
          <Type className="w-3.5 h-3.5" />
          <span className="font-serif italic">Hand Font</span>
        </button>
      </div>

      {/* Right Actions & Collaborator Avatars */}
      <div className="flex items-center space-x-3">
        {/* Active Collaborator Avatars Stack */}
        <div className="hidden sm:flex -space-x-2">
          <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white font-bold shadow-2xs">
            AM
          </div>
          <div className="w-7 h-7 rounded-full bg-violet-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white font-bold shadow-2xs">
            JD
          </div>
          <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white font-bold shadow-2xs">
            +3
          </div>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

        {/* Diagrams Manager */}
        <button
          onClick={() => setActiveModal('diagrams')}
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1 text-xs font-medium"
          title="Diagrams Manager"
        >
          <FolderOpen className="w-4 h-4 text-amber-500" />
          <span className="hidden lg:inline">Diagrams</span>
        </button>

        {/* Import BPMN File */}
        <label className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 text-xs font-medium">
          <Upload className="w-4 h-4 text-emerald-500" />
          <span className="hidden lg:inline">Import</span>
          <input type="file" accept=".bpmn,.xml,.json" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Process Simulator Button */}
        <button
          onClick={() => setActiveModal('simulation')}
          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center space-x-1.5 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate</span>
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={() => setActiveModal('ai_assistant')}
          className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Architect</span>
        </button>

        {/* Primary Export Button */}
        <button
          onClick={() => setActiveModal('export')}
          className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-md font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs"
        >
          Export SVG
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
