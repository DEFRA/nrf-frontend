import {
  BOUNDARY_ACTION_SAVE,
  BOUNDARY_INFO_PANEL_ID,
  BOUNDS_DECIMAL_PLACES,
  BOUNDS_MAX_X_INDEX,
  BOUNDS_MAX_Y_INDEX,
  BOUNDS_MIN_X_INDEX,
  BOUNDS_MIN_Y_INDEX,
  DRAW_EVENT_CREATED,
  NOT_AVAILABLE_TEXT
} from './constants.js'

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
          <dd class="govuk-summary-list__value govuk-!-font-size-16" data-boundary-info-bounds>${NOT_AVAILABLE_TEXT}</dd>
        </div>
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key govuk-!-font-size-16">Intersections</dt>
          <dd class="govuk-summary-list__value govuk-!-font-size-16" data-boundary-info-intersections>${NOT_AVAILABLE_TEXT}</dd>
        </div>
      </dl>
      <button class="govuk-button govuk-!-margin-bottom-0" data-boundary-action="${BOUNDARY_ACTION_SAVE}" type="button" hidden>Save & Continue</button>
    </div>
  `
}

function formatBounds(bounds) {
  if (!Array.isArray(bounds) || bounds.length !== 4) {
    return NOT_AVAILABLE_TEXT
  }

  return bounds
    .map((value) => Number(value).toFixed(BOUNDS_DECIMAL_PLACES))
    .join(', ')
}

function formatIntersectionItem(item) {
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
}

function formatIntersections(intersections) {
  if (!Array.isArray(intersections)) {
    return [NOT_AVAILABLE_TEXT]
  }

  if (!intersections.length) {
    return ['None']
  }

  return intersections.map(formatIntersectionItem)
}

function renderIntersections(container, intersections) {
  const formatted = formatIntersections(intersections)

  if (
    formatted.length === 1 &&
    [NOT_AVAILABLE_TEXT, 'None'].includes(formatted[0])
  ) {
    container.textContent = formatted[0]
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
    Math.min(a[BOUNDS_MIN_X_INDEX], b[BOUNDS_MIN_X_INDEX]),
    Math.min(a[BOUNDS_MIN_Y_INDEX], b[BOUNDS_MIN_Y_INDEX]),
    Math.max(a[BOUNDS_MAX_X_INDEX], b[BOUNDS_MAX_X_INDEX]),
    Math.max(a[BOUNDS_MAX_Y_INDEX], b[BOUNDS_MAX_Y_INDEX])
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

function resolveField(...candidates) {
  for (const candidate of candidates) {
    if (candidate !== null && candidate !== undefined) {
      return candidate
    }
  }
  return null
}

function resolveIntersectingEdps(payload, src) {
  return resolveField(
    payload?.intersectingEdps,
    src?.intersectingEdps,
    payload?.edps,
    src?.edps,
    payload?.intersections?.edps,
    src?.intersections?.edps
  )
}

function resolveGeometry(payload, src) {
  return resolveField(
    payload?.boundaryGeometryWgs84,
    src?.boundaryGeometryWgs84,
    payload?.boundaryGeometryOriginal,
    src?.boundaryGeometryOriginal,
    payload?.geometry,
    src?.geometry,
    payload?.geojson?.geometry,
    src?.geojson?.geometry
  )
}

function resolveBounds(payload, src, geometry) {
  return resolveField(
    payload?.bounds,
    src?.bounds,
    payload?.boundingBox,
    src?.boundingBox,
    payload?.bbox,
    src?.bbox,
    getBoundsFromGeoJsonValue(geometry)
  )
}

function resolveError(payload, src) {
  return resolveField(
    payload?.error,
    src?.error,
    payload?.message,
    src?.message
  )
}

function resolveIsValid(payload, src, geometry, intersectingEdps, error) {
  const explicit = resolveField(
    payload?.isValid,
    src?.isValid,
    payload?.valid,
    src?.valid,
    payload?.validation?.isValid,
    src?.validation?.isValid
  )
  const inferred =
    Boolean(geometry) && Array.isArray(intersectingEdps) && !error
  return !!(explicit ?? inferred)
}

function normalizeBoundaryInfoResponse(payload) {
  const src = payload?.geojson ?? payload ?? {}
  const intersectingEdps = resolveIntersectingEdps(payload, src)
  const geometry = resolveGeometry(payload, src)
  const error = resolveError(payload, src)

  return {
    isValid: resolveIsValid(payload, src, geometry, intersectingEdps, error),
    bounds: resolveBounds(payload, src, geometry),
    intersectingEdps,
    error,
    raw: payload
  }
}

function submitSaveAndContinue(saveAndContinueUrl, csrfToken) {
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

function getBoundaryPanelRoot(mapElementId) {
  return document.querySelector(
    `.app-boundary-info-panel[data-map-element-id="${mapElementId}"]`
  )
}

function renderBoundaryPanel(mapElementId, viewModel) {
  const {
    summary,
    loading = false,
    error,
    results,
    canContinue = false
  } = viewModel
  const panelRoot = getBoundaryPanelRoot(mapElementId)
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

function abortBoundaryRequest(state) {
  state.inFlightRequest?.abort()
  state.inFlightRequest = null
}

function buildBoundaryRequestHeaders(csrfToken) {
  return {
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
  }
}

function registerBoundaryInfoSaveHandler({
  mapElementId,
  state,
  onSaveAndContinue,
  saveAndContinueUrl,
  csrfToken
}) {
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

    submitSaveAndContinue(saveAndContinueUrl, csrfToken)
  })
}

function registerBoundaryInfoMapEvents({
  map,
  state,
  runValidation,
  mapElementId
}) {
  map.on(DRAW_EVENT_CREATED, function (feature) {
    runValidation(feature)
  })

  map.on('draw:edited', function (feature) {
    runValidation(feature)
  })

  map.on('draw:delete', function () {
    abortBoundaryRequest(state)
    state.activeFeature = null
    state.latestResponse = null
    renderBoundaryPanel(mapElementId, {
      summary: 'Draw a boundary to validate it.'
    })
    map.hidePanel?.(BOUNDARY_INFO_PANEL_ID)
  })
}

function beginBoundaryValidation({
  map,
  mapElementId,
  state,
  feature,
  endpoint
}) {
  state.activeFeature = feature
  state.latestResponse = null

  map.showPanel?.(BOUNDARY_INFO_PANEL_ID)
  renderBoundaryPanel(mapElementId, {
    summary: 'Validating boundary with backend',
    loading: true
  })

  if (!endpoint) {
    renderBoundaryPanel(mapElementId, {
      summary: 'Boundary captured. Validation endpoint is not configured yet.',
      loading: false
    })
    return false
  }

  return true
}

function renderBoundaryValidationResult({
  mapElementId,
  validationResult,
  saveAndContinueUrl,
  onSaveAndContinue
}) {
  if (!validationResult.ok) {
    renderBoundaryPanel(mapElementId, {
      summary: 'Boundary validation failed.',
      error:
        validationResult.normalized.error ||
        `Validation request failed with status ${validationResult.status}`,
      results: validationResult.normalized
    })
    return
  }

  renderBoundaryPanel(mapElementId, {
    summary: validationResult.normalized.isValid
      ? 'Boundary validation passed.'
      : 'Boundary validation failed.',
    results: validationResult.normalized,
    canContinue: Boolean(saveAndContinueUrl || onSaveAndContinue)
  })
}

function createBoundaryValidationRunner({
  map,
  mapElementId,
  state,
  endpoint,
  method,
  requestBuilder,
  responseParser,
  csrfToken,
  saveAndContinueUrl,
  onSaveAndContinue
}) {
  return async function runValidation(feature) {
    if (
      !beginBoundaryValidation({ map, mapElementId, state, feature, endpoint })
    ) {
      return
    }

    abortBoundaryRequest(state)
    const controller = new AbortController()
    state.inFlightRequest = controller

    try {
      const response = await fetch(endpoint, {
        method,
        headers: buildBoundaryRequestHeaders(csrfToken),
        body: JSON.stringify(requestBuilder(feature)),
        signal: controller.signal
      })

      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      const validationResult = {
        ok: response.ok,
        status: response.status,
        normalized: responseParser(payload)
      }

      state.latestResponse = validationResult.normalized

      renderBoundaryValidationResult({
        mapElementId,
        validationResult,
        saveAndContinueUrl,
        onSaveAndContinue
      })
    } catch (error) {
      if (error?.name === 'AbortError') {
        return
      }

      renderBoundaryPanel(mapElementId, {
        summary: 'Boundary validation could not be completed.',
        error: error?.message || 'Unexpected validation error'
      })
    } finally {
      if (state.inFlightRequest === controller) {
        state.inFlightRequest = null
      }
    }
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

  const runValidation = createBoundaryValidationRunner({
    map,
    mapElementId,
    state,
    endpoint,
    method,
    requestBuilder,
    responseParser,
    csrfToken,
    saveAndContinueUrl,
    onSaveAndContinue
  })

  registerBoundaryInfoSaveHandler({
    mapElementId,
    state,
    onSaveAndContinue,
    saveAndContinueUrl,
    csrfToken
  })
  registerBoundaryInfoMapEvents({ map, state, runValidation, mapElementId })

  renderBoundaryPanel(mapElementId, {
    summary: 'Draw a boundary to validate it.'
  })
}

export function wireBoundaryInfoControls(
  map,
  { mapElementId, boundaryInfoOptions }
) {
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
