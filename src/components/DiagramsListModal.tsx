import React, { useState, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  diagramAtom,
  activeModalAtom,
  historyStackAtom,
  historyIndexAtom,
} from '../store/atoms';
import { DiagramData } from '../types/bpmn';
import { SAMPLE_DIAGRAM } from '../data/sampleDiagram';
import { FolderOpen, Plus, Copy, Trash2, FileCode2, X, Clock } from 'lucide-react';

export function DiagramsListModal() {
  const [diagram, setDiagram] = useAtom(diagramAtom);
  const [, setActiveModal] = useAtom(activeModalAtom);
  const [, setHistoryStack] = useAtom(historyStackAtom);
  const [, setHistoryIndex] = useAtom(historyIndexAtom);

  const [savedDiagrams, setSavedDiagrams] = useState<DiagramData[]>([]);

  useEffect(() => {
    // Load stored diagrams from LocalStorage
    try {
      const stored = localStorage.getItem('bpmn_canvas_saved_diagrams');
      if (stored) {
        setSavedDiagrams(JSON.parse(stored));
      } else {
        setSavedDiagrams([SAMPLE_DIAGRAM]);
      }
    } catch (e) {
      setSavedDiagrams([SAMPLE_DIAGRAM]);
    }
  }, []);

  const saveToStorage = (list: DiagramData[]) => {
    setSavedDiagrams(list);
    localStorage.setItem('bpmn_canvas_saved_diagrams', JSON.stringify(list));
  };

  const handleSelectDiagram = (target: DiagramData) => {
    setDiagram(target);
    setHistoryStack([target]);
    setHistoryIndex(0);
    setActiveModal(null);
  };

  const handleCreateNew = () => {
    const newDiagram: DiagramData = {
      id: `diagram-${Date.now()}`,
      title: 'Untitled BPMN Diagram',
      version: 1,
      lastModified: Date.now(),
      nodes: [],
      edges: [],
      pools: [],
    };

    const updatedList = [newDiagram, ...savedDiagrams];
    saveToStorage(updatedList);
    handleSelectDiagram(newDiagram);
  };

  const handleDuplicate = (target: DiagramData, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup: DiagramData = {
      ...target,
      id: `diagram-${Date.now()}`,
      title: `${target.title} (Copy)`,
      lastModified: Date.now(),
    };
    saveToStorage([dup, ...savedDiagrams]);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedDiagrams.filter((d) => d.id !== id);
    saveToStorage(filtered);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
            <FolderOpen className="w-5 h-5" />
            <h3 className="font-semibold text-base">Saved Diagrams Manager</h3>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 text-xs">
          <button
            onClick={handleCreateNew}
            className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-dashed border-blue-300 dark:border-blue-800 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Blank Diagram</span>
          </button>

          <div className="space-y-2 pt-2">
            {savedDiagrams.map((d) => (
              <div
                key={d.id}
                onClick={() => handleSelectDiagram(d)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  diagram.id === d.id
                    ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-400'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                    <FileCode2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 block">
                      {d.title}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(d.lastModified).toLocaleDateString()}</span>
                      <span>• {d.nodes.length} Elements</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleDuplicate(d, e)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(d.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
