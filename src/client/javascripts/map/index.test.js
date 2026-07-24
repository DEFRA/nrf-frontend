// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const MAP_ELEMENT_ID = 'draw-boundary-map'

function createMapElement(csrfToken = 'csrf-token') {
  const el = document.createElement('div')
  el.id = MAP_ELEMENT_ID
  el.dataset.csrfToken = csrfToken
  document.body.appendChild(el)
  return el
}

function createMockDefra() {
  const mockMap = {
    on: vi.fn(),
    toggleButtonState: vi.fn(),
    addButton: vi.fn(),
    addPanel: vi.fn(),
    fitToBounds: vi.fn()
  }

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
    searchPlugin: vi.fn().mockReturnValue({ id: 'search' }),
    _mock: MockInteractiveMap._mock,
    _mockMap: mockMap,
    _emit(eventName, ...args) {
      mockMap.on.mock.calls
        .filter((c) => c[0] === eventName)
        .forEach((c) => c[1](...args))
    }
  }
}

let initFn = null
const originalAddEventListener = document.addEventListener.bind(document)

describe('draw boundary map init', () => {
  const createDrawToolsPlugins = vi.fn()
  const wireDrawTools = vi.fn()
  const wireBoundaryInfoPanel = vi.fn()
  const wireFillOpacityOnZoom = vi.fn()
  const wireHideLayersOnDraw = vi.fn()
  const readExistingBoundary = vi.fn()
  const hydrateInitialDrawFeature = vi.fn()

  beforeEach(() => {
    document.body.innerHTML = ''
    delete globalThis.defra
    vi.resetModules()

    createDrawToolsPlugins.mockReset().mockReturnValue({
      interactPlugin: { id: 'interact' },
      drawPlugin: { id: 'draw' }
    })
    wireDrawTools.mockReset()
    wireBoundaryInfoPanel
      .mockReset()
      .mockReturnValue({ checkExistingBoundary: vi.fn() })
    wireFillOpacityOnZoom.mockReset()
    wireHideLayersOnDraw.mockReset()
    readExistingBoundary.mockReset().mockReturnValue({
      initialFeature: null,
      bounds: null,
      center: null
    })
    hydrateInitialDrawFeature.mockReset()

    vi.doMock('./styles.js', () => ({
      getMapStyles: () => [{ id: 'esri-tiles' }, { id: 'outdoor-os' }]
    }))
    vi.doMock('./map-datasets.js', () => ({
      createMapDatasetsPlugin: vi.fn().mockReturnValue({ id: 'datasets' }),
      FILL_LAYER_IDS: ['edp_boundaries'],
      ALL_LAYER_IDS: ['edp_boundaries', 'edp_boundaries-stroke']
    }))
    vi.doMock('./draw-tools.js', () => ({
      createDrawToolsPlugins,
      wireDrawTools
    }))
    vi.doMock('./boundary-info.js', () => ({ wireBoundaryInfoPanel }))
    vi.doMock('./fill-opacity-on-zoom.js', () => ({ wireFillOpacityOnZoom }))
    vi.doMock('./hide-layers-on-draw.js', () => ({ wireHideLayersOnDraw }))
    vi.doMock('./existing-boundary.js', () => ({
      readExistingBoundary,
      hydrateInitialDrawFeature
    }))

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
    await import('./index.js')
    initFn?.()
  }

  it('does nothing when the map element does not exist', async () => {
    globalThis.defra = createMockDefra()

    await loadModule()

    expect(createDrawToolsPlugins).not.toHaveBeenCalled()
  })

  it('does nothing when window.defra is unavailable', async () => {
    createMapElement()

    await loadModule()

    expect(createDrawToolsPlugins).not.toHaveBeenCalled()
  })

  it('creates the map with the expected options and wires up each feature', async () => {
    createMapElement('csrf-token-123')
    const mockDefra = createMockDefra()
    globalThis.defra = mockDefra

    await loadModule()

    expect(mockDefra._mock).toHaveBeenCalledWith(
      MAP_ELEMENT_ID,
      expect.objectContaining({
        behaviour: 'inline',
        center: [1.1405503, 52.7089441],
        zoom: 8.5,
        mapStyle: { id: 'esri-tiles' },
        containerHeight: expect.stringMatching(/^\d+px$/),
        transformRequest: expect.any(Function),
        plugins: expect.arrayContaining([
          { id: 'datasets' },
          { id: 'mapStyles' },
          { id: 'interact' },
          { id: 'draw' },
          { id: 'search' }
        ])
      })
    )

    expect(wireBoundaryInfoPanel).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        checkUrl: '/quote/draw-boundary/check',
        saveAndContinueUrl: '/quote/draw-boundary/save',
        csrfToken: 'csrf-token-123'
      })
    )
    expect(wireDrawTools).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        interactPlugin: { id: 'interact' },
        drawPlugin: { id: 'draw' },
        mapElementId: MAP_ELEMENT_ID,
        hasExistingBoundary: false
      })
    )
    expect(wireFillOpacityOnZoom).toHaveBeenCalledWith(expect.any(Object), {
      fillLayerIds: ['edp_boundaries']
    })
    expect(wireHideLayersOnDraw).toHaveBeenCalledWith(expect.any(Object), {
      layerIds: ['edp_boundaries', 'edp_boundaries-stroke']
    })
  })

  it('tells the draw tools an existing boundary was loaded', async () => {
    createMapElement()
    const mockDefra = createMockDefra()
    globalThis.defra = mockDefra
    const initialFeature = { type: 'Feature', geometry: { type: 'Polygon' } }
    readExistingBoundary.mockReturnValue({
      initialFeature,
      bounds: null,
      center: null
    })

    await loadModule()

    expect(wireDrawTools).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ hasExistingBoundary: true })
    )
  })

  it('hydrates the initial draw feature once the draw plugin is ready, not on map:ready', async () => {
    createMapElement()
    const mockDefra = createMockDefra()
    globalThis.defra = mockDefra
    const initialFeature = { type: 'Feature', geometry: { type: 'Polygon' } }
    readExistingBoundary.mockReturnValue({
      initialFeature,
      bounds: null,
      center: null
    })
    hydrateInitialDrawFeature.mockReturnValue(true)

    await loadModule()

    mockDefra._emit('map:ready')
    expect(hydrateInitialDrawFeature).not.toHaveBeenCalled()

    mockDefra._emit('draw:ready')
    expect(hydrateInitialDrawFeature).toHaveBeenCalledWith({
      drawPlugin: { id: 'draw' },
      initialFeature
    })
  })

  it('zooms the map to fit the hydrated feature', async () => {
    createMapElement()
    const mockDefra = createMockDefra()
    globalThis.defra = mockDefra
    const initialFeature = { type: 'Feature', geometry: { type: 'Polygon' } }
    readExistingBoundary.mockReturnValue({
      initialFeature,
      bounds: null,
      center: null
    })
    hydrateInitialDrawFeature.mockReturnValue(true)

    await loadModule()
    mockDefra._emit('draw:ready')

    expect(mockDefra._mockMap.fitToBounds).toHaveBeenCalledWith(initialFeature)
  })

  it('checks the hydrated boundary so the boundary information panel renders on load', async () => {
    createMapElement()
    const mockDefra = createMockDefra()
    globalThis.defra = mockDefra
    const initialFeature = { type: 'Feature', geometry: { type: 'Polygon' } }
    readExistingBoundary.mockReturnValue({
      initialFeature,
      bounds: null,
      center: null
    })
    hydrateInitialDrawFeature.mockReturnValue(true)
    const checkExistingBoundary = vi.fn()
    wireBoundaryInfoPanel.mockReturnValue({ checkExistingBoundary })

    await loadModule()
    mockDefra._emit('draw:ready')

    expect(checkExistingBoundary).toHaveBeenCalledWith(initialFeature)
  })

  it('does not check the boundary when there is no feature to hydrate', async () => {
    createMapElement()
    const mockDefra = createMockDefra()
    globalThis.defra = mockDefra
    readExistingBoundary.mockReturnValue({
      initialFeature: null,
      bounds: null,
      center: null
    })
    hydrateInitialDrawFeature.mockReturnValue(false)
    const checkExistingBoundary = vi.fn()
    wireBoundaryInfoPanel.mockReturnValue({ checkExistingBoundary })

    await loadModule()
    mockDefra._emit('draw:ready')

    expect(checkExistingBoundary).not.toHaveBeenCalled()
  })

  it('does not zoom the map when there is no feature to hydrate', async () => {
    createMapElement()
    const mockDefra = createMockDefra()
    globalThis.defra = mockDefra
    readExistingBoundary.mockReturnValue({
      initialFeature: null,
      bounds: null,
      center: null
    })
    hydrateInitialDrawFeature.mockReturnValue(false)

    await loadModule()
    mockDefra._emit('draw:ready')

    expect(mockDefra._mockMap.fitToBounds).not.toHaveBeenCalled()
  })

  it('resolves relative tile URLs to absolute URLs, leaving others untouched', async () => {
    createMapElement()
    const mockDefra = createMockDefra()
    globalThis.defra = mockDefra

    await loadModule()

    const options = mockDefra._mock.mock.calls[0][1]
    expect(options.transformRequest('/impact-assessor-map/tiles/x')).toEqual({
      url: `${window.location.origin}/impact-assessor-map/tiles/x`
    })
    expect(options.transformRequest('https://example.com/tile')).toEqual({
      url: 'https://example.com/tile'
    })
  })
})
