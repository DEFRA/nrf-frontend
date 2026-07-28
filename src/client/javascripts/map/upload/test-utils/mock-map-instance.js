import { vi } from 'vitest'

const MOCK_ZOOM_LEVEL = 5

/**
 * @param {{ styleLoaded?: boolean }} [params]
 */
export function createMockMapInstance({ styleLoaded = true } = {}) {
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    isStyleLoaded: vi.fn().mockReturnValue(styleLoaded),
    getZoom: vi.fn().mockReturnValue(MOCK_ZOOM_LEVEL),
    getLayer: vi.fn().mockReturnValue(true),
    setPaintProperty: vi.fn(),
    on: vi.fn()
  }
}
