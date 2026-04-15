// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'

import { wireLayerControls } from './layer-controls.js'

function createMapHarness() {
  const handlers = {}
  const map = {
    on: vi.fn((eventName, callback) => {
      handlers[eventName] = callback
    }),
    addButton: vi.fn(),
    addPanel: vi.fn()
  }

  return { map, handlers }
}

function createMapInstance(styleName = 'dark', isStyleLoaded = true) {
  const styleHandlers = {}
  const onceHandlers = {}
  const sources = new Set()
  const layers = new Set()

  return {
    getSource: vi.fn((sourceId) => (sources.has(sourceId) ? {} : null)),
    addSource: vi.fn((sourceId) => {
      sources.add(sourceId)
    }),
    getLayer: vi.fn((layerId) => layers.has(layerId)),
    addLayer: vi.fn((layerDef) => {
      layers.add(layerDef.id)
    }),
    setPaintProperty: vi.fn(),
    setLayoutProperty: vi.fn(),
    isStyleLoaded: vi.fn(() => isStyleLoaded),
    getStyle: vi.fn(() => ({ name: styleName, sources: {} })),
    on: vi.fn((eventName, callback) => {
      styleHandlers[eventName] = callback
    }),
    once: vi.fn((eventName, callback) => {
      onceHandlers[eventName] = callback
    }),
    _styleHandlers: styleHandlers,
    _onceHandlers: onceHandlers
  }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.useRealTimers()
})

