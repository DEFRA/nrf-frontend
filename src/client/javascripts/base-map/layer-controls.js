import {
  DEFAULT_LAYER_FILL_OPACITY,
  DEFAULT_LAYER_LINE_WIDTH,
  LAYERS_PANEL_ID,
  LAYERS_SVG,
  LAYER_ACTION_TOGGLE,
  LEGEND_MIN_OPACITY,
  LEGEND_OPACITY_MULTIPLIER
} from './constants.js'
import { runWhenMapStyleReady } from './helpers.js'

const layerPanelToggleHandlers = new Map()
const STYLE_REFRESH_MAX_ATTEMPTS = 20
const STYLE_REFRESH_DELAY_MS = 150

function resolveLayerDefinitions(layerControlOptions = {}) {
  const mergeLayerPaint = (layer, paint) =>
    paint ? { ...layer, ...paint } : { ...layer }

  const mapLayerPaint = (layer) => ({
    fillColor: layer.fillColor || '#00703c',
    fillOpacity: layer.fillOpacity ?? DEFAULT_LAYER_FILL_OPACITY,
    lineColor: layer.lineColor || '#00703c',
    lineWidth: layer.lineWidth ?? DEFAULT_LAYER_LINE_WIDTH
  })

  const mapLayerDefinition = (layer) => ({
    sourceId: layer.sourceId,
    sourceLayer: layer.sourceLayer,
    tilesUrl: layer.tilesUrl,
    label: layer.label || layer.sourceLayer || layer.sourceId,
    paint: mapLayerPaint(layer),
    paintByStyle: Object.fromEntries(
      Object.entries(layer.paintByStyle || {}).map(([styleVariant, paint]) => [
        styleVariant,
        mapLayerPaint(mergeLayerPaint(layer, paint))
      ])
    ),
    defaultVisible: !!layer.defaultVisible
  })

  if (Array.isArray(layerControlOptions.layers)) {
    return layerControlOptions.layers
      .filter(
        (layer) => layer?.sourceId && layer?.sourceLayer && layer?.tilesUrl
      )
      .map(mapLayerDefinition)
  }

  if (
    layerControlOptions.sourceId &&
    layerControlOptions.sourceLayer &&
    layerControlOptions.tilesUrl
  ) {
    return [mapLayerDefinition(layerControlOptions)]
  }

  return []
}

function resolveLayerPaint(layerControlOptions, styleVariant) {
  return (
    layerControlOptions.paintByStyle?.[styleVariant] ||
    layerControlOptions.paintByStyle?.default ||
    layerControlOptions.paint || {
      fillColor: '#00703c',
      fillOpacity: DEFAULT_LAYER_FILL_OPACITY,
      lineColor: '#00703c',
      lineWidth: DEFAULT_LAYER_LINE_WIDTH
    }
  )
}

function buildLayersPanelHtml(mapElementId, layerControlOptions = {}) {
  const layerDefinitions = resolveLayerDefinitions(layerControlOptions)
  if (!layerDefinitions.length) {
    return `
      <div class="app-layers-panel" data-map-element-id="${mapElementId}">
        <p class="govuk-body-s govuk-!-margin-bottom-0">No layers are configured.</p>
      </div>
    `
  }

  const itemsHtml = layerDefinitions
    .map((layer) => {
      const checkboxId = `${mapElementId}-${layer.sourceId}-toggle`
      const defaultPaint = resolveLayerPaint(layer, 'default')
      const swatchOpacity = Math.min(
        1,
        Math.max(
          (defaultPaint.fillOpacity ?? DEFAULT_LAYER_FILL_OPACITY) *
            LEGEND_OPACITY_MULTIPLIER,
          LEGEND_MIN_OPACITY
        )
      )
      return `
        <div class="govuk-checkboxes__item">
          <input class="govuk-checkboxes__input" id="${checkboxId}" data-layer-action="${LAYER_ACTION_TOGGLE}" data-layer-id="${layer.sourceId}" type="checkbox" ${layer.defaultVisible ? 'checked' : ''}>
          <label class="govuk-label govuk-checkboxes__label" for="${checkboxId}">
            <span class="app-layer-legend-swatch" aria-hidden="true" data-layer-legend-swatch data-layer-id="${layer.sourceId}" style="border-color:${defaultPaint.lineColor};background-color:${defaultPaint.fillColor};opacity:${swatchOpacity};"></span>${layer.label}
          </label>
        </div>
      `
    })
    .join('')

  return `
    <div class="app-layers-panel" data-map-element-id="${mapElementId}">
      <div class="govuk-checkboxes govuk-checkboxes--small">
        ${itemsHtml}
      </div>
    </div>
  `
}

