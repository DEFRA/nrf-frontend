import {
  getDefraApi,
  logWarning,
  resolveDrawPlugin,
  resolveMapStylesPlugin,
  wireMapErrorLogging
} from './helpers.js'

const VTS_STYLE_BASE_URL = '/public/data/vts'
const VTS_THUMBNAIL_BASE_URL = '/public/data/vts/thumbnails'

function toAbsoluteUrl(url, baseUrl = globalThis.location.origin) {
  if (typeof url !== 'string' || !url.startsWith('/')) {
    return url
  }

  const origin = new URL(baseUrl).origin
  return `${origin}${url}`
}

function normalizeMapStyleSource(source, baseUrl) {
  if (!source || typeof source !== 'object') {
    return source
  }

  return {
    ...source,
    url: toAbsoluteUrl(source.url, baseUrl),
    tiles: Array.isArray(source.tiles)
      ? source.tiles.map((tileUrl) => toAbsoluteUrl(tileUrl, baseUrl))
      : source.tiles
  }
}

function normalizeMapStyle(style, baseUrl = globalThis.location.origin) {
  if (!style || typeof style !== 'object') {
    return style
  }

  return {
    ...style,
    sprite: toAbsoluteUrl(style.sprite, baseUrl),
    glyphs: toAbsoluteUrl(style.glyphs, baseUrl),
    sources: Object.fromEntries(
      Object.entries(style.sources || {}).map(([sourceId, source]) => [
        sourceId,
        normalizeMapStyleSource(source, baseUrl)
      ])
    )
  }
}

function createMapStyleRequestHooks(baseUrl = globalThis.location.origin) {
  return {
    transformRequest(url) {
      return { url: toAbsoluteUrl(url, baseUrl) }
    },
    transformStyle(_previousStyle, nextStyle) {
      return normalizeMapStyle(nextStyle, baseUrl)
    }
  }
}

export const ENGLAND_WEST_LNG = -5.75
export const ENGLAND_SOUTH_LAT = 49.95
export const ENGLAND_EAST_LNG = 1.8
export const ENGLAND_NORTH_LAT = 55.85
export const ENGLAND_BOUNDS = [
  ENGLAND_WEST_LNG,
  ENGLAND_SOUTH_LAT,
  ENGLAND_EAST_LNG,
  ENGLAND_NORTH_LAT
]
export const DEFAULT_MAP_BOUNDS = [
  [ENGLAND_WEST_LNG, ENGLAND_SOUTH_LAT],
  [ENGLAND_EAST_LNG, ENGLAND_NORTH_LAT]
]
export const ENGLAND_MIN_ZOOM = 4
const DRAW_PANEL_ID = 'draw'
const BOUNDARY_INFO_PANEL_ID = 'boundary-info'
const LAYERS_PANEL_ID = 'layers'
const DRAW_ACTION_DRAW = 'draw'
const DRAW_ACTION_EDIT = 'edit'
const DRAW_ACTION_DELETE = 'delete'
const BOUNDARY_ACTION_SAVE = 'save'
const LAYER_ACTION_TOGGLE = 'toggle-layer'
const PENCIL_SVG =
  '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'
const LAYERS_SVG =
  '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>'

function buildDrawPanelHtml(mapElementId) {
  return `
    <div class="app-draw-panel" data-map-element-id="${mapElementId}">
      <p class="govuk-body-s govuk-!-margin-bottom-3">Manage the boundary using draw tools.</p>
      <div class="govuk-button-group govuk-!-margin-bottom-0">
        <button class="govuk-button govuk-button--secondary govuk-!-margin-bottom-0" data-draw-action="${DRAW_ACTION_DRAW}" type="button">Draw</button>
        <button class="govuk-button govuk-button--secondary govuk-!-margin-bottom-0" data-draw-action="${DRAW_ACTION_EDIT}" type="button">Edit</button>
        <button class="govuk-button govuk-button--warning govuk-!-margin-bottom-0" data-draw-action="${DRAW_ACTION_DELETE}" type="button">Delete</button>
      </div>
    </div>
  `
}

