import React, { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  diagramAtom,
  activeModalAtom,
  historyStackAtom,
  historyIndexAtom,
} from '../store/atoms';
import { Sparkles, Wand2, ShieldCheck, FileText, X, Loader2, CheckCircle } from 'lucide-react';

export function AiAssistantModal() {
  const [diagram, setDiagram] = useAtom(diagramAtom);
  const [, setActiveModal] = useAtom(activeModalAtom);
  const [historyStack, setHistoryStack] = useAtom(historyStackAtom);
  const [historyIndex, setHistoryIndex] = useAtom(historyIndexAtom);

  const [activeTab, setActiveTab] = useState<'generate' | 'review' | 'sop'>('generate');
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [sopMarkdown, setSopMarkdown] = useState<string>('');

  const handleGenerateProcess = async () => {
    if (!promptText.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/process-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          prompt: promptText,
        }),
      });

      const data = await res.json();
      if (data.nodes && data.nodes.length > 0) {
        const newDiagram = {
          id: `ai-gen-${Date.now()}`,
          title: data.title || 'AI Generated BPMN Workflow',
          version: 1,
          lastModified: Date.now(),
          nodes: data.nodes,
          edges: data.edges || [],
          pools: [],
        };

        setDiagram(newDiagram);

        const newStack = historyStack.slice(0, historyIndex + 1);
        newStack.push(newDiagram);
        setHistoryStack(newStack);
        setHistoryIndex(newStack.length - 1);

        setActiveModal(null);
      } else {
        alert('Failed to parse AI response into BPMN diagram.');
      }
    } catch (err: any) {
      alert('Error generating process: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewProcess = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/process-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          currentDiagram: diagram,
        }),
      });

      const data = await res.json();
      setReviewResult(data);
    } catch (err: any) {
      alert('Error reviewing process: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSop = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/process-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-sop',
          currentDiagram: diagram,
        }),
      });

      const data = await res.json();
      setSopMarkdown(data.markdown || '');
    } catch (err: any) {
      alert('Error generating SOP: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-violet-600/10 to-indigo-600/10">
          <div className="flex items-center space-x-2 text-violet-700 dark:text-violet-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold text-base">Gemini Process Architect AI</h3>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'generate'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Generate from Text</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('review');
              if (!reviewResult) handleReviewProcess();
            }}
            className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'review'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit & Review</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sop');
              if (!sopMarkdown) handleGenerateSop();
            }}
            className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'sop'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Generate SOP Doc</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 text-sm space-y-4">
          {activeTab === 'generate' && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300 text-xs">
                Describe any business process workflow in plain language. Gemini AI will automatically convert it into a complete BPMN 2.0 diagram layout on your canvas!
              </p>

              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={4}
                placeholder="e.g. Create a customer refund request process. Customer submits refund, CS agent verifies eligibility. If refund > $500, manager approval is required, otherwise auto-approve refund service task and notify customer..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs text-slate-800 dark:text-slate-100"
              />

              <button
                onClick={handleGenerateProcess}
                disabled={isLoading || !promptText.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-md disabled:opacity-40 transition-all"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isLoading ? 'Architecting Process...' : 'Generate BPMN Canvas Diagram'}</span>
              </button>
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-2" />
                  <span>Auditing process graph semantics and error handling...</span>
                </div>
              ) : reviewResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-200 dark:border-violet-800">
                    <div>
                      <span className="text-xs text-violet-600 font-semibold uppercase tracking-wider block">
                        Process Quality Score
                      </span>
                      <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {reviewResult.score} / 100
                      </span>
                    </div>
                    <CheckCircle className="w-8 h-8 text-violet-600" />
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Executive Summary</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{reviewResult.summary}</p>
                  </div>

                  {reviewResult.issues?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-rose-600 mb-1">Potential Bottlenecks & Issues</h4>
                      <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {reviewResult.issues.map((iss: string, idx: number) => (
                          <li key={idx}>{iss}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reviewResult.recommendations?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-emerald-600 mb-1">Optimization Recommendations</h4>
                      <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {reviewResult.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'sop' && (
            <div>
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-2" />
                  <span>Generating Standard Operating Procedure markdown document...</span>
                </div>
              ) : (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs max-h-80 overflow-y-auto whitespace-pre-wrap">
                  {sopMarkdown}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
