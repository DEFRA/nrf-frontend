// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

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

function createMapInstance(styleName = 'dark') {
  const styleHandlers = {}
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
    isStyleLoaded: vi.fn(() => true),
    getStyle: vi.fn(() => ({ name: styleName, sources: {} })),
    on: vi.fn((eventName, callback) => {
      styleHandlers[eventName] = callback
    }),
    _styleHandlers: styleHandlers
  }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
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
    mapInstance._styleHandlers.styledata?.()

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

    // Re-apply paint on existing layers to exercise setPaintProperty branch.
    mapInstance._styleHandlers.styledata?.()
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
    mapInstance.getStyle.mockReturnValue({ sprite: 'imagery/sprite' })
    mapInstance._styleHandlers.styledata?.()

    mapInstance.getStyle.mockReturnValue({ glyphs: 'outdoor/fonts/{font}' })
    mapInstance._styleHandlers.styledata?.()

    expect(mapInstance.setLayoutProperty).toHaveBeenCalled()
  })
})
