// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import {
  addSourceAndLayers,
  drawFeature,
  fitMapToBounds,
  getLayers
} from './features.js'
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
  describe('fitMapToBounds', () => {
    it('returns false when map is missing', () => {
      const result = fitMapToBounds(null, {
        type: 'FeatureCollection',
        features: []
      })

      expect(result).toBe(false)
    })

    it('returns false when geojson is missing', () => {
      const map = createMapMock()

      const result = fitMapToBounds(map, null)

      expect(result).toBe(false)
      expect(map.fitBounds).not.toHaveBeenCalled()
    })

    it('returns false when geometry has no coordinates', () => {
      const map = createMapMock()
      const result = fitMapToBounds(map, {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Polygon' } }]
      })

      expect(result).toBe(false)
      expect(map.fitBounds).not.toHaveBeenCalled()
    })
  })

  describe('addSourceAndLayers', () => {
    it('returns false when geojson is missing', () => {
      const map = createMapMock()

      const result = addSourceAndLayers(map, {
        sourceId: 'feature',
        geojson: null,
        color: '#1d70b8',
        fillOpacity: 0.2,
        lineWidth: 2
      })

      expect(result).toBe(false)
      expect(map.addSource).not.toHaveBeenCalled()
    })

    it('returns false when source already exists', () => {
      const map = createMapMock()
      map.getSource.mockReturnValue({})

      const result = addSourceAndLayers(map, {
        sourceId: 'feature',
        geojson: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-1.5, 52.0] }
        },
        color: '#1d70b8',
        fillOpacity: 0.2,
        lineWidth: 2
      })

      expect(result).toBe(false)
      expect(map.addLayer).not.toHaveBeenCalled()
    })
  })

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

    it('returns early when map is missing', () => {
      expect(
        drawFeature(null, {
          featureGeojson: {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-1.5, 52.0] }
          }
        })
      ).toBeUndefined()
    })

    it('passes custom fitBounds options through', () => {
      const map = createMapMock()
      const featureGeojson = {
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

      drawFeature(map, {
        featureGeojson,
        fitBoundsOptions: { padding: 10, maxZoom: 12 }
      })

      expect(map.fitBounds).toHaveBeenCalledWith(
        [
          [-1.6, 52.0],
          [-1.2, 52.3]
        ],
        { padding: 10, maxZoom: 12 }
      )
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

    it('returns [] when layersUrl is missing', async () => {
      const fetchImpl = vi.fn()

      const result = await getLayers({ fetchImpl })

      expect(result).toEqual([])
      expect(fetchImpl).not.toHaveBeenCalled()
    })

    it('returns [] when fetchImpl is not a function', async () => {
      const result = await getLayers({
        layersUrl: 'https://example.com/layers',
        fetchImpl: null
      })

      expect(result).toEqual([])
    })

    it('returns payload directly when API responds with an array', async () => {
      const fetchImpl = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([{ id: 'array-layer' }])
      })

      const result = await getLayers({
        layersUrl: 'https://example.com/layers',
        fetchImpl
      })

      expect(result).toEqual([{ id: 'array-layer' }])
    })

    it('returns [] when payload shape is unrecognized', async () => {
      const fetchImpl = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: [] })
      })

      const result = await getLayers({
        layersUrl: 'https://example.com/layers',
        fetchImpl
      })

      expect(result).toEqual([])
    })

    it('logs warning and returns [] when response is not ok', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const fetchImpl = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn()
      })

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

    it('does not include empty filters in query string', async () => {
      const fetchImpl = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ layers: [] })
      })

      await getLayers({
        layersUrl: 'https://example.com/layers',
        filters: {
          region: 'england',
          type: '',
          category: null,
          zone: undefined
        },
        fetchImpl
      })

      expect(fetchImpl).toHaveBeenCalledWith(
        'https://example.com/layers?region=england'
      )
    })
  })
})
