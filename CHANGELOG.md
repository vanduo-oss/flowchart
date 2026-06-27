# Changelog

All notable changes to `@vanduo-oss/flowchart` are documented here.

## [1.1.0] — 2026-06-27

### Added

- **Optional Vue 3 binding** at `@vanduo-oss/flowchart/vue` — a `VdFlowchart` component (props `data`, `readonly`, `gridSize`; emits `change`, `select`, `viewport`, `connect`, `ready`). `vue` is an *optional* peer dependency, marked external in the build, so vanilla consumers are unaffected. SSR-safe (the editor is created on mount); changing `data` flows through `load()` while `readonly`/`gridSize` recreate; exposes `{ getInstance() }`.
- First OpenSpec `vue-bindings` capability; `package-integration` extended with the `./vue` subpath.
- `llms.txt` LLM context file and a README **Vue 3** section.

### Changed

- `files` now publishes `CHANGELOG.md` and `llms.txt` alongside `dist/`, `README.md`, and `LICENSE`.

## [1.0.0] — 2026-06-20

### Added

- SVG flowchart editor `VdFlowchart`: zoom/wheel-zoom/fit-view/reset, canvas panning, draggable nodes, and port-guided connections with a one-shot Arrow tool that snaps to the nearest side of the target.
- Per-edge route (`curve`, `straight`, node-aware `orthogonal`), marker, and line-weight presets (`thin`/`medium`/`bold`); selected-only handles and edge reconnect handles.
- Double-click inline text editing, selected-node resize handles with live edge endpoint updates, and a built-in editor shell (primitive previews, inspector, JSON import/export).
- Primitive set: `rounded-rect`, `rect`, `diamond`, `circle`, `textbox`, `label`, `junction`.
- API: node/edge CRUD, viewport controls, `toJSON`/`load`/`clear`, text-edit controls, `on`/`off`/`destroy`; events `change`, `select`, `viewport`, `connect`.
- ESM, CJS, and IIFE builds plus `@vanduo-oss/flowchart/css`; Vanduo auto-init (`window.VanduoFlowchart`, `data-vd-flowchart`).

## [0.0.1] — 2026-05-23

### Added

- Initial standalone npm package extracted from `@vanduo-oss/framework`.
