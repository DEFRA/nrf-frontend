import { vi } from 'vitest'

const MOCK_ZOOM_LEVEL = 5

export function createMockMapInstance() {
  return {
    getZoom: vi.fn().mockReturnValue(MOCK_ZOOM_LEVEL),
    getLayer: vi.fn().mockReturnValue(true),
    setPaintProperty: vi.fn(),
    setLayoutProperty: vi.fn(),
    on: vi.fn()
  }
}
