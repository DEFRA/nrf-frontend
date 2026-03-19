import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'

describe('getViewModel', () => {
  it('should return featureCount of 0 when geometry has no features property', () => {
    const result = getViewModel({
      geometry: { type: 'FeatureCollection' },
      intersecting_edps: [],
      intersects_edp: false
    })

    expect(result.featureCount).toBe(0)
    expect(result.pageHeading).toBe('Boundary Map')
    expect(result.boundaryGeojson).toBe(
      JSON.stringify({ type: 'FeatureCollection' })
    )
    expect(result.intersectsEdp).toBe(false)
    expect(result.intersectingEdps).toEqual([])
  })

  it('should return the correct feature count', () => {
    const response = {
      geometry: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Polygon' } },
          { type: 'Feature', geometry: { type: 'Polygon' } }
        ]
      },
      intersecting_edps: [],
      intersects_edp: false
    }

    const result = getViewModel(response)

    expect(result.featureCount).toBe(2)
  })

  it('should extract intersecting EDPs from response', () => {
    const edps = [
      { name: 'EDP Area 1', attributes: {} },
      { name: 'EDP Area 2', attributes: {} }
    ]
    const response = {
      geometry: { type: 'FeatureCollection', features: [] },
      intersecting_edps: edps,
      intersects_edp: true
    }

    const result = getViewModel(response)

    expect(result.intersectsEdp).toBe(true)
    expect(result.intersectingEdps).toEqual(edps)
  })

  it('should handle missing fields gracefully', () => {
    const result = getViewModel({})

    expect(result.featureCount).toBe(0)
    expect(result.intersectsEdp).toBe(false)
    expect(result.intersectingEdps).toEqual([])
  })

  it('should include uploadBoundaryPath, cancelPath, and mapStyleUrl', () => {
    const result = getViewModel({})

    expect(result.uploadBoundaryPath).toBe('/quote/upload-boundary')
    expect(result.cancelPath).toBe('/quote/boundary-type')
    expect(result.mapStyleUrl).toBeDefined()
  })
})
