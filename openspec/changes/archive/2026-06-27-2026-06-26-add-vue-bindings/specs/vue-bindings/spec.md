# vue-bindings

## ADDED Requirements

### Requirement: VdFlowchart component

`@vanduo-oss/flowchart/vue` SHALL export a `VdFlowchart` component with props `data` (document), `readonly`, and `gridSize`.

#### Scenario: Render editor

- GIVEN `<VdFlowchart :data="doc" />`
- WHEN mounted in a Vue 3 application
- THEN the SVG editor SHALL render into the component's container

### Requirement: Reactive data and forwarded events

The component SHALL call the editor's `load()` when `data` changes, recreate the editor when `readonly` or `gridSize` change, forward `change`, `select`, `viewport`, and `connect` as Vue events, and emit `ready` with the instance.

#### Scenario: Data update

- GIVEN a mounted `VdFlowchart`
- WHEN the `data` prop changes
- THEN the editor SHALL load the new document

#### Scenario: Forwarded change

- GIVEN `<VdFlowchart @change="onChange" />`
- WHEN the document changes
- THEN `onChange` SHALL receive the change payload

### Requirement: SSR safety

The component SHALL render a plain container during SSR and create the editor only after mount on the client; it SHALL destroy the instance on unmount.

#### Scenario: Server render

- GIVEN server-side rendering with no DOM
- WHEN `VdFlowchart` renders
- THEN it SHALL output an empty `<div class="vd-flowchart">` container without creating an editor

#### Scenario: Unmount cleanup

- GIVEN a mounted `VdFlowchart`
- WHEN the component unmounts
- THEN the editor instance SHALL be destroyed

### Requirement: Vue is an optional peer

`vue` SHALL be declared as an optional peer dependency (`peerDependenciesMeta.vue.optional`) and marked external in the build, never bundled into the package.

#### Scenario: Build externalizes vue

- GIVEN the built `dist/vue.js`
- THEN it SHALL import `vue` at runtime rather than bundle it
