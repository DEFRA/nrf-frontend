import {
  PANEL_ROOT_ID,
  SAVE_ACTION,
  buildPanelHtml,
  renderPanel,
  setSaveButtonDisabled
} from './boundary-info-panel.js'
import { postJson } from './post-json.js'
import { stopTileLoading } from './stop-tile-loading.js'
import { ALL_LAYER_IDS } from '../../shared-helpers/datasets.js'

const PANEL_ID = 'boundaryInfo'
// Client-only reason: the check request never got a response (network
// failure, timeout, etc), so there's no backend failureReason to report.
const CHECK_REQUEST_ERROR_REASON = 'boundary_check_request_error'

/**
 * @param {{ status: 'success'|'fail', failureReason?: string }} params
 */
function pushBoundaryValidationEvent({ status, failureReason }) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'rlb_boundary_validation',
    rlb_option: 'draw',
    rlb_status: status,
    ...(status === 'fail' && { rlb_failure_reason: failureReason })
  })
}
// The library's own Done button ('drawDone' -> 'im-c-map-button--draw-done')
// re-derives its disabled state from the plugin's vertex count each render,
// so toggling it via interactiveMap.toggleButtonState gets immediately
// reverted. Blocking the click in the capture phase (before it reaches the
// library's own bubble-phase handler) and dimming it via a body class is the
// only way to hold it disabled for the duration of an in-flight check.
const DONE_BUTTON_SELECTOR = '.im-c-map-button--draw-done'
const CHECKING_BODY_CLASS = 'app-draw-boundary-checking'

/**
 * @param {{ saveAndContinueUrl: string, csrfToken: string, state: object }} params
 */
async function submitSaveAndContinue({ saveAndContinueUrl, csrfToken, state }) {
  if (!saveAndContinueUrl || !state.latestPayload) {
    return
  }

  setSaveButtonDisabled(true)

  let response
  try {
    ;({ response } = await postJson(
      saveAndContinueUrl,
      { boundaryGeojson: state.latestPayload },
      { csrfToken, parseJson: false }
    ))
  } catch {
    setSaveButtonDisabled(false)
    return
  }

  if (response.redirected) {
    // Navigation is guaranteed from here, so it's safe to abort any tile
    // requests still in flight from panning/zooming while drawing — they'd
    // otherwise keep competing for the same-origin connection pool that the
    // destination page's own requests need.
    stopTileLoading(state.mapInstance, ALL_LAYER_IDS)
    window.location.assign(response.url)
    return
  }

  setSaveButtonDisabled(false)
}

/**
 * @param {object} interactiveMap
 * @param {{ checkUrl: string, csrfToken: string, state: object }} params
 * @param {object} feature
 */
async function runBoundaryCheck(
  interactiveMap,
  { checkUrl, csrfToken, state },
  feature
) {
  if (state.checkInFlight) {
    return
  }
  state.checkInFlight = true
  document.body.classList.add(CHECKING_BODY_CLASS)

  state.latestPayload = null
  interactiveMap.showPanel(PANEL_ID)
  renderPanel({ summary: 'Checking boundary...' })

  try {
    const { response, payload } = await postJson(
      checkUrl,
      { geometry: feature?.geometry },
      { csrfToken }
    )

    if (!response.ok) {
      pushBoundaryValidationEvent({
        status: 'fail',
        failureReason: payload?.failureReason || CHECK_REQUEST_ERROR_REASON
      })
      renderPanel({
        error: payload?.error || 'An error occurred checking the boundary'
      })
      return
    }

    state.latestPayload = payload
    pushBoundaryValidationEvent({ status: 'success' })
    renderPanel({ results: payload })
  } catch {
    pushBoundaryValidationEvent({
      status: 'fail',
      failureReason: CHECK_REQUEST_ERROR_REASON
    })
    renderPanel({
      error: 'An error occurred checking the boundary'
    })
  } finally {
    state.checkInFlight = false
    document.body.classList.remove(CHECKING_BODY_CLASS)
  }
}

/**
 * @param {object} interactiveMap
 */
