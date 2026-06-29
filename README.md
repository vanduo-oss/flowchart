# @vanduo-oss/flowchart

[![npm](https://img.shields.io/npm/v/@vanduo-oss/flowchart.svg)](https://www.npmjs.com/package/@vanduo-oss/flowchart)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

> Standalone SVG flowchart editor for the [Vanduo](https://vanduo.dev) design system.

Nodes, port-guided edges with curve/straight/orthogonal routing, inline text editing, resize handles, and JSON import/export. Framework-agnostic, with an optional Vue 3 component.

## Install

```sh
pnpm add @vanduo-oss/flowchart
```

## Quick start

```js
import { VdFlowchart } from "@vanduo-oss/flowchart";
import "@vanduo-oss/flowchart/css";

const editor = new VdFlowchart({
  element: document.getElementById("flowchart"),
  data: {
    nodes: [{ id: "start", type: "circle", x: 80, y: 80, text: "Start" }],
    edges: [],
  },
});

editor.addNode({ type: "diamond", text: "Approved?" });
const snapshot = editor.toJSON();
```

Auto-init: add `data-vd-flowchart` and call `Vanduo.init()`. Vue 3 (optional peer):

```vue
<VdFlowchart :data="doc" @change="onChange" />
```

## Documentation

- Docs & live demos — https://vanduo.dev
- Agent / LLM reference (full class API, events, node/edge schema) — [SKILL.md](./SKILL.md)
- Changelog — [CHANGELOG.md](./CHANGELOG.md)

## License

[MIT](./LICENSE) © Vanduo
