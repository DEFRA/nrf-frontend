import {
  PANEL_ROOT_ID,
  SAVE_ACTION,
  buildPanelHtml,
  renderPanel,
  setSaveButtonDisabled
} from './boundary-info-panel.js'
import { postJson } from './post-json.js'

const PANEL_ID = 'boundaryInfo'

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
      renderPanel({
        error: payload?.error || 'An error occurred checking the boundary'
      })
      return
    }

    state.latestPayload = payload
    renderPanel({ results: payload })
  } catch {
    renderPanel({
      error: 'An error occurred checking the boundary'
    })
  } finally {
    state.checkInFlight = false
  }
}

function onDrawStarted() {
  setSaveButtonDisabled(true)
}

/**
 * @param {object} interactiveMap
 * @param {{ checkUrl: string, csrfToken: string, saveAndContinueUrl: string }} params
 */
export function wireBoundaryInfoPanel(
  interactiveMap,
  { checkUrl, csrfToken, saveAndContinueUrl }
) {
  const state = { latestPayload: null, checkInFlight: false }

  function addBoundaryInfoPanel() {
    interactiveMap.addPanel(PANEL_ID, {
      label: 'Boundary information',
      focus: false,
      html: buildPanelHtml(),
      mobile: {
        slot: 'left-top',
        modal: false,
        open: false,
        dismissible: false
      },
      tablet: {
        slot: 'right-bottom',
        modal: false,
        width: '340px',
        open: false,
        dismissible: false
      },
      desktop: {
        slot: 'right-bottom',
        modal: false,
        width: '340px',
        open: false,
        dismissible: false
      }
    })
  }

  function onSaveClick(clickEvent) {
    const button = clickEvent.target.closest(
      `#${PANEL_ROOT_ID} [data-boundary-action="${SAVE_ACTION}"]`
    )
    if (!button || button.disabled) {
      return
    }

    submitSaveAndContinue({ saveAndContinueUrl, csrfToken, state })
  }

  function onDrawCreated(feature) {
    runBoundaryCheck(interactiveMap, { checkUrl, csrfToken, state }, feature)
  }

  function onDrawEdited(feature) {
    runBoundaryCheck(interactiveMap, { checkUrl, csrfToken, state }, feature)
  }

  function onDrawCancelled() {
    if (state.latestPayload) {
      setSaveButtonDisabled(false)
    }
  }

  function onDrawDelete() {
    state.latestPayload = null
    renderPanel({ summary: '' })
    interactiveMap.hidePanel(PANEL_ID)
  }

  interactiveMap.on('map:ready', addBoundaryInfoPanel)
  document.addEventListener('click', onSaveClick)
  interactiveMap.on('draw:created', onDrawCreated)
  interactiveMap.on('draw:edited', onDrawEdited)
  interactiveMap.on('draw:started', onDrawStarted)
  interactiveMap.on('draw:cancelled', onDrawCancelled)
  interactiveMap.on('draw:delete', onDrawDelete)

  return {
    checkExistingBoundary(feature) {
      runBoundaryCheck(interactiveMap, { checkUrl, csrfToken, state }, feature)
    }
  }
}
