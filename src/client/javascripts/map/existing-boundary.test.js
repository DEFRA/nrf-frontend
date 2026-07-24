// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  readExistingBoundary,
  hydrateInitialDrawFeature
} from './existing-boundary.js'

function createMapElement() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

describe('readExistingBoundary', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('returns nulls when no dataset attributes are present', () => {
    const mapEl = createMapElement()

    expect(readExistingBoundary(mapEl)).toEqual({
      initialFeature: null,
      bounds: null,
      center: null
    })
  })

  it('normalizes a bare geometry into an initial draw feature', () => {
    const mapEl = createMapElement()
    mapEl.dataset.existingBoundaryGeojson = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [-1.2, 51.8],
          [-1.1, 51.8],
          [-1.1, 51.9],
          [-1.2, 51.8]
        ]
      ]
    })

    const { initialFeature } = readExistingBoundary(mapEl)

    expect(initialFeature).toEqual(
      expect.objectContaining({
        type: 'Feature',
        geometry: expect.objectContaining({ type: 'Polygon' })
      })
    )
  })

  it('normalizes a feature collection to its first feature', () => {
    const mapEl = createMapElement()
    mapEl.dataset.existingBoundaryGeojson = JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'feature-from-collection',
          geometry: { type: 'Polygon', coordinates: [] },
          properties: { persisted: true }
        }
      ]
    })

    const { initialFeature } = readExistingBoundary(mapEl)

    expect(initialFeature).toEqual(
      expect.objectContaining({
        id: 'feature-from-collection',
        properties: { persisted: true }
      })
    )
  })

  it('returns null feature and logs when JSON is invalid', () => {
    const mapEl = createMapElement()
    mapEl.dataset.existingBoundaryGeojson = '{invalid-json}'

    const { initialFeature } = readExistingBoundary(mapEl)

    expect(initialFeature).toBeNull()
  })

  it('derives bounds and centre from existingBoundaryMetadata', () => {
    const mapEl = createMapElement()
    mapEl.dataset.existingBoundaryMetadata = JSON.stringify({
      bounds: { bottomLeft: [-1.2, 51.8], topRight: [-1.1, 51.9] },
      centre: [-1.15, 51.85]
    })

    expect(readExistingBoundary(mapEl)).toEqual({
      initialFeature: null,
      bounds: [-1.2, 51.8, -1.1, 51.9],
      center: [-1.15, 51.85]
    })
  })
})

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
