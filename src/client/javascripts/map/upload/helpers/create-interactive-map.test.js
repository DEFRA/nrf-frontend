// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

const mockConstruct = vi.hoisted(() => vi.fn())

vi.mock('@defra/interactive-map', () => ({
  InteractiveMap: new Proxy(function MockInteractiveMap() {}, {
    construct(_target, args) {
      return mockConstruct(...args)
    }
  })
}))
vi.mock('@defra/interactive-map/providers/maplibre', () => ({
  default: vi.fn()
}))

import maplibreProvider from '@defra/interactive-map/providers/maplibre'
import { createInteractiveMap } from './create-interactive-map.js'

describe('createInteractiveMap', () => {
  it('creates the map with the expected default options', () => {
    const mapInstance = { id: 'map' }
    mockConstruct.mockReturnValue(mapInstance)
    maplibreProvider.mockReturnValue({ provider: 'maplibre' })
    const mapStyles = [{ id: 'style-1' }]
    const plugins = [{ id: 'plugin-1' }]

    createInteractiveMap('boundary-map', {
      mapStyles,
      plugins,
      bounds: null,
      center: null
    })

    expect(mockConstruct).toHaveBeenCalledWith(
      'boundary-map',
      expect.objectContaining({
        behaviour: 'inline',
        mapLabel: 'Red line boundary',
        mapStyle: mapStyles[0],
        center: [1.1405503, 52.7089441],
        bounds: null,
        maxZoom: 18,
        containerHeight: '100%',
        enableZoomControls: true,
        enableFullscreen: true,
        transformRequest: expect.any(Function),
        plugins
      })
    )
  })

  it('uses the given centre and bounds when provided', () => {
    mockConstruct.mockReturnValue({})

    createInteractiveMap('boundary-map', {
      mapStyles: [{ id: 'style-1' }],
      plugins: [],
      bounds: [1, 2, 3, 4],
      center: [-1.1, 51.1]
    })

    expect(mockConstruct).toHaveBeenCalledWith(
      'boundary-map',
      expect.objectContaining({
        center: [-1.1, 51.1],
        bounds: [1, 2, 3, 4]
      })
    )
  })
})
