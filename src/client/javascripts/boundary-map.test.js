// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const validGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-1.5, 52.0],
            [-1.4, 52.0],
            [-1.4, 52.1],
            [-1.5, 52.1],
            [-1.5, 52.0]
          ]
        ]
      },
      properties: {}
    }
  ]
}

function createMapElement(
  geojson,
  styleUrl = 'https://example.com/style.json'
) {
  const el = document.createElement('div')
  el.id = 'boundary-map'
  if (geojson !== undefined) {
    el.dataset.geojson =
      typeof geojson === 'string' ? geojson : JSON.stringify(geojson)
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
    once: vi.fn()
  }
}

function createMockDefra(mapInstance) {
  const mockMap = { on: vi.fn() }
  // Use a real function so it works with `new`
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

describe('boundary-map', () => {
  let warnSpy

  beforeEach(() => {
    document.body.innerHTML = ''
    delete globalThis.defra
    vi.resetModules()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Intercept addEventListener to capture the init function
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
    // Call the captured init function directly
    if (initFn) {
      initFn()
    }
  }

  it('does nothing when no map element exists', async () => {
    await loadModule()
    expect(document.getElementById('boundary-map')).toBeNull()
  })

  it('does nothing when geojson is invalid JSON', async () => {
    createMapElement('not-valid-json')
    await loadModule()
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to parse boundary GeoJSON',
      expect.any(SyntaxError)
    )
  })

  it('does nothing when geojson parses to null', async () => {
    createMapElement('null')
    await loadModule()
    expect(globalThis.defra).toBeUndefined()
  })

  it('does nothing when defra global is undefined', async () => {
    createMapElement(validGeojson)
    await loadModule()
    expect(globalThis.defra).toBeUndefined()
  })

  it('does nothing when defra.InteractiveMap is missing', async () => {
    createMapElement(validGeojson)
    globalThis.defra = { maplibreProvider: vi.fn() }
    await loadModule()
    expect(globalThis.defra.maplibreProvider).not.toHaveBeenCalled()
  })

  it('does nothing when defra.maplibreProvider is missing', async () => {
    const constructorSpy = vi.fn().mockReturnValue({})
    createMapElement(validGeojson)
    globalThis.defra = {
      InteractiveMap: constructorSpy
    }
    await loadModule()
    expect(constructorSpy).not.toHaveBeenCalled()
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

  it('adds boundary layers when style is already loaded', async () => {
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
      { padding: 40 }
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

    // Trigger the style.load callback
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
      { padding: 40 }
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
      { padding: 40 }
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
})
