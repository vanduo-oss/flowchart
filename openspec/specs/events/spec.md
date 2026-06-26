# events Specification

## Purpose

Editor change and interaction events.

## Requirements

### Requirement: Event subscription

The editor SHALL expose `on(event, callback)` and `off(event, callback)` for the events `change`, `select`, `viewport`, and `connect`.

#### Scenario: Change on edit

- GIVEN a subscriber to `change`
- WHEN the document is mutated (node/edge add, move, or edit)
- THEN a `change` event SHALL fire with the updated payload

#### Scenario: Resize reason

- GIVEN a subscriber to `change`
- WHEN a node resize completes
- THEN `change` SHALL fire with `reason: 'node:resize'`

### Requirement: Selection and connect events

`select` SHALL fire with the current selection snapshot; `connect` SHALL fire when a pointer-created edge connects two ports.

#### Scenario: Select

- GIVEN a subscriber to `select`
- WHEN a node is selected
- THEN `select` SHALL fire with the selection snapshot

#### Scenario: Connect

- GIVEN a subscriber to `connect`
- WHEN an edge is created by dragging between ports
- THEN `connect` SHALL fire with the new edge
