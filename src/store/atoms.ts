import { atom } from 'jotai';
import {
  DiagramData,
  BPMNToolType,
  CanvasTheme,
  CanvasTransform,
  ConnectionDraft,
  SimulationStep,
  RemoteUser,
  AlignmentGuide,
  SelectionBox,
} from '../types/bpmn';
import { SAMPLE_DIAGRAM } from '../data/sampleDiagram';

// Selection Box Atom (Lasso Selection)
export const selectionBoxAtom = atom<SelectionBox | null>(null as SelectionBox | null);

// Main Diagram Data Atom
export const diagramAtom = atom<DiagramData>(SAMPLE_DIAGRAM);

// Undo / Redo History Atoms
export const historyStackAtom = atom<DiagramData[]>([SAMPLE_DIAGRAM]);
export const historyIndexAtom = atom<number>(0);

// Selection Atoms
export const selectedNodeIdsAtom = atom<string[]>([]);
export const selectedEdgeIdsAtom = atom<string[]>([]);

// Canvas Tool Atom
export const activeToolAtom = atom<BPMNToolType>('select');

// Canvas Viewport Transformation
export const transformAtom = atom<CanvasTransform>({
  zoom: 1.0,
  panX: 0,
  panY: 0,
});

// Canvas Aesthetics & Grid
export const canvasThemeAtom = atom<CanvasTheme>('light');
export const snapGridAtom = atom<boolean>(true);
export const showGridAtom = atom<boolean>(true);
export const handDrawnFontAtom = atom<boolean>(true);

// Style Defaults for Newly Placed Elements
export const activeRoughnessAtom = atom<number>(1.2);
export const activeStrokeColorAtom = atom<string>('#2563eb');
export const activeFillColorAtom = atom<string>('#eff6ff');

// Active Connection Dragging Draft
export const connectionDraftAtom = atom<ConnectionDraft | null>(null as ConnectionDraft | null);

// Alignment Smart Guides
export const alignmentGuidesAtom = atom<AlignmentGuide[]>([]);

// Interactive Process Simulator State
export interface TokenAnimationState {
  edgeId: string;
  progress: number;
}
export const simulationStateAtom = atom<SimulationStep | null>(null as SimulationStep | null);
export const simulationTokenAnimAtom = atom<TokenAnimationState | null>(null as TokenAnimationState | null);
export const autoFocusSimulationAtom = atom<boolean>(true);

// Collaboration & E2EE State
export const isCollaboratingAtom = atom<boolean>(false);
export const roomIdAtom = atom<string | null>(null as string | null);
export const encryptionKeyAtom = atom<string | null>(null as string | null);
export const remoteUsersAtom = atom<RemoteUser[]>([]);

export type ModalType = 'diagrams' | 'simulation' | 'collaborate' | 'export' | 'shortcuts' | null;

// Navigation & Active View State
export type ViewType = 'home' | 'canvas';
export const currentViewAtom = atom<ViewType>('home');

// Active Modals
export const activeModalAtom = atom<ModalType>(null as ModalType);
