import { vi } from 'vitest'

export function createMockMapInstance() {
  return {
    getZoom: vi.fn().mockReturnValue(5),
    getLayer: vi.fn().mockReturnValue(true),
    setPaintProperty: vi.fn(),
    setLayoutProperty: vi.fn(),
    on: vi.fn()
  }
}
