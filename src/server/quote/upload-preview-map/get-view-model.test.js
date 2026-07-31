import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'
import { BOUNDARY_ERRORS, MAX_BOUNDARY_FILE_SIZE_MB } from '@defra/nrf-library'
import { getBoundaryErrorMessage } from '../../common/constants/boundary-error-messages.js'

describe('getViewModel', () => {
  it('should return correct fields', () => {
    const geo = { type: 'FeatureCollection' }
    const result = getViewModel({
      boundaryGeojson: { boundaryGeometryWgs84: geo, intersectingEdps: [] }
    })

    expect(result.pageHeading).toBe('Your uploaded red line boundary file')
    expect(result.boundaryGeojson).toBe(JSON.stringify(geo))
    expect(result.intersectsEdp).toBeFalsy()
    expect(result.intersectingEdps).toEqual([])
    expect(result.boundaryError).toBeNull()
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
    expect(result.intersectingEdps).toEqual(edps)
  })

  it('should handle missing fields gracefully', () => {
    const result = getViewModel({ boundaryGeojson: {} })

    expect(result.intersectsEdp).toBeFalsy()
    expect(result.intersectingEdps).toEqual([])
  })

  it('should include uploadBoundaryPath', () => {
    const result = getViewModel({ boundaryGeojson: {} })

    expect(result.uploadBoundaryPath).toBe('/quote/upload-boundary')
  })

  it('should default backLinkPath to upload-boundary when not changing', () => {
    const result = getViewModel({ boundaryGeojson: {} })

    expect(result.backLinkPath).toBe('/quote/upload-boundary')
  })

  it('should link back to check-your-answers when change=true is in the query', () => {
    const result = getViewModel({
      boundaryGeojson: {},
      query: { change: 'true' }
    })

    expect(result.backLinkPath).toBe('/quote/check-your-answers')
  })

  it('should handle null boundaryGeojson with defaults', () => {
    const result = getViewModel({ boundaryGeojson: null })

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
    expect(result.boundaryGeojson).toBe(JSON.stringify(null))
  })

  it('should map failureReason file_size_too_large to user-facing copy using the frontend max size constant', () => {
    const result = getViewModel({
      boundaryGeojson: null,
      boundaryFailureReason: BOUNDARY_ERRORS.UPLOAD.FILE_SIZE_TOO_LARGE
    })

    expect(result.boundaryError).toBe(
      `The selected file must be smaller than ${MAX_BOUNDARY_FILE_SIZE_MB}MB.`
    )
  })

  it('should use the error page heading and title when there is a failureReason', () => {
    const result = getViewModel({
      boundaryGeojson: null,
      boundaryFailureReason: BOUNDARY_ERRORS.SERVICE.CHECK_FAILED
    })

    expect(result.pageHeading).toBe(
      'Your red line boundary file contains an error'
    )
    expect(result.pageTitle).toContain(
      'Your red line boundary file contains an error'
    )
  })

  it('should use the success page heading when there is no failureReason', () => {
    const result = getViewModel({ boundaryGeojson: {} })

    expect(result.pageHeading).toBe('Your uploaded red line boundary file')
  })

  it('should show the map when geometry is present', () => {
    const result = getViewModel({
      boundaryGeojson: {
        boundaryGeometryWgs84: { type: 'FeatureCollection', features: [] }
      }
    })

    expect(result.showMap).toBe(true)
  })

  it('should show the map for a geometry error that still carries geometry', () => {
    const result = getViewModel({
      boundaryGeojson: {
        boundaryGeometryWgs84: { type: 'FeatureCollection', features: [] }
      },
      boundaryFailureReason: BOUNDARY_ERRORS.GEOMETRY.SELF_INTERSECTING
    })

    expect(result.showMap).toBe(true)
  })

  it('should hide the map when there is no geometry to draw', () => {
    const result = getViewModel({
      boundaryGeojson: null,
      boundaryFailureReason: BOUNDARY_ERRORS.UPLOAD.UNSUPPORTED_CRS
    })

    expect(result.showMap).toBe(false)
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
