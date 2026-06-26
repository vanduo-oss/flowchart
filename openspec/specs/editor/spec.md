# editor Specification

## Purpose

Interactive SVG flowchart editor: shell (toolbar, palette, canvas), viewport zoom/pan, selection, inline text editing, and programmatic document mutation.

## Requirements

### Requirement: Editor shell and viewport

`new VdFlowchart({ element })` SHALL build an editor shell into `element` (toolbar, node palette, SVG canvas) and SHALL support viewport control via `zoomIn()`, `zoomOut()`, `fitView()`, and `resetView()`.

#### Scenario: Construct an editor

- GIVEN a host element
- WHEN `new VdFlowchart({ element })` is constructed
- THEN an SVG editor shell SHALL render into the element with class `vd-flowchart-host`

#### Scenario: Readonly viewer

- GIVEN `readonly: true`
- WHEN the editor renders
- THEN it SHALL apply the `vd-flowchart-readonly` class and disable editing interactions

### Requirement: Programmatic mutation

The editor SHALL expose `addNode(node)`, `updateNode(id, patch)`, `removeNode(id)`, `addEdge(edge)`, `removeEdge(id)`, `startTextEdit(nodeId)`, `stopTextEdit({ commit })`, and `clear()`.

#### Scenario: Add a node

- GIVEN a live editor
- WHEN `addNode({ type: 'rounded-rect', text: 'Step' })` is called
- THEN a node SHALL be added near the viewport center and a `change` event SHALL fire

### Requirement: Serialization

The editor SHALL expose `toJSON()` to export the document and `load(data)` to import or replace it.

#### Scenario: Round-trip

- GIVEN an editor with content
- WHEN `const doc = editor.toJSON(); editor.clear(); editor.load(doc)` runs
- THEN the document SHALL be restored
