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

  it('should build edpIntersectionGeojson from enhanced EDP data', () => {
    const edps = [
      {
        label: 'EDP Area 1',
        n2k_site_name: 'Site A',
        intersection_geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-1.5, 52.0],
              [-1.4, 52.0],
              [-1.4, 52.1],
              [-1.5, 52.1],
              [-1.5, 52.0]
            ]
          ]
        },
        overlap_area_ha: 0.5,
        overlap_area_sqm: 5000.0,
        overlap_percentage: 25.0
      }
    ]
    const response = {
      geometry: { type: 'FeatureCollection', features: [] },
      intersecting_edps: edps,
      intersects_edp: true
    }

    const result = getViewModel(response)
    const parsed = JSON.parse(result.edpIntersectionGeojson)

    expect(parsed.type).toBe('FeatureCollection')
    expect(parsed.features).toHaveLength(1)
    expect(parsed.features[0].type).toBe('Feature')
    expect(parsed.features[0].geometry.type).toBe('Polygon')
    expect(parsed.features[0].properties.label).toBe('EDP Area 1')
    expect(parsed.features[0].properties.overlap_area_ha).toBe(0.5)
    expect(parsed.features[0].properties.overlap_percentage).toBe(25.0)
  })

  it('should return empty FeatureCollection when no EDPs have intersection geometry', () => {
    const edps = [{ label: 'EDP Area 1', n2k_site_name: 'Site A' }]
    const response = {
      geometry: { type: 'FeatureCollection', features: [] },
      intersecting_edps: edps,
      intersects_edp: true
    }

    const result = getViewModel(response)
    const parsed = JSON.parse(result.edpIntersectionGeojson)

    expect(parsed.type).toBe('FeatureCollection')
    expect(parsed.features).toHaveLength(0)
  })
})
