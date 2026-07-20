import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'
import { BOUNDARY_ERRORS, MAX_BOUNDARY_FILE_SIZE_MB } from '@defra/nrf-library'
import { getBoundaryErrorMessage } from '../../common/constants/boundary-error-messages.js'

describe('getViewModel', () => {
  it('should return featureCount of 1 and correct fields', () => {
    const geo = { type: 'FeatureCollection' }
    const result = getViewModel({
      boundaryGeojson: { boundaryGeometryWgs84: geo, intersectingEdps: [] }
    })

    expect(result.featureCount).toBe(1)
    expect(result.pageHeading).toBe('Boundary Map')
    expect(result.boundaryGeojson).toBe(JSON.stringify(geo))
    expect(result.intersectsEdp).toBeFalsy()
    expect(result.intersectingEdps).toEqual([])
    expect(result.boundaryError).toBeNull()
  })

  it('should always return featureCount of 1', () => {
    const boundaryGeojson = {
      boundaryGeometryWgs84: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'Polygon' } },
          { type: 'Feature', geometry: { type: 'Polygon' } }
        ]
      },
      intersectingEdps: []
    }

    const result = getViewModel({ boundaryGeojson })

    expect(result.featureCount).toBe(1)
  })

  it('should extract intersecting EDPs from response', () => {
    const edps = [
      { name: 'EDP Area 1', attributes: {} },
      { name: 'EDP Area 2', attributes: {} }
    ]
    const boundaryGeojson = {
      boundaryGeometryWgs84: { type: 'FeatureCollection', features: [] },
      intersectingEdps: edps
    }

    const result = getViewModel({ boundaryGeojson })

    expect(result.intersectsEdp).toBeTruthy()
    expect(result.intersectingEdps).toEqual(
      edps.map((edp) => ({ ...edp, natura2000SiteName: edp.n2k_site_name }))
    )
  })

  it('should handle missing fields gracefully', () => {
    const result = getViewModel({ boundaryGeojson: {} })

    expect(result.featureCount).toBe(1)
    expect(result.intersectsEdp).toBeFalsy()
    expect(result.intersectingEdps).toEqual([])
  })

  it('should include uploadBoundaryPath and mapStyleUrl', () => {
    const result = getViewModel({ boundaryGeojson: {} })

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
    const boundaryGeojson = {
      boundaryGeometryWgs84: { type: 'FeatureCollection', features: [] },
      intersectingEdps: edps
    }

    const result = getViewModel({ boundaryGeojson })

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
    const boundaryGeojson = {
      boundaryGeometryWgs84: { type: 'FeatureCollection', features: [] },
      intersectingEdps: edps
    }

    const result = getViewModel({ boundaryGeojson })

    expect(JSON.parse(result.edpBoundaryGeojson).features).toHaveLength(0)
    expect(JSON.parse(result.edpIntersectionGeojson).features).toHaveLength(0)
  })

  it('should handle null boundaryGeojson with defaults', () => {
    const result = getViewModel({ boundaryGeojson: null })

    expect(result.featureCount).toBe(1)
    expect(result.boundaryGeojson).toBe(JSON.stringify(null))
    expect(result.intersectsEdp).toBeFalsy()
    expect(result.intersectingEdps).toEqual([])
    expect(result.boundaryError).toBeNull()
  })

  it('should include boundaryError when a failureReason is provided', () => {
    const result = getViewModel({
      boundaryGeojson: null,
      boundaryFailureReason: BOUNDARY_ERRORS.SERVICE.CHECK_FAILED
    })

    expect(result.boundaryError).toBe(
      getBoundaryErrorMessage(BOUNDARY_ERRORS.SERVICE.CHECK_FAILED)
    )
    expect(result.featureCount).toBe(1)
    expect(result.boundaryGeojson).toBe(JSON.stringify(null))
  })

  it('should set uploadStatus to success and failureReason to null when there is no failureReason', () => {
    const result = getViewModel({ boundaryGeojson: {} })

    expect(result.uploadStatus).toBe('success')
    expect(result.failureReason).toBeNull()
  })

  it('should set uploadStatus to failure and pass through failureReason when there is one', () => {
    const result = getViewModel({
      boundaryGeojson: null,
      boundaryFailureReason: BOUNDARY_ERRORS.SERVICE.CHECK_FAILED
    })

    expect(result.uploadStatus).toBe('failure')
    expect(result.failureReason).toBe(BOUNDARY_ERRORS.SERVICE.CHECK_FAILED)
  })

  it('should map failureReason file_size_too_large to user-facing copy using the frontend max size constant', () => {
    const result = getViewModel({
      boundaryGeojson: null,
      boundaryFailureReason: BOUNDARY_ERRORS.UPLOAD.FILE_SIZE_TOO_LARGE
    })

    expect(result.boundaryError).toBe(
      `The uploaded boundary file is too large. The maximum file size allowed is ${MAX_BOUNDARY_FILE_SIZE_MB}MB.`
    )
  })

  it('should fall back to the generic message for an unrecognised failureReason code', () => {
    const result = getViewModel({
      boundaryGeojson: null,
      boundaryFailureReason: 'some_new_code_the_frontend_does_not_know'
    })

    expect(result.boundaryError).toBe(
      getBoundaryErrorMessage(BOUNDARY_ERRORS.SERVICE.CHECK_FAILED)
    )
  })

  it('should include boundaryTypePath', () => {
    const result = getViewModel({ boundaryGeojson: {} })

    expect(result.boundaryTypePath).toBe('/quote/boundary-type')
  })

  it('should include boundaryFilename when provided', () => {
    const result = getViewModel({
      boundaryGeojson: { boundaryGeometryWgs84: null, intersectingEdps: [] },
      boundaryFilename: 'site-boundary.shp'
    })

    expect(result.boundaryFilename).toBe('site-boundary.shp')
  })

  it('should default boundaryFilename to null', () => {
    const result = getViewModel({ boundaryGeojson: {} })

    expect(result.boundaryFilename).toBeNull()
  })

  it('should JSON-stringify boundaryMetadata as existingBoundaryMetadata', () => {
    const boundaryMetadata = {
      centre: [1.29, 51.2],
      bounds: {
        topLeft: [1.29, 51.0],
        topRight: [1.44, 52.69],
        bottomRight: [1.3, 50.59],
        bottomLeft: [1.43, 52.68]
      }
    }

    const result = getViewModel({
      boundaryGeojson: {
        boundaryGeometryWgs84: null,
        intersectingEdps: [],
        boundaryMetadata
      }
    })

    expect(result.existingBoundaryMetadata).toBe(
      JSON.stringify(boundaryMetadata)
    )
  })

  it('should return JSON-stringified null as existingBoundaryMetadata when not present', () => {
    const result = getViewModel({ boundaryGeojson: {} })

    expect(result.existingBoundaryMetadata).toBe(JSON.stringify(null))
  })

  it('should return JSON-stringified null as existingBoundaryMetadata when boundaryGeojson is null', () => {
    const result = getViewModel({ boundaryGeojson: null })

    expect(result.existingBoundaryMetadata).toBe(JSON.stringify(null))
  })
})
