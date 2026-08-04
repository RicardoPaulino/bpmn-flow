import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Gemini AI initialization
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({ apiKey });
}

// 1. AI Process Assistant Endpoint
app.post('/api/gemini/process-assistant', async (req, res) => {
  try {
    const { action, prompt, currentDiagram } = req.body;

    const ai = getGeminiClient();

    if (action === 'generate') {
      const systemInstruction = `You are an expert BPMN 2.0 Business Process Architect. 
Convert user process requests into structured BPMN diagram JSON.
Output ONLY valid JSON adhering strictly to this format:
{
  "title": "Process Name",
  "nodes": [
    {
      "id": "node-1",
      "type": "START_EVENT" | "END_EVENT" | "USER_TASK" | "SERVICE_TASK" | "SCRIPT_TASK" | "GATEWAY_EXCLUSIVE" | "GATEWAY_PARALLEL",
      "label": "Short label",
      "bounds": { "x": 100, "y": 200, "width": 120, "height": 80 },
      "roughStyle": { "roughness": 1.2, "stroke": "#2563eb", "strokeWidth": 2, "fill": "#eff6ff", "fillStyle": "solid" },
      "properties": {},
      "documentation": "Description"
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "type": "SEQUENCE_FLOW",
      "sourceRef": "node-1",
      "targetRef": "node-2",
      "label": "Optionally condition label",
      "waypoints": [{ "x": 150, "y": 240 }, { "x": 250, "y": 240 }],
      "roughStyle": { "roughness": 1.0, "stroke": "#475569", "strokeWidth": 2, "fill": "none", "fillStyle": "solid" }
    }
  ]
}
Ensure coordinates layout left-to-right (x increases by 120-180 per step, y centered around 200). Use width=50, height=50 for START_EVENT/END_EVENT, width=60, height=60 for GATEWAYs, and width=140, height=80 for TASKs.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      return res.json(JSON.parse(responseText));
    } else if (action === 'review') {
      const systemInstruction = `You are a BPMN 2.0 Quality & Optimization Auditor.
Analyze the provided process diagram JSON and return a JSON summary with:
{
  "score": number (0-100),
  "summary": "High level evaluation",
  "issues": ["Issue 1", "Issue 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Review this BPMN process: ${JSON.stringify(currentDiagram)}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      return res.json(JSON.parse(response.text || '{}'));
    } else if (action === 'generate-sop') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a detailed Standard Operating Procedure (SOP) document in markdown for this process diagram: ${JSON.stringify(currentDiagram)}`,
      });

      return res.json({ markdown: response.text });
    }

    return res.status(400).json({ error: 'Invalid action requested' });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process AI request' });
  }
});

// 2. Real-time Collaboration WebSocket Server
const wss = new WebSocketServer({ noServer: true });

// Map of roomId -> Set of connected WebSockets
const rooms = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws: WebSocket, req) => {
  let currentRoom: string | null = null;

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'join-room') {
        currentRoom = data.roomId;
        if (!rooms.has(currentRoom!)) {
          rooms.set(currentRoom!, new Set());
        }
        rooms.get(currentRoom!)!.add(ws);

        // Notify room of new user
        broadcastToRoom(currentRoom!, ws, {
          type: 'user-joined',
          userId: data.userId,
          name: data.userName,
        });
      } else if (data.type === 'sync-state' || data.type === 'cursor-move') {
        if (currentRoom && rooms.has(currentRoom)) {
          broadcastToRoom(currentRoom, ws, data);
        }
      }
    } catch (e) {
      console.error('WebSocket Error:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom)!.delete(ws);
      if (rooms.get(currentRoom)!.size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });
});

function broadcastToRoom(roomId: string, sender: WebSocket, payload: any) {
  const clients = rooms.get(roomId);
  if (!clients) return;

  const message = JSON.stringify(payload);
  clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Upgrade HTTP server to WebSocket on /ws
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// 3. Vite Middleware in Development / Static Build serving in Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`BPMN Canvas Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
