/// <reference types="C:/Users/ksain/revathi/infosysTest/treenode/node_modules/.vue-global-types/vue_3.5_0.d.ts" />
import { defineComponent, ref, computed, onMounted, nextTick } from "vue";
import { apiClient, API_ENDPOINTS } from "@/config/api";
debugger; /* PartiallyEnd: #3632/script.vue */
const __VLS_export = defineComponent({
    name: "TreeExample",
    setup() {
        const staticData = ref([]);
        const dialogVisible = ref(false);
        const deleteDialog = ref(false);
        const addDialog = ref(false);
        const loading = ref(false);
        const adding = ref(false);
        const error = ref(null);
        const deletingIds = ref(new Set());
        const nodeToDelete = ref(null);
        const selectedParentFilter = ref(null);
        const formValid = ref(false);
        const addForm = ref(null);
        // Form data for new item
        const newItem = ref({
            name: '',
            description: '',
            parent: ''
        });
        // Form validation rules
        const nameRules = [
            (v) => !!v || 'Name is required',
            (v) => (v && v.length >= 1) || 'Name must be at least 1 character',
            (v) => (v && v.length <= 50) || 'Name must be less than 50 characters',
        ];
        const descriptionRules = [
            (v) => !!v || 'Description is required',
            (v) => (v && v.length >= 5) || 'Description must be at least 5 characters',
            (v) => (v && v.length <= 100) || 'Description must be less than 100 characters',
        ];
        // Available parents for dropdown (exclude self)
        const availableParents = computed(() => {
            const options = [];
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
        const parentOptions = computed(() => {
            const uniqueParents = new Set();
            const options = [];
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
        const buildTree = (list) => {
            const map = new Map();
            const roots = [];
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
                    map.get(node.parent).children.push(node);
                }
                else {
                    roots.push(node);
                }
            });
            return roots;
        };
        const treeItems = computed(() => buildTree(filteredData.value));
        const selectedNode = ref(null);
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
                    addForm.value.resetValidation();
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
                }
                else {
                    throw new Error(`Add failed with status: ${response.status}`);
                }
            }
            catch (err) {
                error.value = err.response?.data?.message || err.message || "Failed to add new item";
            }
            finally {
                adding.value = false;
            }
        };
        // Filter functions
        const filterByParent = (parentValue) => {
            selectedParentFilter.value = parentValue === '' ? null : parentValue;
        };
        const clearFilter = () => {
            selectedParentFilter.value = null;
        };
        const getParentDisplayName = (parentValue) => {
            if (!parentValue)
                return 'All';
            if (parentValue === 'ROOT')
                return 'Root Items';
            return parentValue;
        };
        // Existing functions remain the same...
        const onNodeClick = (node) => {
            selectedNode.value = JSON.parse(JSON.stringify(node));
            dialogVisible.value = true;
        };
        const confirmDelete = (item) => {
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
            }
            catch (err) {
                error.value = err.response?.data?.message || err.message || "Failed to delete node";
            }
        };
        const onActiveChange = (activeKeys) => {
            if (activeKeys.length) {
                const key = activeKeys[0];
                const found = findNodeByValue(treeItems.value, key);
                selectedNode.value = found ? JSON.parse(JSON.stringify(found)) : null;
            }
            else {
                selectedNode.value = null;
            }
        };
        const findNodeByValue = (nodes, value) => {
            for (const node of nodes) {
                if (node.value === value)
                    return node;
                if (node.children) {
                    const found = findNodeByValue(node.children, value);
                    if (found)
                        return found;
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
                    staticData.value = response.data.data.map((d) => ({
                        name: String(d.name ?? ""),
                        description: String(d.description ?? ""),
                        parent: String(d.parent ?? ""),
                        id: String(d.id ?? "")
                    }));
                }
                else {
                    error.value = "Invalid data format received from API";
                }
            }
            catch (err) {
                error.value = err.response?.data?.message || err.message || "Failed to fetch hierarchy data";
            }
            finally {
                loading.value = false;
            }
        };
        const deleteDBRecord = async (id) => {
            try {
                deletingIds.value.add(id);
                await apiClient.delete(`${API_ENDPOINTS.hierarchy}/delete/${id}`);
            }
            catch (err) {
                error.value = err.response?.data?.message || err.message || "Failed to delete record";
            }
            finally {
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
const __VLS_self = (await import('vue')).defineComponent({
    name: "TreeExample",
    setup() {
        const staticData = ref([]);
        const dialogVisible = ref(false);
        const deleteDialog = ref(false);
        const addDialog = ref(false);
        const loading = ref(false);
        const adding = ref(false);
        const error = ref(null);
        const deletingIds = ref(new Set());
        const nodeToDelete = ref(null);
        const selectedParentFilter = ref(null);
        const formValid = ref(false);
        const addForm = ref(null);
        // Form data for new item
        const newItem = ref({
            name: '',
            description: '',
            parent: ''
        });
        // Form validation rules
        const nameRules = [
            (v) => !!v || 'Name is required',
            (v) => (v && v.length >= 1) || 'Name must be at least 1 character',
            (v) => (v && v.length <= 50) || 'Name must be less than 50 characters',
        ];
        const descriptionRules = [
            (v) => !!v || 'Description is required',
            (v) => (v && v.length >= 5) || 'Description must be at least 5 characters',
            (v) => (v && v.length <= 100) || 'Description must be less than 100 characters',
        ];
        // Available parents for dropdown (exclude self)
        const availableParents = computed(() => {
            const options = [];
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
        const parentOptions = computed(() => {
            const uniqueParents = new Set();
            const options = [];
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
        const buildTree = (list) => {
            const map = new Map();
            const roots = [];
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
                    map.get(node.parent).children.push(node);
                }
                else {
                    roots.push(node);
                }
            });
            return roots;
        };
        const treeItems = computed(() => buildTree(filteredData.value));
        const selectedNode = ref(null);
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
                    addForm.value.resetValidation();
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
                }
                else {
                    throw new Error(`Add failed with status: ${response.status}`);
                }
            }
            catch (err) {
                error.value = err.response?.data?.message || err.message || "Failed to add new item";
            }
            finally {
                adding.value = false;
            }
        };
        // Filter functions
        const filterByParent = (parentValue) => {
            selectedParentFilter.value = parentValue === '' ? null : parentValue;
        };
        const clearFilter = () => {
            selectedParentFilter.value = null;
        };
        const getParentDisplayName = (parentValue) => {
            if (!parentValue)
                return 'All';
            if (parentValue === 'ROOT')
                return 'Root Items';
            return parentValue;
        };
        // Existing functions remain the same...
        const onNodeClick = (node) => {
            selectedNode.value = JSON.parse(JSON.stringify(node));
            dialogVisible.value = true;
        };
        const confirmDelete = (item) => {
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
            }
            catch (err) {
                error.value = err.response?.data?.message || err.message || "Failed to delete node";
            }
        };
        const onActiveChange = (activeKeys) => {
            if (activeKeys.length) {
                const key = activeKeys[0];
                const found = findNodeByValue(treeItems.value, key);
                selectedNode.value = found ? JSON.parse(JSON.stringify(found)) : null;
            }
            else {
                selectedNode.value = null;
            }
        };
        const findNodeByValue = (nodes, value) => {
            for (const node of nodes) {
                if (node.value === value)
                    return node;
                if (node.children) {
                    const found = findNodeByValue(node.children, value);
                    if (found)
                        return found;
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
                    staticData.value = response.data.data.map((d) => ({
                        name: String(d.name ?? ""),
                        description: String(d.description ?? ""),
                        parent: String(d.parent ?? ""),
                        id: String(d.id ?? "")
                    }));
                }
                else {
                    error.value = "Invalid data format received from API";
                }
            }
            catch (err) {
                error.value = err.response?.data?.message || err.message || "Failed to fetch hierarchy data";
            }
            finally {
                loading.value = false;
            }
        };
        const deleteDBRecord = async (id) => {
            try {
                deletingIds.value.add(id);
                await apiClient.delete(`${API_ENDPOINTS.hierarchy}/delete/${id}`);
            }
            catch (err) {
                error.value = err.response?.data?.message || err.message || "Failed to delete record";
            }
            finally {
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
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.VContainer;
/** @type {[typeof __VLS_components.VContainer, typeof __VLS_components.vContainer, typeof __VLS_components.VContainer, typeof __VLS_components.vContainer, ]} */ ;
// @ts-ignore
VContainer;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
const { default: __VLS_5 } = __VLS_3.slots;
__VLS_asFunctionalElement(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
if (__VLS_ctx.loading) {
    // @ts-ignore
    [loading,];
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    const __VLS_6 = {}.VProgressCircular;
    /** @type {[typeof __VLS_components.VProgressCircular, typeof __VLS_components.vProgressCircular, typeof __VLS_components.VProgressCircular, typeof __VLS_components.vProgressCircular, ]} */ ;
    // @ts-ignore
    VProgressCircular;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
        indeterminate: true,
        color: "primary",
    }));
    const __VLS_8 = __VLS_7({
        indeterminate: true,
        color: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    __VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ml-2" },
    });
}
if (__VLS_ctx.error) {
    // @ts-ignore
    [error,];
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "error--text mb-4" },
    });
    const __VLS_11 = {}.VAlert;
    /** @type {[typeof __VLS_components.VAlert, typeof __VLS_components.vAlert, typeof __VLS_components.VAlert, typeof __VLS_components.vAlert, ]} */ ;
    // @ts-ignore
    VAlert;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
        type: "error",
    }));
    const __VLS_13 = __VLS_12({
        type: "error",
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    const { default: __VLS_15 } = __VLS_14.slots;
    (__VLS_ctx.error);
    // @ts-ignore
    [error,];
    var __VLS_14;
}
const __VLS_16 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
    size: "x-medium",
    variant: "text",
    color: "success",
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
    size: "x-medium",
    variant: "text",
    color: "success",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
const __VLS_22 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.addDialog = true;
            // @ts-ignore
            [addDialog,];
        } });
