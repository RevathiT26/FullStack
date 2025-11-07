import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HelloWorld from '../../src/components/HelloWorld.vue';
import { nextTick } from 'vue';

const globalStubs = {
  'v-app': true,
  'v-container': true,
  'v-treeview': true,
  'v-dialog': true,
  'v-card': true,
  'v-card-text': true,
  'v-card-actions': true,
  'v-btn': true,
  'v-icon': true
};

describe('HelloWorld.vue', () => {
  it('builds tree from staticData correctly', async () => {
    const wrapper: any = mount(HelloWorld, { global: { stubs: globalStubs } });
    await nextTick();
    const vm: any = wrapper.vm;

    const tree: any[] = vm.treeItems;
    expect(Array.isArray(tree)).toBe(true);
    expect(tree.length).toBeGreaterThan(0);

    const root = tree[0];
    expect(root).toBeDefined();
  });

  it('onNodeClick opens dialog and sets selectedNode', async () => {
    const wrapper: any = mount(HelloWorld, { global: { stubs: globalStubs } });
    const vm: any = wrapper.vm;
    const root = vm.treeItems[0];
    if (root) {
      vm.onNodeClick(root);
      await nextTick();
      expect(vm.dialogVisible).toBe(true);
      expect(vm.selectedNode.value).toBeDefined();
    }
  });

  it('onActiveChange selects node by value', async () => {
    const wrapper: any = mount(HelloWorld, { global: { stubs: globalStubs } });
    const vm: any = wrapper.vm;
    const root = vm.treeItems[0];
    if (root) {
      vm.onActiveChange([root.value]);
      await nextTick();
      expect(vm.selectedNode.value).toBeDefined();
    }
  });
});