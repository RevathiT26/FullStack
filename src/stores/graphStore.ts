import { defineStore } from "pinia";
import { BehaviorSubject } from "rxjs";

export interface GraphNode {
  name: string;
  description: string;
  parent?: string;
}

export const useGraphStore = defineStore("graph", {
  state: () => ({
    nodes: [] as GraphNode[],
    loading: false
  }),
  actions: {
    setNodes(nodes: GraphNode[]) {
      this.nodes = nodes;
    }
  }
});

// RxJS subject for selection that components can subscribe to
export const selection$ = new BehaviorSubject<GraphNode | null>(null);
export function selectNode(node: GraphNode | null) {
  selection$.next(node);
}
