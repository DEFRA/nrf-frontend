// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderSavedBoundary, wireSavedBoundary } from './saved-boundary.js'

function createMapMock() {
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn()
  }
}

describe('renderSavedBoundary', () => {
  it('returns false when geojson is missing', () => {
    const map = createMapMock()

    const result = renderSavedBoundary(map, {
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

    const result = renderSavedBoundary(map, {
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

    const result = renderSavedBoundary(map, {
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

    renderSavedBoundary(map, {
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

describe('wireSavedBoundary', () => {
  function createMapMock({ styleLoaded = true } = {}) {
    return {
      getSource: vi.fn().mockReturnValue(null),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      isStyleLoaded: vi.fn().mockReturnValue(styleLoaded),
      once: vi.fn()
    }
  }

  it('renders the boundary immediately when the style is already loaded', () => {
    const map = createMapMock()
    const geojson = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.5, 52.0] }
    }

    wireSavedBoundary(map, geojson)

    expect(map.addSource).toHaveBeenCalledWith('boundary', {
      type: 'geojson',
      data: geojson
    })
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'boundary-fill',
        paint: expect.objectContaining({
          'fill-color': 'rgba(212,53,28,1)',
          'fill-opacity': 0.1
        })
      })
    )
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'boundary-line',
        paint: expect.objectContaining({
          'line-color': 'rgba(212,53,28,1)',
          'line-width': 2
        })
      })
    )
  })

  it('waits for the style to finish loading before rendering', () => {
    const map = createMapMock({ styleLoaded: false })
    const geojson = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.5, 52.0] }
    }

    wireSavedBoundary(map, geojson)

    expect(map.addSource).not.toHaveBeenCalled()
    expect(map.once).toHaveBeenCalledWith('styledata', expect.any(Function))

    map.isStyleLoaded.mockReturnValue(true)
    map.once.mock.calls[0][1]()

    expect(map.addSource).toHaveBeenCalledWith('boundary', {
      type: 'geojson',
      data: geojson
    })
  })
})
