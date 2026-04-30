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

  const update = () => {
    const zoom = mapInstance.getZoom?.() ?? 0
    const active = findActiveLayer(layerDefinitions, mapElementId, zoom)

    if (!active) {
      mapElement.classList.remove(ACTIVE_CLASS)
      border.hidden = true
      label.hidden = true
      return
    }

    border.style.borderColor = active.lineColor
    label.style.backgroundColor = active.lineColor
    label.textContent = `Area: ${active.areaLabel || active.label || active.sourceLayer || active.sourceId}`
    border.hidden = false
    label.hidden = false
    mapElement.classList.add(ACTIVE_CLASS)
  }

  mapInstance.on?.('zoomend', update)
  mapInstance.on?.('moveend', update)
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
