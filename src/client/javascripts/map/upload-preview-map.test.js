// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validGeojson } from '../../../test-utils/fixtures/boundary-map-geojson.js'

const MAP_ELEMENT_ID = 'boundary-map'

function createMapElement({
  existingBoundaryGeojson,
  existingBoundaryMetadata
} = {}) {
  const el = document.createElement('div')
  el.id = MAP_ELEMENT_ID
  if (existingBoundaryGeojson !== undefined) {
    el.dataset.existingBoundaryGeojson =
      typeof existingBoundaryGeojson === 'string'
        ? existingBoundaryGeojson
        : JSON.stringify(existingBoundaryGeojson)
  }
  if (existingBoundaryMetadata !== undefined) {
    el.dataset.existingBoundaryMetadata =
      typeof existingBoundaryMetadata === 'string'
        ? existingBoundaryMetadata
        : JSON.stringify(existingBoundaryMetadata)
  }
  document.body.appendChild(el)
  return el
}

function createMockMapInstance({ styleLoaded = true } = {}) {
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn(),
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
      construct(_target, args) {
        MockInteractiveMap._mock(...args)
        return mockMap
      }
    }),
    maplibreProvider: vi.fn().mockReturnValue({ provider: 'maplibre' }),
    mapStylesPlugin: vi.fn().mockReturnValue({ id: 'mapStyles' }),
    _mock: MockInteractiveMap._mock,
    _mockMap: mockMap,
    _triggerReady() {
      mockMap.on.mock.calls
        .filter((c) => c[0] === 'map:ready')
        .forEach((c) => c[1]({ map: mapInstance }))
    }
  }
}

let initFn = null
const originalAddEventListener = document.addEventListener.bind(document)

describe('upload preview map init', () => {
  const createMapDatasetsPlugin = vi.fn()
  const wireFillOpacityOnZoom = vi.fn()

  beforeEach(() => {
    document.body.innerHTML = ''
    delete globalThis.defra
    vi.resetModules()

    createMapDatasetsPlugin.mockReset().mockReturnValue({ id: 'datasets' })
    wireFillOpacityOnZoom.mockReset()

    vi.doMock('./styles.js', () => ({
      getMapStyles: () => [{ id: 'esri-tiles' }, { id: 'outdoor-os' }]
    }))
    vi.doMock('./map-datasets.js', () => ({
      createMapDatasetsPlugin,
      FILL_LAYER_IDS: ['edp_boundaries']
    }))
    vi.doMock('./fill-opacity-on-zoom.js', () => ({ wireFillOpacityOnZoom }))

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
    vi.restoreAllMocks()
  })

  async function loadModule() {
    await import('./upload-preview-map.js')
    initFn?.()
  }

  it('does nothing when the map element does not exist', async () => {
    globalThis.defra = createMockDefra(createMockMapInstance())

    await loadModule()

    expect(createMapDatasetsPlugin).not.toHaveBeenCalled()
  })

  it('does nothing when window.defra is unavailable', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })

    await loadModule()

    expect(createMapDatasetsPlugin).not.toHaveBeenCalled()
  })

  it('does nothing when defra.InteractiveMap is missing', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    globalThis.defra = { maplibreProvider: vi.fn() }

    await loadModule()

    expect(createMapDatasetsPlugin).not.toHaveBeenCalled()
  })

  it('does nothing when defra.maplibreProvider is missing', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    globalThis.defra = { InteractiveMap: vi.fn() }

    await loadModule()

    expect(createMapDatasetsPlugin).not.toHaveBeenCalled()
  })

  it('creates the map with zoom controls and the datasets and map styles plugins', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mockDefra = createMockDefra(createMockMapInstance())
    globalThis.defra = mockDefra

    await loadModule()

    expect(mockDefra._mock).toHaveBeenCalledWith(
      MAP_ELEMENT_ID,
      expect.objectContaining({
        behaviour: 'inline',
        mapLabel: 'Red line boundary',
        mapStyle: { id: 'esri-tiles' },
        center: [1.1405503, 52.7089441],
        bounds: null,
        containerHeight: '400px',
        enableZoomControls: true,
        transformRequest: expect.any(Function),
        plugins: [{ id: 'datasets' }, { id: 'mapStyles' }]
      })
    )
    expect(mockDefra.mapStylesPlugin).toHaveBeenCalledWith({
      mapStyles: [{ id: 'esri-tiles' }, { id: 'outdoor-os' }]
    })
  })

  it('uses the centre and bounds from existing boundary metadata when present', async () => {
    createMapElement({
      existingBoundaryGeojson: validGeojson,
      existingBoundaryMetadata: {
        centre: [-1.45, 52.05],
        bounds: {
          bottomLeft: [-1.5, 52.0],
          topRight: [-1.4, 52.1]
        }
      }
    })
    const mockDefra = createMockDefra(createMockMapInstance())
    globalThis.defra = mockDefra

    await loadModule()

    expect(mockDefra._mock).toHaveBeenCalledWith(
      MAP_ELEMENT_ID,
      expect.objectContaining({
        center: [-1.45, 52.05],
        bounds: [-1.5, 52.0, -1.4, 52.1]
      })
    )
  })

  it('adds the boundary source and layers when the map is ready', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mapInstance = createMockMapInstance()
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.addSource).toHaveBeenCalledWith('boundary', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: validGeojson.features[0].geometry,
        properties: {}
      }
    })
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

  it('waits for the style to finish loading before adding the boundary source', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mapInstance = createMockMapInstance({ styleLoaded: false })
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.addSource).not.toHaveBeenCalled()
    expect(mapInstance.once).toHaveBeenCalledWith(
      'styledata',
      expect.any(Function)
    )

    mapInstance.isStyleLoaded.mockReturnValue(true)
    mapInstance.once.mock.calls[0][1]()

    expect(mapInstance.addSource).toHaveBeenCalledWith(
      'boundary',
      expect.objectContaining({ type: 'geojson' })
    )
  })

  it('re-checks after every styledata event until the style is actually loaded', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mapInstance = createMockMapInstance({ styleLoaded: false })
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.once).toHaveBeenCalledTimes(1)

    // Style still isn't loaded after the first 'styledata' — should re-subscribe
    mapInstance.once.mock.calls[0][1]()
    expect(mapInstance.addSource).not.toHaveBeenCalled()
    expect(mapInstance.once).toHaveBeenCalledTimes(2)

    // Now the style has finished loading
    mapInstance.isStyleLoaded.mockReturnValue(true)
    mapInstance.once.mock.calls[1][1]()

    expect(mapInstance.addSource).toHaveBeenCalledWith(
      'boundary',
      expect.objectContaining({ type: 'geojson' })
    )
  })

  it('suppresses map tile errors', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mapInstance = createMockMapInstance()
    const mockDefra = createMockDefra(mapInstance)
    globalThis.defra = mockDefra

    await loadModule()
    mockDefra._triggerReady()

    const errorCall = mapInstance.on.mock.calls.find((c) => c[0] === 'error')
    expect(errorCall).toBeTruthy()
    expect(() =>
      errorCall[1]({ error: new Error('tile load failed') })
    ).not.toThrow()
  })

  it('wires fill opacity on zoom with the EDP fill layer ids', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    globalThis.defra = createMockDefra(createMockMapInstance())

    await loadModule()

    expect(wireFillOpacityOnZoom).toHaveBeenCalledWith(expect.any(Object), {
      fillLayerIds: ['edp_boundaries']
    })
  })
})