function buildBoundaryInfoPanelHtml(mapElementId) {
  return `
    <div class="app-boundary-info-panel" data-map-element-id="${mapElementId}">
      <h3 class="govuk-heading-s govuk-!-margin-bottom-2">Boundary information</h3>
      <p class="govuk-body-s govuk-!-margin-bottom-2" data-boundary-info-summary>Draw a boundary to validate it.</p>
      <p class="govuk-body-s govuk-!-margin-bottom-2" data-boundary-info-loading hidden aria-live="polite">Checking boundary...</p>
      <p class="govuk-error-message govuk-!-margin-bottom-2" data-boundary-info-error hidden></p>
      <dl class="govuk-summary-list govuk-!-margin-bottom-3" data-boundary-info-results hidden>
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key govuk-!-font-size-16">Bounds</dt>
          <dd class="govuk-summary-list__value govuk-!-font-size-16" data-boundary-info-bounds>Not available</dd>
        </div>
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key govuk-!-font-size-16">Intersections</dt>
          <dd class="govuk-summary-list__value govuk-!-font-size-16" data-boundary-info-intersections>Not available</dd>
        </div>
      </dl>
      <button class="govuk-button govuk-!-margin-bottom-0" data-boundary-action="${BOUNDARY_ACTION_SAVE}" type="button" hidden>Save & Continue</button>
    </div>
  `
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
        Math.max((defaultPaint.fillOpacity ?? 0.08) * 4, 0.25)
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

function resolveLayerDefinitions(layerControlOptions = {}) {
  const mapLayerPaint = (layer) => ({
    fillColor: layer.fillColor || '#00703c',
    fillOpacity: layer.fillOpacity ?? 0.08,
    lineColor: layer.lineColor || '#00703c',
    lineWidth: layer.lineWidth ?? 2
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
        mapLayerPaint({ ...layer, ...(paint || {}) })
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

function formatBounds(bounds) {
  if (!Array.isArray(bounds) || bounds.length !== 4) {
    return 'Not available'
  }

  return bounds.map((value) => Number(value).toFixed(6)).join(', ')
}

function formatIntersections(intersections) {
  if (!Array.isArray(intersections)) {
    return 'Not available'
  }

  if (!intersections.length) {
    return 'None'
  }

  return intersections.map((item) => {
    if (typeof item === 'string') {
      return item
    }

    if (!item || typeof item !== 'object') {
      return String(item)
    }

    const name = item.name ?? item.label
    const code = item.code ?? item.id

    if (name && code) {
      return `${name} (${code})`
    }

    if (name) {
      return String(name)
    }

    if (code) {
      return String(code)
    }

    return JSON.stringify(item)
  })
}

function renderIntersections(container, intersections) {
  const formatted = formatIntersections(intersections)

  if (!Array.isArray(formatted)) {
    container.textContent = formatted
    return
  }

  container.textContent = ''
  const list = document.createElement('ul')
  list.className =
    'govuk-list govuk-list--bullet govuk-!-font-size-16 govuk-!-margin-bottom-0'

  formatted.forEach((value) => {
    const item = document.createElement('li')
    item.textContent = value
    list.appendChild(item)
  })

  container.appendChild(list)
}

function collectCoordinatePairs(value, pairs = []) {
  if (!Array.isArray(value)) {
    return pairs
  }

  if (
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  ) {
    pairs.push(value)
    return pairs
  }

  value.forEach((item) => collectCoordinatePairs(item, pairs))
  return pairs
}

function getBoundsFromGeometry(geometry) {
  const coordinatePairs = collectCoordinatePairs(geometry?.coordinates)
  if (!coordinatePairs.length) {
    return null
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  coordinatePairs.forEach(([x, y]) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  })

  return [minX, minY, maxX, maxY]
}

function mergeBounds(a, b) {
  if (!a) {
    return b || null
  }
  if (!b) {
    return a
  }

  return [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.max(a[2], b[2]),
    Math.max(a[3], b[3])
  ]
}

function getBoundsFromGeoJsonValue(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  if (value.type === 'FeatureCollection' && Array.isArray(value.features)) {
    return value.features.reduce(
      (bounds, feature) =>
        mergeBounds(bounds, getBoundsFromGeoJsonValue(feature)),
      null
    )
  }

  if (value.type === 'Feature') {
    return getBoundsFromGeoJsonValue(value.geometry)
  }

  return getBoundsFromGeometry(value)
}

function normalizeBoundaryInfoResponse(payload) {
  const sourcePayload = payload?.geojson ?? payload ?? {}

  const intersectingEdps =
    payload?.intersectingEdps ??
    sourcePayload?.intersectingEdps ??
    payload?.edps ??
    sourcePayload?.edps ??
    payload?.intersections?.edps ??
    sourcePayload?.intersections?.edps ??
    null

  const geometry =
    payload?.boundaryGeometryWgs84 ??
    sourcePayload?.boundaryGeometryWgs84 ??
    payload?.boundaryGeometryOriginal ??
    sourcePayload?.boundaryGeometryOriginal ??
    payload?.geometry ??
    sourcePayload?.geometry ??
    payload?.geojson?.geometry ??
    sourcePayload?.geojson?.geometry ??
    null

  const error =
    payload?.error ??
    sourcePayload?.error ??
    payload?.message ??
    sourcePayload?.message ??
    null

  const explicitIsValid =
    payload?.isValid ??
    sourcePayload?.isValid ??
    payload?.valid ??
    sourcePayload?.valid ??
    payload?.validation?.isValid ??
    sourcePayload?.validation?.isValid

  const inferredIsValid =
    Boolean(geometry) && Array.isArray(intersectingEdps) && !error

  const isValid = explicitIsValid ?? inferredIsValid

  return {
    isValid: !!isValid,
    bounds:
      payload?.bounds ??
      sourcePayload?.bounds ??
      payload?.boundingBox ??
      sourcePayload?.boundingBox ??
      payload?.bbox ??
      sourcePayload?.bbox ??
      getBoundsFromGeoJsonValue(geometry),
    intersectingEdps,
    error,
    raw: payload
  }
}

function wireBoundaryInfoPanel(
  map,
  { mapElementId, boundaryInfoOptions = {} }
) {
  const state = {
    activeFeature: null,
    latestResponse: null,
    inFlightRequest: null
  }

  const {
    endpoint,
    method = 'POST',
    requestBuilder = (feature) => ({ geojson: feature }),
    responseParser = normalizeBoundaryInfoResponse,
    csrfToken,
    saveAndContinueUrl,
    onSaveAndContinue
  } = boundaryInfoOptions

  const submitSaveAndContinue = () => {
    if (!saveAndContinueUrl) {
      return
    }

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = saveAndContinueUrl
    form.style.display = 'none'

    if (csrfToken) {
      const tokenInput = document.createElement('input')
      tokenInput.type = 'hidden'
      tokenInput.name = 'csrfToken'
      tokenInput.value = csrfToken
      form.appendChild(tokenInput)
    }

    document.body.appendChild(form)
    form.submit()
  }

  const getPanelRoot = () =>
    document.querySelector(
      `.app-boundary-info-panel[data-map-element-id="${mapElementId}"]`
    )

  const renderPanel = ({
    summary,
    loading = false,
    error,
    results,
    canContinue = false
  }) => {
    const panelRoot = getPanelRoot()
    if (!panelRoot) {
      return
    }

    const summaryEl = panelRoot.querySelector('[data-boundary-info-summary]')
    const loadingEl = panelRoot.querySelector('[data-boundary-info-loading]')
    const errorEl = panelRoot.querySelector('[data-boundary-info-error]')
    const resultsEl = panelRoot.querySelector('[data-boundary-info-results]')
    const boundsEl = panelRoot.querySelector('[data-boundary-info-bounds]')
    const intersectionsEl = panelRoot.querySelector(
      '[data-boundary-info-intersections]'
    )
    const saveButton = panelRoot.querySelector(
      `[data-boundary-action="${BOUNDARY_ACTION_SAVE}"]`
    )

    summaryEl.textContent = summary
    loadingEl.hidden = !loading
    errorEl.hidden = !error
    errorEl.textContent = error || ''
    resultsEl.hidden = !results

    if (results) {
      boundsEl.textContent = formatBounds(results.bounds)
      renderIntersections(intersectionsEl, results.intersectingEdps)
    }

    const canShowSave = !!results?.isValid
    saveButton.hidden = !canShowSave
    saveButton.disabled = !canContinue
  }

  const abortActiveRequest = () => {
    state.inFlightRequest?.abort()
    state.inFlightRequest = null
  }

  const runValidation = async (feature) => {
    state.activeFeature = feature
    state.latestResponse = null

    map.showPanel?.(BOUNDARY_INFO_PANEL_ID)
    renderPanel({
      summary: 'Validating boundary with backend',
      loading: true
    })

    if (!endpoint) {
      renderPanel({
        summary:
          'Boundary captured. Validation endpoint is not configured yet.',
        loading: false
      })
      return
    }

    abortActiveRequest()
    const controller = new AbortController()
    state.inFlightRequest = controller

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
        },
        body: JSON.stringify(requestBuilder(feature)),
        signal: controller.signal
      })

      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      const normalized = responseParser(payload)
      state.latestResponse = normalized

      if (!response.ok) {
        renderPanel({
          summary: 'Boundary validation failed.',
          error:
            normalized.error ||
            `Validation request failed with status ${response.status}`,
          results: normalized
        })
        return
      }

      renderPanel({
        summary: normalized.isValid
          ? 'Boundary validation passed.'
          : 'Boundary validation failed.',
        results: normalized,
        canContinue: Boolean(saveAndContinueUrl || onSaveAndContinue)
      })
    } catch (error) {
      if (error?.name === 'AbortError') {
        return
      }

      renderPanel({
        summary: 'Boundary validation could not be completed.',
        error: error?.message || 'Unexpected validation error'
      })
    } finally {
      if (state.inFlightRequest === controller) {
        state.inFlightRequest = null
      }
    }
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-boundary-action]')
    if (!button) {
      return
    }

    if (
      !button.closest(
        `.app-boundary-info-panel[data-map-element-id="${mapElementId}"]`
      )
    ) {
      return
    }

    if (
      button.dataset.boundaryAction !== BOUNDARY_ACTION_SAVE ||
      button.disabled
    ) {
      return
    }

    if (typeof onSaveAndContinue === 'function') {
      onSaveAndContinue({
        feature: state.activeFeature,
        response: state.latestResponse
      })
      return
    }

    submitSaveAndContinue()
  })

  map.on('draw:created', function (feature) {
    runValidation(feature)
  })

  map.on('draw:edited', function (feature) {
    runValidation(feature)
  })

  map.on('draw:delete', function () {
    abortActiveRequest()
    state.activeFeature = null
    state.latestResponse = null
    renderPanel({ summary: 'Draw a boundary to validate it.' })
    map.hidePanel?.(BOUNDARY_INFO_PANEL_ID)
  })

  renderPanel({ summary: 'Draw a boundary to validate it.' })
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

