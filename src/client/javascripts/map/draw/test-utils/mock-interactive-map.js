import { vi } from 'vitest'

export function createMockInteractiveMap() {
  return {
    on: vi.fn(),
    addPanel: vi.fn((_id, config) => {
      document.body.insertAdjacentHTML('beforeend', config.html)
    }),
    addButton: vi.fn(),
    showPanel: vi.fn(),
    hidePanel: vi.fn(),
    toggleButtonState: vi.fn(),
    fitToBounds: vi.fn()
  }
}
