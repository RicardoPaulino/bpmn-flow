import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  activeModalAtom,
  diagramAtom,
  selectedNodeIdsAtom,
  selectedEdgeIdsAtom,
  historyStackAtom,
  historyIndexAtom,
  currentViewAtom,
} from './store/atoms';
import { HeaderNav } from './components/HeaderNav';
import { HomeScreen } from './components/HomeScreen';
import { TopToolbar } from './components/TopToolbar';
import { CanvasArea } from './components/CanvasArea';
import { SidebarPropertyPanel } from './components/SidebarPropertyPanel';
import { ProcessSimulatorModal } from './components/ProcessSimulatorModal';
import { CollaborateModal } from './components/CollaborateModal';
import { ExportModal } from './components/ExportModal';
import { DiagramsListModal } from './components/DiagramsListModal';
import { ShortcutsModal } from './components/ShortcutsModal';

export default function App() {
  const [activeModal] = useAtom(activeModalAtom);
  const [currentView] = useAtom(currentViewAtom);
  const [diagram, setDiagram] = useAtom(diagramAtom);
  const [selectedNodeIds, setSelectedNodeIds] = useAtom(selectedNodeIdsAtom);
  const [selectedEdgeIds, setSelectedEdgeIds] = useAtom(selectedEdgeIdsAtom);
  const [historyStack, setHistoryStack] = useAtom(historyStackAtom);
  const [historyIndex, setHistoryIndex] = useAtom(historyIndexAtom);

  // Keyboard Shortcuts Handler (Delete, Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Delete / Backspace -> Delete Selected Elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
          const updatedNodes = diagram.nodes.filter((n) => !selectedNodeIds.includes(n.id));
          const updatedEdges = diagram.edges.filter(
            (e) =>
              !selectedEdgeIds.includes(e.id) &&
              !selectedNodeIds.includes(e.sourceRef) &&
              !selectedNodeIds.includes(e.targetRef)
          );

          const updated = {
            ...diagram,
            nodes: updatedNodes,
            edges: updatedEdges,
            lastModified: Date.now(),
          };

          setDiagram(updated);
          const newStack = historyStack.slice(0, historyIndex + 1);
          newStack.push(updated);
          setHistoryStack(newStack);
          setHistoryIndex(newStack.length - 1);

          setSelectedNodeIds([]);
          setSelectedEdgeIds([]);
        }
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          setHistoryIndex(prevIndex);
          setDiagram(historyStack[prevIndex]);
        }
      }

      // Redo: Ctrl+Y or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        if (historyIndex < historyStack.length - 1) {
          const nextIndex = historyIndex + 1;
          setHistoryIndex(nextIndex);
          setDiagram(historyStack[nextIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    diagram,
    selectedNodeIds,
    selectedEdgeIds,
    historyStack,
    historyIndex,
    setDiagram,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    setHistoryStack,
    setHistoryIndex,
  ]);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased select-none">
      {/* Top Header Navigation */}
      <HeaderNav />

      {/* Main Content Area: Home Hub or Canvas Workspace */}
      <main className="flex-1 relative w-full h-full overflow-hidden flex flex-col">
        {currentView === 'home' ? (
          <HomeScreen />
        ) : (
          <div className="relative w-full h-full overflow-hidden flex-1">
            {/* Floating Tool Palette */}
            <TopToolbar />

            {/* HTML5 Canvas Engine */}
            <CanvasArea />

            {/* Contextual Properties Drawer */}
            <SidebarPropertyPanel />
          </div>
        )}
      </main>

      {/* Modals Overlay */}
      {activeModal === 'simulation' && <ProcessSimulatorModal />}
      {activeModal === 'collaborate' && <CollaborateModal />}
      {activeModal === 'export' && <ExportModal />}
      {activeModal === 'diagrams' && <DiagramsListModal />}
      {activeModal === 'shortcuts' && <ShortcutsModal />}
    </div>
  );
}
