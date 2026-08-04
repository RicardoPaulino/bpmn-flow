import { BPMNNode, SequenceFlow, DiagramData } from '../types/bpmn';

/**
 * Standard OMG BPMN 2.0 XML Exporter and Parser
 */

export function exportToBpmnXml(diagram: DiagramData): string {
  const processId = `Process_${diagram.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" `;
  xml += `xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" `;
  xml += `xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" `;
  xml += `xmlns:di="http://www.omg.org/spec/DD/20100524/DI" `;
  xml += `xmlns:camunda="http://camunda.org/schema/1.0/bpmn" `;
  xml += `id="Definitions_${Date.now()}" targetNamespace="http://bpmn.io/schema/bpmn">\n`;

  xml += `  <bpmn:process id="${processId}" name="${escapeXml(diagram.title)}" isExecutable="true">\n`;

  // Write BPMN Elements (Nodes)
  diagram.nodes.forEach((node) => {
    const nodeTag = getNodeTag(node.type);
    let eventDefAttr = '';
    if (node.eventDefinition && node.eventDefinition !== 'none') {
      eventDefAttr = `<bpmn:${node.eventDefinition}EventDefinition id="EventDef_${node.id}" />`;
    }

    // Find incoming and outgoing flows
    const incomingFlows = diagram.edges.filter((e) => e.targetRef === node.id);
    const outgoingFlows = diagram.edges.filter((e) => e.sourceRef === node.id);

    xml += `    <bpmn:${nodeTag} id="${node.id}" name="${escapeXml(node.label)}">\n`;

    if (node.documentation) {
      xml += `      <bpmn:documentation>${escapeXml(node.documentation)}</bpmn:documentation>\n`;
    }

    incomingFlows.forEach((flow) => {
      xml += `      <bpmn:incoming>${flow.id}</bpmn:incoming>\n`;
    });
    outgoingFlows.forEach((flow) => {
      xml += `      <bpmn:outgoing>${flow.id}</bpmn:outgoing>\n`;
    });

    if (eventDefAttr) {
      xml += `      ${eventDefAttr}\n`;
    }

    xml += `    </bpmn:${nodeTag}>\n`;
  });

  // Write Sequence Flows (Edges)
  diagram.edges.forEach((edge) => {
    xml += `    <bpmn:sequenceFlow id="${edge.id}" name="${escapeXml(edge.label || '')}" sourceRef="${edge.sourceRef}" targetRef="${edge.targetRef}"`;
    
    if (edge.conditionExpression) {
      xml += `>\n`;
      xml += `      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${escapeXml(edge.conditionExpression)}</bpmn:conditionExpression>\n`;
      xml += `    </bpmn:sequenceFlow>\n`;
    } else {
      xml += ` />\n`;
    }
  });

  xml += `  </bpmn:process>\n`;

  // Write BPMN Diagram (DI) for layout positioning
  xml += `  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n`;
  xml += `    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">\n`;

  diagram.nodes.forEach((node) => {
    xml += `      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">\n`;
    xml += `        <dc:Bounds x="${Math.round(node.bounds.x)}" y="${Math.round(node.bounds.y)}" width="${Math.round(node.bounds.width)}" height="${Math.round(node.bounds.height)}" />\n`;
    xml += `      </bpmndi:BPMNShape>\n`;
  });

  diagram.edges.forEach((edge) => {
    xml += `      <bpmndi:BPMNEdge id="${edge.id}_di" bpmnElement="${edge.id}">\n`;
    edge.waypoints.forEach((wp) => {
      xml += `        <di:waypoint x="${Math.round(wp.x)}" y="${Math.round(wp.y)}" />\n`;
    });
    xml += `      </bpmndi:BPMNEdge>\n`;
  });

  xml += `    </bpmndi:BPMNPlane>\n`;
  xml += `  </bpmndi:BPMNDiagram>\n`;
  xml += `</bpmn:definitions>\n`;

  return xml;
}