function resolveLayerPaint(layerControlOptions, styleVariant) {
  return (
    layerControlOptions.paintByStyle?.[styleVariant] ||
    layerControlOptions.paintByStyle?.default ||
    layerControlOptions.paint || {
      fillColor: '#00703c',
      fillOpacity: 0.08,
      lineColor: '#00703c',
      lineWidth: 2
    }
  )
}

function applyVectorTileOverlayPaint(
  mapInstance,
  layerControlOptions,
  styleVariant
) {
  const { sourceId, sourceLayer } = layerControlOptions
  const { fillColor, fillOpacity, lineColor, lineWidth } = resolveLayerPaint(
    layerControlOptions,
    styleVariant
  )

  if (!mapInstance || !sourceId || !sourceLayer) {
    return
  }

  if (!mapInstance.getLayer(`${sourceId}-fill`)) {
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
  } else {
    mapInstance.setPaintProperty?.(`${sourceId}-fill`, 'fill-color', fillColor)
    mapInstance.setPaintProperty?.(
      `${sourceId}-fill`,
      'fill-opacity',
      fillOpacity
    )
  }

  if (!mapInstance.getLayer(`${sourceId}-line`)) {
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
  } else {
    mapInstance.setPaintProperty?.(`${sourceId}-line`, 'line-color', lineColor)
    mapInstance.setPaintProperty?.(`${sourceId}-line`, 'line-width', lineWidth)
  }
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
    swatch.style.opacity = String(Math.min(1, Math.max(fillOpacity * 4, 0.25)))
  })
}

