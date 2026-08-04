export type BPMNElementType =
  | 'START_EVENT'
  | 'END_EVENT'
  | 'INTERMEDIATE_CATCH_EVENT'
  | 'INTERMEDIATE_THROW_EVENT'
  | 'TASK'
  | 'USER_TASK'
  | 'SERVICE_TASK'
  | 'SCRIPT_TASK'
  | 'SEND_TASK'
  | 'RECEIVE_TASK'
  | 'BUSINESS_RULE_TASK'
  | 'SUB_PROCESS'
  | 'GATEWAY_EXCLUSIVE'
  | 'GATEWAY_PARALLEL'
  | 'GATEWAY_INCLUSIVE'
  | 'GATEWAY_EVENT_BASED'
  | 'GATEWAY_COMPLEX'
  | 'POOL'
  | 'LANE'
  | 'TEXT_ANNOTATION';

export type BPMNConnectorType =
  | 'SEQUENCE_FLOW'
  | 'MESSAGE_FLOW'
  | 'ASSOCIATION';

export type RoutingStyle = 'orthogonal' | 'straight' | 'curved';
export type LineDashStyle = 'solid' | 'dashed' | 'dotted';
export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export type BPMNToolType =
  | 'select'
  | 'hand'
  | 'eraser'
  | 'connect'
  | BPMNElementType
  | BPMNConnectorType;

export type EventDefinitionType =
  | 'none'
  | 'message'
  | 'timer'
  | 'error'
  | 'signal'
  | 'escalation'
  | 'link'
  | 'conditional';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoughStyle {
  roughness: number; // 0 (clean) to 3 (rough sketch)
  stroke: string;
  strokeWidth: number;
  fill: string;
  fillStyle: 'hachure' | 'solid' | 'zigzag' | 'cross-hatch' | 'dots' | 'sunburst';
  opacity?: number;
}

export interface BPMNNode {
  id: string;
  type: BPMNElementType;
  label: string;
  bounds: BoundingBox;
  roughStyle: RoughStyle;
  eventDefinition?: EventDefinitionType;
  properties: Record<string, string>; // Camunda/Zeebe custom properties & documentation
  documentation?: string;
  poolId?: string;
  laneId?: string;
  isExpanded?: boolean; // For sub-processes
}

export interface Waypoint {
  x: number;
  y: number;
}

export interface SequenceFlow {
  id: string;
  type: BPMNConnectorType;
  sourceRef: string;
  targetRef: string;
  sourceAnchor?: 'top' | 'right' | 'bottom' | 'left';
  targetAnchor?: 'top' | 'right' | 'bottom' | 'left';
  routingStyle?: RoutingStyle;
  lineDash?: LineDashStyle;
  waypoints: Waypoint[];
  label?: string;
  conditionExpression?: string;
  roughStyle: RoughStyle;
  documentation?: string;
}

export interface Lane {
  id: string;
  name: string;
  height: number;
}

export interface Pool {
  id: string;
  name: string;
  bounds: BoundingBox;
  lanes: Lane[];
  roughStyle: RoughStyle;
}

export interface DiagramData {
  id: string;
  title: string;
  version: number;
  lastModified: number;
  nodes: BPMNNode[];
  edges: SequenceFlow[];
  pools: Pool[];
}

export type CanvasTheme = 'light' | 'dark' | 'paper' | 'blueprint';

export interface CanvasTransform {
  zoom: number;
  panX: number;
  panY: number;
}

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

export interface ConnectionDraft {
  sourceNodeId: string;
  sourceAnchor: 'top' | 'right' | 'bottom' | 'left';
  currentPoint: Waypoint;
}

// Process Simulator State
export interface SimulationStep {
  currentNodeId: string;
  activePathEdgeIds: string[];
  visitedNodeIds: string[];
  logs: string[];
  status: 'running' | 'paused' | 'completed' | 'error';
  variableState: Record<string, any>;
}

// Real-time Collaboration Cursor
export interface RemoteUser {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  selectedIds: string[];
}

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
