// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { drawFeature, getLayers } from './features.js'
import { ENGLAND_BOUNDS } from './config.js'

function createMapMock() {
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    fitBounds: vi.fn()
  }
}

describe('base-map features', () => {
  describe('drawFeature', () => {
    it('adds feature and boundary layers and fits to feature bounds', () => {
      const map = createMapMock()
      const featureGeojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-1.6, 52.0],
                  [-1.2, 52.0],
                  [-1.2, 52.3],
                  [-1.6, 52.3],
                  [-1.6, 52.0]
                ]
              ]
            }
          }
        ]
      }
      const boundaryGeojson = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-2.0, 51.9],
              [-1.0, 51.9],
              [-1.0, 52.4],
              [-2.0, 52.4],
              [-2.0, 51.9]
            ]
          ]
        }
      }

      drawFeature(map, { featureGeojson, boundaryGeojson })

      expect(map.addSource).toHaveBeenCalledWith('feature', {
        type: 'geojson',
        data: featureGeojson
      })
      expect(map.addSource).toHaveBeenCalledWith('boundary', {
        type: 'geojson',
        data: boundaryGeojson
      })
      expect(map.addLayer).toHaveBeenCalledTimes(4)
      expect(map.fitBounds).toHaveBeenCalledWith(
        [
          [-1.6, 52.0],
          [-1.2, 52.3]
        ],
        { padding: 40, maxZoom: 15 }
      )
    })

    it('uses fallback bounds when no drawable geometry is present', () => {
      const map = createMapMock()

      drawFeature(map, {
        featureGeojson: null,
        boundaryGeojson: null,
        fallbackBounds: ENGLAND_BOUNDS
      })

      expect(map.fitBounds).toHaveBeenCalledWith(ENGLAND_BOUNDS, {
        padding: 20
      })
    })

    it('skips adding sources that already exist', () => {
      const map = createMapMock()
      map.getSource.mockReturnValueOnce({}).mockReturnValueOnce({})

      drawFeature(map, {
        featureGeojson: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-1.5, 52.0] }
        },
        boundaryGeojson: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-1.4, 52.1] }
        }
      })

      expect(map.addSource).not.toHaveBeenCalled()
      expect(map.addLayer).not.toHaveBeenCalled()
    })
  })

  describe('getLayers', () => {
    it('returns layers from payload.layers and applies filters', async () => {
      const fetchImpl = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          layers: [{ id: 'flood-zone' }]
        })
      })

      const result = await getLayers({
        layersUrl: 'https://example.com/layers',
        filters: { region: 'england', type: 'edp' },
        fetchImpl
      })

      expect(fetchImpl).toHaveBeenCalledWith(
        'https://example.com/layers?region=england&type=edp'
      )
      expect(result).toEqual([{ id: 'flood-zone' }])
    })

    it('returns [] and logs warning when fetch fails', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const fetchImpl = vi.fn().mockRejectedValue(new Error('network'))

      const result = await getLayers({
        layersUrl: 'https://example.com/layers',
        fetchImpl
      })

      expect(result).toEqual([])
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to load map layers',
        expect.any(Error)
      )
      warnSpy.mockRestore()
    })
  })
})
