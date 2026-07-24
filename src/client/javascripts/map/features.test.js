// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { addSourceAndLayers } from './features.js'

function createMapMock() {
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn()
  }
}

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

  it('adds a source and fill/line layers with the given paint properties', () => {
    const map = createMapMock()
    const geojson = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.5, 52.0] }
    }

    const result = addSourceAndLayers(map, {
      sourceId: 'boundary',
      geojson,
      color: '#d4351c',
      fillOpacity: 0.1,
      lineWidth: 3
    })

    expect(result).toBe(true)
    expect(map.addSource).toHaveBeenCalledWith('boundary', {
      type: 'geojson',
      data: geojson
    })
    expect(map.addLayer).toHaveBeenCalledWith({
      id: 'boundary-fill',
      type: 'fill',
      source: 'boundary',
      paint: {
        'fill-color': '#d4351c',
        'fill-opacity': 0.1
      }
    })
    expect(map.addLayer).toHaveBeenCalledWith({
      id: 'boundary-line',
      type: 'line',
      source: 'boundary',
      paint: {
        'line-color': '#d4351c',
        'line-width': 3
      }
    })
  })

  it('merges custom line paint properties', () => {
    const map = createMapMock()
    const geojson = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.5, 52.0] }
    }

    addSourceAndLayers(map, {
      sourceId: 'boundary',
      geojson,
      color: '#d4351c',
      fillOpacity: 0.1,
      lineWidth: 3,
      linePaint: { 'line-dasharray': [2, 2] }
    })

    expect(map.addLayer).toHaveBeenCalledWith({
      id: 'boundary-line',
      type: 'line',
      source: 'boundary',
      paint: {
        'line-color': '#d4351c',
        'line-width': 3,
        'line-dasharray': [2, 2]
      }
    })
  })
})
