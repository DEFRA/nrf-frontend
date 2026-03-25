import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'

describe('getViewModel', () => {
  it('should return featureCount of 1 and correct fields', () => {
    const geo = { type: 'FeatureCollection' }
    const result = getViewModel({
      boundaryGeometryWgs84: geo,
      intersectingEdps: []
    })

    expect(result.featureCount).toBe(1)
    expect(result.pageHeading).toBe('Boundary Map')
    expect(result.boundaryGeojson).toBe(JSON.stringify(geo))
    expect(result.intersectsEdp).toBeFalsy()
    expect(result.intersectingEdps).toEqual([])
    expect(result.boundaryError).toBeNull()
  })

  it('should always return featureCount of 1', () => {
    const response = {
      boundaryGeometryWgs84: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Polygon' } },
          { type: 'Feature', geometry: { type: 'Polygon' } }
        ]
      },
      intersectingEdps: []
    }

    const result = getViewModel(response)

    expect(result.featureCount).toBe(1)
  })

  it('should extract intersecting EDPs from response', () => {
    const edps = [
      { name: 'EDP Area 1', attributes: {} },
      { name: 'EDP Area 2', attributes: {} }
    ]
    const response = {
      boundaryGeometryWgs84: { type: 'FeatureCollection', features: [] },
      intersectingEdps: edps
    }

    const result = getViewModel(response)

    expect(result.intersectsEdp).toBeTruthy()
    expect(result.intersectingEdps).toEqual(
      edps.map((edp) => ({ ...edp, natura2000SiteName: edp.n2k_site_name }))
    )
  })

  it('should handle missing fields gracefully', () => {
    const result = getViewModel({})

    expect(result.featureCount).toBe(1)
    expect(result.intersectsEdp).toBeFalsy()
    expect(result.intersectingEdps).toEqual([])
  })

  it('should include uploadBoundaryPath and mapStyleUrl', () => {
    const result = getViewModel({})

    expect(result.uploadBoundaryPath).toBe('/quote/upload-boundary')
    expect(result.mapStyleUrl).toBeDefined()
  })

  it('should build edpBoundaryGeojson and edpIntersectionGeojson from enhanced EDP data', () => {
    const edpGeometry = {
      type: 'Polygon',
      coordinates: [
        [
          [-1.6, 51.9],
          [-1.3, 51.9],
          [-1.3, 52.2],
          [-1.6, 52.2],
          [-1.6, 51.9]
        ]
      ]
    }
    const intersectionGeometry = {
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
    }
    const edps = [
      {
        label: 'EDP Area 1',
        n2k_site_name: 'Site A',
        edp_geometry: edpGeometry,
        intersection_geometry: intersectionGeometry,
        overlap_area_ha: 0.5,
        overlap_area_sqm: 5000.0,
        overlap_percentage: 25.0
      }
    ]
    const response = {
      boundaryGeometryWgs84: { type: 'FeatureCollection', features: [] },
      intersectingEdps: edps
    }

    const result = getViewModel(response)

    const boundary = JSON.parse(result.edpBoundaryGeojson)
    expect(boundary.type).toBe('FeatureCollection')
    expect(boundary.features).toHaveLength(1)
    expect(boundary.features[0].geometry).toEqual(edpGeometry)
    expect(boundary.features[0].properties.label).toBe('EDP Area 1')

    const intersection = JSON.parse(result.edpIntersectionGeojson)
    expect(intersection.type).toBe('FeatureCollection')
    expect(intersection.features).toHaveLength(1)
    expect(intersection.features[0].geometry).toEqual(intersectionGeometry)
    expect(intersection.features[0].properties.overlap_area_ha).toBe(0.5)
    expect(intersection.features[0].properties.overlap_percentage).toBe(25.0)
  })

  it('should return empty FeatureCollections when no EDPs have geometries', () => {
    const edps = [{ label: 'EDP Area 1', n2k_site_name: 'Site A' }]
    const response = {
      boundaryGeometryWgs84: { type: 'FeatureCollection', features: [] },
      intersectingEdps: edps
    }

    const result = getViewModel(response)

    expect(JSON.parse(result.edpBoundaryGeojson).features).toHaveLength(0)
    expect(JSON.parse(result.edpIntersectionGeojson).features).toHaveLength(0)
  })

  it('should handle null boundaryGeojson with defaults', () => {
    const result = getViewModel(null)

    expect(result.featureCount).toBe(1)
    expect(result.boundaryGeojson).toBe(JSON.stringify(null))
    expect(result.intersectsEdp).toBeFalsy()
    expect(result.intersectingEdps).toEqual([])
    expect(result.boundaryError).toBeNull()
  })

  it('should include boundaryError when provided', () => {
    const result = getViewModel(null, 'Invalid geometry')

    expect(result.boundaryError).toBe('Invalid geometry')
    expect(result.featureCount).toBe(1)
    expect(result.boundaryGeojson).toBe(JSON.stringify(null))
  })

  it('should include boundaryTypePath', () => {
    const result = getViewModel({})

    expect(result.boundaryTypePath).toBe('/quote/boundary-type')
  })
})
