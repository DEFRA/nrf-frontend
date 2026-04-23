import { BOUNDARY_INFO_PANEL_ID, DRAW_EVENT_CREATED } from './constants.js'
import { renderBoundaryPanel } from './boundary-info-view.js'

export function abortBoundaryRequest(state) {
  state.inFlightRequest?.abort()
  state.inFlightRequest = null
}

export function buildBoundaryRequestHeaders(csrfToken) {
  return {
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
  }
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
    summary: 'Checking boundary...',
    announce: 'Checking boundary'
  })

  if (!endpoint) {
    renderBoundaryPanel(mapElementId, {
      summary: 'Boundary captured. Validation endpoint is not configured yet.'
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
      announce: 'Boundary validation failed',
      focusHeading: true,
      error: 'An error occurred checking the boundary'
    })
    return
  }

  const { isValid, intersectingEdps } = validationResult.normalized
  const hasEdpData = Array.isArray(intersectingEdps)
  renderBoundaryPanel(mapElementId, {
    summary: isValid ? '' : 'Boundary validation failed.',
    announce: isValid
      ? 'Boundary validation passed'
      : 'Boundary validation failed',
    focusHeading: true,
    results: hasEdpData ? validationResult.normalized : null,
    canContinue: hasEdpData && Boolean(saveAndContinueUrl || onSaveAndContinue)
  })
}

export function createBoundaryValidationRunner({
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
        announce: 'Boundary validation could not be completed',
        focusHeading: true,
        error: 'An error occurred checking the boundary'
      })
    } finally {
      if (state.inFlightRequest === controller) {
        state.inFlightRequest = null
      }
    }
  }
}

export function registerBoundaryInfoMapEvents({
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
