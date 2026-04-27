import { config } from '../../../config/config.js'
import getViewModel, { title } from './get-view-model.js'

describe('draw-boundary getViewModel', () => {
  test('returns configured default map style URL', () => {
    const originalStyleUrl = config.get('map.defaultStyleUrl')

    config.set('map.defaultStyleUrl', '/public/data/vts/test-style.json')

    const viewModel = getViewModel()

    expect(viewModel).toEqual(
      expect.objectContaining({
        pageHeading: title,
        mapStyleUrl: '/public/data/vts/test-style.json',
        impactAssessorLayers: expect.any(String),
        saveAndContinueUrl: '/quote/draw-boundary/save',
        existingBoundaryGeojson: JSON.stringify(null)
      })
    )

    config.set('map.defaultStyleUrl', originalStyleUrl)
  })

  test('returns osNamesUrl for the search proxy endpoint', () => {
    const viewModel = getViewModel()

    expect(viewModel.osNamesUrl).toBe('/os-names-search?query={query}')
  })

  test('returns existing boundary geometry from quote cache when present', () => {
    const quoteData = {
      boundaryGeojson: {
        boundaryGeometryWgs84: {
          type: 'Polygon',
          coordinates: [
            [
              [-1.2, 51.8],
              [-1.1, 51.8],
              [-1.1, 51.9],
              [-1.2, 51.8]
            ]
          ]
        }
      }
    }

    const viewModel = getViewModel(quoteData)

    expect(viewModel.existingBoundaryGeojson).toBe(
      JSON.stringify(quoteData.boundaryGeojson.boundaryGeometryWgs84)
    )
  })

  test('returns existing boundary metadata from quote cache when present', () => {
    const boundaryMetadata = {
      bounds: {
        bottomLeft: [-1.2, 51.8],
        topRight: [-1.1, 51.9]
      },
      centre: [-1.15, 51.85]
    }
    const quoteData = {
      boundaryGeojson: {
        boundaryMetadata
      }
    }

    const viewModel = getViewModel(quoteData)

    expect(viewModel.existingBoundaryMetadata).toBe(
      JSON.stringify(boundaryMetadata)
    )
  })

  test('returns JSON-stringified null as existingBoundaryMetadata when not present', () => {
    const viewModel = getViewModel()

    expect(viewModel.existingBoundaryMetadata).toBe(JSON.stringify(null))
  })
})
