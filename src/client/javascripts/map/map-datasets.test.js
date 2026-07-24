// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

import {
  ALL_LAYER_IDS,
  FILL_LAYER_IDS,
  createMapDatasetsPlugin
} from './map-datasets.js'

describe('map-datasets', () => {
  it('derives ALL_LAYER_IDS from FILL_LAYER_IDS, including stroke layers', () => {
    expect(FILL_LAYER_IDS).toEqual(['edp_boundaries', 'excluded_areas'])
    expect(ALL_LAYER_IDS).toEqual([
      'edp_boundaries',
      'edp_boundaries-stroke',
      'excluded_areas',
      'excluded_areas-stroke'
    ])
  })

  it('creates the datasets plugin with edp_boundaries and excluded_areas datasets', () => {
    const datasetsPlugin = vi.fn().mockReturnValue({ id: 'datasets' })
    globalThis.defra = { datasetsPlugin }

    const result = createMapDatasetsPlugin()

    expect(result).toEqual({ id: 'datasets' })
    expect(datasetsPlugin).toHaveBeenCalledWith({
      datasets: [
        expect.objectContaining({
          id: 'edp_boundaries',
          sourceLayer: 'edp_boundaries',
          tiles: ['/impact-assessor-map/tiles/edp_boundaries/{z}/{x}/{y}.mvt']
        }),
        expect.objectContaining({
          id: 'excluded_areas',
          sourceLayer: 'edp_boundaries',
          tiles: ['/excluded-areas-map/tiles/edp_boundaries/{z}/{x}/{y}.mvt']
        })
      ]
    })

    delete globalThis.defra
  })
})
