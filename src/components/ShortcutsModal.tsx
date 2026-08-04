import React, { useState, useMemo } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  activeModalAtom,
  activeToolAtom,
  transformAtom,
  showGridAtom,
  snapGridAtom,
  handDrawnFontAtom,
  canvasThemeAtom,
} from '../store/atoms';
import { BPMNToolType } from '../types/bpmn';
import {
  Keyboard,
  X,
  Search,
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
  Grid,
  Magnet,
  Trash2,
  Sparkles,
  Play,
  Download,
  Check,
  Zap,
} from 'lucide-react';

interface ShortcutItem {
  id: string;
  category: 'tools' | 'elements' | 'editing' | 'view';
  label: string;
  description: string;
  keys: string[][];
  toolType?: BPMNToolType;
  action?: () => void;
  icon?: React.ReactNode;
}

export function ShortcutsModal() {
  const [, setActiveModal] = useAtom(activeModalAtom);
  const [activeTool, setActiveTool] = useAtom(activeToolAtom);
  const [, setTransform] = useAtom(transformAtom);
  const [showGrid, setShowGrid] = useAtom(showGridAtom);
  const [snapGrid, setSnapGrid] = useAtom(snapGridAtom);
  const [handDrawnFont, setHandDrawnFont] = useAtom(handDrawnFontAtom);
  const [theme, setTheme] = useAtom(canvasThemeAtom);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const shortcuts: ShortcutItem[] = useMemo(
    () => [
      // Tools & Canvas
      {
        id: 'tool_select',
        category: 'tools',
        label: 'Select & Drag Tool',
        description: 'Select, move, multi-select, or resize BPMN elements',
        keys: [['V'], ['1']],
        toolType: 'select',
        icon: <MousePointer className="w-4 h-4 text-blue-500" />,
      },
      {
        id: 'tool_hand',
        category: 'tools',
        label: 'Hand / Pan Canvas',
        description: 'Pan around the canvas viewport smoothly',
        keys: [['H'], ['2'], ['Space', 'Drag']],
        toolType: 'hand',
        icon: <Hand className="w-4 h-4 text-amber-500" />,
      },
      {
        id: 'tool_eraser',
        category: 'tools',
        label: 'Eraser Tool',
        description: 'Click or drag across elements to delete them quickly',
        keys: [['E'], ['3']],
        toolType: 'eraser',
        icon: <Eraser className="w-4 h-4 text-rose-500" />,
      },

      // BPMN Elements
      {
        id: 'elem_start',
        category: 'elements',
        label: 'Start Event',
        description: 'Place a new green Start Event circle',
        keys: [['S'], ['4']],
        toolType: 'START_EVENT',
        icon: <Circle className="w-4 h-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />,
      },
      {
        id: 'elem_task',
        category: 'elements',
        label: 'User / Service Task',
        description: 'Place an activity task box on the canvas',
        keys: [['T'], ['5']],
        toolType: 'USER_TASK',
        icon: <Square className="w-4 h-4 text-indigo-500" />,
      },
      {
        id: 'elem_gateway',
        category: 'elements',
        label: 'Exclusive Gateway (XOR)',
        description: 'Place a decision gateway diamond',
        keys: [['G'], ['6']],
        toolType: 'GATEWAY_EXCLUSIVE',
        icon: <GitFork className="w-4 h-4 text-amber-500" />,
      },
      {
        id: 'elem_flow',
        category: 'elements',
        label: 'Sequence Flow Edge',
        description: 'Connect two shapes with a directed arrow',
        keys: [['F'], ['7']],
        toolType: 'SEQUENCE_FLOW',
        icon: <ArrowRight className="w-4 h-4 text-sky-500" />,
      },
      {
        id: 'elem_annotation',
        category: 'elements',
        label: 'Sticky Note Annotation',
        description: 'Place a sticky note text annotation for comments',
        keys: [['A'], ['8']],
        toolType: 'TEXT_ANNOTATION',
        icon: <Type className="w-4 h-4 text-purple-500" />,
      },
      {
        id: 'elem_end',
        category: 'elements',
        label: 'End Event',
        description: 'Place a red End Event circle',
        keys: [['N'], ['9']],
        toolType: 'END_EVENT',
        icon: <Circle className="w-4 h-4 text-rose-600 stroke-[3]" />,
      },

      // Editing & History
      {
        id: 'edit_undo',
        category: 'editing',
        label: 'Undo Action',
        description: 'Revert the last diagram change',
        keys: [['Ctrl', 'Z'], ['⌘', 'Z']],
        icon: <RotateCcw className="w-4 h-4 text-blue-500" />,
      },
      {
        id: 'edit_redo',
        category: 'editing',
        label: 'Redo Action',
        description: 'Reapply the previously undone change',
        keys: [['Ctrl', 'Y'], ['⌘', 'Shift', 'Z']],
        icon: <RotateCw className="w-4 h-4 text-indigo-500" />,
      },
      {
        id: 'edit_delete',
        category: 'editing',
        label: 'Delete Selection',
        description: 'Remove currently selected nodes or sequence flows',
        keys: [['Delete'], ['Backspace']],
        icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      },
      {
        id: 'edit_resize',
        category: 'editing',
        label: 'Resize Selected Node',
        description: 'Drag any corner or edge handles of a selected shape',
        keys: [['Drag Handles']],
        icon: <Zap className="w-4 h-4 text-amber-500" />,
      },
      {
        id: 'edit_deselect',
        category: 'editing',
        label: 'Deselect / Cancel',
        description: 'Clear selection or return active tool to Select mode',
        keys: [['Esc']],
        icon: <X className="w-4 h-4 text-slate-400" />,
      },

      // View & Navigation
      {
        id: 'view_zoomin',
        category: 'view',
        label: 'Zoom In Canvas',
        description: 'Increase viewport magnification',
        keys: [['Ctrl', '+'], ['+']],
        action: () => setTransform((prev) => ({ ...prev, zoom: Math.min(3, prev.zoom + 0.15) })),
        icon: <ZoomIn className="w-4 h-4 text-emerald-500" />,
      },
      {
        id: 'view_zoomout',
        category: 'view',
        label: 'Zoom Out Canvas',
        description: 'Decrease viewport magnification',
        keys: [['Ctrl', '-'], ['-']],
        action: () => setTransform((prev) => ({ ...prev, zoom: Math.max(0.2, prev.zoom - 0.15) })),
        icon: <ZoomOut className="w-4 h-4 text-rose-500" />,
      },
      {
        id: 'view_resetzoom',
        category: 'view',
        label: 'Reset Zoom (100%)',
        description: 'Reset zoom back to 100% scale',
        keys: [['Ctrl', '0'], ['0']],
        action: () => setTransform((prev) => ({ ...prev, zoom: 1.0 })),
        icon: <Zap className="w-4 h-4 text-blue-500" />,
      },
      {
        id: 'view_grid',
        category: 'view',
        label: 'Toggle Alignment Grid',
        description: 'Show or hide the background dotted grid',
        keys: [['Shift', 'G']],
        action: () => setShowGrid((prev) => !prev),
        icon: <Grid className="w-4 h-4 text-indigo-500" />,
      },
      {
        id: 'view_snap',
        category: 'view',
        label: 'Toggle Snap to Grid',
        description: 'Enable or disable automatic grid snapping',
        keys: [['Shift', 'S']],
        action: () => setSnapGrid((prev) => !prev),
        icon: <Magnet className="w-4 h-4 text-amber-500" />,
      },
      {
        id: 'view_font',
        category: 'view',
        label: 'Toggle Sketch Font',
        description: 'Switch between clean vector font and hand-drawn Caveat font',
        keys: [['Shift', 'F']],
        action: () => setHandDrawnFont((prev) => !prev),
        icon: <Type className="w-4 h-4 text-violet-500" />,
      },
      {
        id: 'view_shortcuts',
        category: 'view',
        label: 'Open Shortcuts Cheat Sheet',
        description: 'Display this keyboard shortcuts modal anytime',
        keys: [['?'], ['Shift', '/'], ['Ctrl', '/']],
        icon: <Keyboard className="w-4 h-4 text-indigo-500" />,
      },
    ],
    [setTransform, setShowGrid, setSnapGrid, setHandDrawnFont]
  );

  const categories = [
    { id: 'all', label: 'All Shortcuts' },
    { id: 'tools', label: 'Tools' },
    { id: 'elements', label: 'BPMN Shapes' },
    { id: 'editing', label: 'Editing & History' },
    { id: 'view', label: 'View & Navigation' },
  ];

  const filteredShortcuts = useMemo(() => {
    return shortcuts.filter((s) => {
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        s.label.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.keys.some((combo) => combo.some((k) => k.toLowerCase().includes(query)));
      return matchesCategory && matchesQuery;
    });
  }, [shortcuts, selectedCategory, searchQuery]);

  const handleActivateTool = (toolType?: BPMNToolType, action?: () => void) => {
    if (toolType) {
      setActiveTool(toolType);
      setActiveModal(null);
    } else if (action) {
      action();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight">
                Keyboard Shortcuts & Hotkeys
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Boost your diagramming speed with essential hotkeys
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcut (e.g. 'Task', 'Zoom', 'Undo', 'V')..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts Grid List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Keyboard className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                No shortcuts found for "{searchQuery}"
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredShortcuts.map((s) => {
                const isActiveTool = s.toolType && activeTool === s.toolType;

                return (
                  <div
                    key={s.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between group ${
                      isActiveTool
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start space-x-3 pr-2 min-w-0">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shrink-0 mt-0.5">
                        {s.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                            {s.label}
                          </span>
                          {isActiveTool && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-full shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {s.description}
                        </p>
                      </div>
                    </div>

                    {/* Keys & Action Trigger */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        {s.keys.map((combo, idx) => (
                          <div key={idx} className="flex items-center space-x-1">
                            {combo.map((k, kIdx) => (
                              <React.Fragment key={kIdx}>
                                <kbd className="px-2 py-0.5 min-w-[22px] text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-2xs text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200">
                                  {k}
                                </kbd>
                                {kIdx < combo.length - 1 && (
                                  <span className="text-[10px] text-slate-400 font-bold">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        ))}
                      </div>

                      {(s.toolType || s.action) && (
                        <button
                          onClick={() => handleActivateTool(s.toolType, s.action)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg"
                          title="Activate now"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Pro Tip:</span>
            <span>
              Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">?</kbd> anywhere to open or close this window.
            </span>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl text-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
