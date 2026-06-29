---
name: vanduo-flowchart
description: Use when building diagrams with @vanduo-oss/flowchart — a standalone SVG flowchart/diagram editor (nodes, port-guided edges, inline editing, JSON import/export) with data-* auto-init and an optional Vue 3 component. Covers install, the class API, events, security, and caveats.
---

# @vanduo-oss/flowchart

Standalone **SVG flowchart editor** for the Vanduo design system: nodes, port-guided edges with three routing modes, inline text editing, resize handles, and JSON import/export. Token-themed; framework-agnostic core with an optional Vue 3 component at `./vue`.

## Install

```sh
pnpm add @vanduo-oss/flowchart
```

```js
import { VdFlowchart } from "@vanduo-oss/flowchart";
import "@vanduo-oss/flowchart/css";

const editor = new VdFlowchart({ element, data: { nodes, edges } });
editor.addNode({ type: "diamond", text: "Approved?" });
const snapshot = editor.toJSON();
```

Auto-init: add `data-vd-flowchart` (+ `data-vd-flowchart-data="#json"`) and call `Vanduo.init()`. Vue 3 (optional peer `vue >=3.3`): `import { VdFlowchart } from "@vanduo-oss/flowchart/vue"`.

## Architecture

- SVG editor: nodes (`rounded-rect`, `rect`, `diamond`, `circle`, `textbox`, `label`, `junction`) + edges with `curve` / `straight` / `orthogonal` routes (orthogonal routes around nodes).
- Interactions: pan, draggable nodes, port-guided one-shot Arrow tool, selected-only handles, double-click inline text edit (Escape / Cmd+Enter), node resize.
- Browser bundle exposes `window.VanduoFlowchart` and self-registers as the Vanduo `flowchart` component; theming via `--vd-*` tokens.
- Optional Vue wrapper is SSR-safe (editor created on client mount).

## API

- **Constructor:** `new VdFlowchart({ element, data?, readonly?, gridSize? })` (fills host; default height 560px).
- **Nodes/edges:** `addNode`/`updateNode(id,patch)`/`removeNode(id)`, `addEdge`/`updateEdge(id,patch)`/`removeEdge(id)`. Edge fields: `from/to {nodeId,port}`, `kind`, `route`, `startMarker`/`endMarker`, `strokeWidth`.
- **Viewport:** `zoomIn`/`zoomOut`/`resetView`/`fitView`/`setViewport`.
- **Document:** `toJSON()`, `load(data)`, `clear()`. **Text:** `startTextEdit(nodeId)`, `stopTextEdit({ commit })`.
- **Lifecycle/events:** `on(event,cb)`/`off`/`destroy()`; events `change`, `select`, `viewport`, `connect`.
- **Auto-init:** `init`, `destroy`, `destroyAll`, `reinit` (or `Vanduo.reinit('flowchart')`).
- **Vue:** `<VdFlowchart :data :readonly :gridSize @change @select @viewport @connect @ready>` — `data` changes flow through `load()` (no recreate); ref exposes `getInstance()`.

## Security

- Node labels render via `textContent` (not innerHTML) — **XSS-safe** for user text.
- Imported diagrams use `JSON.parse` (no `eval`); node IDs are trimmed/validated and edges are filtered against real node IDs on load.

## Caveats

- `vue` is an optional peer; vanilla/CDN consumers unaffected.
- Core is browser-only (SVG/DOM); the Vue component is SSR-safe (mounts on client).
- Requires the CSS bundle for theming; give the host element a height/min-height.

## Docs

Full documentation and live demos: https://vanduo.dev
