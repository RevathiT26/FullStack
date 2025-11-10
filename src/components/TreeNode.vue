<template>
    <v-container>
      <h1>Hierarchy Tree</h1>
      <div v-if="loading">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <span class="ml-2">Loading...</span>
      </div>
      <div v-if="error" class="error--text mb-4">
        <v-alert type="error">{{ error }}</v-alert>
      </div>
      <v-btn 
             
            size="x-medium" 
            variant="text" 
            color="success"
            @click.stop="addDialog = true"
          >
            <v-icon>mdi-Add</v-icon>ADD
          </v-btn>
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
          <v-btn 
            icon 
            size="x-small" 
            variant="text" 
            color="error"
            @click.stop="confirmDelete(item)"
            :loading="deletingIds.has(item.id)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-treeview>

      <!-- Add Item Dialog -->
      <v-dialog v-model="addDialog" max-width="600" persistent>
        <v-card>
          <v-card-title class="text-primary">
            <v-icon class="mr-2">mdi-plus-circle</v-icon>
            Add New Hierarchy Item
          </v-card-title>
          
          <v-card-text>
            <v-form ref="addForm" v-model="formValid" lazy-validation>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="newItem.name"
                    label="Name *"
                    :rules="nameRules"
                    required
                    prepend-icon="mdi-tag"
                    placeholder="Enter item name"
                    clearable
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="newItem.description"
                    label="Description *"
                    :rules="descriptionRules"
                    required
                    prepend-icon="mdi-text"
                    placeholder="Enter item description"
                    rows="3"
                    auto-grow
                    clearable
                  ></v-textarea>
                </v-col>
                
                <v-col cols="12">
                  <v-select
                    v-model="newItem.parent"
                    :items="availableParents"
                    item-title="text"
                    item-value="value"
                    label="Parent (Optional)"
                    prepend-icon="mdi-folder-outline"
                    clearable
                    placeholder="Select parent item or leave empty for root"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props" :title="item.raw.text">
                        <template v-slot:prepend>
                          <v-icon>{{ item.raw.icon }}</v-icon>
                        </template>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="closeAddDialog" color="grey">
              Cancel
            </v-btn>
            <v-btn 
              @click="addNewItem" 
              color="primary"
              :loading="adding"
              :disabled="!formValid"
            >
              <v-icon left>mdi-plus</v-icon>
              Add Item
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- View Dialog -->
      <v-dialog v-model="dialogVisible" max-width="400">
        <v-card>
          <v-card-title>Node Details</v-card-title>
          <v-card-text>
            <p><strong>Name:</strong> {{ selectedNode?.title }}</p>
            <p><strong>Description:</strong> {{ selectedNode?.value }}</p>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="dialogVisible = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete Confirmation Dialog -->
      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card>
          <v-card-title class="text-error">Confirm Delete</v-card-title>
          <v-card-text>
            <p>Are you sure you want to delete "<strong>{{ nodeToDelete?.title }}</strong>"?</p>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="deleteDialog = false">Cancel</v-btn>
            <v-btn 
              color="error" 
              @click="deleteNode"
              :loading="deletingIds.has(nodeToDelete?.id)"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, nextTick } from "vue";
import { apiClient, API_ENDPOINTS } from "@/config/api";

interface FlatData {
  name: string;
  description: string;
  parent: string;
  id: string;
}

interface TreeItem {
  value: string;
  title: string;
  parent: string;
  id: string;
  children?: TreeItem[];
}

interface ParentOption {
  text: string;
  value: string;
  icon: string;
}

interface NewItemForm {
  name: string;
  description: string;
  parent: string;
}

