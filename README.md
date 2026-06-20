# @vanduo-oss/flowchart

Standalone SVG flowchart editor for Vanduo diagrams, workflows, and documentation.

## Install

```bash
pnpm add @vanduo-oss/flowchart
```

## Usage

```js
import { VdFlowchart } from '@vanduo-oss/flowchart';
import '@vanduo-oss/flowchart/css';

const editor = new VdFlowchart({
  element: document.getElementById('flowchart-demo'),
  data: {
    nodes: [
      { id: 'start', type: 'circle', x: 80, y: 80, text: 'Start' },
      { id: 'step', type: 'rounded-rect', x: 300, y: 92, text: 'Review request' }
    ],
    edges: [
      {
        id: 'edge-1',
        from: { nodeId: 'start', port: 'right' },
        to: { nodeId: 'step', port: 'left' },
        kind: 'arrow',
        route: 'orthogonal',
        strokeWidth: 3.5
      }
    ]
  }
});

editor.addNode({ type: 'diamond', text: 'Approved?' });
editor.addNode({ type: 'junction' });
editor.zoomIn();
editor.fitView();

const snapshot = editor.toJSON();
editor.load(snapshot);
editor.destroy();
```

## Features

- Zoom in/out, wheel zoom, fit view, and viewport reset
- Canvas panning and draggable nodes
- Port-guided connections with a one-shot Arrow tool; drops snap to the nearest side of the target shape
- Selected-only connection handles, selected-edge reconnect handles, and larger arrowheads for calmer pointer targeting
- Per-edge route, marker, and line-weight controls with `thin`, `medium`, and `bold` presets
- Natural `curve` edges (per-axis bezier control offsets) and node-aware `orthogonal` routing with rounded corners that routes around nodes instead of cutting through them
- Double-click inline text editing with commit/cancel keyboard controls
- Selected-node resize handles with live edge endpoint updates
- Built-in editor shell with primitive previews, inspector, and JSON import/export
- Minimal primitive set: `rounded-rect`, `rect`, `diamond`, `circle`, `textbox`, `label`, `junction`

## API

### Constructor

```js
new VdFlowchart({ element, data, readonly, gridSize })
```

The editor fills its host element and ships a default height of `560px`. Give the
host element a `height` or `min-height` to size the editor; the canvas stays a
fixed size while the inspector scrolls internally, so selecting a node never
resizes the canvas.

### Methods

- `addNode(node)` / `updateNode(id, patch)` / `removeNode(id)`
- `addEdge(edge)` / `updateEdge(id, patch)` / `removeEdge(id)`
- `zoomIn()` / `zoomOut()` / `resetView()` / `fitView()` / `setViewport(viewport)`
- `toJSON()` / `load(data)` / `clear()`
- `startTextEdit(nodeId)` / `stopTextEdit({ commit })`
- `on(event, callback)` / `off(event, callback)` / `destroy()`

### Events

- `change` — fired after document mutations and viewport updates
- `select` — fired when the selected node or edge changes
- `viewport` — fired after pan/zoom changes
- `connect` — fired when a new edge is created

Resize completion emits `change` with `reason: 'node:resize'`. Text edits commit through the existing node update path and keep the inspector and JSON panel synchronized with `nodes[].text`.
Edge JSON can include `route`, `startMarker`, `endMarker`, and `strokeWidth`.

## Vanduo Auto Init

The browser bundle exposes `window.VanduoFlowchart`. If `window.Vanduo` is present, it self-registers as the `flowchart` component:

```html
<script type="application/json" id="flow-data">
{
  "nodes": [
    { "id": "start", "type": "circle", "x": 80, "y": 80, "text": "Start" }
  ],
  "edges": []
}
</script>

<div
  data-vd-flowchart
  data-vd-flowchart-data="#flow-data"
  data-vd-flowchart-grid-size="24">
</div>
```

```js
Vanduo.init(root);
Vanduo.destroy(root);
Vanduo.reinit('flowchart', root);
```

## License

MIT
