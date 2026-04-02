// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import {
  createInlineMapOptions,
  getMapStyleUrl
} from './interactive-map-profile-common.js'

describe('interactive-map-profile-common', () => {
  it('reads map style url from map element dataset', () => {
    const element = document.createElement('div')
    element.dataset.mapStyleUrl = '/public/data/vts/OS_VTS_3857_Outdoor.json'

    expect(getMapStyleUrl(element)).toBe(
      '/public/data/vts/OS_VTS_3857_Outdoor.json'
    )
  })

  it('builds inline map options with OS attribution and extra options', () => {
    const options = createInlineMapOptions({
      mapProvider: { provider: 'maplibre' },
      mapLabel: 'Test map',
      mapStyles: [{ url: '/public/data/vts/OS_VTS_3857_Dark.json' }],
      containerHeight: '400px',
      extraOptions: { bounds: [-8.75, 49.8, 2.1, 60.95] }
    })

    expect(options).toEqual(
      expect.objectContaining({
        mapProvider: { provider: 'maplibre' },
        behaviour: 'inline',
        mapLabel: 'Test map',
        containerHeight: '400px',
        enableZoomControls: true,
        bounds: [-8.75, 49.8, 2.1, 60.95],
        mapStyle: expect.objectContaining({
          url: '/public/data/vts/OS_VTS_3857_Dark.json',
          attribution: expect.stringContaining('Ordnance Survey')
        })
      })
    )
  })
})
