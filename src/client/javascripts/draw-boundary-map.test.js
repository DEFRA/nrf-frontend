// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

function createMapElement(styleUrl = '/os-base-map/resources/styles') {
  const el = document.createElement('div')
  el.id = 'draw-boundary-map'
  el.dataset.mapStyleUrl = styleUrl
  document.body.appendChild(el)
  return el
}

function createMockDefra() {
  function MockInteractiveMap() {
    return {
      on: vi.fn().mockReturnValue({}),
      addButton: vi.fn(),
      addPanel: vi.fn()
    }
  }

  MockInteractiveMap._mock = vi.fn()
  const mapStylesPlugin = vi.fn().mockReturnValue({ id: 'mapStyles' })
  const drawMLPlugin = vi.fn().mockReturnValue({ id: 'draw' })

  return {
    InteractiveMap: new Proxy(MockInteractiveMap, {
      construct(target, args) {
        MockInteractiveMap._mock(...args)
        return new MockInteractiveMap()
      }
    }),
    maplibreProvider: vi.fn().mockReturnValue({ provider: 'maplibre' }),
    mapStylesPlugin,
    drawMLPlugin,
    _mock: MockInteractiveMap._mock
  }
}

let initFn = null
const originalAddEventListener = document.addEventListener.bind(document)

