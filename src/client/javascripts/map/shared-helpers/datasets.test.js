// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

vi.mock('@defra/interactive-map/plugins/datasets', () => ({
  default: vi.fn()
}))

import createDatasetsPlugin from '@defra/interactive-map/plugins/datasets'
import {
  ALL_LAYER_IDS,
  FILL_LAYER_IDS,
  createMapDatasetsPlugin
} from './datasets.js'

describe('datasets', () => {
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
    createDatasetsPlugin.mockReturnValue({ id: 'datasets' })

    const result = createMapDatasetsPlugin()

    expect(result).toEqual({ id: 'datasets' })
    expect(createDatasetsPlugin).toHaveBeenCalledWith({
      datasets: [
        expect.objectContaining({
          id: 'edp_boundaries',
          label: 'Nature Restoration Fund nutrients levy',
          sourceLayer: 'edp_boundaries',
          showInKey: true,
          tiles: ['/impact-assessor-map/tiles/edp_boundaries/{z}/{x}/{y}.mvt'],
          style: {
            stroke: '#FD0',
            fillPattern: 'horizontal-hatch',
            fillPatternForegroundColor: 'rgba(255, 221, 0, 0.6)',
            fillPatternBackgroundColor: 'transparent'
          }
        }),
        expect.objectContaining({
          id: 'excluded_areas',
          label: 'Excluded areas',
          sourceLayer: 'edp_excluded_areas',
          showInKey: true,
          tiles: [
            '/impact-assessor-map/tiles/edp_excluded_areas/{z}/{x}/{y}.mvt'
          ],
          style: {
            stroke: '#f47738',
            fillPattern: 'vertical-hatch',
            fillPatternForegroundColor: 'rgba(244, 119, 56, 0.6)',
            fillPatternBackgroundColor: 'transparent'
          }
        })
      ]
    })
  })
})
