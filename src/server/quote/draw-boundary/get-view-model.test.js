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
        mapStyleUrl: '/public/data/vts/test-style.json'
      })
    )

    config.set('map.defaultStyleUrl', originalStyleUrl)
  })
})
