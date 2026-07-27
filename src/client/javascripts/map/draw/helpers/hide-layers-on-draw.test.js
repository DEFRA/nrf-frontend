// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

import { wireHideLayersOnDraw } from './hide-layers-on-draw.js'

function createInteractiveMap() {
  const handlers = {}
  return {
    on: vi.fn((event, callback) => {
      handlers[event] = callback
    }),
    _emit: (event, payload) => handlers[event]?.(payload)
  }
}

function createMapInstance({ existingLayers = new Set() } = {}) {
  return {
    getLayer: vi.fn((layerId) => existingLayers.has(layerId)),
    setLayoutProperty: vi.fn()
  }
}

describe('wireHideLayersOnDraw', () => {
  it('does nothing before map:ready has fired', () => {
    const interactiveMap = createInteractiveMap()
    wireHideLayersOnDraw(interactiveMap, { layerIds: ['edp'] })

    expect(() => interactiveMap._emit('draw:started')).not.toThrow()
  })

  it('hides existing layers on draw:started', () => {
    const interactiveMap = createInteractiveMap()
    const mapInstance = createMapInstance({
      existingLayers: new Set(['edp', 'edp-stroke'])
    })

    wireHideLayersOnDraw(interactiveMap, { layerIds: ['edp', 'edp-stroke'] })
    interactiveMap._emit('map:ready', { map: mapInstance })
    interactiveMap._emit('draw:started')

    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'edp',
      'visibility',
      'none'
    )
    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'edp-stroke',
      'visibility',
      'none'
    )
  })

  it.each(['draw:created', 'draw:edited', 'draw:cancelled'])(
    'shows layers again on %s',
    (event) => {
      const interactiveMap = createInteractiveMap()
      const mapInstance = createMapInstance({
        existingLayers: new Set(['edp'])
      })

      wireHideLayersOnDraw(interactiveMap, { layerIds: ['edp'] })
      interactiveMap._emit('map:ready', { map: mapInstance })
      interactiveMap._emit(event)

      expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
        'edp',
        'visibility',
        'visible'
      )
    }
  )

  it('skips layers that do not exist on the map', () => {
    const interactiveMap = createInteractiveMap()
    const mapInstance = createMapInstance({ existingLayers: new Set() })

    wireHideLayersOnDraw(interactiveMap, { layerIds: ['missing'] })
    interactiveMap._emit('map:ready', { map: mapInstance })
    interactiveMap._emit('draw:started')

    expect(mapInstance.setLayoutProperty).not.toHaveBeenCalled()
  })
})
