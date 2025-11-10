import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import TreeNode from '../../src/components/TreeNode.vue';
import { nextTick } from 'vue';

// Mock the API client
vi.mock('@/config/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  API_ENDPOINTS: {
    hierarchy: '/api/hierarchy'
  }
}));

const createStubs = () => ({
  'v-container': { template: '<div class="v-container"><slot /></div>' },
  'v-treeview': { template: '<div class="v-treeview" data-testid="treeview"><slot /></div>' },
  'v-dialog': { 
    template: '<div v-if="modelValue" class="v-dialog"><slot /></div>',
    props: ['modelValue']
  },
  'v-card': { template: '<div class="v-card"><slot /></div>' },
  'v-card-title': { template: '<div class="v-card-title"><slot /></div>' },
  'v-card-text': { template: '<div class="v-card-text"><slot /></div>' },
  'v-card-actions': { template: '<div class="v-card-actions"><slot /></div>' },
  'v-btn': { 
    template: '<button class="v-btn" @click="$emit(\'click\')"><slot /></button>',
    props: ['loading', 'disabled', 'color']
  },
  'v-icon': { template: '<i class="v-icon"><slot /></i>' },
  'v-progress-circular': { template: '<div class="v-progress-circular">Loading...</div>' },
  'v-alert': { 
    template: '<div class="v-alert"><slot /></div>',
    props: ['type']
  },
  'v-form': { 
    template: '<form class="v-form"><slot /></form>',
    props: ['modelValue']
  },
  'v-text-field': { 
    template: '<input class="v-text-field" type="text" />',
    props: ['modelValue', 'label', 'rules']
  },
  'v-textarea': { 
    template: '<textarea class="v-textarea"></textarea>',
    props: ['modelValue', 'label', 'rules']
  },
  'v-select': { 
    template: '<select class="v-select"><slot /></select>',
    props: ['modelValue', 'items', 'label']
  },
  'v-list-item': { template: '<li class="v-list-item"><slot /></li>' },
  'v-spacer': { template: '<div class="v-spacer"></div>' },
  'v-row': { template: '<div class="v-row"><slot /></div>' },
  'v-col': { template: '<div class="v-col"><slot /></div>' }
});

describe('TreeNode.vue', () => {
  let wrapper: VueWrapper<any>;
  let mockApiClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { apiClient } = await import('@/config/api');
    mockApiClient = apiClient;

    const mockData = {
      data: {
        data: [
          { id: '1', name: 'Root', description: 'Root description', parent: '' },
          { id: '2', name: 'Child1', description: 'Child1 description', parent: 'Root' }
        ]
      }
    };

    mockApiClient.get.mockResolvedValue(mockData);
    mockApiClient.post.mockResolvedValue({ status: 201 });
    mockApiClient.delete.mockResolvedValue({ status: 200 });

    wrapper = mount(TreeNode, {
      global: {
        stubs: createStubs()
      }
    });

    await nextTick();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('renders the component', () => {
    expect(wrapper.find('h1').text()).toBe('Hierarchy Tree');
  });

  it('calls API on mount', () => {
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/hierarchy');
  });
});