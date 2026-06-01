import { LAYER_ACTION_TOGGLE } from './constants.js'

const ACTIVE_CLASS = 'app-area-indicator--active'

function isLayerVisible(mapElementId, sourceId) {
  const toggle = document.querySelector(
    `.app-layers-panel[data-map-element-id="${mapElementId}"] [data-layer-action="${LAYER_ACTION_TOGGLE}"][data-layer-id="${sourceId}"]`
  )
  // No toggle in DOM = single-layer config without a panel; treat as visible.
  return toggle ? toggle.checked : true
}

function findActiveLayer(layerDefinitions, mapElementId, zoom) {
  return (
    layerDefinitions.find(
      (layer) =>
        typeof layer.hideAtZoom === 'number' &&
        zoom >= layer.hideAtZoom &&
        isLayerVisible(mapElementId, layer.sourceId)
    ) || null
  )
}

function createIndicatorElement(parent, className) {
  const el = document.createElement('div')
  el.className = className
  el.hidden = true
  parent.appendChild(el)
  return el
}

/**
 * @param {import('maplibre-gl').Map} mapInstance
 * @returns {Array<[number, number]>}
 */
function getViewportCornerPoints(mapInstance) {
  const canvas = mapInstance.getCanvas?.()
  if (!canvas) {
    return []
  }
  const w = canvas.offsetWidth
  const h = canvas.offsetHeight
  return [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h]
  ]
}

/**
 * @param {import('maplibre-gl').Map} mapInstance
 * @param {string} layerId
 * @returns {boolean}
 */
function areAllCornersInsideLayer(mapInstance, layerId) {
  const points = getViewportCornerPoints(mapInstance)
  if (!points.length) {
    return false
  }
  return points.every(
    (point) =>
      mapInstance.queryRenderedFeatures?.(point, { layers: [layerId] })
        ?.length > 0
  )
}

export function wireHideLayerOnZoom({
  mapInstance,
  mapElement,
  mapElementId,
  layerDefinitions
}) {
  if (!mapInstance || !mapElement || !layerDefinitions?.length) {
    return
  }

  const border = createIndicatorElement(mapElement, 'app-area-indicator-border')
  const label = createIndicatorElement(mapElement, 'app-area-indicator-label')

  let suppressedFillLayerId = null

  const restoreFillOpacity = () => {
    if (!suppressedFillLayerId) {
      return
    }
    const previousLayer = layerDefinitions.find(
      (layer) => `${layer.sourceId}-fill` === suppressedFillLayerId
    )
    mapInstance.setPaintProperty?.(
      suppressedFillLayerId,
      'fill-opacity',
      previousLayer?.fillOpacity ?? 0
    )
    suppressedFillLayerId = null
  }

  const suppressFillOpacity = (fillLayerId) => {
    if (suppressedFillLayerId === fillLayerId) {
      return
    }
    mapInstance.setPaintProperty?.(fillLayerId, 'fill-opacity', 0)
    suppressedFillLayerId = fillLayerId
  }

  const hideIndicator = () => {
    restoreFillOpacity()
    mapElement.classList.remove(ACTIVE_CLASS)
    border.hidden = true
    label.hidden = true
  }

  const showIndicator = (active) => {
    suppressFillOpacity(`${active.sourceId}-fill`)
    border.style.borderColor = active.lineColor
    label.style.backgroundColor = active.lineColor
    label.textContent = `Area: ${active.areaLabel || active.label || active.sourceLayer || active.sourceId}`
    border.hidden = false
    label.hidden = false
    mapElement.classList.add(ACTIVE_CLASS)
  }

  const update = () => {
    const zoom = mapInstance.getZoom?.() ?? 0
    const active = findActiveLayer(layerDefinitions, mapElementId, zoom)
    const isInsideActiveLayer =
      !!active &&
      areAllCornersInsideLayer(mapInstance, `${active.sourceId}-fill`)

    if (isInsideActiveLayer) {
      showIndicator(active)
    } else {
      hideIndicator()
    }
  }

  mapInstance.on?.('zoomend', update)
  mapInstance.on?.('moveend', update)
  // Run an initial check once the map has rendered and tiles have loaded —
  // covers pre-zoomed loads where no user interaction triggers zoom/moveend.
  mapInstance.once?.('idle', update)
  document.addEventListener('change', (event) => {
    const toggle = event.target.closest(
      `.app-layers-panel[data-map-element-id="${mapElementId}"] [data-layer-action="${LAYER_ACTION_TOGGLE}"]`
    )
    if (toggle) {
      update()
    }
  })

  update()
}
