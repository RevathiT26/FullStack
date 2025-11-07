<template>
  <v-app>
    <v-container>
      <v-treeview :items="treeItems" item-key="value" activatable open-on-click @update:active="onActiveChange">
        <template #label="{ item }">
          <div @click.stop="onNodeClick(item)">
            <strong>{{ item.value }}</strong>
            <small style="color: gray"> — {{ item.title }}</small>
          </div>
        </template>

        <template #append="{ item }">
          <v-btn icon size="x-small" variant="text" @click.stop="onNodeClick(item)">
            <v-icon>mdi-eye</v-icon>
          </v-btn>
        </template>
      </v-treeview>
      <v-dialog v-model="dialogVisible">
        <v-card>
          <v-card-text style="text-align: center;">
            {{ selectedNode ? selectedNode.value : "" }}
          </v-card-text>
          <v-card-actions>
            <v-btn @click="dialogVisible = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </v-container>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";

interface FlatData {
  name: string;
  description: string;
  parent: string;
}

interface TreeItem {
  value: string;
  title: string;
  parent: string;
  children?: TreeItem[];
}

export default defineComponent({
  name: "TreeExample",
  setup() {
    const staticData = ref<FlatData[]>([
      { name: "A", description: "This is a description of A", parent: "" },
      { name: "B", description: "This is a description of B", parent: "A" },
      { name: "C", description: "This is a description of C", parent: "A" },
      { name: "D", description: "This is a description of D", parent: "A" },
      { name: "B-1", description: "This is a description of B-1", parent: "B" },
      { name: "B-2", description: "This is a description of B-2", parent: "B" },
      { name: "B-3", description: "This is a description of B-3", parent: "B" }
    ]);

    const dialogVisible = ref(false);
    const buildTree = (list: FlatData[]): TreeItem[] => {
      const map = new Map<string, TreeItem>();
      const roots: TreeItem[] = [];

      list.forEach((item) => {
        map.set(item.name, {
          value: item.description,
          title: item.name,
          parent: item.parent,
          children: [],
        });
      });

      map.forEach((node) => {
        if (node.parent && map.has(node.parent)) {
          map.get(node.parent)!.children!.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    };

    const treeItems = computed(() => buildTree(staticData.value));
    const selectedNode = ref<TreeItem | null>(null);

    const onNodeClick = (node: TreeItem) => {
      // ✅ Convert proxy to plain JS object for logging
      selectedNode.value = JSON.parse(JSON.stringify(node));
      console.log("Clicked node:", selectedNode.value);
      dialogVisible.value = true;
    };

    const onActiveChange = (activeKeys: string[]) => {
      if (activeKeys.length) {
        const key = activeKeys[0];
        const found = findNodeByValue(treeItems.value, key);
        selectedNode.value = found ? JSON.parse(JSON.stringify(found)) : null;
      } else {
        selectedNode.value = null;
      }
    };

    const findNodeByValue = (
      nodes: TreeItem[],
      value: string
    ): TreeItem | null => {
      for (const node of nodes) {
        if (node.value === value) return node;
        if (node.children) {
          const found = findNodeByValue(node.children, value);
          if (found) return found;
        }
      }
      return null;
    };

    return {
      treeItems,
      onNodeClick,
      onActiveChange,
      selectedNode,
      dialogVisible
    };
  },
});
</script>
