import { vi } from 'vitest'

export function createInteractiveMap() {
  const handlers = {}
  return {
    on: vi.fn((eventType, callback) => {
      handlers[eventType] = callback
    }),
    addPanel: vi.fn((_id, config) => {
      document.body.insertAdjacentHTML('beforeend', config.html)
    }),
    showPanel: vi.fn(),
    hidePanel: vi.fn(),
    _emit: (eventType, payload) => handlers[eventType]?.(payload)
  }
}

/**
 * @param {{ existingLayers?: Set<string> }} params
 */
export function createMapInstance({ existingLayers = new Set() } = {}) {
  return {
    getLayer: vi.fn((layerId) =>
      existingLayers.has(layerId) ? { source: `${layerId}-source` } : null
    ),
    getSource: vi.fn(() => true),
    removeLayer: vi.fn(),
    removeSource: vi.fn()
  }
}