function ensureVectorTileOverlay(mapInstance, layerControlOptions) {
  const { sourceId, sourceLayer, tilesUrl } = layerControlOptions

  if (!mapInstance || !tilesUrl || !sourceId || !sourceLayer) {
    return
  }

  if (!mapInstance.getSource(sourceId)) {
    mapInstance.addSource(sourceId, {
      type: 'vector',
      tiles: [tilesUrl]
    })
  }
}

function inferStyleVariant(mapInstance) {
  const style = mapInstance?.getStyle?.() || {}
  const candidateText = [
    style?.name,
    style?.sprite,
    style?.glyphs,
    ...Object.values(style?.sources || {}).map((source) => source?.url)
  ]
    .filter((value) => typeof value === 'string' && value.length)
    .join(' ')
    .toLowerCase()

  if (candidateText.includes('black_and_white')) {
    return 'black-and-white'
  }

  if (candidateText.includes('dark')) {
    return 'dark'
  }

  if (candidateText.includes('outdoor')) {
    return 'outdoor-os'
  }

  if (candidateText.includes('imagery') || candidateText.includes('esri')) {
    return 'esri-tiles'
  }

  return 'default'
}

function applyVectorTileOverlayPaint(
  mapInstance,
  layerControlOptions,
  styleVariant,
  shouldUpdatePaint = true
) {
  const { sourceId, sourceLayer } = layerControlOptions
  const { fillColor, fillOpacity, lineColor, lineWidth } = resolveLayerPaint(
    layerControlOptions,
    styleVariant
  )

  if (!mapInstance || !sourceId || !sourceLayer) {
    return false
  }

  let addedLayer = false

  if (mapInstance.getLayer(`${sourceId}-fill`)) {
    if (shouldUpdatePaint) {
      mapInstance.setPaintProperty?.(
        `${sourceId}-fill`,
        'fill-color',
        fillColor
      )
      mapInstance.setPaintProperty?.(
        `${sourceId}-fill`,
        'fill-opacity',
        fillOpacity
      )
    }
  } else {
    mapInstance.addLayer({
      id: `${sourceId}-fill`,
      type: 'fill',
      source: sourceId,
      'source-layer': sourceLayer,
      paint: {
        'fill-color': fillColor,
        'fill-opacity': fillOpacity
      }
    })
    addedLayer = true
  }

  if (mapInstance.getLayer(`${sourceId}-line`)) {
    if (shouldUpdatePaint) {
      mapInstance.setPaintProperty?.(
        `${sourceId}-line`,
        'line-color',
        lineColor
      )
      mapInstance.setPaintProperty?.(
        `${sourceId}-line`,
        'line-width',
        lineWidth
      )
    }
  } else {
    mapInstance.addLayer({
      id: `${sourceId}-line`,
      type: 'line',
      source: sourceId,
      'source-layer': sourceLayer,
      paint: {
        'line-color': lineColor,
        'line-width': lineWidth
      }
    })
    addedLayer = true
  }

  return addedLayer
}

