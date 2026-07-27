// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { readExistingBoundary } from './read-boundary-metadata.js'

function createMapElement() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

describe('readExistingBoundary', () => {
  afterEach(() => {
    document.body.innerHTML = ''
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
