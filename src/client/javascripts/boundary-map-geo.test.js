// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { collectCoords, fitMapToBounds } from './boundary-map-geo.js'
import {
  validGeojson,
  singleGeometry,
  multiPolygon,
  emptyGeojson
} from './__fixtures__/boundary-map-fixtures.js'

describe('collectCoords', () => {
  it('collects flat coordinate pairs', () => {
    const coords = []
    collectCoords([-1.5, 52.0], coords)
    expect(coords).toEqual([[-1.5, 52.0]])
  })

  it('collects nested coordinate arrays', () => {
    const coords = []
    collectCoords(
      [
        [
          [-2.0, 51.0],
          [-1.0, 53.0]
        ]
      ],
      coords
    )
    expect(coords).toEqual([
      [-2.0, 51.0],
      [-1.0, 53.0]
    ])
  })
})

describe('fitMapToBounds', () => {
  it('calculates bounds from a FeatureCollection', () => {
    const mapInstance = { fitBounds: vi.fn() }
    fitMapToBounds(mapInstance, validGeojson)

    expect(mapInstance.fitBounds).toHaveBeenCalledWith(
      [
        [-1.5, 52.0],
        [-1.4, 52.1]
      ],
      { padding: 40 }
    )
  })

  it('handles a single geometry (no features array)', () => {
    const mapInstance = { fitBounds: vi.fn() }
    fitMapToBounds(mapInstance, singleGeometry)

    expect(mapInstance.fitBounds).toHaveBeenCalledWith(
      [
        [-1.5, 52.0],
        [-1.5, 52.0]
      ],
      { padding: 40 }
    )
  })

  it('handles nested coordinate arrays (MultiPolygon)', () => {
    const mapInstance = { fitBounds: vi.fn() }
    fitMapToBounds(mapInstance, multiPolygon)

    expect(mapInstance.fitBounds).toHaveBeenCalledWith(
      [
        [-2.0, 51.0],
        [-1.0, 53.0]
      ],
      { padding: 40 }
    )
  })

  it('does not call fitBounds for empty features', () => {
    const mapInstance = { fitBounds: vi.fn() }
    fitMapToBounds(mapInstance, emptyGeojson)

    expect(mapInstance.fitBounds).not.toHaveBeenCalled()
  })
})
