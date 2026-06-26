# lifecycle Specification

## Purpose

Declarative auto-initialization, instance tracking, teardown, and optional Vanduo registration.

## Requirements

### Requirement: Declarative initialization

`init(root)` SHALL scan `root` (or the document) for `[data-vd-flowchart]` elements and construct a `VdFlowchart` for each, reading `data` from the element (inline JSON or text), `readonly` from `data-vd-flowchart-readonly`, and grid size from `data-vd-flowchart-grid-size`.

#### Scenario: Auto-init

- GIVEN `<div data-vd-flowchart> …JSON… </div>`
- WHEN `init()` runs
- THEN an editor SHALL initialize into the element and be tracked in the `instances` map

#### Scenario: Idempotent init

- GIVEN an already-initialized element
- WHEN `init()` runs again over the same root
- THEN the element SHALL NOT be re-initialized

### Requirement: Teardown

`destroy(el)`, `destroyAll(root)`, and `reinit(root)` SHALL remove or refresh tracked instances; instance `destroy()` SHALL detach listeners and clear the host element.

#### Scenario: Destroy

- GIVEN a tracked editor
- WHEN `destroy(el)` is called
- THEN its listeners SHALL detach and the instance SHALL be untracked

### Requirement: Optional Vanduo registration

When `window.Vanduo` exists at load, the IIFE SHALL register as `flowchart` for scoped `Vanduo.init(root)`, `Vanduo.destroy(root)`, and `Vanduo.reinit('flowchart', root)`.

#### Scenario: Framework init

- GIVEN `vanduo.min.js` loaded before the flowchart IIFE
- WHEN `Vanduo.init(root)` runs
- THEN `[data-vd-flowchart]` elements within `root` SHALL initialize
