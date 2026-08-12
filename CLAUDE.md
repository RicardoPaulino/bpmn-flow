# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

BPMN Canvas — a minimalist, hand-drawn-style BPMN 2.0 process modeling tool. Rendering is done on raw HTML5 Canvas with Rough.js (sketchy/hand-drawn look), state is managed with Jotai, and there's a single Express server that serves the Vite app, proxies to Gemini for AI features, and runs a WebSocket relay for E2EE real-time collaboration.

## Commands

- `npm run dev` — start the dev server (tsx running `server.ts`, which mounts Vite in middleware mode). Serves on `http://0.0.0.0:3000`.
- `npm run build` — Vite builds the client, then esbuild bundles `server.ts` to `dist/server.cjs`.
- `npm start` — run the production build (`node dist/server.cjs`).
- `npm run lint` — `tsc --noEmit` (no separate linter configured; this is the only static check).
- `npm run clean` — remove `dist` and `server.js`.

There is no test suite in this repo.

Requires a `GEMINI_API_KEY` env var (see `.env.example`) for the AI assistant features to work; the rest of the app functions without it.

## Architecture

### Single server, two roles

`server.ts` is the only backend entry point. It does three things:
1. Serves the frontend — Vite in middleware mode during dev, static `dist/` files in production (`NODE_ENV=production`).
2. Exposes `POST /api/gemini/process-assistant`, a single endpoint dispatching on an `action` field (`generate` | `review` | `generate-sop`) to different Gemini prompts/system instructions. The Gemini client is instantiated lazily per-request.
3. Runs a `ws` WebSocket server on `/ws` (attached via the HTTP `upgrade` event, not a separate port) implementing a bare relay: clients `join-room`, and `sync-state`/`cursor-move` messages are broadcast to everyone else in that room. The server never inspects diagram content — see E2EE below.

### State: Jotai atoms as the single source of truth

`src/store/atoms.ts` holds all app state as independent atoms — no reducers/context. Key ones:
- `diagramAtom` — the current `DiagramData` (nodes, edges, pools).
- `historyStackAtom` / `historyIndexAtom` — manual undo/redo; every mutation that should be undoable pushes a full `DiagramData` snapshot onto the stack and truncates anything after the current index (see the pattern in `App.tsx`'s keydown handler and `useCanvasInteraction`'s `pushHistory`).
- `selectedNodeIdsAtom` / `selectedEdgeIdsAtom`, `activeToolAtom`, `transformAtom` (pan/zoom), `connectionDraftAtom`, `alignmentGuidesAtom`, `selectionBoxAtom` — all canvas-interaction ephemeral state.
- `activeModalAtom` (`ModalType`) — which single modal is open; new modals should extend this union rather than adding separate boolean atoms.

### Canvas rendering pipeline

The canvas is imperative, not React-declarative:
- `src/hooks/useCanvasInteraction.ts` owns all pointer/keyboard event handling, drag/resize/pan/connect state machines, and coordinate transforms (`screenToWorld`), then writes results into the Jotai atoms above.
- `src/canvas/renderer.ts` (`renderMasterCanvas`) reads the atoms' current values (passed as plain args, not hooks) and does a full imperative redraw each frame: background/grid → edges → nodes → overlays (selection, alignment guides, remote cursors, resize handles). It uses `roughjs` for the sketchy stroke style.
- `src/canvas/bpmnDrawers.ts` has the per-element-type drawing logic (shapes for each `BPMNElementType`, anchor point calculation, edge drawing).
- `src/components/CanvasArea.tsx` is the thin React wrapper that owns the `<canvas>` ref, calls `useCanvasInteraction`, and triggers `renderMasterCanvas` on relevant state changes.

When adding a new BPMN element type or interaction, changes typically span `types/bpmn.ts` (type union), `bpmnDrawers.ts` (how it's drawn), `useCanvasInteraction.ts` (how it's placed/edited), and possibly `bpmnAutoLayout.ts` / `bpmnRouting.ts` (layout and edge-anchor logic).

### Domain model (`src/types/bpmn.ts`)

`DiagramData` = `{ nodes: BPMNNode[], edges: SequenceFlow[], pools: Pool[] }`. Every node/edge carries its own `RoughStyle` (roughness, stroke, fill, fillStyle) so visual style is per-element, not themed globally. `BPMNElementType` and `BPMNConnectorType` are the canonical element vocab — the Gemini system prompt in `server.ts`, the XML exporter (`utils/bpmnXml.ts`), and the drawers all need to stay in sync with this union when it changes.

### AI features

`src/components/AiAssistantModal.tsx` calls the three `process-assistant` actions on the server: generating a diagram from a text prompt, reviewing/scoring an existing diagram, and generating an SOP markdown doc. The expected JSON shape for AI-generated diagrams is defined in the system prompt inside `server.ts` — if `DiagramData`/`BPMNNode`/`SequenceFlow` shapes change, that prompt must be updated too.

### Real-time collaboration (E2EE)

Collaboration is designed so the server only ever relays opaque bytes:
- `src/utils/crypto.ts` wraps the Web Crypto API (AES-GCM) for key generation and encrypt/decrypt, done entirely client-side.
- `src/components/CollaborateModal.tsx` creates a room ID and shares a link (`?room=<id>`) containing the session; the server (`server.ts`'s WebSocket handler) just forwards `sync-state`/`cursor-move` payloads between clients in the same room without decrypting them.
- `remoteUsersAtom` / `RemoteUser` track other participants' live cursor and selection state for rendering on canvas.

### BPMN XML import/export

`src/utils/bpmnXml.ts` converts between the internal `DiagramData` model and standard BPMN 2.0 XML (OMG namespace + Camunda extensions), used by `ExportModal.tsx`.

### Path alias

`@/*` resolves to the repo root (configured in both `tsconfig.json` and `vite.config.ts`) — e.g. `@/src/...`.
