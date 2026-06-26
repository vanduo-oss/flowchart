# document-model Specification

## Purpose

The flowchart document: node types, edge ports/markers/routes, and the document data shape.

## Requirements

### Requirement: Node types

Nodes SHALL support the types `rounded-rect`, `rect`, `diamond`, `circle`, `textbox`, `label`, and `junction` (enumerated by `FLOWCHART_NODE_TYPES`).

#### Scenario: Decision node

- GIVEN `addNode({ type: 'diamond', text: 'Approved?' })`
- WHEN it renders
- THEN a diamond decision node SHALL appear

### Requirement: Edges, ports, markers, and routes

Edges SHALL connect node ports `top`, `right`, `bottom`, `left` (`FLOWCHART_PORTS`), support markers `none`, `arrow`, `dot` (`FLOWCHART_EDGE_MARKERS`), and routes `curve`, `straight`, `orthogonal` (`FLOWCHART_EDGE_ROUTES`).

#### Scenario: Arrow edge with route

- GIVEN two nodes
- WHEN `addEdge({ from, to, marker: 'arrow', route: 'orthogonal' })` is called
- THEN an orthogonal arrow edge SHALL connect them, snapping to the nearest side of the target

### Requirement: Document data shape

The constructor `data` option and `load(data)` SHALL accept a document of `{ nodes, edges }`; `toJSON()` SHALL return the same shape.

#### Scenario: Initialize from data

- GIVEN `new VdFlowchart({ element, data: { nodes: [...], edges: [...] } })`
- WHEN it renders
- THEN the provided nodes and edges SHALL render
