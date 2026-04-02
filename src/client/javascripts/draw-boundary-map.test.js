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

  return {
    InteractiveMap: new Proxy(MockInteractiveMap, {
      construct(target, args) {
        MockInteractiveMap._mock(...args)
        return new MockInteractiveMap()
      }
    }),
    maplibreProvider: vi.fn().mockReturnValue({ provider: 'maplibre' }),
    mapStylesPlugin,
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
        bounds: [-8.75, 49.8, 2.1, 60.95],
        maxBounds: [-8.75, 49.8, 2.1, 60.95],
        containerHeight: expect.stringMatching(/^\d+px$/),
        mapStyle: expect.objectContaining({
          url: '/public/data/vts/ESRI_World_Imagery.json'
        }),
        plugins: [expect.objectContaining({ id: 'mapStyles' })]
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
})
