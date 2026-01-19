import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock ClipboardEvent for JSDOM
class MockClipboardEvent extends Event {
  clipboardData: DataTransfer | null;
  
  constructor(type: string, options?: ClipboardEventInit) {
    super(type, options);
    this.clipboardData = options?.clipboardData || null;
  }
}

if (typeof globalThis.ClipboardEvent === 'undefined') {
  (globalThis as any).ClipboardEvent = MockClipboardEvent;
}

// Mock DataTransfer for JSDOM
if (typeof globalThis.DataTransfer === 'undefined') {
  class MockDataTransfer {
    private data: Map<string, string> = new Map();
    
    setData(format: string, data: string): void {
      this.data.set(format, data);
    }
    
    getData(format: string): string {
      return this.data.get(format) || '';
    }
    
    clearData(format?: string): void {
      if (format) {
        this.data.delete(format);
      } else {
        this.data.clear();
      }
    }
  }
  
  (globalThis as any).DataTransfer = MockDataTransfer;
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// Mock IntersectionObserver
class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Mock scrollTo
Element.prototype.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Console error/warn suppression for expected errors (optional)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress known React testing warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: An update to') ||
        args[0].includes('act(...)'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
  
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('WebSocket')
    ) {
      return;
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
