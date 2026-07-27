// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

vi.mock('@defra/interactive-map/plugins/map-styles', () => ({
  default: vi.fn()
}))
vi.mock('@defra/interactive-map/plugins/scale-bar', () => ({
  default: vi.fn()
}))
vi.mock('./datasets.js', () => ({ createMapDatasetsPlugin: vi.fn() }))

import createMapStylesPlugin from '@defra/interactive-map/plugins/map-styles'
import createScaleBarPlugin from '@defra/interactive-map/plugins/scale-bar'
import { createMapDatasetsPlugin } from './datasets.js'
import { createCommonMapPlugins } from './common-map-plugins.js'

describe('createCommonMapPlugins', () => {
  it('creates the datasets, map styles and scale bar plugins', () => {
    const datasetsPlugin = { id: 'datasets' }
    const mapStylesPlugin = { id: 'map-styles' }
    const scaleBarPlugin = { id: 'scale-bar' }
    createMapDatasetsPlugin.mockReturnValue(datasetsPlugin)
    createMapStylesPlugin.mockReturnValue(mapStylesPlugin)
    createScaleBarPlugin.mockReturnValue(scaleBarPlugin)

    const result = createCommonMapPlugins()

    expect(result.datasetsPlugin).toBe(datasetsPlugin)
    expect(result.mapStylesPlugin).toBe(mapStylesPlugin)
    expect(result.scaleBarPlugin).toBe(scaleBarPlugin)
    expect(result.mapStyles).toEqual(expect.any(Array))
    expect(createMapStylesPlugin).toHaveBeenCalledWith({
      mapStyles: result.mapStyles
    })
    expect(createScaleBarPlugin).toHaveBeenCalledWith({ units: 'metric' })
  })
})