function onDrawModeStarted(interactiveMap) {
  setSaveButtonDisabled(true)
  interactiveMap.hidePanel(PANEL_ID)
}

/**
 * @param {object} interactiveMap
 */
function addBoundaryInfoPanel(interactiveMap) {
  interactiveMap.addPanel(PANEL_ID, {
    label: 'Boundary information',
    focus: false,
    html: buildPanelHtml(),
    // The library's own heading (used for the panel's aria-labelledby) is
    // kept screen-reader-only in favour of our own heading in buildPanelHtml,
    // which we can toggle visually hidden/visible per render state.
    mobile: {
      slot: 'drawer',
      modal: false,
      open: false,
      dismissible: false,
      showLabel: false
    },
    tablet: {
      slot: 'right-bottom',
      modal: false,
      width: '340px',
      open: false,
      dismissible: false,
      showLabel: false
    },
    desktop: {
      slot: 'right-bottom',
      modal: false,
      width: '340px',
      open: false,
      dismissible: false,
      showLabel: false
    }
  })
}

/**
 * @param {object} state
 * @param {MouseEvent} clickEvent
 */
function onDoneClickCapture(state, clickEvent) {
  if (!state.checkInFlight) {
    return
  }
  if (clickEvent.target.closest(DONE_BUTTON_SELECTOR)) {
    clickEvent.preventDefault()
    clickEvent.stopImmediatePropagation()
  }
}

/**
 * @param {object} state
 * @param {{ saveAndContinueUrl: string, csrfToken: string }} params
 * @param {MouseEvent} clickEvent
 */
function onSaveClick(state, { saveAndContinueUrl, csrfToken }, clickEvent) {
  const button = clickEvent.target.closest(
    `#${PANEL_ROOT_ID} [data-boundary-action="${SAVE_ACTION}"]`
  )
  if (!button || button.disabled) {
    return
  }

  submitSaveAndContinue({ saveAndContinueUrl, csrfToken, state })
}

/**
 * @param {object} interactiveMap
 * @param {object} state
 */
function onDrawCancelled(interactiveMap, state) {
  if (state.latestPayload) {
    setSaveButtonDisabled(false)
    interactiveMap.showPanel(PANEL_ID)
  }
}

/**
 * @param {object} interactiveMap
 * @param {object} state
 */
function onDrawDelete(interactiveMap, state) {
  state.latestPayload = null
  renderPanel({ summary: '' })
  interactiveMap.hidePanel(PANEL_ID)
}

/**
 * @param {object} interactiveMap
 * @param {{ checkUrl: string, csrfToken: string, saveAndContinueUrl: string }} params
 */
export function wireBoundaryInfoPanel(
  interactiveMap,
  { checkUrl, csrfToken, saveAndContinueUrl }
) {
  const state = { latestPayload: null, checkInFlight: false, mapInstance: null }
  const runCheck = (feature) =>
    runBoundaryCheck(interactiveMap, { checkUrl, csrfToken, state }, feature)

  interactiveMap.on('map:ready', (mapReadyEvent) => {
    state.mapInstance = mapReadyEvent?.map ?? null
    addBoundaryInfoPanel(interactiveMap)
  })
  document.addEventListener('click', (clickEvent) =>
    onSaveClick(state, { saveAndContinueUrl, csrfToken }, clickEvent)
  )
  document.addEventListener(
    'click',
    (clickEvent) => onDoneClickCapture(state, clickEvent),
    true
  )
  interactiveMap.on('draw:created', runCheck)
  interactiveMap.on('draw:edited', runCheck)
  interactiveMap.on('draw:started', () => onDrawModeStarted(interactiveMap))
  interactiveMap.on('draw:editstart', () => onDrawModeStarted(interactiveMap))
  interactiveMap.on('draw:cancelled', () =>
    onDrawCancelled(interactiveMap, state)
  )
  interactiveMap.on('draw:delete', () => onDrawDelete(interactiveMap, state))

  return {
    checkExistingBoundary: runCheck
  }
}
