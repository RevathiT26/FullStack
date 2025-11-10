import { vi } from 'vitest';
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});
// Mock CSS imports globally
vi.mock('*.css', () => ({}));
vi.mock('*.scss', () => ({}));
vi.mock('*.sass', () => ({}));
vi.mock('*.less', () => ({}));
// Mock Vuetify styles specifically
vi.mock('vuetify/styles', () => ({}));
vi.mock('vuetify/lib/styles/main.css', () => ({}));
// Mock @mdi/font CSS
vi.mock('@mdi/font/css/materialdesignicons.css', () => ({}));
// Mock specific Vuetify component CSS files that might be imported
vi.mock('vuetify/lib/components/VAlert/VAlert.css', () => ({}));
vi.mock('vuetify/lib/components/VBtn/VBtn.css', () => ({}));
vi.mock('vuetify/lib/components/VCard/VCard.css', () => ({}));
vi.mock('vuetify/lib/components/VDialog/VDialog.css', () => ({}));
vi.mock('vuetify/lib/components/VForm/VForm.css', () => ({}));
vi.mock('vuetify/lib/components/VTextField/VTextField.css', () => ({}));
vi.mock('vuetify/lib/components/VTextarea/VTextarea.css', () => ({}));
vi.mock('vuetify/lib/components/VSelect/VSelect.css', () => ({}));
vi.mock('vuetify/lib/components/VTreeview/VTreeview.css', () => ({}));
vi.mock('vuetify/lib/components/VContainer/VContainer.css', () => ({}));
vi.mock('vuetify/lib/components/VRow/VRow.css', () => ({}));
vi.mock('vuetify/lib/components/VCol/VCol.css', () => ({}));
vi.mock('vuetify/lib/components/VIcon/VIcon.css', () => ({}));
vi.mock('vuetify/lib/components/VProgressCircular/VProgressCircular.css', () => ({}));
vi.mock('vuetify/lib/components/VListItem/VListItem.css', () => ({}));
vi.mock('vuetify/lib/components/VSpacer/VSpacer.css', () => ({}));
// Mock Web APIs that might be missing in test environment
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
// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
// Mock getComputedStyle
global.getComputedStyle = vi.fn().mockImplementation(() => ({
    getPropertyValue: vi.fn().mockReturnValue(''),
    display: 'block',
    visibility: 'visible',
    opacity: '1'
}));
// Mock HTMLElement methods that Vuetify might use
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