function updateLayerLegendSwatches({
  mapElementId,
  layerDefinitions,
  styleVariant
}) {
  const panelRoot = document.querySelector(
    `.app-layers-panel[data-map-element-id="${mapElementId}"]`
  )

  if (!panelRoot) {
    return
  }

  layerDefinitions.forEach((layer) => {
    const swatch = panelRoot.querySelector(
      `[data-layer-legend-swatch][data-layer-id="${layer.sourceId}"]`
    )
    if (!swatch) {
      return
    }

    const { fillColor, fillOpacity, lineColor } = resolveLayerPaint(
      layer,
      styleVariant
    )

    swatch.style.display = 'inline-block'
    swatch.style.width = '0.9rem'
    swatch.style.height = '0.9rem'
    swatch.style.borderStyle = 'solid'
    swatch.style.borderWidth = '2px'
    swatch.style.marginRight = '0.45rem'
    swatch.style.verticalAlign = 'text-bottom'
    swatch.style.borderColor = lineColor
    swatch.style.backgroundColor = fillColor
    swatch.style.opacity = String(
      Math.min(
        1,
        Math.max(fillOpacity * LEGEND_OPACITY_MULTIPLIER, LEGEND_MIN_OPACITY)
      )
    )
  })
}

function setVectorTileOverlayVisibility(
  mapInstance,
  layerControlOptions,
  visible,
  shouldUpdateVisibility = true
) {
  const { sourceId } = layerControlOptions
  const visibility = visible ? 'visible' : 'none'

  if (!shouldUpdateVisibility) {
    return
  }

  ;[`${sourceId}-fill`, `${sourceId}-line`].forEach(function (layerId) {
    if (mapInstance.getLayer?.(layerId)) {
      mapInstance.setLayoutProperty(layerId, 'visibility', visibility)
    }
  })
}

function resolveLayerPanelStyleVariant(layerControlOptions, mapInstance) {
  return typeof layerControlOptions.styleVariantResolver === 'function'
    ? layerControlOptions.styleVariantResolver(mapInstance)
    : inferStyleVariant(mapInstance)
}

function getLayerPanelToggles(mapElementId) {
  return document.querySelectorAll(
    `.app-layers-panel[data-map-element-id="${mapElementId}"] [data-layer-action="${LAYER_ACTION_TOGGLE}"]`
  )
}

function syncLayerToggleState(mapElementId, visibleByLayer) {
  getLayerPanelToggles(mapElementId).forEach((toggle) => {
    const layerId = toggle.dataset.layerId
    toggle.checked = !!visibleByLayer[layerId]
  })
}

function registerLayerPanelToggleHandler({
  mapElementId,
  state,
  applyVisibility
}) {
  const existingHandler = layerPanelToggleHandlers.get(mapElementId)
  if (existingHandler) {
    document.removeEventListener('change', existingHandler)
  }

  const handleChange = function (event) {
    const toggle = event.target.closest('[data-layer-action]')
    if (!toggle) {
      return
    }

    if (
      !toggle.closest(
        `.app-layers-panel[data-map-element-id="${mapElementId}"]`
      )
    ) {
      return
    }

    const layerId = toggle.dataset.layerId
    if (!layerId || !Object.hasOwn(state.visibleByLayer, layerId)) {
      return
    }

    state.visibleByLayer[layerId] = toggle.checked
    applyVisibility()
  }

  document.addEventListener('change', handleChange)
  layerPanelToggleHandlers.set(mapElementId, handleChange)
}

function applyLayerVisibility({
  state,
  layerControlOptions,
  layerDefinitions,
  mapElementId
}) {
  if (!state.mapInstance) {
    return
  }

  if (!state.mapInstance.isStyleLoaded?.()) {
    return
  }

  state.styleVariant = resolveLayerPanelStyleVariant(
    layerControlOptions,
    state.mapInstance
  )
  const shouldUpdatePaint = state.lastAppliedStyleVariant !== state.styleVariant

  layerDefinitions.forEach((layer) => {
    ensureVectorTileOverlay(state.mapInstance, layer)
    const visible = !!state.visibleByLayer[layer.sourceId]
    const addedLayer = applyVectorTileOverlayPaint(
      state.mapInstance,
      layer,
      state.styleVariant,
      shouldUpdatePaint
    )
    setVectorTileOverlayVisibility(
      state.mapInstance,
      layer,
      visible,
      addedLayer ||
        state.lastAppliedVisibilityByLayer[layer.sourceId] !== visible
    )
    state.lastAppliedVisibilityByLayer[layer.sourceId] = visible
  })

  if (shouldUpdatePaint) {
    updateLayerLegendSwatches({
      mapElementId,
      layerDefinitions,
      styleVariant: state.styleVariant
    })
  }

  state.lastAppliedStyleVariant = state.styleVariant
}

