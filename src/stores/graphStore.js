import { defineStore } from "pinia";
import { BehaviorSubject } from "rxjs";
export const useGraphStore = defineStore("graph", {
    state: () => ({
        nodes: [],
        loading: false
    }),
    actions: {
        setNodes(nodes) {
            this.nodes = nodes;
        }
    }
});
// RxJS subject for selection that components can subscribe to
export const selection$ = new BehaviorSubject(null);
export function selectNode(node) {
    selection$.next(node);
}
