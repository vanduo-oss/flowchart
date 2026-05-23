import { expect, test } from '@playwright/test';

test.describe('Vanduo Flowchart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/flowchart-harness.html');
    await page.evaluate(() => (window as any).resetEditor());
  });

  async function centerOf(locator: any) {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    return {
      x: box!.x + box!.width / 2,
      y: box!.y + box!.height / 2
    };
  }

  async function loadTwoNodeFlow(page: any) {
    await page.evaluate(() => {
      (window as any).flowchartEditor.load({
        nodes: [
          { id: 'source', type: 'circle', x: 60, y: 100, width: 120, height: 120, text: 'Source' },
          { id: 'target', type: 'rounded-rect', x: 360, y: 100, width: 180, height: 120, text: 'Target' }
        ],
        edges: []
      });
      (window as any).flowchartEvents = [];
    });
  }

  function lineCommandCount(path: string | null) {
    return path?.match(/\sL\s/g)?.length ?? 0;
  }

  test('renders nodes, edges, toolbar, and inspector shell', async ({ page }) => {
    const editor = page.locator('#editor .vd-flowchart-shell');
    await expect(editor).toBeVisible();
    await expect(editor.locator('.vd-flowchart-node')).toHaveCount(3);
    await expect(editor.locator('.vd-flowchart-edge')).toHaveCount(2);
    await expect(editor.locator('.vd-flowchart-panel--palette .vd-flowchart-palette-btn')).toHaveCount(8);
    await expect(editor.locator('.vd-flowchart-json textarea')).toHaveValue(/"nodes"/);
  });

  test('palette buttons preview the actual primitive shapes', async ({ page }) => {
    const palette = page.locator('#editor .vd-flowchart-panel--palette');
    await expect(palette.locator('[data-tool="arrow"] path.vd-flowchart-palette-arrow')).toHaveCount(1);
    await expect(palette.locator('[data-node-type="rounded-rect"] rect.vd-flowchart-palette-shape--rounded-rect')).toHaveCount(1);
    await expect(palette.locator('[data-node-type="rect"] rect.vd-flowchart-palette-shape--rect')).toHaveCount(1);
    await expect(palette.locator('[data-node-type="diamond"] polygon')).toHaveCount(1);
    await expect(palette.locator('[data-node-type="circle"] ellipse')).toHaveCount(1);
    await expect(palette.locator('[data-node-type="junction"] circle.vd-flowchart-palette-shape--junction')).toHaveCount(1);
    await expect(palette.locator('[data-node-type="textbox"] path.vd-flowchart-palette-lines')).toHaveCount(1);
    await expect(palette.locator('[data-node-type="label"] text.vd-flowchart-palette-label-mark')).toHaveText('Aa');
  });

  test('zoom controls and wheel update viewport state', async ({ page }) => {
    await page.locator('#editor [data-flowchart-action="zoom-in"]').click();
    await page.locator('#editor [data-flowchart-action="zoom-out"]').click();

    const canvas = page.locator('#editor .vd-flowchart-canvas');
    await canvas.hover();
    await canvas.dispatchEvent('wheel', { deltaY: -320, clientX: 500, clientY: 280 });

    const result = await page.evaluate(() => (window as any).flowchartEditor.toJSON().viewport);
    expect(result.scale).toBeGreaterThan(1);
  });

  test('dragging the canvas updates viewport translation', async ({ page }) => {
    const canvas = page.locator('#editor .vd-flowchart-canvas');
    await canvas.dispatchEvent('pointerdown', { pointerId: 1, button: 0, clientX: 520, clientY: 280 });
    await canvas.dispatchEvent('pointermove', { pointerId: 1, clientX: 590, clientY: 332 });
    await canvas.dispatchEvent('pointerup', { pointerId: 1, clientX: 590, clientY: 332 });

    const result = await page.evaluate(() => (window as any).flowchartEditor.toJSON().viewport);
    expect(result.x).toBe(70);
    expect(result.y).toBe(52);
  });

  test('dragging a node updates its coordinates', async ({ page }) => {
    const node = page.locator('#editor [data-node-id="review"]').first();
    const before = await page.evaluate(() => {
      const data = (window as any).flowchartEditor.toJSON();
      return data.nodes.find((node: any) => node.id === 'review');
    });

    await node.dispatchEvent('pointerdown', { pointerId: 2, button: 0, clientX: 380, clientY: 170 });
    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointermove', { pointerId: 2, clientX: 460, clientY: 240 });
    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointerup', { pointerId: 2, clientX: 460, clientY: 240 });

    const after = await page.evaluate(() => {
      const data = (window as any).flowchartEditor.toJSON();
      return data.nodes.find((node: any) => node.id === 'review');
    });

    expect(after.x).toBeGreaterThan(before.x);
    expect(after.y).toBeGreaterThan(before.y);
  });

  test('connecting two ports creates a new edge', async ({ page }) => {
    const sourcePort = page.locator('#editor [data-node-id="start"][data-port="bottom"]');
    const targetPort = page.locator('#editor [data-node-id="decision"][data-port="top"]');

    const sourceBox = await sourcePort.boundingBox();
    const targetBox = await targetPort.boundingBox();
    expect(sourceBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    await sourcePort.dispatchEvent('pointerdown', {
      pointerId: 3,
      button: 0,
      clientX: sourceBox!.x + sourceBox!.width / 2,
      clientY: sourceBox!.y + sourceBox!.height / 2
    });
    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointermove', {
      pointerId: 3,
      clientX: targetBox!.x + targetBox!.width / 2,
      clientY: targetBox!.y + targetBox!.height / 2
    });
    await targetPort.dispatchEvent('pointerup', {
      pointerId: 3,
      clientX: targetBox!.x + targetBox!.width / 2,
      clientY: targetBox!.y + targetBox!.height / 2
    });

    const result = await page.evaluate(() => {
      const data = (window as any).flowchartEditor.toJSON();
      return {
        edgeCount: data.edges.length,
        events: (window as any).flowchartEvents
      };
    });

    expect(result.edgeCount).toBe(3);
    expect(result.events.some((event: { type: string }) => event.type === 'connect')).toBe(true);
  });

  test('releasing an arrow over target shape sides snaps to nearest ports', async ({ page }) => {
    const sideTargets: Array<{ port: string; dx: number; dy: number; absoluteY?: boolean }> = [
      { port: 'left', dx: 4, dy: 0.5 },
      { port: 'right', dx: 0.96, dy: 0.5 },
      { port: 'top', dx: 0.5, dy: 4, absoluteY: true },
      { port: 'bottom', dx: 0.5, dy: 0.96 }
    ];

    for (let index = 0; index < sideTargets.length; index += 1) {
      await loadTwoNodeFlow(page);
      const sourcePort = page.locator('#editor [data-node-id="source"][data-port="right"]');
      const targetNode = page.locator('#editor .vd-flowchart-node[data-node-id="target"]');
      const sourceBox = await sourcePort.boundingBox();
      const targetBox = await targetNode.boundingBox();
      expect(sourceBox).not.toBeNull();
      expect(targetBox).not.toBeNull();

      const config = sideTargets[index];
      const releaseX = config.dx > 1 ? targetBox!.x + config.dx : targetBox!.x + targetBox!.width * config.dx;
      const releaseY = config.absoluteY
        ? targetBox!.y + config.dy
        : targetBox!.y + targetBox!.height * config.dy;
      const pointerId = 40 + index;

      await sourcePort.dispatchEvent('pointerdown', {
        pointerId,
        button: 0,
        clientX: sourceBox!.x + sourceBox!.width / 2,
        clientY: sourceBox!.y + sourceBox!.height / 2
      });
      await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointermove', {
        pointerId,
        clientX: releaseX,
        clientY: releaseY
      });
      await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointerup', {
        pointerId,
        clientX: releaseX,
        clientY: releaseY
      });

      const result = await page.evaluate(() => {
        const data = (window as any).flowchartEditor.toJSON();
        return {
          edgeCount: data.edges.length,
          target: data.edges[0]?.to,
          events: (window as any).flowchartEvents
        };
      });

      expect(result.edgeCount).toBe(1);
      expect(result.target).toEqual({ nodeId: 'target', port: config.port });
      expect(result.events.some((event: { type: string }) => event.type === 'connect')).toBe(true);
    }
  });

  test('double-click inline text editing commits and Escape cancels', async ({ page }) => {
    await page.locator('#editor .vd-flowchart-node[data-node-id="review"]').dblclick();
    const editor = page.locator('#editor .vd-flowchart-text-editor');
    await expect(editor).toBeVisible();
    await editor.fill('Edited inline');
    await editor.press('Control+Enter');

    await expect(page.locator('#editor .vd-flowchart-text-editor')).toHaveCount(0);
    await expect(page.locator('#editor [data-field="node-text"]')).toHaveValue('Edited inline');
    await expect(page.locator('#editor .vd-flowchart-json textarea')).toHaveValue(/Edited inline/);

    await page.evaluate(() => (window as any).flowchartEditor.startTextEdit('review'));
    await expect(editor).toBeVisible();
    await editor.fill('Cancelled edit');
    await editor.press('Escape');

    const result = await page.evaluate(() => {
      const data = (window as any).flowchartEditor.toJSON();
      return {
        text: data.nodes.find((node: any) => node.id === 'review').text,
        reasons: (window as any).flowchartEvents.map((event: { reason?: string }) => event.reason).filter(Boolean)
      };
    });

    expect(result.text).toBe('Edited inline');
    expect(result.reasons).toContain('node:update');
  });

  test('shape text uses centered SVG baselines while textbox stays note-aligned', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).flowchartEditor.load({
        nodes: [
          { id: 'rounded', type: 'rounded-rect', x: 40, y: 40, width: 180, height: 96, text: 'Rounded' },
          { id: 'rect', type: 'rect', x: 260, y: 40, width: 180, height: 96, text: 'Rect' },
          { id: 'diamond', type: 'diamond', x: 480, y: 28, width: 184, height: 120, text: 'Diamond' },
          { id: 'circle', type: 'circle', x: 720, y: 24, width: 128, height: 128, text: 'Circle' },
          { id: 'label', type: 'label', x: 40, y: 220, width: 180, height: 72, text: 'Label' },
          { id: 'textbox', type: 'textbox', x: 260, y: 196, width: 220, height: 120, text: 'Notes' }
        ],
        edges: []
      });
    });

    const metrics = await page.evaluate(() => {
      return ['rounded', 'rect', 'diamond', 'circle', 'label', 'textbox'].map((id) => {
        const node = (window as any).flowchartEditor.toJSON().nodes.find((item: any) => item.id === id);
        const text = document.querySelector(`#editor .vd-flowchart-node[data-node-id="${id}"] .vd-flowchart-node-text`);
        const firstLine = text?.querySelector('tspan');
        return {
          id,
          type: node.type,
          height: node.height,
          baseline: text?.getAttribute('dominant-baseline'),
          anchor: text?.getAttribute('text-anchor'),
          y: Number(firstLine?.getAttribute('y'))
        };
      });
    });

    metrics.filter((item: any) => item.type !== 'textbox').forEach((item: any) => {
      expect(item.baseline).toBe('middle');
      expect(item.anchor).toBe('middle');
      expect(Math.abs(item.y - item.height / 2)).toBeLessThanOrEqual(1);
    });
    const textbox = metrics.find((item: any) => item.type === 'textbox');
    expect(textbox.y).toBeLessThan(textbox.height / 2);
  });

  test('inspector edits node text and type', async ({ page }) => {
    await page.locator('#editor [data-node-id="review"]').first().click();
    await page.locator('#editor [data-field="node-type"]').selectOption('textbox');
    await page.locator('#editor [data-field="node-text"]').fill('Detailed notes');
    await page.locator('#editor [data-field="node-text"]').dispatchEvent('change');

    const result = await page.evaluate(() => {
      const data = (window as any).flowchartEditor.toJSON();
      return data.nodes.find((node: any) => node.id === 'review');
    });

    expect(result.type).toBe('textbox');
    expect(result.text).toBe('Detailed notes');
  });

  test('selected nodes expose resize handles and resizing updates edges', async ({ page }) => {
    await page.locator('#editor .vd-flowchart-node[data-node-id="review"]').click();
    await expect(page.locator('#editor [data-node-id="review"].vd-flowchart-resize-handle')).toHaveCount(8);

    const handle = page.locator('#editor [data-node-id="review"][data-resize-handle="e"].vd-flowchart-resize-handle');
    const handleBox = await handle.boundingBox();
    expect(handleBox).not.toBeNull();

    const before = await page.evaluate(() => {
      const node = (window as any).flowchartEditor.toJSON().nodes.find((item: any) => item.id === 'review');
      const path = document.querySelector('#editor [data-edge-id="edge-b"] .vd-flowchart-edge-path')?.getAttribute('d');
      return { node, path };
    });

    await handle.dispatchEvent('pointerdown', {
      pointerId: 80,
      button: 0,
      clientX: handleBox!.x + handleBox!.width / 2,
      clientY: handleBox!.y + handleBox!.height / 2
    });
    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointermove', {
      pointerId: 80,
      clientX: handleBox!.x + handleBox!.width / 2 + 70,
      clientY: handleBox!.y + handleBox!.height / 2
    });
    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointerup', {
      pointerId: 80,
      clientX: handleBox!.x + handleBox!.width / 2 + 70,
      clientY: handleBox!.y + handleBox!.height / 2
    });

    const after = await page.evaluate(() => {
      const data = (window as any).flowchartEditor.toJSON();
      const node = data.nodes.find((item: any) => item.id === 'review');
      const path = document.querySelector('#editor [data-edge-id="edge-b"] .vd-flowchart-edge-path')?.getAttribute('d');
      return {
        node,
        path,
        reasons: (window as any).flowchartEvents.map((event: { reason?: string }) => event.reason).filter(Boolean)
      };
    });

    expect(after.node.width).toBeGreaterThan(before.node.width);
    expect(after.path).not.toBe(before.path);
    expect(after.reasons).toContain('node:resize');
    await expect(page.locator('#editor [data-field="node-width"]')).toHaveValue(String(after.node.width));

    const shrinkHandle = page.locator('#editor [data-node-id="review"][data-resize-handle="e"].vd-flowchart-resize-handle');
    const shrinkBox = await shrinkHandle.boundingBox();
    expect(shrinkBox).not.toBeNull();
    await shrinkHandle.dispatchEvent('pointerdown', {
      pointerId: 81,
      button: 0,
      clientX: shrinkBox!.x + shrinkBox!.width / 2,
      clientY: shrinkBox!.y + shrinkBox!.height / 2
    });
    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointermove', {
      pointerId: 81,
      clientX: shrinkBox!.x + shrinkBox!.width / 2 - 1000,
      clientY: shrinkBox!.y + shrinkBox!.height / 2
    });
    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointerup', {
      pointerId: 81,
      clientX: shrinkBox!.x + shrinkBox!.width / 2 - 1000,
      clientY: shrinkBox!.y + shrinkBox!.height / 2
    });

    const clamped = await page.evaluate(() => {
      return (window as any).flowchartEditor.toJSON().nodes.find((item: any) => item.id === 'review');
    });
    expect(clamped.width).toBe(56);
  });

  test('json import/export and clear actions round-trip', async ({ page }) => {
    await page.locator('#editor [data-flowchart-action="clear"]').click();
    await expect(page.locator('#editor .vd-flowchart-node')).toHaveCount(0);

    const textarea = page.locator('#editor .vd-flowchart-json textarea');
    await textarea.fill(JSON.stringify({
      nodes: [
        { id: 'only', type: 'label', x: 90, y: 120, text: 'Single step' }
      ],
      edges: []
    }, null, 2));
    await page.locator('#editor [data-json-action="load"]').click();

    await expect(page.locator('#editor .vd-flowchart-node')).toHaveCount(1);
    await expect(page.locator('#editor .vd-flowchart-node[data-node-id="only"]')).toBeVisible();
  });

  test('delete action removes selected edges and nodes', async ({ page }) => {
    await page.locator('#editor [data-edge-id="edge-a"]').first().click();
    await page.locator('#editor .vd-flowchart-delete').click();
    await expect(page.locator('#editor .vd-flowchart-edge')).toHaveCount(1);

    await page.locator('#editor .vd-flowchart-node[data-node-id="decision"]').dispatchEvent('pointerdown', {
      pointerId: 7,
      button: 0,
      clientX: 20,
      clientY: 20
    });
    await page.locator('#editor .vd-flowchart-node[data-node-id="decision"]').dispatchEvent('pointerup', {
      pointerId: 7,
      clientX: 20,
      clientY: 20
    });
    await page.locator('#editor .vd-flowchart-delete').click();
    await expect(page.locator('#editor .vd-flowchart-node')).toHaveCount(2);
  });

  test('double-click edge enters reconnect mode and dragging endpoint updates attachment', async ({ page }) => {
    await loadTwoNodeFlow(page);
    await page.evaluate(() => {
      (window as any).flowchartEditor.addEdge({
        id: 'edge-test',
        from: { nodeId: 'source', port: 'bottom' },
        to: { nodeId: 'target', port: 'top' },
        endMarker: 'arrow'
      });
    });

    const hitPath = page.locator('#editor [data-edge-id="edge-test"] .vd-flowchart-edge-hit');
    const hitBox = await hitPath.boundingBox();
    expect(hitBox).not.toBeNull();
    await hitPath.dispatchEvent('dblclick', {
      button: 0,
      bubbles: true,
      clientX: hitBox!.x + hitBox!.width / 2,
      clientY: hitBox!.y + hitBox!.height / 2
    });
    await expect(page.locator('#editor [data-edge-id="edge-test"].vd-flowchart-edge-endpoint-hit')).toHaveCount(2);

    const toHandle = page.locator('#editor [data-edge-id="edge-test"][data-edge-endpoint="to"].vd-flowchart-edge-endpoint-hit');
    const handleBox = await toHandle.boundingBox();
    const targetPort = page.locator('#editor [data-node-id="target"][data-port="right"]');
    const targetBox = await targetPort.boundingBox();
    expect(handleBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    await toHandle.dispatchEvent('pointerdown', {
      pointerId: 90,
      button: 0,
      clientX: handleBox!.x + handleBox!.width / 2,
      clientY: handleBox!.y + handleBox!.height / 2
    });
    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointermove', {
      pointerId: 90,
      clientX: targetBox!.x + targetBox!.width / 2,
      clientY: targetBox!.y + targetBox!.height / 2
    });
    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointerup', {
      pointerId: 90,
      clientX: targetBox!.x + targetBox!.width / 2,
      clientY: targetBox!.y + targetBox!.height / 2
    });

    const edge = await page.evaluate(() => {
      const data = (window as any).flowchartEditor.toJSON();
      return data.edges.find((item: any) => item.id === 'edge-test');
    });

    expect(edge.to).toEqual({ nodeId: 'target', port: 'right' });
  });

  test('connecting over node center keeps a stable target port', async ({ page }) => {
    await loadTwoNodeFlow(page);
    const sourcePort = page.locator('#editor [data-node-id="source"][data-port="right"]');
    const targetNode = page.locator('#editor .vd-flowchart-node[data-node-id="target"]');
    const sourceBox = await sourcePort.boundingBox();
    const targetBox = await targetNode.boundingBox();
    expect(sourceBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    const centerX = targetBox!.x + targetBox!.width / 2;
    const centerY = targetBox!.y + targetBox!.height / 2;

    await sourcePort.dispatchEvent('pointerdown', {
      pointerId: 91,
      button: 0,
      clientX: sourceBox!.x + sourceBox!.width / 2,
      clientY: sourceBox!.y + sourceBox!.height / 2
    });

    const ports: string[] = [];
    for (let offset = -6; offset <= 6; offset += 3) {
      await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointermove', {
        pointerId: 91,
        clientX: centerX + offset,
        clientY: centerY + offset
      });
      const port = await page.evaluate(() => {
        const interaction = (window as any).flowchartEditor.interaction;
        return interaction?.target?.port || null;
      });
      if (port) ports.push(port);
    }

    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointerup', {
      pointerId: 91,
      clientX: centerX,
      clientY: centerY
    });

    expect(ports.length).toBeGreaterThan(0);
    expect(new Set(ports).size).toBe(1);
  });

  test('vertical edges render end markers and inspector controls start/end caps', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).flowchartEditor.load({
        nodes: [
          { id: 'top', type: 'rect', x: 200, y: 40, width: 160, height: 80, text: 'Process' },
          { id: 'bottom', type: 'rounded-rect', x: 200, y: 220, width: 160, height: 80, text: 'Step' }
        ],
        edges: [{
          id: 'vertical-edge',
          from: { nodeId: 'top', port: 'bottom' },
          to: { nodeId: 'bottom', port: 'top' },
          endMarker: 'arrow'
        }]
      });
      (window as any).flowchartEditor.fitView();
    });

    const path = page.locator('#editor [data-edge-id="vertical-edge"] .vd-flowchart-edge-path');
    await expect(path).toHaveAttribute('marker-end', /url\(#/);

    await page.evaluate(() => {
      (window as any).flowchartEditor.select({ kind: 'edge', id: 'vertical-edge' });
    });
    await page.locator('#editor [data-field="edge-start-marker"]').selectOption('dot');
    await page.locator('#editor [data-field="edge-end-marker"]').selectOption('arrow');

    await expect(path).toHaveAttribute('marker-start', /url\(#/);
    await expect(path).toHaveAttribute('marker-end', /url\(#/);

    const edge = await page.evaluate(() => {
      return (window as any).flowchartEditor.toJSON().edges.find((item: any) => item.id === 'vertical-edge');
    });
    expect(edge.startMarker).toBe('dot');
    expect(edge.endMarker).toBe('arrow');
  });

  test('edge inspector route dropdown updates exported edge route', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).flowchartEditor.select({ kind: 'edge', id: 'edge-a' });
    });

    const routeSelect = page.locator('#editor [data-field="edge-route"]');
    await expect(routeSelect).toHaveValue('curve');
    await routeSelect.selectOption('orthogonal');

    const edge = await page.evaluate(() => {
      return (window as any).flowchartEditor.toJSON().edges.find((item: any) => item.id === 'edge-a');
    });

    expect(edge.route).toBe('orthogonal');
    await expect(page.locator('#editor .vd-flowchart-json textarea')).toHaveValue(/"route": "orthogonal"/);
  });

  test('curve, straight, and orthogonal edges produce distinct path commands', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).flowchartEditor.load({
        nodes: [
          { id: 'source', type: 'rect', x: 80, y: 80, width: 140, height: 88, text: 'Source' },
          { id: 'target', type: 'rounded-rect', x: 420, y: 176, width: 180, height: 104, text: 'Target' }
        ],
        edges: [
          {
            id: 'curve-edge',
            from: { nodeId: 'source', port: 'right' },
            to: { nodeId: 'target', port: 'left' },
            route: 'curve'
          },
          {
            id: 'straight-edge',
            from: { nodeId: 'source', port: 'bottom' },
            to: { nodeId: 'target', port: 'top' },
            route: 'straight'
          },
          {
            id: 'orthogonal-edge',
            from: { nodeId: 'source', port: 'right' },
            to: { nodeId: 'target', port: 'top' },
            route: 'orthogonal'
          }
        ]
      });
    });

    const paths = await page.evaluate(() => {
      return ['curve-edge', 'straight-edge', 'orthogonal-edge'].reduce((result: Record<string, string | null>, id) => {
        result[id] = document
          .querySelector(`#editor [data-edge-id="${id}"] .vd-flowchart-edge-path`)
          ?.getAttribute('d') ?? null;
        return result;
      }, {});
    });

    expect(paths['curve-edge']).toContain(' C ');
    expect(paths['straight-edge']).not.toContain(' C ');
    expect(lineCommandCount(paths['straight-edge'])).toBe(1);
    expect(paths['orthogonal-edge']).not.toContain(' C ');
    expect(lineCommandCount(paths['orthogonal-edge'])).toBeGreaterThan(2);
    expect(new Set(Object.values(paths)).size).toBe(3);
  });

  test('orthogonal edges keep line segments and endpoint ports after node move and resize', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).flowchartEditor.load({
        nodes: [
          { id: 'source', type: 'rect', x: 60, y: 80, width: 120, height: 80, text: 'Source' },
          { id: 'target', type: 'rounded-rect', x: 360, y: 220, width: 160, height: 100, text: 'Target' }
        ],
        edges: [{
          id: 'route-edge',
          from: { nodeId: 'source', port: 'right' },
          to: { nodeId: 'target', port: 'top' },
          route: 'orthogonal'
        }]
      });
    });

    const result = await page.evaluate(() => {
      (window as any).flowchartEditor.updateNode('source', { x: 110, width: 180 });
      (window as any).flowchartEditor.updateNode('target', { y: 300, width: 220, height: 140 });

      const data = (window as any).flowchartEditor.toJSON();
      const source = data.nodes.find((node: any) => node.id === 'source');
      const target = data.nodes.find((node: any) => node.id === 'target');
      const edge = data.edges.find((item: any) => item.id === 'route-edge');
      const path = document.querySelector('#editor [data-edge-id="route-edge"] .vd-flowchart-edge-path')?.getAttribute('d') ?? '';
      const numbers = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];

      return {
        edge,
        path,
        start: numbers.slice(0, 2),
        end: numbers.slice(-2),
        expectedStart: [source.x + source.width, source.y + source.height / 2],
        expectedEnd: [target.x + target.width / 2, target.y]
      };
    });

    expect(result.path).not.toContain(' C ');
    expect(lineCommandCount(result.path)).toBeGreaterThan(2);
    expect(result.edge.from).toEqual({ nodeId: 'source', port: 'right' });
    expect(result.edge.to).toEqual({ nodeId: 'target', port: 'top' });
    expect(result.start).toEqual(result.expectedStart);
    expect(result.end).toEqual(result.expectedEnd);
  });

  test('connection preview uses default curve and reconnect preview keeps edge route', async ({ page }) => {
    await loadTwoNodeFlow(page);

    const sourcePort = page.locator('#editor [data-node-id="source"][data-port="right"]');
    const sourceBox = await sourcePort.boundingBox();
    expect(sourceBox).not.toBeNull();

    await sourcePort.dispatchEvent('pointerdown', {
      pointerId: 120,
      button: 0,
      clientX: sourceBox!.x + sourceBox!.width / 2,
      clientY: sourceBox!.y + sourceBox!.height / 2
    });
    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointermove', {
      pointerId: 120,
      clientX: sourceBox!.x + sourceBox!.width / 2 + 150,
      clientY: sourceBox!.y + sourceBox!.height / 2 + 70
    });

    const defaultPreview = await page.locator('#editor .vd-flowchart-preview-path').getAttribute('d');
    expect(defaultPreview).toContain(' C ');

    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointerup', {
      pointerId: 120,
      clientX: sourceBox!.x + sourceBox!.width / 2 + 150,
      clientY: sourceBox!.y + sourceBox!.height / 2 + 70
    });

    await loadTwoNodeFlow(page);
    await page.evaluate(() => {
      (window as any).flowchartEditor.addEdge({
        id: 'preview-edge',
        from: { nodeId: 'source', port: 'right' },
        to: { nodeId: 'target', port: 'left' },
        route: 'orthogonal',
        endMarker: 'arrow'
      });
    });

    const hitPath = page.locator('#editor [data-edge-id="preview-edge"] .vd-flowchart-edge-hit');
    const hitBox = await hitPath.boundingBox();
    expect(hitBox).not.toBeNull();
    await hitPath.dispatchEvent('dblclick', {
      button: 0,
      bubbles: true,
      clientX: hitBox!.x + hitBox!.width / 2,
      clientY: hitBox!.y + hitBox!.height / 2
    });

    const toHandle = page.locator('#editor [data-edge-id="preview-edge"][data-edge-endpoint="to"].vd-flowchart-edge-endpoint-hit');
    const handleBox = await toHandle.boundingBox();
    const targetPort = page.locator('#editor [data-node-id="target"][data-port="top"]');
    const targetBox = await targetPort.boundingBox();
    expect(handleBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    await toHandle.dispatchEvent('pointerdown', {
      pointerId: 121,
      button: 0,
      clientX: handleBox!.x + handleBox!.width / 2,
      clientY: handleBox!.y + handleBox!.height / 2
    });
    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointermove', {
      pointerId: 121,
      clientX: targetBox!.x + targetBox!.width / 2,
      clientY: targetBox!.y + targetBox!.height / 2
    });

    const reconnectPreview = await page.locator('#editor .vd-flowchart-preview-path').getAttribute('d');
    expect(reconnectPreview).not.toContain(' C ');
    expect(lineCommandCount(reconnectPreview)).toBeGreaterThan(2);

    await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointerup', {
      pointerId: 121,
      clientX: targetBox!.x + targetBox!.width / 2,
      clientY: targetBox!.y + targetBox!.height / 2
    });
  });

  test('idle ports stay non-interactive until selection or arrow mode', async ({ page }) => {
    const port = page.locator('#editor [data-node-id="review"][data-port="right"]');
    const reviewNode = page.locator('#editor .vd-flowchart-node[data-node-id="review"]');
    const idle = await port.evaluate((element) => {
      const portDot = element.querySelector('.vd-flowchart-port');
      return {
        pointerEvents: getComputedStyle(element).pointerEvents,
        opacity: portDot ? getComputedStyle(portDot).opacity : null
      };
    });

    expect(idle.pointerEvents).toBe('none');
    expect(idle.opacity).toBe('0');

    await reviewNode.click();
    const selected = await port.evaluate((element) => {
      const portDot = element.querySelector('.vd-flowchart-port');
      return {
        pointerEvents: getComputedStyle(element).pointerEvents,
        opacity: portDot ? getComputedStyle(portDot).opacity : null
      };
    });

    expect(selected.pointerEvents).toBe('auto');
    expect(selected.opacity).toBe('1');

    await page.evaluate(() => (window as any).flowchartEditor.select(null));
    await page.locator('#editor [data-tool="arrow"]').click();
    const arrowMode = await port.evaluate((element) => {
      const portDot = element.querySelector('.vd-flowchart-port');
      return {
        pointerEvents: getComputedStyle(element).pointerEvents,
        opacity: portDot ? getComputedStyle(portDot).opacity : null
      };
    });

    expect(arrowMode.pointerEvents).toBe('auto');
    expect(arrowMode.opacity).toBe('1');
  });

  test('selected side handles keep a stable connection cursor instead of resize', async ({ page }) => {
    const reviewNode = page.locator('#editor .vd-flowchart-node[data-node-id="review"]');
    const port = page.locator('#editor [data-node-id="review"][data-port="right"]');
    await reviewNode.click();
    const clearance = await page.evaluate(() => {
      const port = document.querySelector('#editor [data-node-id="review"][data-port="right"]');
      const portHit = port?.querySelector('.vd-flowchart-port-hit');
      const resizeZones = Array.from(document.querySelectorAll('#editor [data-node-id="review"][data-resize-handle="e"].vd-flowchart-resize-zone'));
      const portRect = portHit?.getBoundingClientRect();
      return {
        portRect: portRect ? { top: portRect.top, bottom: portRect.bottom } : null,
        overlaps: resizeZones.map((zone) => {
          const rect = zone.getBoundingClientRect();
          return portRect ? !(rect.bottom <= portRect.top || rect.top >= portRect.bottom) : false;
        })
      };
    });

    expect(clearance.portRect).not.toBeNull();
    expect(clearance.overlaps.every((overlap: boolean) => overlap === false)).toBe(true);
  });

  test('reconnect handles stay clickable above nodes with real pointer input', async ({ page }, testInfo) => {
    await loadTwoNodeFlow(page);
    await page.evaluate(() => {
      (window as any).flowchartEditor.addEdge({
        id: 'edge-pointer',
        from: { nodeId: 'source', port: 'bottom' },
        to: { nodeId: 'target', port: 'top' },
        endMarker: 'arrow'
      });
    });

    const reconnectPoint = await page.evaluate(() => {
      const path = document.querySelector('#editor [data-edge-id="edge-pointer"] .vd-flowchart-edge-hit') as SVGPathElement | null;
      if (!path) return null;
      const midpoint = path.getPointAtLength(path.getTotalLength() / 2);
      const matrix = path.getScreenCTM();
      if (!matrix) return null;
      const screen = new DOMPoint(midpoint.x, midpoint.y).matrixTransform(matrix);
      return { x: screen.x, y: screen.y };
    });
    expect(reconnectPoint).not.toBeNull();
    await page.mouse.click(reconnectPoint!.x, reconnectPoint!.y);

    const handleCenter = await centerOf(page.locator('#editor [data-edge-id="edge-pointer"][data-edge-endpoint="to"].vd-flowchart-edge-endpoint-hit'));
    const targetCenter = await centerOf(page.locator('#editor [data-node-id="target"][data-port="right"] .vd-flowchart-port-hit'));

    if (testInfo.project.name.includes('Mobile')) {
      await page.locator('#editor [data-edge-id="edge-pointer"][data-edge-endpoint="to"].vd-flowchart-edge-endpoint-hit').dispatchEvent('pointerdown', {
        pointerId: 92,
        button: 0,
        clientX: handleCenter.x,
        clientY: handleCenter.y
      });
      await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointermove', {
        pointerId: 92,
        clientX: targetCenter.x,
        clientY: targetCenter.y
      });
      await page.locator('#editor .vd-flowchart-canvas').dispatchEvent('pointerup', {
        pointerId: 92,
        clientX: targetCenter.x,
        clientY: targetCenter.y
      });
    } else {
      await page.mouse.move(handleCenter.x, handleCenter.y);
      await page.mouse.down();
      await page.mouse.move(targetCenter.x, targetCenter.y);
      await page.mouse.up();
    }

    const edge = await page.evaluate(() => {
      return (window as any).flowchartEditor.toJSON().edges.find((item: any) => item.id === 'edge-pointer');
    });

    expect(edge.to).toEqual({ nodeId: 'target', port: 'right' });
  });

  test('edge weight presets persist stroke width and keep selection halo separate', async ({ page }) => {
    await page.locator('#editor [data-edge-id="edge-a"] .vd-flowchart-edge-hit').click();
    await page.locator('#editor [data-field="edge-stroke-preset"]').selectOption('bold');

    const result = await page.evaluate(() => {
      const edge = (window as any).flowchartEditor.toJSON().edges.find((item: any) => item.id === 'edge-a');
      const path = document.querySelector('#editor [data-edge-id="edge-a"] .vd-flowchart-edge-path');
      const halo = document.querySelector('#editor [data-edge-id="edge-a"] .vd-flowchart-edge-selection');
      return {
        edge,
        pathWidth: Number(path?.getAttribute('stroke-width')),
        haloWidth: Number(halo?.getAttribute('stroke-width'))
      };
    });

    expect(result.edge.strokeWidth).toBe(3.5);
    expect(result.pathWidth).toBe(3.5);
    expect(result.haloWidth).toBeGreaterThan(result.pathWidth);
  });

  test('arrowheads scale up with heavier edge weights', async ({ page }) => {
    await page.locator('#editor [data-edge-id="edge-a"] .vd-flowchart-edge-hit').click();

    const before = await page.evaluate(() => {
      const path = document.querySelector('#editor [data-edge-id="edge-a"] .vd-flowchart-edge-path');
      const markerEnd = path?.getAttribute('marker-end') ?? '';
      const markerId = markerEnd.match(/#([^)]+)/)?.[1] ?? '';
      const marker = markerId ? document.getElementById(markerId) : null;
      return {
        markerId,
        markerWidth: Number(marker?.getAttribute('markerWidth'))
      };
    });

    await page.locator('#editor [data-field="edge-stroke-preset"]').selectOption('bold');

    const after = await page.evaluate(() => {
      const path = document.querySelector('#editor [data-edge-id="edge-a"] .vd-flowchart-edge-path');
      const markerEnd = path?.getAttribute('marker-end') ?? '';
      const markerId = markerEnd.match(/#([^)]+)/)?.[1] ?? '';
      const marker = markerId ? document.getElementById(markerId) : null;
      return {
        markerId,
        markerWidth: Number(marker?.getAttribute('markerWidth'))
      };
    });

    expect(after.markerId).not.toBe('');
    expect(after.markerWidth).toBeGreaterThan(before.markerWidth);
  });

  test('arrow palette tool arms one-shot connector creation', async ({ page }) => {
    const arrowTool = page.locator('#editor [data-tool="arrow"]');
    await arrowTool.click();
    await expect(arrowTool).toHaveClass(/is-active/);

    const sourceCenter = await centerOf(page.locator('#editor [data-node-id="start"][data-port="right"]'));
    const targetCenter = await centerOf(page.locator('#editor [data-node-id="decision"][data-port="top"]'));

    await page.mouse.move(sourceCenter.x, sourceCenter.y);
    await page.mouse.down();
    await page.mouse.move(targetCenter.x, targetCenter.y);
    await page.mouse.up();

    const result = await page.evaluate(() => ({
      edgeCount: (window as any).flowchartEditor.toJSON().edges.length,
      activeTool: (window as any).flowchartEditor.activeTool
    }));

    expect(result.edgeCount).toBe(3);
    expect(result.activeTool).toBeNull();
    await expect(arrowTool).not.toHaveClass(/is-active/);
  });

  test('junction primitive can branch to multiple shapes and stays fixed-size', async ({ page }) => {
    await page.locator('#editor [data-node-type="junction"]').click();
    const junctionId = await page.evaluate(() => {
      const nodes = (window as any).flowchartEditor.toJSON().nodes;
      return nodes[nodes.length - 1].id;
    });

    await page.evaluate((id) => {
      (window as any).flowchartEditor.updateNode(id, { x: 460, y: 265 });
      (window as any).flowchartEditor.select({ kind: 'node', id });
    }, junctionId);

    await expect(page.locator('#editor [data-field="node-text"]')).toHaveCount(0);
    await expect(page.locator('#editor [data-field="node-width"]')).toHaveCount(0);

    await page.evaluate((id) => {
      (window as any).flowchartEditor.addEdge({
        id: `${id}-review`,
        from: { nodeId: id, port: 'top' },
        to: { nodeId: 'review', port: 'bottom' },
        endMarker: 'arrow'
      });
      (window as any).flowchartEditor.addEdge({
        id: `${id}-decision`,
        from: { nodeId: id, port: 'right' },
        to: { nodeId: 'decision', port: 'left' },
        endMarker: 'arrow'
      });
    }, junctionId);

    const result = await page.evaluate((id) => {
      const data = (window as any).flowchartEditor.toJSON();
      const node = data.nodes.find((item: any) => item.id === id);
      const edges = data.edges.filter((edge: any) => edge.from.nodeId === id);
      return { node, edges };
    }, junctionId);

    expect(result.node.type).toBe('junction');
    expect(result.node.width).toBe(28);
    expect(result.node.height).toBe(28);
    expect(result.edges).toHaveLength(2);
  });

  test('keyboard copy and paste duplicates nodes and edges', async ({ page }) => {
    await page.locator('#editor .vd-flowchart-canvas').click();

    await page.locator('#editor .vd-flowchart-node[data-node-id="review"]').click();
    await page.locator('#editor .vd-flowchart-canvas').focus();
    await page.keyboard.press('Control+c');
    await page.keyboard.press('Control+v');

    const nodes = await page.evaluate(() => (window as any).flowchartEditor.toJSON().nodes);
    expect(nodes).toHaveLength(4);
    const originals = nodes.filter((node: any) => node.id === 'review');
    const copies = nodes.filter((node: any) => node.id !== 'review' && node.text === 'Review request');
    expect(originals).toHaveLength(1);
    expect(copies).toHaveLength(1);
    expect(copies[0].x).toBe(originals[0].x + 24);
    expect(copies[0].y).toBe(originals[0].y + 24);

    await page.locator('#editor [data-edge-id="edge-a"] .vd-flowchart-edge-hit').click();
    await page.locator('#editor .vd-flowchart-canvas').focus();
    await page.keyboard.press('Control+c');
    await page.keyboard.press('Control+v');

    const edges = await page.evaluate(() => (window as any).flowchartEditor.toJSON().edges);
    expect(edges).toHaveLength(3);
    const duplicated = edges.filter((edge: any) => edge.id !== 'edge-a' && edge.id !== 'edge-b');
    expect(duplicated).toHaveLength(1);
    expect(duplicated[0].from).toEqual(edges.find((edge: any) => edge.id === 'edge-a').from);
  });

  test('auto-init registers with Vanduo and scoped destroy removes instances', async ({ page }) => {
    const result = await page.evaluate(() => {
      const component = (window as any).Vanduo.components.flowchart;
      (window as any).Vanduo.init(document.getElementById('auto-editor'));
      const initialized = component.instances.has(document.getElementById('auto-editor'));
      const nodeCount = document.querySelectorAll('#auto-editor .vd-flowchart-node').length;
      (window as any).Vanduo.destroy(document.getElementById('auto-editor'));
      return {
        registered: Boolean(component),
        initialized,
        nodeCount,
        destroyed: document.querySelectorAll('#auto-editor .vd-flowchart-shell').length === 0,
        instanceCount: component.instances.size
      };
    });

    expect(result.registered).toBe(true);
    expect(result.initialized).toBe(true);
    expect(result.nodeCount).toBe(3);
    expect(result.destroyed).toBe(true);
    expect(result.instanceCount).toBe(0);
  });
});
