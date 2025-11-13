import { vi } from 'vitest';

process.on('unhandledRejection', (err) => { 
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => { 
  console.error('Uncaught exception:', err);
});

// Mock all Vuetify component imports
vi.mock('vuetify/lib/components/VAlert', () => ({
  VAlert: { name: 'VAlert' }
}));

vi.mock('vuetify/lib/components/VBtn', () => ({
  VBtn: { name: 'VBtn' }
}));

vi.mock('vuetify/lib/components/VCard', () => ({
  VCard: { name: 'VCard' },
  VCardTitle: { name: 'VCardTitle' },
  VCardText: { name: 'VCardText' },
  VCardActions: { name: 'VCardActions' }
}));

vi.mock('vuetify/lib/components/VDialog', () => ({
  VDialog: { name: 'VDialog' }
}));

vi.mock('vuetify/lib/components/VForm', () => ({
  VForm: { name: 'VForm' }
}));

vi.mock('vuetify/lib/components/VTextField', () => ({
  VTextField: { name: 'VTextField' }
}));

vi.mock('vuetify/lib/components/VTextarea', () => ({
  VTextarea: { name: 'VTextarea' }
}));

vi.mock('vuetify/lib/components/VSelect', () => ({
  VSelect: { name: 'VSelect' }
}));

vi.mock('vuetify/lib/components/VTreeview', () => ({
  VTreeview: { name: 'VTreeview' }
}));

vi.mock('vuetify/lib/components/VContainer', () => ({
  VContainer: { name: 'VContainer' }
}));

vi.mock('vuetify/lib/components/VRow', () => ({
  VRow: { name: 'VRow' }
}));

vi.mock('vuetify/lib/components/VCol', () => ({
  VCol: { name: 'VCol' }
}));

vi.mock('vuetify/lib/components/VIcon', () => ({
  VIcon: { name: 'VIcon' }
}));

vi.mock('vuetify/lib/components/VProgressCircular', () => ({
  VProgressCircular: { name: 'VProgressCircular' }
}));

vi.mock('vuetify/lib/components/VListItem', () => ({
  VListItem: { name: 'VListItem' }
}));

vi.mock('vuetify/lib/components/VSpacer', () => ({
  VSpacer: { name: 'VSpacer' }
}));

// Mock CSS imports
vi.mock('*.css', () => ({}));
vi.mock('*.scss', () => ({}));
vi.mock('vuetify/styles', () => ({}));

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.getComputedStyle = vi.fn().mockImplementation(() => ({
  getPropertyValue: vi.fn().mockReturnValue(''),
  display: 'block',
  visibility: 'visible',
  opacity: '1'
}));

if (typeof window !== 'undefined') {
  HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: vi.fn()
  }));
}
