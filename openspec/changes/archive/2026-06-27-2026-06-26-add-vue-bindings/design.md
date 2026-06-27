## Context

Vanduo ecosystem packages are intentionally framework-agnostic (zero runtime deps, ESM/CJS/IIFE). Adding Vue support must not compromise that for vanilla/CDN users.

## Decision

Ship Vue bindings as a separate `./vue` subpath:

- `vue` is an OPTIONAL peer (`peerDependenciesMeta.vue.optional`) and `external` in esbuild, so installing or building the core never pulls Vue.
- The component is a thin wrapper: it constructs `new VdFlowchart({ element })` in `onMounted` into a plain `<div class="vd-flowchart">` the server can pre-render (SSR-safe). Reactive `data` flows through the editor's `load()`; construct-time options (`readonly`, `gridSize`) recreate the editor; editor events (`change`, `select`, `viewport`, `connect`) are forwarded as Vue emits; `destroy()` runs on unmount.

## Build output impact

esbuild gains two entries — `dist/vue.js` (ESM) and `dist/vue.cjs` (CJS) — both with `external: ['vue']`; `src/vue.d.ts` is copied to `dist/vue.d.ts`. The existing `index.*`, IIFE, and CSS outputs are unchanged.

## Alternatives considered

- **vd2-only wrapper (no package change):** rejected — every Vue consumer would reinvent the wiring, and the docs would not demonstrate real installation.
- **Vue as a hard dependency / main-entry export:** rejected — would couple the framework-agnostic core to Vue.
