// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

import { wireFillOpacityOnZoom } from './fill-opacity-on-zoom.js'

function createInteractiveMap() {
  const handlers = {}
  return {
    on: vi.fn((event, callback) => {
      handlers[event] = callback
    }),
    _emit: (event, payload) => handlers[event]?.(payload)
  }
}

function createMapInstance({ zoom = 8, existingLayers = new Set() } = {}) {
  const handlers = {}
  return {
    getZoom: vi.fn(() => zoom),
    getLayer: vi.fn((layerId) => existingLayers.has(layerId)),
    setPaintProperty: vi.fn(),
    on: vi.fn((event, callback) => {
      handlers[event] = callback
    }),
    _emit: (event) => handlers[event]?.(),
    _setZoom: (value) => {
      zoom = value
    }
  }
}

describe('wireFillOpacityOnZoom', () => {
  it('does nothing before map:ready has fired', () => {
    const interactiveMap = createInteractiveMap()
    expect(() =>
      wireFillOpacityOnZoom(interactiveMap, { fillLayerIds: ['edp'] })
    ).not.toThrow()
  })

  it('applies the reduced opacity to existing layers when zoom is at or above the threshold', () => {
    const interactiveMap = createInteractiveMap()
    const mapInstance = createMapInstance({
      zoom: 14,
      existingLayers: new Set(['edp', 'excluded'])
    })

    wireFillOpacityOnZoom(interactiveMap, {
      fillLayerIds: ['edp', 'excluded']
    })
    interactiveMap._emit('map:ready', { map: mapInstance })

    expect(mapInstance.setPaintProperty).toHaveBeenCalledWith(
      'edp',
      'fill-opacity',
      0.2
    )
    expect(mapInstance.setPaintProperty).toHaveBeenCalledWith(
      'excluded',
      'fill-opacity',
      0.2
    )
  })

  it('applies full opacity when zoom is below the threshold', () => {
    const interactiveMap = createInteractiveMap()
    const mapInstance = createMapInstance({
      zoom: 10,
      existingLayers: new Set(['edp'])
    })

    wireFillOpacityOnZoom(interactiveMap, { fillLayerIds: ['edp'] })
    interactiveMap._emit('map:ready', { map: mapInstance })

    expect(mapInstance.setPaintProperty).toHaveBeenCalledWith(
      'edp',
      'fill-opacity',
      1
    )
  })

  it('skips layers that do not exist on the map', () => {
    const interactiveMap = createInteractiveMap()
    const mapInstance = createMapInstance({
      zoom: 14,
      existingLayers: new Set()
    })

    wireFillOpacityOnZoom(interactiveMap, { fillLayerIds: ['missing'] })
    interactiveMap._emit('map:ready', { map: mapInstance })

    expect(mapInstance.setPaintProperty).not.toHaveBeenCalled()
  })

  it('re-applies opacity on zoomend and idle', () => {
    const interactiveMap = createInteractiveMap()
    const mapInstance = createMapInstance({
      zoom: 8,
      existingLayers: new Set(['edp'])
    })

    wireFillOpacityOnZoom(interactiveMap, { fillLayerIds: ['edp'] })
    interactiveMap._emit('map:ready', { map: mapInstance })
    mapInstance.setPaintProperty.mockClear()

    mapInstance._setZoom(14)
    mapInstance._emit('zoomend')
    expect(mapInstance.setPaintProperty).toHaveBeenCalledWith(
      'edp',
      'fill-opacity',
      0.2
    )

    mapInstance.setPaintProperty.mockClear()
    mapInstance._setZoom(5)
    mapInstance._emit('idle')
    expect(mapInstance.setPaintProperty).toHaveBeenCalledWith(
      'edp',
      'fill-opacity',
      1
    )
  })
})
