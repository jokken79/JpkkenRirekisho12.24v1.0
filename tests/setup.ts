import '@testing-library/jest-dom';

// Mock IndexedDB for Dexie
import 'fake-indexeddb/auto';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock URL.createObjectURL
URL.createObjectURL = () => 'blob:mock-url';
URL.revokeObjectURL = () => {};
