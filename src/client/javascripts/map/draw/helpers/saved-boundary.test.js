import { describe, it, expect, vi } from 'vitest'
import {
  hydrateInitialDrawFeature,
  wireSavedBoundary
} from './saved-boundary.js'

describe('hydrateInitialDrawFeature', () => {
  it('adds the feature via drawPlugin.addFeature when valid', () => {
    const addFeature = vi.fn()
    const feature = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [] }
    }

    const result = hydrateInitialDrawFeature({
      drawPlugin: { addFeature },
      initialFeature: feature
    })

    expect(addFeature).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Feature',
        id: expect.any(String),
        properties: {}
      })
    )
    expect(result).toBe(true)
  })

  it('does nothing when there is no initial feature', () => {
    const addFeature = vi.fn()

    const result = hydrateInitialDrawFeature({
      drawPlugin: { addFeature },
      initialFeature: null
    })

    expect(addFeature).not.toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it('does nothing when drawPlugin has no addFeature method', () => {
    const feature = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [] }
    }

    expect(() =>
      hydrateInitialDrawFeature({ drawPlugin: {}, initialFeature: feature })
    ).not.toThrow()
    expect(
      hydrateInitialDrawFeature({ drawPlugin: {}, initialFeature: feature })
    ).toBe(false)
  })
})

describe('wireSavedBoundary', () => {
  function createInteractiveMap() {
    const handlers = {}
    return {
      on: vi.fn((eventType, callback) => {
        handlers[eventType] = callback
      }),
      fitToBounds: vi.fn(),
      _emit: (eventType, payload) => handlers[eventType]?.(payload)
    }
  }

  it('hydrates the feature and checks it once the draw plugin is ready', () => {
    const addFeature = vi.fn()
    const checkExistingBoundary = vi.fn()
    const interactiveMap = createInteractiveMap()
    const initialFeature = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [] }
    }

    wireSavedBoundary(interactiveMap, {
      drawPlugin: { addFeature },
      initialFeature,
      boundaryInfoPanel: { checkExistingBoundary }
    })

    expect(addFeature).not.toHaveBeenCalled()

    interactiveMap._emit('draw:ready')

    expect(addFeature).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Feature' })
    )
    expect(interactiveMap.fitToBounds).toHaveBeenCalledWith(initialFeature)
    expect(checkExistingBoundary).toHaveBeenCalledWith(initialFeature)
  })

  it('does nothing when there is no initial feature to hydrate', () => {
    const interactiveMap = createInteractiveMap()
    const checkExistingBoundary = vi.fn()

    wireSavedBoundary(interactiveMap, {
      drawPlugin: { addFeature: vi.fn() },
      initialFeature: null,
      boundaryInfoPanel: { checkExistingBoundary }
    })

    interactiveMap._emit('draw:ready')

    expect(interactiveMap.fitToBounds).not.toHaveBeenCalled()
    expect(checkExistingBoundary).not.toHaveBeenCalled()
  })
})