describe('draw-boundary-map init', () => {
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
    await import('./draw-boundary-map.js')
    if (initFn) {
      initFn()
    }
  }

  it('does nothing when map element does not exist', async () => {
    await loadModule()
    expect(document.getElementById('draw-boundary-map')).toBeNull()
  })

  it('warns when map dependencies are unavailable', async () => {
    createMapElement()
    await loadModule()
    expect(warnSpy).toHaveBeenCalledWith(
      'DEFRA interactive map dependencies not available',
      ''
    )
  })

  it('creates an InteractiveMap with expected options', async () => {
    createMapElement('/public/data/vts/OS_VTS_3857_Outdoor.json')
    const mockDefra = createMockDefra()
    globalThis.defra = mockDefra

    await loadModule()

    expect(mockDefra.maplibreProvider).toHaveBeenCalledTimes(1)
    expect(mockDefra.mapStylesPlugin).toHaveBeenCalledTimes(1)
    expect(mockDefra.drawMLPlugin).toHaveBeenCalledTimes(1)
    expect(mockDefra.mapStylesPlugin).toHaveBeenCalledWith(
      expect.objectContaining({
        mapStyles: expect.arrayContaining([
          expect.objectContaining({
            id: 'esri-tiles',
            thumbnail: '/public/data/vts/thumbnails/esri-tiles.svg'
          }),
          expect.objectContaining({ id: 'outdoor-os' }),
          expect.objectContaining({ id: 'dark' })
        ]),
        manifest: expect.objectContaining({
          panels: expect.any(Array),
          buttons: expect.any(Array)
        })
      })
    )
    expect(mockDefra._mock).toHaveBeenCalledWith(
      'draw-boundary-map',
      expect.objectContaining({
        mapLabel: 'Draw boundary map',
        bounds: null,
        center: [1.1405503, 52.7089441],
        zoom: 8.5,
        maxBounds: [-8.75, 49.8, 2.5, 60.95],
        containerHeight: expect.stringMatching(/^\d+px$/),
        mapStyle: expect.objectContaining({
          url: '/public/data/vts/ESRI_World_Imagery.json'
        }),
        plugins: expect.arrayContaining([
          expect.objectContaining({ id: 'mapStyles' }),
          expect.objectContaining({ id: 'draw' })
        ])
      })
    )
  })

  it('warns when map styles plugin is unavailable', async () => {
    createMapElement('/public/data/vts/OS_VTS_3857_Outdoor.json')
    const mockDefra = createMockDefra()
    delete mockDefra.mapStylesPlugin
    globalThis.defra = mockDefra

    await loadModule()

    expect(warnSpy).toHaveBeenCalledWith(
      'Map styles plugin not available, using single style',
      ''
    )
  })

  it('passes cached boundary geometry to createMap as initial draw feature', async () => {
    const mapEl = createMapElement('/public/data/vts/OS_VTS_3857_Outdoor.json')
    mapEl.dataset.existingBoundaryGeojson = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [-1.2, 51.8],
          [-1.1, 51.8],
          [-1.1, 51.9],
          [-1.2, 51.8]
        ]
      ]
    })

    const createMapMock = vi.fn()
    vi.doMock('./base-map/config.js', () => ({
      createMap: createMapMock
    }))

    await import('./draw-boundary-map.js')
    initFn?.()

    expect(createMapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        drawControlOptions: {
          initialFeature: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-1.2, 51.8],
                  [-1.1, 51.8],
                  [-1.1, 51.9],
                  [-1.2, 51.8]
                ]
              ]
            },
            properties: {}
          }
        }
      })
    )
  })

  it('passes boundary validation and layer parameters from dataset values', async () => {
    const mapEl = createMapElement('/public/data/vts/OS_VTS_3857_Outdoor.json')
    mapEl.dataset.boundaryValidationUrl = '/quote/validate-boundary'
    mapEl.dataset.saveAndContinueUrl = '/quote/check-your-answers'
    mapEl.dataset.csrfToken = 'csrf-token-123'
    mapEl.dataset.impactAssessorLayers = 'edp_boundaries, lpa_boundaries'

    const createMapMock = vi.fn()
    vi.doMock('./base-map/config.js', () => ({
      createMap: createMapMock
    }))

    await import('./draw-boundary-map.js')
    initFn?.()

    expect(createMapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        boundaryInfoOptions: expect.objectContaining({
          endpoint: '/quote/validate-boundary',
          csrfToken: 'csrf-token-123',
          saveAndContinueUrl: '/quote/check-your-answers'
        }),
        layerControlOptions: {
          layers: expect.arrayContaining([
            expect.objectContaining({ sourceLayer: 'edp_boundaries' }),
            expect.objectContaining({ sourceLayer: 'lpa_boundaries' })
          ])
        }
      })
    )
  })

  it('falls back to default layers and no initial feature for invalid cached boundary JSON', async () => {
    const mapEl = createMapElement('/public/data/vts/OS_VTS_3857_Outdoor.json')
    mapEl.dataset.existingBoundaryGeojson = '{invalid-json}'

    const createMapMock = vi.fn()
    vi.doMock('./base-map/config.js', () => ({
      createMap: createMapMock
    }))

    await import('./draw-boundary-map.js')
    initFn?.()

    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to parse existing boundary GeoJSON',
      expect.any(Error)
    )
    expect(createMapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        drawControlOptions: {},
        layerControlOptions: {
          layers: expect.arrayContaining([
            expect.objectContaining({ sourceLayer: 'edp_boundaries' })
          ])
        }
      })
    )
  })

  it('normalizes a feature collection boundary to an initial draw feature', async () => {
    const mapEl = createMapElement('/public/data/vts/OS_VTS_3857_Outdoor.json')
    mapEl.dataset.existingBoundaryGeojson = JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'feature-from-collection',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-1.2, 51.8],
                [-1.1, 51.8],
                [-1.1, 51.9],
                [-1.2, 51.8]
              ]
            ]
          },
          properties: { persisted: true }
        }
      ]
    })

    const createMapMock = vi.fn()
    vi.doMock('./base-map/config.js', () => ({
      createMap: createMapMock
    }))

    await import('./draw-boundary-map.js')
    initFn?.()

    expect(createMapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        drawControlOptions: {
          initialFeature: expect.objectContaining({
            id: 'feature-from-collection',
            properties: { persisted: true }
          })
        }
      })
    )
  })

  it('uses bounds and centre from existingBoundaryMetadata when present', async () => {
    const mapEl = createMapElement('/public/data/vts/OS_VTS_3857_Outdoor.json')
    mapEl.dataset.existingBoundaryMetadata = JSON.stringify({
      bounds: {
        bottomLeft: [-1.2, 51.8],
        topRight: [-1.1, 51.9]
      },
      centre: [-1.15, 51.85]
    })

    const createMapMock = vi.fn()
    vi.doMock('./base-map/config.js', () => ({
      createMap: createMapMock
    }))

    await import('./draw-boundary-map.js')
    initFn?.()

    expect(createMapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          bounds: [-1.2, 51.8, -1.1, 51.9],
          center: [-1.15, 51.85]
        })
      })
    )
  })

  it('falls back to null bounds and default center when metadata has no bounds or centre', async () => {
    const mapEl = createMapElement('/public/data/vts/OS_VTS_3857_Outdoor.json')
    mapEl.dataset.existingBoundaryMetadata = JSON.stringify({})

    const createMapMock = vi.fn()
    vi.doMock('./base-map/config.js', () => ({
      createMap: createMapMock
    }))

    await import('./draw-boundary-map.js')
    initFn?.()

    expect(createMapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          bounds: null,
          center: [1.1405503, 52.7089441]
        })
      })
    )
  })

  it('warns and falls back when existingBoundaryMetadata is invalid JSON', async () => {
    const mapEl = createMapElement('/public/data/vts/OS_VTS_3857_Outdoor.json')
    mapEl.dataset.existingBoundaryMetadata = '{invalid-json}'

    const createMapMock = vi.fn()
    vi.doMock('./base-map/config.js', () => ({
      createMap: createMapMock
    }))

    await import('./draw-boundary-map.js')
    initFn?.()

    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to parse existing boundary metadata',
      expect.any(Error)
    )
    expect(createMapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          bounds: null,
          center: [1.1405503, 52.7089441]
        })
      })
    )
  })
})