const { default: __VLS_23 } = __VLS_19.slots;
const __VLS_24 = {}.VIcon;
/** @type {[typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, ]} */ ;
// @ts-ignore
VIcon;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({}));
const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const { default: __VLS_28 } = __VLS_27.slots;
var __VLS_27;
var __VLS_19;
const __VLS_29 = {}.VTreeview;
/** @type {[typeof __VLS_components.VTreeview, typeof __VLS_components.vTreeview, typeof __VLS_components.VTreeview, typeof __VLS_components.vTreeview, ]} */ ;
// @ts-ignore
VTreeview;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    ...{ 'onUpdate:active': {} },
    items: (__VLS_ctx.treeItems),
    itemKey: "value",
    activatable: true,
    openOnClick: true,
}));
const __VLS_31 = __VLS_30({
    ...{ 'onUpdate:active': {} },
    items: (__VLS_ctx.treeItems),
    itemKey: "value",
    activatable: true,
    openOnClick: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
let __VLS_33;
let __VLS_34;
const __VLS_35 = ({ 'update:active': {} },
    { 'onUpdate:active': (__VLS_ctx.onActiveChange) });
const { default: __VLS_36 } = __VLS_32.slots;
// @ts-ignore
[treeItems, onActiveChange,];
{
    const { title: __VLS_37 } = __VLS_32.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_37);
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.onNodeClick(item);
                // @ts-ignore
                [onNodeClick,];
            } },
    });
    __VLS_asFunctionalElement(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (item.title);
    __VLS_asFunctionalElement(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ style: {} },
    });
    (item.title);
}
{
    const { append: __VLS_38 } = __VLS_32.slots;
    const [{ item }] = __VLS_getSlotParameters(__VLS_38);
    const __VLS_39 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    VBtn;
    // @ts-ignore
    const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
        ...{ 'onClick': {} },
        icon: true,
        size: "x-small",
        variant: "text",
    }));
    const __VLS_41 = __VLS_40({
        ...{ 'onClick': {} },
        icon: true,
        size: "x-small",
        variant: "text",
    }, ...__VLS_functionalComponentArgsRest(__VLS_40));
    let __VLS_43;
    let __VLS_44;
    const __VLS_45 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.onNodeClick(item);
                // @ts-ignore
                [onNodeClick,];
            } });
    const { default: __VLS_46 } = __VLS_42.slots;
    const __VLS_47 = {}.VIcon;
    /** @type {[typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, ]} */ ;
    // @ts-ignore
    VIcon;
    // @ts-ignore
    const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({}));
    const __VLS_49 = __VLS_48({}, ...__VLS_functionalComponentArgsRest(__VLS_48));
    const { default: __VLS_51 } = __VLS_50.slots;
    var __VLS_50;
    var __VLS_42;
    const __VLS_52 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    VBtn;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        ...{ 'onClick': {} },
        icon: true,
        size: "x-small",
        variant: "text",
        color: "error",
        loading: (__VLS_ctx.deletingIds.has(item.id)),
    }));
    const __VLS_54 = __VLS_53({
        ...{ 'onClick': {} },
        icon: true,
        size: "x-small",
        variant: "text",
        color: "error",
        loading: (__VLS_ctx.deletingIds.has(item.id)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    let __VLS_56;
    let __VLS_57;
    const __VLS_58 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.confirmDelete(item);
                // @ts-ignore
                [deletingIds, confirmDelete,];
            } });
    const { default: __VLS_59 } = __VLS_55.slots;
    const __VLS_60 = {}.VIcon;
    /** @type {[typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, ]} */ ;
    // @ts-ignore
    VIcon;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({}));
    const __VLS_62 = __VLS_61({}, ...__VLS_functionalComponentArgsRest(__VLS_61));
    const { default: __VLS_64 } = __VLS_63.slots;
    var __VLS_63;
    var __VLS_55;
}
var __VLS_32;
const __VLS_65 = {}.VDialog;
/** @type {[typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, ]} */ ;
// @ts-ignore
VDialog;
// @ts-ignore
const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
    modelValue: (__VLS_ctx.addDialog),
    maxWidth: "600",
    persistent: true,
}));
const __VLS_67 = __VLS_66({
    modelValue: (__VLS_ctx.addDialog),
    maxWidth: "600",
    persistent: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_66));