function setVectorTileOverlayVisibility(
  mapInstance,
  layerControlOptions,
  visible
) {
  const { sourceId } = layerControlOptions
  const visibility = visible ? 'visible' : 'none'

  ;[`${sourceId}-fill`, `${sourceId}-line`].forEach(function (layerId) {
    if (mapInstance.getLayer?.(layerId)) {
      mapInstance.setLayoutProperty(layerId, 'visibility', visibility)
    }
  })
}

function wireLayerPanel(map, { mapElementId, layerControlOptions = {} }) {
  const layerDefinitions = resolveLayerDefinitions(layerControlOptions)
  const state = {
    visibleByLayer: Object.fromEntries(
      layerDefinitions.map((layer) => [layer.sourceId, !!layer.defaultVisible])
    ),
    mapInstance: null,
    styleVariant: 'default'
  }

  const applyVisibility = () => {
    if (!state.mapInstance) {
      return
    }

    state.styleVariant =
      typeof layerControlOptions.styleVariantResolver === 'function'
        ? layerControlOptions.styleVariantResolver(state.mapInstance)
        : inferStyleVariant(state.mapInstance)

    layerDefinitions.forEach((layer) => {
      ensureVectorTileOverlay(state.mapInstance, layer)
      applyVectorTileOverlayPaint(state.mapInstance, layer, state.styleVariant)
      setVectorTileOverlayVisibility(
        state.mapInstance,
        layer,
        !!state.visibleByLayer[layer.sourceId]
      )
    })

    updateLayerLegendSwatches({
      mapElementId,
      layerDefinitions,
      styleVariant: state.styleVariant
    })
  }

  const getToggles = () =>
    document.querySelectorAll(
      `.app-layers-panel[data-map-element-id="${mapElementId}"] [data-layer-action="${LAYER_ACTION_TOGGLE}"]`
    )

  const syncToggleState = () => {
    getToggles().forEach((toggle) => {
      const layerId = toggle.dataset.layerId
      toggle.checked = !!state.visibleByLayer[layerId]
    })
  }

  map.on('map:ready', function (event) {
    state.mapInstance = event.map
    state.mapInstance.on('styledata', function () {
      applyVisibility()
    })

    applyVisibility()
  })

  map.on('app:panelopened', function ({ panelId } = {}) {
    if (panelId !== LAYERS_PANEL_ID) {
      return
    }

    applyVisibility()
  })

  document.addEventListener('change', function (event) {
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
  })

  syncToggleState()
}

