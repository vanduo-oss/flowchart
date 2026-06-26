/**
 * Vue 3 bindings for @vanduo-oss/flowchart — optional entry.
 *
 *   import { VdFlowchart } from '@vanduo-oss/flowchart/vue';
 *   <VdFlowchart :data="doc" :readonly="false" @change="onChange" />
 *
 * The core package stays framework-agnostic; `vue` is an *optional* peer
 * dependency, only needed if you import this subpath. SSR-safe: the editor is
 * created on mount (client) into a plain container the server can pre-render.
 */
import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { VdFlowchart as VdFlowchartCore } from './index.js';

const FORWARDED_EVENTS = ['change', 'select', 'viewport', 'connect'];

export const VdFlowchart = defineComponent({
  name: 'VdFlowchart',
  props: {
    /** Flowchart document — `{ nodes, edges }`. */
    data: { type: Object, default: () => ({}) },
    /** Render as a non-editable viewer. */
    readonly: { type: Boolean, default: false },
    /** Background grid size in px. */
    gridSize: { type: Number, default: undefined },
  },
  emits: ['change', 'select', 'viewport', 'connect', 'ready'],
  setup(props, { emit, expose }) {
    const el = ref(null);
    let instance = null;

    const create = () => {
      instance = new VdFlowchartCore({
        element: el.value,
        data: props.data,
        readonly: props.readonly,
        gridSize: props.gridSize,
      });
      FORWARDED_EVENTS.forEach((name) => {
        instance.on(name, (payload) => emit(name, payload));
      });
      emit('ready', instance);
    };

    onMounted(() => {
      if (typeof window === 'undefined' || !el.value) return;
      create();
    });

    // Data flows through load(); construct-time options recreate the editor.
    watch(
      () => props.data,
      (next) => {
        if (instance && typeof instance.load === 'function') instance.load(next);
      },
      { deep: true },
    );
    watch(
      () => [props.readonly, props.gridSize],
      () => {
        if (!instance) return;
        instance.destroy();
        create();
      },
    );

    onBeforeUnmount(() => {
      if (instance) {
        instance.destroy();
        instance = null;
      }
    });

    expose({ getInstance: () => instance });

    return () => h('div', { ref: el, class: 'vd-flowchart' });
  },
});

export default VdFlowchart;