const { default: __VLS_69 } = __VLS_68.slots;
// @ts-ignore
[addDialog,];
const __VLS_70 = {}.VCard;
/** @type {[typeof __VLS_components.VCard, typeof __VLS_components.vCard, typeof __VLS_components.VCard, typeof __VLS_components.vCard, ]} */ ;
// @ts-ignore
VCard;
// @ts-ignore
const __VLS_71 = __VLS_asFunctionalComponent(__VLS_70, new __VLS_70({}));
const __VLS_72 = __VLS_71({}, ...__VLS_functionalComponentArgsRest(__VLS_71));
const { default: __VLS_74 } = __VLS_73.slots;
const __VLS_75 = {}.VCardTitle;
/** @type {[typeof __VLS_components.VCardTitle, typeof __VLS_components.vCardTitle, typeof __VLS_components.VCardTitle, typeof __VLS_components.vCardTitle, ]} */ ;
// @ts-ignore
VCardTitle;
// @ts-ignore
const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
    ...{ class: "text-primary" },
}));
const __VLS_77 = __VLS_76({
    ...{ class: "text-primary" },
}, ...__VLS_functionalComponentArgsRest(__VLS_76));
const { default: __VLS_79 } = __VLS_78.slots;
const __VLS_80 = {}.VIcon;
/** @type {[typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, ]} */ ;
// @ts-ignore
VIcon;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    ...{ class: "mr-2" },
}));
const __VLS_82 = __VLS_81({
    ...{ class: "mr-2" },
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
const { default: __VLS_84 } = __VLS_83.slots;
var __VLS_83;
var __VLS_78;
const __VLS_85 = {}.VCardText;
/** @type {[typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, ]} */ ;
// @ts-ignore
VCardText;
// @ts-ignore
const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({}));
const __VLS_87 = __VLS_86({}, ...__VLS_functionalComponentArgsRest(__VLS_86));
const { default: __VLS_89 } = __VLS_88.slots;
const __VLS_90 = {}.VForm;
/** @type {[typeof __VLS_components.VForm, typeof __VLS_components.vForm, typeof __VLS_components.VForm, typeof __VLS_components.vForm, ]} */ ;
// @ts-ignore
VForm;
// @ts-ignore
const __VLS_91 = __VLS_asFunctionalComponent(__VLS_90, new __VLS_90({
    ref: "addForm",
    modelValue: (__VLS_ctx.formValid),
    lazyValidation: true,
}));
const __VLS_92 = __VLS_91({
    ref: "addForm",
    modelValue: (__VLS_ctx.formValid),
    lazyValidation: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_91));
/** @type {typeof __VLS_ctx.addForm} */ ;
var __VLS_94 = {};
const { default: __VLS_96 } = __VLS_93.slots;
// @ts-ignore
[formValid, addForm,];
const __VLS_97 = {}.VRow;
/** @type {[typeof __VLS_components.VRow, typeof __VLS_components.vRow, typeof __VLS_components.VRow, typeof __VLS_components.vRow, ]} */ ;
// @ts-ignore
VRow;
// @ts-ignore
const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({}));
const __VLS_99 = __VLS_98({}, ...__VLS_functionalComponentArgsRest(__VLS_98));
const { default: __VLS_101 } = __VLS_100.slots;
const __VLS_102 = {}.VCol;
/** @type {[typeof __VLS_components.VCol, typeof __VLS_components.vCol, typeof __VLS_components.VCol, typeof __VLS_components.vCol, ]} */ ;
// @ts-ignore
VCol;
// @ts-ignore
const __VLS_103 = __VLS_asFunctionalComponent(__VLS_102, new __VLS_102({
    cols: "12",
}));
const __VLS_104 = __VLS_103({
    cols: "12",
}, ...__VLS_functionalComponentArgsRest(__VLS_103));
const { default: __VLS_106 } = __VLS_105.slots;
const __VLS_107 = {}.VTextField;
/** @type {[typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, ]} */ ;
// @ts-ignore
VTextField;
// @ts-ignore
const __VLS_108 = __VLS_asFunctionalComponent(__VLS_107, new __VLS_107({
    modelValue: (__VLS_ctx.newItem.name),
    label: "Name *",
    rules: (__VLS_ctx.nameRules),
    required: true,
    prependIcon: "mdi-tag",
    placeholder: "Enter item name",
    clearable: true,
}));
const __VLS_109 = __VLS_108({
    modelValue: (__VLS_ctx.newItem.name),
    label: "Name *",
    rules: (__VLS_ctx.nameRules),
    required: true,
    prependIcon: "mdi-tag",
    placeholder: "Enter item name",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_108));
