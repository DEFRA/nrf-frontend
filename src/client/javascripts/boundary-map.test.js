// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validGeojson,
  validEdpBoundaryGeojson,
  validEdpIntersectionGeojson
} from './__fixtures__/boundary-map-fixtures.js'

function createMapElement(
  geojson,
  styleUrl = 'https://example.com/style.json',
  { edpBoundary, edpIntersection } = {}
) {
  const el = document.createElement('div')
  el.id = 'boundary-map'
  if (geojson !== undefined) {
    el.dataset.geojson =
      typeof geojson === 'string' ? geojson : JSON.stringify(geojson)
  }
  if (edpBoundary !== undefined) {
    el.dataset.edpBoundaryGeojson =
      typeof edpBoundary === 'string'
        ? edpBoundary
        : JSON.stringify(edpBoundary)
  }
  if (edpIntersection !== undefined) {
    el.dataset.edpIntersectionGeojson =
      typeof edpIntersection === 'string'
        ? edpIntersection
        : JSON.stringify(edpIntersection)
  }
  el.dataset.mapStyleUrl = styleUrl
  document.body.appendChild(el)
  return el
}

function createMockMapInstance(styleLoaded = true) {
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    fitBounds: vi.fn(),
    isStyleLoaded: vi.fn().mockReturnValue(styleLoaded),
    once: vi.fn(),
    on: vi.fn()
  }
}

function createMockDefra(mapInstance) {
  const mockMap = { on: vi.fn() }
  function MockInteractiveMap() {
    return mockMap
  }
  MockInteractiveMap._mock = vi.fn()
  return {
    InteractiveMap: new Proxy(MockInteractiveMap, {
      construct(target, args) {
        MockInteractiveMap._mock(...args)
        return mockMap
      }
    }),
    maplibreProvider: vi.fn().mockReturnValue({}),
    _mock: MockInteractiveMap._mock,
    _mockMap: mockMap,
    _triggerReady() {
      const readyCallback = mockMap.on.mock.calls.find(
        (c) => c[0] === 'map:ready'
      )?.[1]
      if (readyCallback) {
        readyCallback({ map: mapInstance })
      }
    }
  }
}

/**
 * Each import of boundary-map.js adds a DOMContentLoaded listener that
 * cannot be removed. To prevent stale listeners from prior tests firing
 * with an incorrect `defra` global, we track them and use a wrapper that
 * only invokes the most recently registered one.
 */
let initFn = null
const originalAddEventListener = document.addEventListener.bind(document)