describe('layer-controls', () => {
  it('renders no-layers message when configuration is empty', () => {
    const { map, handlers } = createMapHarness()

    wireLayerControls(map, {
      mapElementId: 'map-no-layers',
      layerControlOptions: {}
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]

    expect(panelConfig.html).toContain('No layers are configured')
  })

  it('wires overlays, style updates, and toggle interactions for configured layers', () => {
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('dark')

    const layerControlOptions = {
      layers: [
        {
          sourceId: 'edp_boundaries-tiles',
          sourceLayer: 'edp_boundaries',
          tilesUrl: '/impact-assessor-map/tiles/edp_boundaries/{z}/{x}/{y}.mvt',
          label: 'EDP',
          defaultVisible: true,
          fillColor: '#00703c',
          lineColor: '#00703c',
          fillOpacity: 0.08,
          paintByStyle: {
            dark: {
              fillColor: '#9ddfa6',
              lineColor: '#9ddfa6',
              fillOpacity: 0.2
            }
          }
        },
        {
          sourceId: 'lpa_boundaries-tiles',
          sourceLayer: 'lpa_boundaries',
          tilesUrl: '/impact-assessor-map/tiles/lpa_boundaries/{z}/{x}/{y}.mvt',
          label: 'LPA',
          defaultVisible: false,
          fillColor: '#1d70b8',
          lineColor: '#1d70b8',
          fillOpacity: 0.08
        }
      ]
    }

    wireLayerControls(map, {
      mapElementId: 'map-layers',
      layerControlOptions
    })

    handlers['app:ready']?.()

    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['map:ready']?.({ map: mapInstance })

    expect(mapInstance.addSource).toHaveBeenCalledWith(
      'edp_boundaries-tiles',
      expect.objectContaining({
        type: 'vector',
        tiles: ['/impact-assessor-map/tiles/edp_boundaries/{z}/{x}/{y}.mvt']
      })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'edp_boundaries-tiles-fill' })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'edp_boundaries-tiles-line' })
    )

    handlers['app:panelopened']?.({ panelId: 'something-else' })
    handlers['app:panelopened']?.({ panelId: 'layers' })
    mapInstance._styleHandlers['style.load']?.()

    const edpToggle = document.querySelector(
      '.app-layers-panel[data-map-element-id="map-layers"] [data-layer-id="edp_boundaries-tiles"]'
    )
    const lpaToggle = document.querySelector(
      '.app-layers-panel[data-map-element-id="map-layers"] [data-layer-id="lpa_boundaries-tiles"]'
    )

    expect(edpToggle.checked).toBe(true)
    expect(lpaToggle.checked).toBe(false)

    edpToggle.checked = false
    edpToggle.dispatchEvent(new Event('change', { bubbles: true }))

    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'edp_boundaries-tiles-fill',
      'visibility',
      'none'
    )
    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'edp_boundaries-tiles-line',
      'visibility',
      'none'
    )

    lpaToggle.checked = true
    lpaToggle.dispatchEvent(new Event('change', { bubbles: true }))

    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'lpa_boundaries-tiles-fill',
      'visibility',
      'visible'
    )
    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'lpa_boundaries-tiles-line',
      'visibility',
      'visible'
    )
  })

  it('uses custom style variant resolver and supports single-layer config shape', () => {
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('outdoor-os')

    wireLayerControls(map, {
      mapElementId: 'map-single-layer',
      layerControlOptions: {
        sourceId: 'single-tiles',
        sourceLayer: 'single_layer',
        tilesUrl: '/impact-assessor-map/tiles/single_layer/{z}/{x}/{y}.mvt',
        paintByStyle: {
          custom: {
            fillColor: '#123456',
            lineColor: '#654321',
            fillOpacity: 0.5,
            lineWidth: 4
          }
        },
        styleVariantResolver: vi.fn(() => 'custom')
      }
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['map:ready']?.({ map: mapInstance })

    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'single-tiles-fill',
        paint: expect.objectContaining({ 'fill-color': '#123456' })
      })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'single-tiles-line',
        paint: expect.objectContaining({ 'line-color': '#654321' })
      })
    )
  })

  it('does not apply visibility until the map style has loaded', () => {
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('dark', false)

    wireLayerControls(map, {
      mapElementId: 'map-style-loading',
      layerControlOptions: {
        layers: [
          {
            sourceId: 'loading-tiles',
            sourceLayer: 'loading_layer',
            tilesUrl:
              '/impact-assessor-map/tiles/loading_layer/{z}/{x}/{y}.mvt',
            defaultVisible: true
          }
        ]
      }
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['map:ready']?.({ map: mapInstance })

    expect(mapInstance.addSource).not.toHaveBeenCalled()
    expect(mapInstance.addLayer).not.toHaveBeenCalled()
    expect(mapInstance.setPaintProperty).not.toHaveBeenCalled()
    expect(mapInstance.setLayoutProperty).not.toHaveBeenCalled()

    mapInstance.isStyleLoaded.mockReturnValue(true)
    mapInstance._onceHandlers['style.load']?.()

    expect(mapInstance.addSource).toHaveBeenCalledWith(
      'loading-tiles',
      expect.objectContaining({
        type: 'vector',
        tiles: ['/impact-assessor-map/tiles/loading_layer/{z}/{x}/{y}.mvt']
      })
    )
    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'loading-tiles-fill',
      'visibility',
      'visible'
    )
    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'loading-tiles-line',
      'visibility',
      'visible'
    )
  })

  it('does not try to reapply overlays when a layer is toggled during style reload', () => {
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('dark', false)

    wireLayerControls(map, {
      mapElementId: 'map-toggle-while-loading',
      layerControlOptions: {
        layers: [
          {
            sourceId: 'toggle-loading-tiles',
            sourceLayer: 'toggle_loading_layer',
            tilesUrl:
              '/impact-assessor-map/tiles/toggle_loading_layer/{z}/{x}/{y}.mvt',
            defaultVisible: true
          }
        ]
      }
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['map:ready']?.({ map: mapInstance })

    const toggle = document.querySelector(
      '.app-layers-panel[data-map-element-id="map-toggle-while-loading"] [data-layer-id="toggle-loading-tiles"]'
    )

    toggle.checked = false
    toggle.dispatchEvent(new Event('change', { bubbles: true }))

    expect(mapInstance.addSource).not.toHaveBeenCalled()
    expect(mapInstance.addLayer).not.toHaveBeenCalled()
    expect(mapInstance.setLayoutProperty).not.toHaveBeenCalled()

    mapInstance.isStyleLoaded.mockReturnValue(true)
    mapInstance._onceHandlers['style.load']?.()

    expect(mapInstance.addSource).toHaveBeenCalledWith(
      'toggle-loading-tiles',
      expect.objectContaining({
        type: 'vector',
        tiles: [
          '/impact-assessor-map/tiles/toggle_loading_layer/{z}/{x}/{y}.mvt'
        ]
      })
    )
    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'toggle-loading-tiles-fill',
      'visibility',
      'none'
    )
    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'toggle-loading-tiles-line',
      'visibility',
      'none'
    )
  })

  it('replaces an existing toggle listener when controls are wired again for the same map element', () => {
    const first = createMapHarness()
    const second = createMapHarness()
    const firstMapInstance = createMapInstance('dark')
    const secondMapInstance = createMapInstance('dark')
    const layerControlOptions = {
      layers: [
        {
          sourceId: 'shared-tiles',
          sourceLayer: 'shared_layer',
          tilesUrl: '/impact-assessor-map/tiles/shared_layer/{z}/{x}/{y}.mvt',
          defaultVisible: true
        }
      ]
    }

    wireLayerControls(first.map, {
      mapElementId: 'shared-map',
      layerControlOptions
    })
    wireLayerControls(second.map, {
      mapElementId: 'shared-map',
      layerControlOptions
    })

    first.handlers['app:ready']?.()
    second.handlers['app:ready']?.()

    const panelConfig = second.map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    first.handlers['map:ready']?.({ map: firstMapInstance })
    second.handlers['map:ready']?.({ map: secondMapInstance })

    const firstCallsBeforeToggle =
      firstMapInstance.setLayoutProperty.mock.calls.length
    const secondCallsBeforeToggle =
      secondMapInstance.setLayoutProperty.mock.calls.length

    const toggle = document.querySelector(
      '.app-layers-panel[data-map-element-id="shared-map"] [data-layer-id="shared-tiles"]'
    )
    toggle.checked = false
    toggle.dispatchEvent(new Event('change', { bubbles: true }))

    expect(firstMapInstance.setLayoutProperty.mock.calls.length).toBe(
      firstCallsBeforeToggle
    )
    expect(secondMapInstance.setLayoutProperty.mock.calls.length).toBe(
      secondCallsBeforeToggle + 2
    )
    expect(secondMapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'shared-tiles-fill',
      'visibility',
      'none'
    )
    expect(secondMapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'shared-tiles-line',
      'visibility',
      'none'
    )
  })

  it('skips redundant paint and visibility updates when styledata fires without changes', () => {
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('dark')

    wireLayerControls(map, {
      mapElementId: 'map-noop-styledata',
      layerControlOptions: {
        layers: [
          {
            sourceId: 'noop-tiles',
            sourceLayer: 'noop_layer',
            tilesUrl: '/impact-assessor-map/tiles/noop_layer/{z}/{x}/{y}.mvt',
            defaultVisible: true,
            paintByStyle: {
              dark: {
                fillColor: '#9ddfa6',
                lineColor: '#9ddfa6',
                fillOpacity: 0.2
              }
            }
          }
        ]
      }
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['map:ready']?.({ map: mapInstance })

    mapInstance.addSource.mockClear()
    mapInstance.addLayer.mockClear()
    mapInstance.setPaintProperty.mockClear()
    mapInstance.setLayoutProperty.mockClear()

    mapInstance._styleHandlers.styledata?.()

    expect(mapInstance.addSource).not.toHaveBeenCalled()
    expect(mapInstance.addLayer).not.toHaveBeenCalled()
    expect(mapInstance.setPaintProperty).not.toHaveBeenCalled()
    expect(mapInstance.setLayoutProperty).not.toHaveBeenCalled()
  })

  it('renders overlays on first load even when map:ready fires before app:ready', () => {
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('dark')

    wireLayerControls(map, {
      mapElementId: 'map-ready-before-app-ready',
      layerControlOptions: {
        layers: [
          {
            sourceId: 'early-tiles',
            sourceLayer: 'early_layer',
            tilesUrl: '/impact-assessor-map/tiles/early_layer/{z}/{x}/{y}.mvt',
            defaultVisible: true
          }
        ]
      }
    })

    handlers['map:ready']?.({ map: mapInstance })
    handlers['app:ready']?.()

    expect(mapInstance.addSource).toHaveBeenCalledWith(
      'early-tiles',
      expect.objectContaining({
        type: 'vector',
        tiles: ['/impact-assessor-map/tiles/early_layer/{z}/{x}/{y}.mvt']
      })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'early-tiles-fill' })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'early-tiles-line' })
    )
  })

  it('renders overlays when the style becomes ready via styledata after map:ready', () => {
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('dark', false)

    wireLayerControls(map, {
      mapElementId: 'map-styledata-ready',
      layerControlOptions: {
        layers: [
          {
            sourceId: 'styledata-tiles',
            sourceLayer: 'styledata_layer',
            tilesUrl:
              '/impact-assessor-map/tiles/styledata_layer/{z}/{x}/{y}.mvt',
            defaultVisible: true
          }
        ]
      }
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['map:ready']?.({ map: mapInstance })

    expect(mapInstance.addSource).not.toHaveBeenCalled()

    mapInstance.isStyleLoaded.mockReturnValue(true)
    mapInstance._styleHandlers.styledata?.()

    expect(mapInstance.addSource).toHaveBeenCalledWith(
      'styledata-tiles',
      expect.objectContaining({
        type: 'vector',
        tiles: ['/impact-assessor-map/tiles/styledata_layer/{z}/{x}/{y}.mvt']
      })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'styledata-tiles-fill' })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'styledata-tiles-line' })
    )
  })

  it('renders overlays when map:loaded fires after map:ready', () => {
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('dark', false)

    wireLayerControls(map, {
      mapElementId: 'map-loaded-ready',
      layerControlOptions: {
        layers: [
          {
            sourceId: 'loaded-tiles',
            sourceLayer: 'loaded_layer',
            tilesUrl: '/impact-assessor-map/tiles/loaded_layer/{z}/{x}/{y}.mvt',
            defaultVisible: true
          }
        ]
      }
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['map:ready']?.({ map: mapInstance })
    expect(mapInstance.addSource).not.toHaveBeenCalled()

    mapInstance.isStyleLoaded.mockReturnValue(true)
    handlers['map:loaded']?.()

    expect(mapInstance.addSource).toHaveBeenCalledWith(
      'loaded-tiles',
      expect.objectContaining({
        type: 'vector',
        tiles: ['/impact-assessor-map/tiles/loaded_layer/{z}/{x}/{y}.mvt']
      })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'loaded-tiles-fill' })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'loaded-tiles-line' })
    )
  })

  it('forces a full overlay reapply when the base map style changes', () => {
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('dark')

    wireLayerControls(map, {
      mapElementId: 'map-style-change-reapply',
      layerControlOptions: {
        layers: [
          {
            sourceId: 'style-change-tiles',
            sourceLayer: 'style_change_layer',
            tilesUrl:
              '/impact-assessor-map/tiles/style_change_layer/{z}/{x}/{y}.mvt',
            defaultVisible: true,
            paintByStyle: {
              dark: {
                fillColor: '#9ddfa6',
                lineColor: '#9ddfa6',
                fillOpacity: 0.2
              }
            }
          }
        ]
      }
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['map:ready']?.({ map: mapInstance })

    mapInstance.setPaintProperty.mockClear()
    mapInstance.setLayoutProperty.mockClear()

    mapInstance._styleHandlers['style.load']?.()

    expect(mapInstance.setPaintProperty).toHaveBeenCalledWith(
      'style-change-tiles-fill',
      'fill-color',
      '#9ddfa6'
    )
    expect(mapInstance.setPaintProperty).toHaveBeenCalledWith(
      'style-change-tiles-line',
      'line-color',
      '#9ddfa6'
    )
    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'style-change-tiles-fill',
      'visibility',
      'visible'
    )
    expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
      'style-change-tiles-line',
      'visibility',
      'visible'
    )
  })

  it('reapplies overlays after style change on the next task when stale layers disappear', async () => {
    vi.useFakeTimers()
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('dark')
    let staleOverlayLayers = false

    mapInstance.getLayer.mockImplementation((layerId) => {
      if (
        staleOverlayLayers &&
        (layerId === 'deferred-tiles-fill' || layerId === 'deferred-tiles-line')
      ) {
        return {}
      }

      return null
    })

    wireLayerControls(map, {
      mapElementId: 'map-style-change-deferred',
      layerControlOptions: {
        layers: [
          {
            sourceId: 'deferred-tiles',
            sourceLayer: 'deferred_layer',
            tilesUrl:
              '/impact-assessor-map/tiles/deferred_layer/{z}/{x}/{y}.mvt',
            defaultVisible: true
          }
        ]
      }
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['map:ready']?.({ map: mapInstance })

    mapInstance.addLayer.mockClear()
    staleOverlayLayers = true
    handlers['map:stylechange']?.()

    expect(mapInstance.addLayer).not.toHaveBeenCalled()

    staleOverlayLayers = false
    await vi.runAllTimersAsync()

    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'deferred-tiles-fill' })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'deferred-tiles-line' })
    )
  })

  it('keeps retrying overlay reapply for a short period after style change', async () => {
    vi.useFakeTimers()
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('dark')
    let styleSettled = false

    mapInstance.getLayer.mockImplementation((layerId) => {
      if (layerId === 'retry-tiles-fill' || layerId === 'retry-tiles-line') {
        if (!styleSettled) {
          return {}
        }

        return null
      }

      return null
    })

    wireLayerControls(map, {
      mapElementId: 'map-style-change-retry',
      layerControlOptions: {
        layers: [
          {
            sourceId: 'retry-tiles',
            sourceLayer: 'retry_layer',
            tilesUrl: '/impact-assessor-map/tiles/retry_layer/{z}/{x}/{y}.mvt',
            defaultVisible: true
          }
        ]
      }
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['map:ready']?.({ map: mapInstance })

    mapInstance.addLayer.mockClear()
    handlers['map:stylechange']?.()
    setTimeout(() => {
      styleSettled = true
    }, 0)

    await vi.runAllTimersAsync()

    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'retry-tiles-fill' })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'retry-tiles-line' })
    )
  })

  it('infers style variants from map style metadata and ignores unknown toggles', () => {
    const { map, handlers } = createMapHarness()
    const mapInstance = createMapInstance('OS black_and_white')

    wireLayerControls(map, {
      mapElementId: 'map-style-inference',
      layerControlOptions: {
        layers: [
          {
            sourceId: 'inferred-tiles',
            sourceLayer: 'inferred_layer',
            tilesUrl:
              '/impact-assessor-map/tiles/inferred_layer/{z}/{x}/{y}.mvt',
            defaultVisible: true,
            paintByStyle: {
              'black-and-white': {
                fillColor: '#111111',
                lineColor: '#222222',
                fillOpacity: 0.4,
                lineWidth: 3
              },
              'esri-tiles': {
                fillColor: '#aaaaaa',
                lineColor: '#bbbbbb',
                fillOpacity: 0.3,
                lineWidth: 2
              },
              'outdoor-os': {
                fillColor: '#0f0f0f',
                lineColor: '#f0f0f0',
                fillOpacity: 0.2,
                lineWidth: 1
              }
            }
          }
        ]
      }
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['app:panelopened']?.({ panelId: 'layers' })
    handlers['map:ready']?.({ map: mapInstance })

    // Switch style to exercise setPaintProperty on existing layers.
    mapInstance.getStyle.mockReturnValue({ sprite: 'imagery/sprite' })
    mapInstance._styleHandlers['style.load']?.()
    expect(mapInstance.setPaintProperty).toHaveBeenCalled()

    // Unknown toggle should be ignored.
    const rogueToggle = document.createElement('input')
    rogueToggle.dataset.layerAction = 'toggle-layer'
    rogueToggle.dataset.layerId = 'unknown-layer'
    document
      .querySelector(
        '.app-layers-panel[data-map-element-id="map-style-inference"]'
      )
      .appendChild(rogueToggle)
    rogueToggle.dispatchEvent(new Event('change', { bubbles: true }))

    // Switch styles to hit other inference branches.
    mapInstance.getStyle.mockReturnValue({ glyphs: 'outdoor/fonts/{font}' })
    mapInstance._styleHandlers['style.load']?.()

    expect(mapInstance.setLayoutProperty).toHaveBeenCalled()
  })
})