// @ts-ignore
[newItem, nameRules,];
var __VLS_105;
const __VLS_112 = {}.VCol;
/** @type {[typeof __VLS_components.VCol, typeof __VLS_components.vCol, typeof __VLS_components.VCol, typeof __VLS_components.vCol, ]} */ ;
// @ts-ignore
VCol;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
    cols: "12",
}));
const __VLS_114 = __VLS_113({
    cols: "12",
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
const { default: __VLS_116 } = __VLS_115.slots;
const __VLS_117 = {}.VTextarea;
/** @type {[typeof __VLS_components.VTextarea, typeof __VLS_components.vTextarea, typeof __VLS_components.VTextarea, typeof __VLS_components.vTextarea, ]} */ ;
// @ts-ignore
VTextarea;
// @ts-ignore
const __VLS_118 = __VLS_asFunctionalComponent(__VLS_117, new __VLS_117({
    modelValue: (__VLS_ctx.newItem.description),
    label: "Description *",
    rules: (__VLS_ctx.descriptionRules),
    required: true,
    prependIcon: "mdi-text",
    placeholder: "Enter item description",
    rows: "3",
    autoGrow: true,
    clearable: true,
}));
const __VLS_119 = __VLS_118({
    modelValue: (__VLS_ctx.newItem.description),
    label: "Description *",
    rules: (__VLS_ctx.descriptionRules),
    required: true,
    prependIcon: "mdi-text",
    placeholder: "Enter item description",
    rows: "3",
    autoGrow: true,
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_118));
// @ts-ignore
[newItem, descriptionRules,];
var __VLS_115;
const __VLS_122 = {}.VCol;
/** @type {[typeof __VLS_components.VCol, typeof __VLS_components.vCol, typeof __VLS_components.VCol, typeof __VLS_components.vCol, ]} */ ;
// @ts-ignore
VCol;
// @ts-ignore
const __VLS_123 = __VLS_asFunctionalComponent(__VLS_122, new __VLS_122({
    cols: "12",
}));
const __VLS_124 = __VLS_123({
    cols: "12",
}, ...__VLS_functionalComponentArgsRest(__VLS_123));
const { default: __VLS_126 } = __VLS_125.slots;
const __VLS_127 = {}.VSelect;
/** @type {[typeof __VLS_components.VSelect, typeof __VLS_components.vSelect, typeof __VLS_components.VSelect, typeof __VLS_components.vSelect, ]} */ ;
// @ts-ignore
VSelect;
// @ts-ignore
const __VLS_128 = __VLS_asFunctionalComponent(__VLS_127, new __VLS_127({
    modelValue: (__VLS_ctx.newItem.parent),
    items: (__VLS_ctx.availableParents),
    itemTitle: "text",
    itemValue: "value",
    label: "Parent (Optional)",
    prependIcon: "mdi-folder-outline",
    clearable: true,
    placeholder: "Select parent item or leave empty for root",
}));
const __VLS_129 = __VLS_128({
    modelValue: (__VLS_ctx.newItem.parent),
    items: (__VLS_ctx.availableParents),
    itemTitle: "text",
    itemValue: "value",
    label: "Parent (Optional)",
    prependIcon: "mdi-folder-outline",
    clearable: true,
    placeholder: "Select parent item or leave empty for root",
}, ...__VLS_functionalComponentArgsRest(__VLS_128));
const { default: __VLS_131 } = __VLS_130.slots;
// @ts-ignore
[newItem, availableParents,];
{
    const { item: __VLS_132 } = __VLS_130.slots;
    const [{ props, item }] = __VLS_getSlotParameters(__VLS_132);
    const __VLS_133 = {}.VListItem;
    /** @type {[typeof __VLS_components.VListItem, typeof __VLS_components.vListItem, typeof __VLS_components.VListItem, typeof __VLS_components.vListItem, ]} */ ;
    // @ts-ignore
    VListItem;
    // @ts-ignore
    const __VLS_134 = __VLS_asFunctionalComponent(__VLS_133, new __VLS_133({
        ...(props),
        title: (item.raw.text),
    }));
    const __VLS_135 = __VLS_134({
        ...(props),
        title: (item.raw.text),
    }, ...__VLS_functionalComponentArgsRest(__VLS_134));
    const { default: __VLS_137 } = __VLS_136.slots;
    {
        const { prepend: __VLS_138 } = __VLS_136.slots;
        const __VLS_139 = {}.VIcon;
        /** @type {[typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, ]} */ ;
        // @ts-ignore
        VIcon;
        // @ts-ignore
        const __VLS_140 = __VLS_asFunctionalComponent(__VLS_139, new __VLS_139({}));
        const __VLS_141 = __VLS_140({}, ...__VLS_functionalComponentArgsRest(__VLS_140));
        const { default: __VLS_143 } = __VLS_142.slots;
        (item.raw.icon);
        var __VLS_142;
    }
    var __VLS_136;
}
var __VLS_130;
var __VLS_125;
var __VLS_100;
var __VLS_93;
var __VLS_88;
const __VLS_144 = {}.VCardActions;
/** @type {[typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, ]} */ ;
// @ts-ignore
VCardActions;
// @ts-ignore
const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({}));
const __VLS_146 = __VLS_145({}, ...__VLS_functionalComponentArgsRest(__VLS_145));
const { default: __VLS_148 } = __VLS_147.slots;
const __VLS_149 = {}.VSpacer;
/** @type {[typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, ]} */ ;
// @ts-ignore
VSpacer;
// @ts-ignore
const __VLS_150 = __VLS_asFunctionalComponent(__VLS_149, new __VLS_149({}));
const __VLS_151 = __VLS_150({}, ...__VLS_functionalComponentArgsRest(__VLS_150));
const __VLS_154 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_155 = __VLS_asFunctionalComponent(__VLS_154, new __VLS_154({
    ...{ 'onClick': {} },
    color: "grey",
}));
const __VLS_156 = __VLS_155({
    ...{ 'onClick': {} },
    color: "grey",
}, ...__VLS_functionalComponentArgsRest(__VLS_155));
let __VLS_158;
let __VLS_159;
const __VLS_160 = ({ click: {} },
    { onClick: (__VLS_ctx.closeAddDialog) });
const { default: __VLS_161 } = __VLS_157.slots;
// @ts-ignore
[closeAddDialog,];
var __VLS_157;
const __VLS_162 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_163 = __VLS_asFunctionalComponent(__VLS_162, new __VLS_162({
    ...{ 'onClick': {} },
    color: "primary",
    loading: (__VLS_ctx.adding),
    disabled: (!__VLS_ctx.formValid),
}));
const __VLS_164 = __VLS_163({
    ...{ 'onClick': {} },
    color: "primary",
    loading: (__VLS_ctx.adding),
    disabled: (!__VLS_ctx.formValid),
}, ...__VLS_functionalComponentArgsRest(__VLS_163));
let __VLS_166;
let __VLS_167;
const __VLS_168 = ({ click: {} },
    { onClick: (__VLS_ctx.addNewItem) });
const { default: __VLS_169 } = __VLS_165.slots;
// @ts-ignore
[formValid, adding, addNewItem,];
const __VLS_170 = {}.VIcon;
/** @type {[typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, ]} */ ;
// @ts-ignore
VIcon;
// @ts-ignore
const __VLS_171 = __VLS_asFunctionalComponent(__VLS_170, new __VLS_170({
    left: true,
}));
const __VLS_172 = __VLS_171({
    left: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_171));
const { default: __VLS_174 } = __VLS_173.slots;
var __VLS_173;
var __VLS_165;
var __VLS_147;
var __VLS_73;
var __VLS_68;
const __VLS_175 = {}.VDialog;
/** @type {[typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, ]} */ ;
// @ts-ignore
VDialog;
// @ts-ignore
const __VLS_176 = __VLS_asFunctionalComponent(__VLS_175, new __VLS_175({
    modelValue: (__VLS_ctx.dialogVisible),
    maxWidth: "400",
}));
const __VLS_177 = __VLS_176({
    modelValue: (__VLS_ctx.dialogVisible),
    maxWidth: "400",
}, ...__VLS_functionalComponentArgsRest(__VLS_176));
const { default: __VLS_179 } = __VLS_178.slots;
// @ts-ignore
[dialogVisible,];
const __VLS_180 = {}.VCard;
/** @type {[typeof __VLS_components.VCard, typeof __VLS_components.vCard, typeof __VLS_components.VCard, typeof __VLS_components.vCard, ]} */ ;
// @ts-ignore
VCard;
// @ts-ignore
const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({}));
const __VLS_182 = __VLS_181({}, ...__VLS_functionalComponentArgsRest(__VLS_181));
const { default: __VLS_184 } = __VLS_183.slots;
const __VLS_185 = {}.VCardTitle;
/** @type {[typeof __VLS_components.VCardTitle, typeof __VLS_components.vCardTitle, typeof __VLS_components.VCardTitle, typeof __VLS_components.vCardTitle, ]} */ ;
// @ts-ignore
VCardTitle;
// @ts-ignore
const __VLS_186 = __VLS_asFunctionalComponent(__VLS_185, new __VLS_185({}));
const __VLS_187 = __VLS_186({}, ...__VLS_functionalComponentArgsRest(__VLS_186));
const { default: __VLS_189 } = __VLS_188.slots;
var __VLS_188;
const __VLS_190 = {}.VCardText;
/** @type {[typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, ]} */ ;
// @ts-ignore
VCardText;
// @ts-ignore
const __VLS_191 = __VLS_asFunctionalComponent(__VLS_190, new __VLS_190({}));
const __VLS_192 = __VLS_191({}, ...__VLS_functionalComponentArgsRest(__VLS_191));
const { default: __VLS_194 } = __VLS_193.slots;
__VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.selectedNode?.title);
// @ts-ignore
[selectedNode,];
__VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.selectedNode?.value);
// @ts-ignore
[selectedNode,];
var __VLS_193;
const __VLS_195 = {}.VCardActions;
/** @type {[typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, ]} */ ;
// @ts-ignore
VCardActions;
// @ts-ignore
const __VLS_196 = __VLS_asFunctionalComponent(__VLS_195, new __VLS_195({}));
const __VLS_197 = __VLS_196({}, ...__VLS_functionalComponentArgsRest(__VLS_196));
const { default: __VLS_199 } = __VLS_198.slots;
const __VLS_200 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
    ...{ 'onClick': {} },
}));
const __VLS_202 = __VLS_201({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_201));
let __VLS_204;
let __VLS_205;
const __VLS_206 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.dialogVisible = false;
            // @ts-ignore
            [dialogVisible,];
        } });
