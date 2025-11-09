<template>
  <v-app>
    <v-container>
      <v-treeview :items="treeItems" item-key="value" activatable open-on-click @update:active="onActiveChange">
        <template #title="{ item }">
          <div @click.stop="onNodeClick(item)">
            <strong>{{ item.title }}</strong>
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
import { defineComponent, ref, computed, onMounted } from "vue";

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
    // replace static/staticData with an empty ref and fetch on mount
    const staticData = ref<FlatData[]>([]);

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
      console.log("Active keys changed:", activeKeys);
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

    // Fetch hierarchy from API on component mount
    onMounted(async () => {
      try {
        const res = await fetch("https://hierarchyapp-cfa7g5dth7enb0d3.southindia-01.azurewebsites.net/api/hierarchy", {
          method: "GET",
          headers: { "Accept": "application/json" }
        });
        if (!res.ok) {
          console.error("Failed to fetch hierarchy:", res.status, res.statusText);
          return;
        }
        const data = await res.json();
        // Expecting API to return an array of objects matching FlatData
        if (Array.isArray(data)) {
          // optional: validate/normalize items minimally
          staticData.value = data.map((d: any) => ({
            name: String(d.name ?? ""),
            description: String(d.description ?? d.desc ?? ""),
            parent: String(d.parent ?? "")
          }));
        } else {
          console.error("Unexpected hierarchy response:", data);
        }
      } catch (err) {
        console.error("Error fetching hierarchy:", err);
      }
    });

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