function createFeatureId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `boundary-${Date.now()}`
}

function wireDrawPanelButtons({
  map,
  drawPlugin,
  mapElementId,
  drawControlOptions = {}
}) {
  const { initialFeature } = drawControlOptions
  const drawState = { featureId: null, pendingFeatureId: null }
  let hasHydratedInitialFeature = false
  const hideDrawPanel = () => map.hidePanel?.(DRAW_PANEL_ID)
  const showDrawPanel = () => map.showPanel?.(DRAW_PANEL_ID)

  const getPanelButtons = () =>
    document.querySelectorAll(
      `.app-draw-panel[data-map-element-id="${mapElementId}"] [data-draw-action]`
    )

  const refreshButtonState = () => {
    const hasConfirmedFeature = !!drawState.featureId
    const drawBusy = !!(drawState.featureId || drawState.pendingFeatureId)
    getPanelButtons().forEach((button) => {
      const action = button.dataset.drawAction
      if (action === DRAW_ACTION_DRAW) {
        button.disabled = drawBusy
      } else if (action === DRAW_ACTION_EDIT || action === DRAW_ACTION_DELETE) {
        button.disabled = !hasConfirmedFeature
      }
    })
  }

  const runAction = (action) => {
    if (!drawPlugin) {
      logWarning('Draw plugin not available, action ignored')
      return
    }

    if (action === DRAW_ACTION_DRAW) {
      const featureId = createFeatureId()
      hideDrawPanel()
      drawPlugin.newPolygon?.(featureId)
      drawState.pendingFeatureId = featureId
      refreshButtonState()
      return
    }

    if (!drawState.featureId) {
      return
    }

    if (action === DRAW_ACTION_EDIT) {
      hideDrawPanel()
      drawPlugin.editFeature?.(drawState.featureId)
      return
    }

    if (action === DRAW_ACTION_DELETE) {
      drawPlugin.deleteFeature?.([drawState.featureId])
      drawState.featureId = null
      refreshButtonState()
    }
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-draw-action]')
    if (!button) {
      return
    }

    if (
      !button.closest(`.app-draw-panel[data-map-element-id="${mapElementId}"]`)
    ) {
      return
    }

    runAction(button.dataset.drawAction)
  })

  map.on('draw:started', function () {
    hideDrawPanel()
  })

  map.on('draw:created', function (feature) {
    drawState.featureId = feature?.id || drawState.pendingFeatureId || null
    drawState.pendingFeatureId = null
    refreshButtonState()
    showDrawPanel()
  })

  map.on('draw:edited', function (feature) {
    drawState.featureId = feature?.id || drawState.featureId
    drawState.pendingFeatureId = null
    refreshButtonState()
    showDrawPanel()
  })

  map.on('draw:updated', function (feature) {
    drawState.featureId = feature?.id || drawState.featureId
    refreshButtonState()
  })

  map.on('draw:delete', function ({ featureIds = [] } = {}) {
    if (drawState.featureId && featureIds.includes(drawState.featureId)) {
      drawState.featureId = null
    }

    if (
      drawState.pendingFeatureId &&
      featureIds.includes(drawState.pendingFeatureId)
    ) {
      drawState.pendingFeatureId = null
    }

    refreshButtonState()
  })

  map.on('draw:cancelled', function (feature) {
    drawState.featureId = feature?.id || drawState.featureId
    drawState.pendingFeatureId = null
    refreshButtonState()
    showDrawPanel()
  })

  const hydrateInitialFeature = () => {
    if (hasHydratedInitialFeature) {
      return
    }

    if (
      initialFeature?.type !== 'Feature' ||
      !initialFeature?.geometry ||
      typeof drawPlugin?.addFeature !== 'function'
    ) {
      return
    }

    const resolvedInitialFeature = {
      ...initialFeature,
      id: initialFeature.id || createFeatureId(),
      properties: initialFeature.properties || {}
    }

    drawPlugin.addFeature(resolvedInitialFeature)
    drawState.featureId = resolvedInitialFeature.id
    hasHydratedInitialFeature = true
    refreshButtonState()
    showDrawPanel()

    map.fitToBounds?.(resolvedInitialFeature)

    map.emit?.('draw:created', resolvedInitialFeature)
  }

  map.on('draw:ready', hydrateInitialFeature)

  refreshButtonState()
}

