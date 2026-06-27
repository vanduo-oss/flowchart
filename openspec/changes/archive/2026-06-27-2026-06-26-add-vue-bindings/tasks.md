## 1. OpenSpec

- [x] 1.1 Add `openspec/config.yaml` and baseline capability specs (editor, document-model, lifecycle, events, package-integration, vue-bindings)
- [x] 1.2 Add this change (proposal, tasks, design, spec deltas)

## 2. Vue bindings

- [x] 2.1 `src/vue.js` — `VdFlowchart` component; SSR-safe; `load()` on data change, recreate on readonly/gridSize change, forward change/select/viewport/connect, `destroy()` on unmount
- [x] 2.2 `src/vue.d.ts` — typed `VdFlowchartProps`; copied to `dist/vue.d.ts` by the build

## 3. Build & package

- [x] 3.1 `scripts/build.js` — esbuild esm + cjs vue entry with `vue` external
- [x] 3.2 `package.json` — `./vue` export, optional `vue` peer, `vue` devDep, version `1.1.0`
- [x] 3.3 `pnpm build` produces `dist/vue.js`, `dist/vue.cjs`, `dist/vue.d.ts`

## 4. Verify & ship

- [x] 4.1 vd2 consumes `@vanduo-oss/flowchart/vue`: `vue-tsc` clean, vitest + Playwright pass
- [ ] 4.2 Publish `@vanduo-oss/flowchart@1.1.0`, then pin vd2 to `^1.1.0` (replace `file:../flowchart`)
- [ ] 4.3 `openspec archive 2026-06-26-add-vue-bindings` after publish