export function parseBpmnXml(xmlString: string): DiagramData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  const nodes: BPMNNode[] = [];
  const edges: SequenceFlow[] = [];

  // Parse BPMN shapes from BPMNDI if available
  const boundsMap = new Map<string, { x: number; y: number; width: number; height: number }>();
  const shapes = xmlDoc.getElementsByTagNameNS('*', 'BPMNShape');
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    const elementId = shape.getAttribute('bpmnElement');
    const bounds = shape.getElementsByTagNameNS('*', 'Bounds')[0];
    if (elementId && bounds) {
      boundsMap.set(elementId, {
        x: parseFloat(bounds.getAttribute('x') || '100'),
        y: parseFloat(bounds.getAttribute('y') || '100'),
        width: parseFloat(bounds.getAttribute('width') || '100'),
        height: parseFloat(bounds.getAttribute('height') || '80'),
      });
    }
  }

  // Helper to extract nodes of a given tag name
  const extractNodes = (tagName: string, type: BPMNNode['type']) => {
    const elements = xmlDoc.getElementsByTagNameNS('*', tagName);
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const id = el.getAttribute('id') || `node_${Date.now()}_${i}`;
      const name = el.getAttribute('name') || id;
      const bounds = boundsMap.get(id) || { x: 100 + i * 120, y: 150, width: type.includes('EVENT') ? 50 : type.includes('GATEWAY') ? 60 : 120, height: type.includes('EVENT') ? 50 : type.includes('GATEWAY') ? 60 : 80 };

      let docText = '';
      const docEl = el.getElementsByTagNameNS('*', 'documentation')[0];
      if (docEl) docText = docEl.textContent || '';

      nodes.push({
        id,
        type,
        label: name,
        bounds,
        roughStyle: {
          roughness: 1.0,
          stroke: type.includes('EVENT') ? '#16a34a' : type.includes('GATEWAY') ? '#d97706' : '#2563eb',
          strokeWidth: 2,
          fill: '#f8fafc',
          fillStyle: 'solid',
        },
        properties: {},
        documentation: docText,
      });
    }
  };

  extractNodes('startEvent', 'START_EVENT');
  extractNodes('endEvent', 'END_EVENT');
  extractNodes('userTask', 'USER_TASK');
  extractNodes('serviceTask', 'SERVICE_TASK');
  extractNodes('scriptTask', 'SCRIPT_TASK');
  extractNodes('task', 'TASK');
  extractNodes('exclusiveGateway', 'GATEWAY_EXCLUSIVE');
  extractNodes('parallelGateway', 'GATEWAY_PARALLEL');
  extractNodes('inclusiveGateway', 'GATEWAY_INCLUSIVE');

  // Parse Sequence Flows
  const sequenceFlows = xmlDoc.getElementsByTagNameNS('*', 'sequenceFlow');
  for (let i = 0; i < sequenceFlows.length; i++) {
    const sf = sequenceFlows[i];
    const id = sf.getAttribute('id') || `flow_${Date.now()}_${i}`;
    const name = sf.getAttribute('name') || '';
    const sourceRef = sf.getAttribute('sourceRef') || '';
    const targetRef = sf.getAttribute('targetRef') || '';

    // Attempt to calculate waypoints from source/target nodes if DI not found
    const sourceNode = nodes.find((n) => n.id === sourceRef);
    const targetNode = nodes.find((n) => n.id === targetRef);

    const waypoints = [];
    if (sourceNode && targetNode) {
      waypoints.push({
        x: sourceNode.bounds.x + sourceNode.bounds.width,
        y: sourceNode.bounds.y + sourceNode.bounds.height / 2,
      });
      waypoints.push({
        x: targetNode.bounds.x,
        y: targetNode.bounds.y + targetNode.bounds.height / 2,
      });
    } else {
      waypoints.push({ x: 0, y: 0 }, { x: 100, y: 100 });
    }

    edges.push({
      id,
      type: 'SEQUENCE_FLOW',
      sourceRef,
      targetRef,
      waypoints,
      label: name,
      roughStyle: {
        roughness: 1.0,
        stroke: '#475569',
        strokeWidth: 2,
        fill: 'none',
        fillStyle: 'solid',
      },
    });
  }

  const processEl = xmlDoc.getElementsByTagNameNS('*', 'process')[0];
  const title = processEl?.getAttribute('name') || processEl?.getAttribute('id') || 'Imported BPMN Diagram';

  return {
    id: `imported-${Date.now()}`,
    title,
    version: 1,
    lastModified: Date.now(),
    nodes,
    edges,
    pools: [],
  };
}

function getNodeTag(type: BPMNNode['type']): string {
  switch (type) {
    case 'START_EVENT': return 'startEvent';
    case 'END_EVENT': return 'endEvent';
    case 'INTERMEDIATE_CATCH_EVENT': return 'intermediateCatchEvent';
    case 'INTERMEDIATE_THROW_EVENT': return 'intermediateThrowEvent';
    case 'USER_TASK': return 'userTask';
    case 'SERVICE_TASK': return 'serviceTask';
    case 'SCRIPT_TASK': return 'scriptTask';
    case 'SUB_PROCESS': return 'subProcess';
    case 'GATEWAY_EXCLUSIVE': return 'exclusiveGateway';
    case 'GATEWAY_PARALLEL': return 'parallelGateway';
    case 'GATEWAY_INCLUSIVE': return 'inclusiveGateway';
    default: return 'task';
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
