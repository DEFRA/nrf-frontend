// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMockMapInstance as createMapInstance } from '../../../test-utils/create-mock-map-instance.js'
import { wireHideLayerOnZoom } from './hide-layer-on-zoom.js'

const MAP_ELEMENT_ID = 'test-map'

function createMapElement() {
  const el = document.createElement('div')
  el.id = MAP_ELEMENT_ID
  document.body.appendChild(el)
  return el
}

function createLayersPanel(layers) {
  const panel = document.createElement('div')
  panel.className = 'app-layers-panel'
  panel.dataset.mapElementId = MAP_ELEMENT_ID

  layers.forEach(({ sourceId, checked }) => {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.dataset.layerAction = 'toggle-layer'
    input.dataset.layerId = sourceId
    input.checked = checked
    panel.appendChild(input)
  })

  document.body.appendChild(panel)
  return panel
}

const edpLayer = {
  sourceId: 'edp_boundaries-tiles',
  sourceLayer: 'edp_boundaries',
  label: 'EDP boundaries',
  areaLabel: 'Nature Restoration Fund nutrients levy',
  lineColor: '#FD0',
  fillOpacity: 0.15,
  hideAtZoom: 12
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('wireHideLayerOnZoom', () => {
  it('does nothing when required arguments are missing', () => {
    const mapInstance = createMapInstance()

    wireHideLayerOnZoom({
      mapInstance,
      mapElement: null,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer]
    })
    wireHideLayerOnZoom({
      mapInstance,
      mapElement: createMapElement(),
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: []
    })

    expect(mapInstance.on).not.toHaveBeenCalled()
  })

  it('appends a border and label element to the map container', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance()

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer]
    })

    expect(
      mapElement.querySelector('.app-area-indicator-border')
    ).not.toBeNull()
    expect(mapElement.querySelector('.app-area-indicator-label')).not.toBeNull()
  })

  it('hides the indicator when zoom is below the layer threshold', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance({ zoom: 11.9 })
    createLayersPanel([{ sourceId: edpLayer.sourceId, checked: true }])

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer]
    })

    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      false
    )
    expect(mapElement.querySelector('.app-area-indicator-border').hidden).toBe(
      true
    )
    expect(mapElement.querySelector('.app-area-indicator-label').hidden).toBe(
      true
    )
  })

  it('shows the indicator with the visible layer label and colour at or above threshold', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance({
      zoom: 13,
      allCornersInsideLayer: true
    })
    createLayersPanel([{ sourceId: edpLayer.sourceId, checked: true }])

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer]
    })

    const border = mapElement.querySelector('.app-area-indicator-border')
    const label = mapElement.querySelector('.app-area-indicator-label')

    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      true
    )
    expect(border.hidden).toBe(false)
    expect(label.hidden).toBe(false)
    expect(label.textContent).toBe(
      'Area: Nature Restoration Fund nutrients levy'
    )
    expect(border.style.borderColor).toBe('rgb(255, 221, 0)')
    expect(label.style.backgroundColor).toBe('rgb(255, 221, 0)')
  })

  it('hides the indicator when the layer is toggled off via the layer-controls panel', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance({
      zoom: 13,
      allCornersInsideLayer: true
    })
    const panel = createLayersPanel([
      { sourceId: edpLayer.sourceId, checked: true }
    ])

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer]
    })

    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      true
    )

    const toggle = panel.querySelector(`[data-layer-id="${edpLayer.sourceId}"]`)
    toggle.checked = false
    toggle.dispatchEvent(new Event('change', { bubbles: true }))

    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      false
    )
  })

  it('updates the indicator on map zoomend', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance({
      zoom: 11.9,
      allCornersInsideLayer: true
    })
    createLayersPanel([{ sourceId: edpLayer.sourceId, checked: true }])

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer]
    })

    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      false
    )

    mapInstance.getZoom.mockReturnValue(13)
    mapInstance._handlers.zoomend?.()

    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      true
    )
  })

  it('picks the first visible layer when multiple have hideAtZoom thresholds', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance({
      zoom: 13,
      allCornersInsideLayer: true
    })
    const lpaLayer = {
      sourceId: 'lpa_boundaries-tiles',
      sourceLayer: 'lpa_boundaries',
      label: 'LPA boundaries',
      lineColor: '#1d70b8',
      hideAtZoom: 12
    }
    createLayersPanel([
      { sourceId: edpLayer.sourceId, checked: false },
      { sourceId: lpaLayer.sourceId, checked: true }
    ])

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer, lpaLayer]
    })

    expect(
      mapElement.querySelector('.app-area-indicator-label').textContent
    ).toBe('Area: LPA boundaries')
  })

  it('treats a layer as visible when no panel toggle exists for it', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance({
      zoom: 13,
      allCornersInsideLayer: true
    })
    // No panel created.

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer]
    })

    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      true
    )
  })

  it('ignores layer definitions without a hideAtZoom threshold', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance({ zoom: 22 })
    const layerWithoutThreshold = { ...edpLayer, hideAtZoom: undefined }
    createLayersPanel([{ sourceId: edpLayer.sourceId, checked: true }])

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [layerWithoutThreshold]
    })

    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      false
    )
  })

  it('runs an initial check on the map idle event, covering pre-zoomed loads with no user interaction', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance({
      zoom: 13,
      allCornersInsideLayer: false
    })
    createLayersPanel([{ sourceId: edpLayer.sourceId, checked: true }])

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer]
    })

    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      false
    )

    // Tiles finish loading after the initial sync update — corners now inside.
    mapInstance.queryRenderedFeatures.mockReturnValue([{ type: 'Feature' }])
    mapInstance._handlers.idle?.()

    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      true
    )
  })

  it('hides the indicator when above the zoom threshold but the viewport corners are not all inside the layer', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance({
      zoom: 13,
      allCornersInsideLayer: false
    })
    createLayersPanel([{ sourceId: edpLayer.sourceId, checked: true }])

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer]
    })

    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      false
    )
    expect(mapInstance.setPaintProperty).not.toHaveBeenCalled()
  })

  it('suppresses the layer fill once when the indicator becomes active and does not re-suppress on subsequent updates', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance({
      zoom: 13,
      allCornersInsideLayer: true
    })
    createLayersPanel([{ sourceId: edpLayer.sourceId, checked: true }])

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer]
    })

    expect(mapInstance.setPaintProperty).toHaveBeenCalledExactlyOnceWith(
      'edp_boundaries-tiles-fill',
      'fill-opacity',
      0
    )

    mapInstance._handlers.moveend?.()

    expect(mapInstance.setPaintProperty).toHaveBeenCalledTimes(1)
  })

  it('restores the layer fill when the viewport moves outside the layer', () => {
    const mapElement = createMapElement()
    const mapInstance = createMapInstance({
      zoom: 13,
      allCornersInsideLayer: true
    })
    createLayersPanel([{ sourceId: edpLayer.sourceId, checked: true }])

    wireHideLayerOnZoom({
      mapInstance,
      mapElement,
      mapElementId: MAP_ELEMENT_ID,
      layerDefinitions: [edpLayer]
    })

    mapInstance.queryRenderedFeatures.mockReturnValue([])
    mapInstance._handlers.moveend?.()

    expect(mapInstance.setPaintProperty).toHaveBeenLastCalledWith(
      'edp_boundaries-tiles-fill',
      'fill-opacity',
      0.15
    )
    expect(mapElement.classList.contains('app-area-indicator--active')).toBe(
      false
    )
  })
})
