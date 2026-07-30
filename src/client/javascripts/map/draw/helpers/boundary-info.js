import {
  PANEL_ROOT_ID,
  SAVE_ACTION,
  buildPanelHtml,
  renderPanel,
  setSaveButtonDisabled
} from './boundary-info-panel.js'
import { postJson } from './post-json.js'

const PANEL_ID = 'boundaryInfo'
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
    document.body.classList.remove(CHECKING_BODY_CLASS)
  }
}

function onDrawStarted() {
  setSaveButtonDisabled(true)
}

/**
 * @param {object} interactiveMap
 */
function addBoundaryInfoPanel(interactiveMap) {
  interactiveMap.addPanel(PANEL_ID, {
    label: 'Boundary information',
    focus: false,
    html: buildPanelHtml(),
    mobile: { slot: 'drawer', modal: false, open: false, dismissible: false },
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

function onDrawCancelled(state) {
  if (state.latestPayload) {
    setSaveButtonDisabled(false)
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
  const state = { latestPayload: null, checkInFlight: false }
  const runCheck = (feature) =>
    runBoundaryCheck(interactiveMap, { checkUrl, csrfToken, state }, feature)

  interactiveMap.on('map:ready', () => addBoundaryInfoPanel(interactiveMap))
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
  interactiveMap.on('draw:started', onDrawStarted)
  interactiveMap.on('draw:cancelled', () => onDrawCancelled(state))
  interactiveMap.on('draw:delete', () => onDrawDelete(interactiveMap, state))

  return {
    checkExistingBoundary: runCheck
  }
}
