import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { diagramAtom, activeModalAtom } from '../store/atoms';
import { Download, FileCode, Image, FileJson, X, Check } from 'lucide-react';
import { exportToBpmnXml } from '../utils/bpmnXml';

export function ExportModal() {
  const [diagram] = useAtom(diagramAtom);
  const [, setActiveModal] = useAtom(activeModalAtom);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBpmnXml = () => {
    const xml = exportToBpmnXml(diagram);
    downloadFile(xml, `${diagram.title.toLowerCase().replace(/\s+/g, '_')}.bpmn`, 'text/xml');
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(diagram, null, 2);
    downloadFile(jsonStr, `${diagram.title.toLowerCase().replace(/\s+/g, '_')}.json`, 'application/json');
  };

  const handleExportPng = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${diagram.title.toLowerCase().replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <Download className="w-5 h-5" />
            <h3 className="font-semibold text-base">Export Diagram</h3>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          {/* BPMN 2.0 XML */}
          <button
            onClick={handleExportBpmnXml}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left flex items-start space-x-3 transition-all group"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg group-hover:scale-105 transition-transform">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                OMG BPMN 2.0 XML (.bpmn)
              </span>
              <span className="text-xs text-slate-500 block">
                Standard XML format compatible with Camunda Desktop Modeler, Zeebe, and Signavio.
              </span>
            </div>
          </button>

          {/* High Res PNG */}
          <button
            onClick={handleExportPng}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left flex items-start space-x-3 transition-all group"
          >
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                Image PNG (.png)
              </span>
              <span className="text-xs text-slate-500 block">
                High-resolution raster graphic image of current canvas view.
              </span>
            </div>
          </button>

          {/* Raw JSON */}
          <button
            onClick={handleExportJson}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 text-left flex items-start space-x-3 transition-all group"
          >
            <div className="p-2 bg-violet-100 dark:bg-violet-950 text-violet-600 rounded-lg group-hover:scale-105 transition-transform">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">
                Raw Diagram State JSON (.json)
              </span>
              <span className="text-xs text-slate-500 block">
                Structured graph representation containing rough.js properties.
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
