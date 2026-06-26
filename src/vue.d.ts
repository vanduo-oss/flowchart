import type { DefineComponent } from 'vue';

export interface VdFlowchartDocument {
  nodes?: Array<Record<string, unknown>>;
  edges?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface VdFlowchartProps {
  /** Flowchart document ({ nodes, edges }). */
  data?: VdFlowchartDocument;
  /** Render as a non-editable viewer. */
  readonly?: boolean;
  /** Background grid size in px. */
  gridSize?: number;
}

export declare const VdFlowchart: DefineComponent<VdFlowchartProps>;
export default VdFlowchart;
