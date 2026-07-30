import { describe, expect, it, vi } from 'vitest'

import { stopTileLoading } from './stop-tile-loading.js'

function createMapInstance({ layers = {} } = {}) {
  return {
    getLayer: vi.fn((layerId) => layers[layerId] ?? null),
    getSource: vi.fn((sourceId) => Boolean(sourceId)),
    removeLayer: vi.fn(),
    removeSource: vi.fn()
  }
}

describe('stopTileLoading', () => {
  it('does nothing when there is no map instance', () => {
    expect(() => stopTileLoading(null, ['edp_boundaries'])).not.toThrow()
  })

  it('removes each existing layer and its underlying source', () => {
    const map = createMapInstance({
      layers: {
        edp_boundaries: { source: 'edp_boundaries' },
        'edp_boundaries-stroke': { source: 'edp_boundaries' }
      }
    })

    stopTileLoading(map, ['edp_boundaries', 'edp_boundaries-stroke'])

    expect(map.removeLayer).toHaveBeenCalledWith('edp_boundaries')
    expect(map.removeLayer).toHaveBeenCalledWith('edp_boundaries-stroke')
    // Both layers share one source — it should only be removed once.
    expect(map.removeSource).toHaveBeenCalledTimes(1)
    expect(map.removeSource).toHaveBeenCalledWith('edp_boundaries')
  })

  it('skips layers that do not exist on the map', () => {
    const map = createMapInstance()

    stopTileLoading(map, ['missing'])

    expect(map.removeLayer).not.toHaveBeenCalled()
    expect(map.removeSource).not.toHaveBeenCalled()
  })
})