function createStyleRefreshScheduler(applyVisibility) {
  let pendingStyleRefresh = null

  const cancel = () => {
    if (pendingStyleRefresh) {
      clearTimeout(pendingStyleRefresh)
      pendingStyleRefresh = null
    }
  }

  const schedule = (attempt = 1) => {
    cancel()
    pendingStyleRefresh = setTimeout(
      function () {
        pendingStyleRefresh = null
        applyVisibility()

        if (attempt < STYLE_REFRESH_MAX_ATTEMPTS) {
          schedule(attempt + 1)
        }
      },
      attempt === 1 ? 0 : STYLE_REFRESH_DELAY_MS
    )
  }

  return { schedule, cancel }
}

function wireLayerPanel(map, { mapElementId, layerControlOptions = {} }) {
  const layerDefinitions = resolveLayerDefinitions(layerControlOptions)
  const state = {
    visibleByLayer: Object.fromEntries(
      layerDefinitions.map((layer) => [layer.sourceId, !!layer.defaultVisible])
    ),
    mapInstance: null,
    styleVariant: 'default',
    lastAppliedStyleVariant: null,
    lastAppliedVisibilityByLayer: {}
  }

  const resetAppliedState = () => {
    state.lastAppliedStyleVariant = null
    state.lastAppliedVisibilityByLayer = {}
  }

  const applyVisibility = () =>
    applyLayerVisibility({
      state,
      layerControlOptions,
      layerDefinitions,
      mapElementId
    })

  const styleRefresh = createStyleRefreshScheduler(applyVisibility)

  map.on('map:ready', function (event) {
    state.mapInstance = event.map
    state.mapInstance.on('style.load', function () {
      applyVisibility()
    })
    state.mapInstance.on('styledata', function () {
      applyVisibility()
    })
    runWhenMapStyleReady(state.mapInstance, applyVisibility)
  })

  map.on('map:loaded', function () {
    resetAppliedState()
    applyVisibility()
  })

  map.on('map:stylechange', function () {
    resetAppliedState()
    styleRefresh.schedule()
  })

  map.on('app:panelopened', function ({ panelId } = {}) {
    if (panelId !== LAYERS_PANEL_ID) {
      return
    }

    applyVisibility()
  })

  registerLayerPanelToggleHandler({ mapElementId, state, applyVisibility })
  syncLayerToggleState(mapElementId, state.visibleByLayer)
}

export function wireLayerControls(map, { mapElementId, layerControlOptions }) {
  wireLayerPanel(map, { mapElementId, layerControlOptions })

  map.on('app:ready', function () {
    map.addButton(LAYERS_PANEL_ID, {
      label: 'Layers',
      panelId: LAYERS_PANEL_ID,
      iconSvgContent: LAYERS_SVG,
      mobile: { slot: 'top-left', showLabel: false, order: 3 },
      tablet: { slot: 'top-left', showLabel: false, order: 3 },
      desktop: { slot: 'top-left', showLabel: false, order: 3 }
    })

    map.addPanel(LAYERS_PANEL_ID, {
      label: 'Layers',
      html: buildLayersPanelHtml(mapElementId, layerControlOptions),
      mobile: { slot: 'bottom', modal: true, open: false },
      tablet: {
        slot: 'left-top',
        modal: false,
        width: '320px',
        open: false
      },
      desktop: {
        slot: 'left-top',
        modal: false,
        width: '320px',
        open: false
      }
    })
  })
}