describe('boundary-map init', () => {
  let warnSpy

  beforeEach(() => {
    document.body.innerHTML = ''
    delete globalThis.defra
    vi.resetModules()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    vi.spyOn(document, 'addEventListener').mockImplementation(
      (event, fn, ...rest) => {
        if (event === 'DOMContentLoaded') {
          initFn = fn
        } else {
          originalAddEventListener(event, fn, ...rest)
        }
      }
    )
  })

  afterEach(() => {
    warnSpy.mockRestore()
    vi.restoreAllMocks()
  })

  async function loadModule() {
    await import('./boundary-map.js')
    if (initFn) {
      initFn()
    }
  }

  it('does nothing when no map element exists', async () => {
    await loadModule()
    expect(document.getElementById('boundary-map')).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith('Boundary map element not found', '')
  })

  it('does nothing when geojson is invalid JSON', async () => {
    createMapElement('not-valid-json')
    await loadModule()
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to parse boundary GeoJSON',
      expect.any(SyntaxError)
    )
  })

  it('creates map and fits to UK bounds when geojson parses to null', async () => {
    createMapElement('null')
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mockDefra._mock).toHaveBeenCalled()
    expect(mapInstance.addSource).not.toHaveBeenCalledWith(
      'boundary',
      expect.anything()
    )
    expect(mapInstance.fitBounds).toHaveBeenCalledWith(
      [
        [-5.2, 50.0],
        [1.5, 55.0]
      ],
      { padding: 20 }
    )
  })

  it('does nothing when defra global is undefined', async () => {
    createMapElement(validGeojson)
    await loadModule()
    expect(warnSpy).toHaveBeenCalledWith(
      'DEFRA interactive map dependencies not available',
      ''
    )
  })

  it('does nothing when defra.InteractiveMap is missing', async () => {
    createMapElement(validGeojson)
    globalThis.defra = { maplibreProvider: vi.fn() }
    await loadModule()
    expect(globalThis.defra.maplibreProvider).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      'DEFRA interactive map dependencies not available',
      ''
    )
  })

  it('does nothing when defra.maplibreProvider is missing', async () => {
    const constructorSpy = vi.fn().mockReturnValue({})
    createMapElement(validGeojson)
    globalThis.defra = {
      InteractiveMap: constructorSpy
    }
    await loadModule()
    expect(constructorSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      'DEFRA interactive map dependencies not available',
      ''
    )
  })

  it('creates an InteractiveMap with correct options', async () => {
    createMapElement(validGeojson, 'https://tiles.example.com/style.json')
    const mapInstance = createMockMapInstance()
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()

    expect(mockDefra._mock).toHaveBeenCalledWith(
      'boundary-map',
      expect.objectContaining({
        behaviour: 'inline',
        mapLabel: 'Red line boundary',
        containerHeight: '400px',
        enableZoomControls: true,
        mapStyle: expect.objectContaining({
          url: 'https://tiles.example.com/style.json'
        })
      })
    )
  })

  it('adds all layers when style is already loaded', async () => {
    createMapElement(validGeojson, 'https://example.com/style.json', {
      edpBoundary: validEdpBoundaryGeojson,
      edpIntersection: validEdpIntersectionGeojson
    })
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.addSource).toHaveBeenCalledTimes(3)
    expect(mapInstance.addLayer).toHaveBeenCalledTimes(6)
  })

  it('adds boundary source and layers with correct data when style is loaded', async () => {
    createMapElement(validGeojson)
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.addSource).toHaveBeenCalledWith('boundary', {
      type: 'geojson',
      data: validGeojson
    })
    expect(mapInstance.addLayer).toHaveBeenCalledTimes(2)
    expect(mapInstance.fitBounds).toHaveBeenCalledWith(
      [
        [-1.5, 52.0],
        [-1.4, 52.1]
      ],
      { padding: 40, maxZoom: 15 }
    )
  })

  it('waits for style.load when style is not yet loaded', async () => {
    createMapElement(validGeojson)
    const mapInstance = createMockMapInstance(false)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.addSource).not.toHaveBeenCalled()
    expect(mapInstance.once).toHaveBeenCalledWith(
      'style.load',
      expect.any(Function)
    )

    const styleLoadCallback = mapInstance.once.mock.calls[0][1]
    styleLoadCallback()

    expect(mapInstance.addSource).toHaveBeenCalledWith(
      'boundary',
      expect.objectContaining({ type: 'geojson' })
    )
  })

  it('skips adding layers if boundary source already exists', async () => {
    createMapElement(validGeojson)
    const mapInstance = createMockMapInstance(true)
    mapInstance.getSource.mockReturnValue({})
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.addSource).not.toHaveBeenCalled()
    expect(mapInstance.addLayer).not.toHaveBeenCalled()
  })

  it('handles geojson without features array (single geometry)', async () => {
    const singleGeometry = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-1.5, 52.0] },
      properties: {}
    }
    createMapElement(singleGeometry)
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.fitBounds).toHaveBeenCalledWith(
      [
        [-1.5, 52.0],
        [-1.5, 52.0]
      ],
      { padding: 40, maxZoom: 15 }
    )
  })

  it('handles nested coordinate arrays (MultiPolygon)', async () => {
    const multiPolygon = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [-2.0, 51.0],
                  [-1.0, 51.0],
                  [-1.0, 53.0],
                  [-2.0, 53.0],
                  [-2.0, 51.0]
                ]
              ]
            ]
          },
          properties: {}
        }
      ]
    }
    createMapElement(multiPolygon)
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.fitBounds).toHaveBeenCalledWith(
      [
        [-2.0, 51.0],
        [-1.0, 53.0]
      ],
      { padding: 40, maxZoom: 15 }
    )
  })

  it('handles empty features array without calling fitBounds', async () => {
    const emptyGeojson = { type: 'FeatureCollection', features: [] }
    createMapElement(emptyGeojson)
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.fitBounds).not.toHaveBeenCalled()
  })

  it('registers an error handler on the map instance', async () => {
    createMapElement(validGeojson)
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    const errorCall = mapInstance.on.mock.calls.find((c) => c[0] === 'error')
    expect(errorCall).toBeTruthy()

    // Trigger the error handler with an error object
    errorCall[1]({ error: new Error('tile load failed') })
    expect(warnSpy).toHaveBeenCalledWith(
      'Boundary map error',
      expect.any(Error)
    )
  })

  it('error handler falls back to the event itself when err.error is missing', async () => {
    createMapElement(validGeojson)
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    const errorCall = mapInstance.on.mock.calls.find((c) => c[0] === 'error')
    const errEvent = { message: 'something went wrong' }
    errorCall[1](errEvent)
    expect(warnSpy).toHaveBeenCalledWith('Boundary map error', errEvent)
  })

  it('adds fill and line layers with correct paint properties', async () => {
    createMapElement(validGeojson)
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.addLayer).toHaveBeenCalledWith({
      id: 'boundary-fill',
      type: 'fill',
      source: 'boundary',
      paint: {
        'fill-color': '#d4351c',
        'fill-opacity': 0.1
      }
    })
    expect(mapInstance.addLayer).toHaveBeenCalledWith({
      id: 'boundary-line',
      type: 'line',
      source: 'boundary',
      paint: {
        'line-color': '#d4351c',
        'line-width': 3
      }
    })
  })

  it('passes maplibreProvider return value to InteractiveMap', async () => {
    createMapElement(validGeojson)
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    const providerResult = { provider: 'maplibre' }
    mockDefra.maplibreProvider.mockReturnValue(providerResult)
    globalThis.defra = mockDefra

    await loadModule()

    expect(mockDefra._mock).toHaveBeenCalledWith(
      'boundary-map',
      expect.objectContaining({
        mapProvider: providerResult
      })
    )
  })

  it('includes current year in map attribution', async () => {
    createMapElement(validGeojson)
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()

    const year = new Date().getFullYear()
    expect(mockDefra._mock).toHaveBeenCalledWith(
      'boundary-map',
      expect.objectContaining({
        mapStyle: expect.objectContaining({
          attribution: expect.stringContaining(String(year))
        })
      })
    )
  })

  it('computes bounds across multiple features', async () => {
    const multiFeature = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-3.0, 50.0],
                [-2.0, 50.0],
                [-2.0, 51.0],
                [-3.0, 51.0],
                [-3.0, 50.0]
              ]
            ]
          },
          properties: {}
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0.0, 53.0]
          },
          properties: {}
        }
      ]
    }
    createMapElement(multiFeature)
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.fitBounds).toHaveBeenCalledWith(
      [
        [-3.0, 50.0],
        [0.0, 53.0]
      ],
      { maxZoom: 15, padding: 40 }
    )
  })

  it('handles bare geometry object without features or geometry wrapper', async () => {
    const bareGeometry = {
      type: 'Polygon',
      coordinates: [
        [
          [-1.0, 51.0],
          [-0.5, 51.0],
          [-0.5, 51.5],
          [-1.0, 51.5],
          [-1.0, 51.0]
        ]
      ]
    }
    createMapElement(bareGeometry)
    const mapInstance = createMockMapInstance(true)
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.fitBounds).toHaveBeenCalledWith(
      [
        [-1.0, 51.0],
        [-0.5, 51.5]
      ],
      { maxZoom: 15, padding: 40 }
    )
  })
})
