// Global test setup: extend Vitest's `expect` with jest-dom matchers and
// unmount React trees after each test to keep the DOM isolated between cases.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom does not implement matchMedia, which next-themes (used by the sonner
// Toaster mounted in App) calls on mount. Provide a minimal, inert stub so
// components depending on it render in the test environment.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// jsdom does not implement ResizeObserver, which cmdk's CommandList (used by
// the Global_Search overlay) calls on mount to size the list. Provide a
// minimal, inert stub so components depending on it render in the test
// environment, mirroring the matchMedia stub above.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

// jsdom also does not implement Element.scrollIntoView, which cmdk calls when
// the selected item changes (keyboard navigation, filtering). Stub it as a
// no-op so those calls don't throw in the test environment.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

afterEach(() => {
  cleanup()
})