export function getStyleControlsManifest() {
  return {
    panels: [
      {
        id: 'mapStyles',
        tablet: {
          slot: 'side',
          modal: false,
          width: '400px',
          dismissable: true
        },
        desktop: {
          slot: 'left-top',
          modal: false,
          width: '400px',
          dismissable: true
        }
      }
    ],
    buttons: [
      {
        id: 'mapStyles',
        mobile: {
          slot: 'top-left',
          showLabel: false
        },
        tablet: {
          slot: 'top-left',
          showLabel: false,
          order: 1
        },
        desktop: {
          slot: 'top-left',
          showLabel: false,
          order: 1
        }
      }
    ]
  }
}

function getOrdnanceSurveyAttribution() {
  return `&copy; Crown copyright and database rights ${new Date().getFullYear()} Ordnance Survey`
}

export function getMapStyles() {
  return [
    {
      id: 'esri-tiles',
      label: 'Satellite',
      url: `${VTS_STYLE_BASE_URL}/ESRI_World_Imagery.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/esri-tiles.svg`,
      attribution: getOrdnanceSurveyAttribution()
    },
    {
      id: 'outdoor-os',
      label: 'Outdoor OS',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Outdoor.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/outdoor-os.svg`,
      attribution: getOrdnanceSurveyAttribution()
    },
    {
      id: 'dark',
      label: 'Dark',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Dark.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/dark.svg`,
      attribution: getOrdnanceSurveyAttribution()
    },
    {
      id: 'black-and-white',
      label: 'Black and white',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Black_and_White.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/black-and-white.svg`,
      attribution: getOrdnanceSurveyAttribution()
    }
  ]
}

function wireDrawControls(
  map,
  { drawPlugin, mapElementId, drawControlOptions }
) {
  map.on('app:ready', function () {
    map.addButton(DRAW_PANEL_ID, {
      label: 'Draw',
      panelId: DRAW_PANEL_ID,
      iconSvgContent: PENCIL_SVG,
      mobile: { slot: 'top-left', showLabel: false, order: 2 },
      tablet: { slot: 'top-left', showLabel: false, order: 2 },
      desktop: { slot: 'top-left', showLabel: false, order: 2 }
    })

    map.addPanel(DRAW_PANEL_ID, {
      label: 'Draw',
      html: buildDrawPanelHtml(mapElementId),
      mobile: { slot: 'bottom', modal: true, open: false },
      tablet: {
        slot: 'left-bottom',
        modal: false,
        width: '340px',
        open: false
      },
      desktop: {
        slot: 'left-bottom',
        modal: false,
        width: '340px',
        open: false
      }
    })

    wireDrawPanelButtons({
      map,
      drawPlugin,
      mapElementId,
      drawControlOptions
    })
  })
}

function wireBoundaryInfoControls(map, { mapElementId, boundaryInfoOptions }) {
  map.on('app:ready', function () {
    map.addPanel(BOUNDARY_INFO_PANEL_ID, {
      label: 'Boundary information',
      html: buildBoundaryInfoPanelHtml(mapElementId),
      mobile: { slot: 'bottom', modal: true, open: false },
      tablet: {
        slot: 'right-bottom',
        modal: false,
        width: '520px',
        open: false
      },
      desktop: {
        slot: 'right-bottom',
        modal: false,
        width: '520px',
        open: false
      }
    })

    wireBoundaryInfoPanel(map, { mapElementId, boundaryInfoOptions })
  })
}

function wireLayerControls(map, { mapElementId, layerControlOptions }) {
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

    wireLayerPanel(map, { mapElementId, layerControlOptions })
  })
}

function resolveMapConfig(mapElementId, mapOptions = {}) {
  if (typeof mapElementId === 'string') {
    return { mapElementId, options: mapOptions }
  }

  return mapElementId || {}
}

function resolveContainerHeightValue(containerHeight, mapEl) {
  if (typeof containerHeight === 'function') {
    return containerHeight(mapEl)
  }

  return containerHeight
}

function resolvePlugins({
  options = {},
  showStyleControls,
  showDrawControls,
  defraApi,
  mapStyles,
  drawPluginOptions = {}
}) {
  const plugins = [...(options.plugins || [])]

  if (showStyleControls) {
    const mapStylesPlugin = resolveMapStylesPlugin(defraApi)
    if (mapStylesPlugin) {
      plugins.push(
        mapStylesPlugin({
          mapStyles,
          manifest: getStyleControlsManifest()
        })
      )
    }
  }

  if (showDrawControls) {
    const drawPlugin = resolveDrawPlugin(defraApi)
    if (drawPlugin) {
      plugins.push(drawPlugin(drawPluginOptions))
    }
  }

  return plugins
}

function buildBaseOptions({
  defraApi,
  mapLabel,
  mapStyles,
  resolvedContainerHeight,
  plugins
}) {
  return {
    mapProvider: defraApi.maplibreProvider(),
    behaviour: 'inline',
    enableZoomControls: true,
    minZoom: ENGLAND_MIN_ZOOM,
    bounds: ENGLAND_BOUNDS,
    maxBounds: ENGLAND_BOUNDS,
    mapStyle: mapStyles[0],
    mapStyles,
    ...(mapLabel ? { mapLabel } : {}),
    ...(resolvedContainerHeight
      ? { containerHeight: resolvedContainerHeight }
      : {}),
    ...(plugins.length ? { plugins } : {}),
    ...createMapStyleRequestHooks()
  }
}

export function createMap(mapElementId, mapOptions = {}) {
  const mapConfig = resolveMapConfig(mapElementId, mapOptions)

  const {
    mapElementId: elementId,
    mapLabel,
    mapStyles = getMapStyles(),
    containerHeight,
    mapErrorMessage,
    showStyleControls = false,
    showDrawControls = false,
    showBoundaryInfoPanel = false,
    showLayerControls = false,
    drawPluginOptions,
    drawControlOptions,
    boundaryInfoOptions,
    layerControlOptions,
    options = {}
  } = mapConfig

  const mapEl = document.getElementById(elementId)
  if (!mapEl) {
    return null
  }

  const defraApi = getDefraApi()
  if (!defraApi) {
    logWarning('DEFRA interactive map dependencies not available')
    return null
  }

  const resolvedContainerHeight = resolveContainerHeightValue(
    containerHeight,
    mapEl
  )
  const plugins = resolvePlugins({
    options,
    showStyleControls,
    showDrawControls,
    defraApi,
    mapStyles,
    drawPluginOptions
  })
  const baseOptions = buildBaseOptions({
    defraApi,
    mapLabel,
    mapStyles,
    resolvedContainerHeight,
    plugins
  })

  const map = new defraApi.InteractiveMap(elementId, {
    ...baseOptions,
    ...options
  })

  if (mapErrorMessage) {
    map.on('map:ready', function (event) {
      wireMapErrorLogging(event.map, mapErrorMessage)
    })
  }

  if (showDrawControls) {
    wireDrawControls(map, {
      drawPlugin: plugins.find((plugin) => plugin.id === DRAW_PANEL_ID),
      mapElementId: elementId,
      drawControlOptions
    })
  }

  if (showBoundaryInfoPanel) {
    wireBoundaryInfoControls(map, {
      mapElementId: elementId,
      boundaryInfoOptions
    })
  }

  if (showLayerControls) {
    wireLayerControls(map, {
      mapElementId: elementId,
      layerControlOptions
    })
  }

  return map
}