export default defineComponent({
  name: "TreeExample",
  setup() {
    const staticData = ref<FlatData[]>([]);
    const dialogVisible = ref(false);
    const deleteDialog = ref(false);
    const addDialog = ref(false);
    const loading = ref(false);
    const adding = ref(false);
    const error = ref<string | null>(null);
    const deletingIds = ref(new Set<string>());
    const nodeToDelete = ref<TreeItem | null>(null);
    const selectedParentFilter = ref<string | null>(null);
    const formValid = ref(false);
    const addForm = ref(null);

    // Form data for new item
    const newItem = ref<NewItemForm>({
      name: '',
      description: '',
      parent: ''
    });

    // Form validation rules
    const nameRules = [
      (v: string) => !!v || 'Name is required',
      (v: string) => (v && v.length >= 1) || 'Name must be at least 1 character',
      (v: string) => (v && v.length <= 50) || 'Name must be less than 50 characters',
    ];

    const descriptionRules = [
      (v: string) => !!v || 'Description is required',
      (v: string) => (v && v.length >= 5) || 'Description must be at least 5 characters',
      (v: string) => (v && v.length <= 100) || 'Description must be less than 100 characters',
    ];

    // Available parents for dropdown (exclude self)
    const availableParents = computed((): ParentOption[] => {
      const options: ParentOption[] = [];

      // Add "No Parent" option
      options.push({
        text: 'No Parent (Root Item)',
        value: '',
        icon: 'mdi-home'
      });

      // Add existing items as potential parents
      staticData.value.forEach(item => {
        options.push({
          text: `${item.name}`,
          value: item.name,
          icon: 'mdi-folder'
        });
      });

      return options;
    });

    // Computed property for filtered data based on parent selection
    const filteredData = computed(() => {
      if (!selectedParentFilter.value) {
        return staticData.value;
      }
      if (selectedParentFilter.value === 'ROOT') {
        return staticData.value.filter(item => !item.parent || item.parent.trim() === '');
      }
      return staticData.value.filter(item => item.parent === selectedParentFilter.value);
    });

    // Build parent options dropdown from API response
    const parentOptions = computed((): ParentOption[] => {
      const uniqueParents = new Set<string>();
      const options: ParentOption[] = [];

      options.push({
        text: 'Show All Items',
        value: '',
        icon: 'mdi-view-list'
      });

      const hasRootItems = staticData.value.some(item => !item.parent || item.parent.trim() === '');
      if (hasRootItems) {
        options.push({
          text: '🏠 Root Items (No Parent)',
          value: 'ROOT',
          icon: 'mdi-home'
        });
      }

      staticData.value.forEach(item => {
        if (item.parent && item.parent.trim() !== '') {
          uniqueParents.add(item.parent);
        }
      });

      Array.from(uniqueParents).sort().forEach(parent => {
        const childCount = staticData.value.filter(item => item.parent === parent).length;
        options.push({
          text: `${parent} (${childCount} children)`,
          value: parent,
          icon: 'mdi-folder'
        });
      });

      return options;
    });

    const buildTree = (list: FlatData[]): TreeItem[] => {
      const map = new Map<string, TreeItem>();
      const roots: TreeItem[] = [];

      list.forEach((item) => {
        map.set(item.name, {
          value: item.description,
          title: item.name,
          parent: item.parent,
          id: item.id,
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

    const treeItems = computed(() => buildTree(filteredData.value));
    const selectedNode = ref<TreeItem | null>(null);

    // Add item functions
    const openAddDialog = () => {
      // Reset form
      newItem.value = {
        name: '',
        description: '',
        parent: ''
      };
      addDialog.value = true;
      // Reset form validation
      nextTick(() => {
        if (addForm.value) {
          (addForm.value as any).resetValidation();
        }
      });
    };

    const closeAddDialog = () => {
      addDialog.value = false;
      newItem.value = {
        name: '',
        description: '',
        parent: ''
      };
    };

    const addNewItem = async () => {
      if (!formValid.value) {
        return;
      }

      try {
        adding.value = true;

        const payload = {
          name: newItem.value.name.trim(),
          description: newItem.value.description.trim(),
          parent: newItem.value.parent || ''
        };

        const response = await apiClient.post(API_ENDPOINTS.hierarchy, payload);

        if (response.status === 200 || response.status === 201) {
          // Refresh data
          await fetchHierarchy();
          
          // Close dialog
          closeAddDialog();
          
          // Clear any errors
          error.value = null;
          
        } else {
          throw new Error(`Add failed with status: ${response.status}`);
        }

      } catch (err: any) {
        error.value = err.response?.data?.message || err.message || "Failed to add new item";
      } finally {
        adding.value = false;
      }
    };

    // Filter functions
    const filterByParent = (parentValue: string | null) => {
      selectedParentFilter.value = parentValue === '' ? null : parentValue;
    };

    const clearFilter = () => {
      selectedParentFilter.value = null;
    };

    const getParentDisplayName = (parentValue: string | null): string => {
      if (!parentValue) return 'All';
      if (parentValue === 'ROOT') return 'Root Items';
      return parentValue;
    };

    // Existing functions remain the same...
    const onNodeClick = (node: TreeItem) => {
      selectedNode.value = JSON.parse(JSON.stringify(node));
      dialogVisible.value = true;
    };

    const confirmDelete = (item: TreeItem) => {
      nodeToDelete.value = JSON.parse(JSON.stringify(item));
      deleteDialog.value = true;
    };

    const deleteNode = async () => {
      if (!nodeToDelete.value?.id) {
        return;
      }

      try {
        await deleteDBRecord(nodeToDelete.value.id);
        await fetchHierarchy();
        deleteDialog.value = false;
        nodeToDelete.value = null;
      } catch (err: any) {
        error.value = err.response?.data?.message || err.message || "Failed to delete node";
      }
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

    const findNodeByValue = (nodes: TreeItem[], value: string): TreeItem | null => {
      for (const node of nodes) {
        if (node.value === value) return node;
        if (node.children) {
          const found = findNodeByValue(node.children, value);
          if (found) return found;
        }
      }
      return null;
    };

    const fetchHierarchy = async () => {
      try {
        loading.value = true;
        error.value = null;

        const response = await apiClient.get(API_ENDPOINTS.hierarchy);
        
        if (Array.isArray(response.data.data)) {
          staticData.value = response.data.data.map((d: any) => ({
            name: String(d.name ?? ""),
            description: String(d.description ?? ""),
            parent: String(d.parent ?? ""),
            id: String(d.id ?? "")
          }));
        } else {
          error.value = "Invalid data format received from API";
        }
      } catch (err: any) {
        error.value = err.response?.data?.message || err.message || "Failed to fetch hierarchy data";
      } finally {
        loading.value = false;
      }
    };

    const deleteDBRecord = async (id: string) => {
      try {
        deletingIds.value.add(id);
        await apiClient.delete(`${API_ENDPOINTS.hierarchy}/delete/${id}`);
      } catch (err: any) {
        error.value = err.response?.data?.message || err.message || "Failed to delete record";
      } finally {
        deletingIds.value.delete(id);
      }
    };

    onMounted(() => {
      fetchHierarchy();
    });

    return {
      treeItems,
      onNodeClick,
      onActiveChange,
      selectedNode,
      dialogVisible,
      deleteDialog,
      addDialog,
      loading,
      adding,
      error,
      deletingIds,
      nodeToDelete,
      fetchHierarchy,
      confirmDelete,
      deleteNode,
      selectedParentFilter,
      parentOptions,
      filteredData,
      filterByParent,
      clearFilter,
      getParentDisplayName,
      // Add item related
      newItem,
      formValid,
      addForm,
      nameRules,
      descriptionRules,
      availableParents,
      openAddDialog,
      closeAddDialog,
      addNewItem,
    };
  },
});
</script>
