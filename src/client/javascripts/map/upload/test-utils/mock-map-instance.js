import { vi } from 'vitest'

/**
 * @param {{ styleLoaded?: boolean }} [params]
 */
export function createMockMapInstance({ styleLoaded = true } = {}) {
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    isStyleLoaded: vi.fn().mockReturnValue(styleLoaded),
    getZoom: vi.fn().mockReturnValue(5),
    getLayer: vi.fn().mockReturnValue(true),
    setPaintProperty: vi.fn(),
    once: vi.fn(),
    on: vi.fn()
  }
}