const { default: __VLS_207 } = __VLS_203.slots;
var __VLS_203;
var __VLS_198;
var __VLS_183;
var __VLS_178;
const __VLS_208 = {}.VDialog;
/** @type {[typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, ]} */ ;
// @ts-ignore
VDialog;
// @ts-ignore
const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
    modelValue: (__VLS_ctx.deleteDialog),
    maxWidth: "400",
}));
const __VLS_210 = __VLS_209({
    modelValue: (__VLS_ctx.deleteDialog),
    maxWidth: "400",
}, ...__VLS_functionalComponentArgsRest(__VLS_209));
const { default: __VLS_212 } = __VLS_211.slots;
// @ts-ignore
[deleteDialog,];
const __VLS_213 = {}.VCard;
/** @type {[typeof __VLS_components.VCard, typeof __VLS_components.vCard, typeof __VLS_components.VCard, typeof __VLS_components.vCard, ]} */ ;
// @ts-ignore
VCard;
// @ts-ignore
const __VLS_214 = __VLS_asFunctionalComponent(__VLS_213, new __VLS_213({}));
const __VLS_215 = __VLS_214({}, ...__VLS_functionalComponentArgsRest(__VLS_214));
const { default: __VLS_217 } = __VLS_216.slots;
const __VLS_218 = {}.VCardTitle;
/** @type {[typeof __VLS_components.VCardTitle, typeof __VLS_components.vCardTitle, typeof __VLS_components.VCardTitle, typeof __VLS_components.vCardTitle, ]} */ ;
// @ts-ignore
VCardTitle;
// @ts-ignore
const __VLS_219 = __VLS_asFunctionalComponent(__VLS_218, new __VLS_218({
    ...{ class: "text-error" },
}));
const __VLS_220 = __VLS_219({
    ...{ class: "text-error" },
}, ...__VLS_functionalComponentArgsRest(__VLS_219));
const { default: __VLS_222 } = __VLS_221.slots;
var __VLS_221;
const __VLS_223 = {}.VCardText;
/** @type {[typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, ]} */ ;
// @ts-ignore
VCardText;
// @ts-ignore
const __VLS_224 = __VLS_asFunctionalComponent(__VLS_223, new __VLS_223({}));
const __VLS_225 = __VLS_224({}, ...__VLS_functionalComponentArgsRest(__VLS_224));
const { default: __VLS_227 } = __VLS_226.slots;
__VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.nodeToDelete?.title);
// @ts-ignore
[nodeToDelete,];
var __VLS_226;
const __VLS_228 = {}.VCardActions;
/** @type {[typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, ]} */ ;
// @ts-ignore
VCardActions;
// @ts-ignore
const __VLS_229 = __VLS_asFunctionalComponent(__VLS_228, new __VLS_228({}));
const __VLS_230 = __VLS_229({}, ...__VLS_functionalComponentArgsRest(__VLS_229));
const { default: __VLS_232 } = __VLS_231.slots;
const __VLS_233 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_234 = __VLS_asFunctionalComponent(__VLS_233, new __VLS_233({
    ...{ 'onClick': {} },
}));
const __VLS_235 = __VLS_234({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_234));
let __VLS_237;
let __VLS_238;
const __VLS_239 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.deleteDialog = false;
            // @ts-ignore
            [deleteDialog,];
        } });
const { default: __VLS_240 } = __VLS_236.slots;
var __VLS_236;
const __VLS_241 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
VBtn;
// @ts-ignore
const __VLS_242 = __VLS_asFunctionalComponent(__VLS_241, new __VLS_241({
    ...{ 'onClick': {} },
    color: "error",
    loading: (__VLS_ctx.deletingIds.has(__VLS_ctx.nodeToDelete?.id)),
}));
const __VLS_243 = __VLS_242({
    ...{ 'onClick': {} },
    color: "error",
    loading: (__VLS_ctx.deletingIds.has(__VLS_ctx.nodeToDelete?.id)),
}, ...__VLS_functionalComponentArgsRest(__VLS_242));
let __VLS_245;
let __VLS_246;
const __VLS_247 = ({ click: {} },
    { onClick: (__VLS_ctx.deleteNode) });
const { default: __VLS_248 } = __VLS_244.slots;
// @ts-ignore
[deletingIds, nodeToDelete, deleteNode,];
var __VLS_244;
var __VLS_231;
var __VLS_216;
var __VLS_211;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['error--text']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
// @ts-ignore
var __VLS_95 = __VLS_94;
export default {};
