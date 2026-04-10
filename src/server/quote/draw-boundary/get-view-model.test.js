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
        backLinkPath: '/quote/boundary-type',
        mapStyleUrl: '/public/data/vts/test-style.json',
        impactAssessorLayers: expect.any(String),
        saveAndContinueUrl: '/quote/draw-boundary/save',
        existingBoundaryGeojson: JSON.stringify(null)
      })
    )

    config.set('map.defaultStyleUrl', originalStyleUrl)
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
})
