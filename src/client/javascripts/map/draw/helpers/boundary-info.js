import {
  PANEL_ROOT_ID,
  SAVE_ACTION,
  buildPanelHtml,
  renderPanel,
  setSaveButtonDisabled
} from './boundary-info-panel.js'
import { logger } from '../../../logger/index.js'

const PANEL_ID = 'boundaryInfo'

/**
 * @param {string} url
 * @param {object} body
 * @param {{ csrfToken: string, parseJson?: boolean }} params
 * @returns {Promise<{ response: Response, payload: object|null }>}
 */
async function postJson(url, body, { csrfToken, parseJson = true }) {
  const headers = { 'Content-Type': 'application/json' }
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
  } catch (error) {
    logger.error(error, `Failed to POST to ${url}`)
    throw error
  }

  if (!response.ok) {
    logger.error(
      new Error(`Received status ${response.status}`),
      `POST to ${url} returned a non-OK response`
    )
  }

  if (!parseJson) {
    return { response, payload: null }
  }

  let payload = null
  try {
    payload = await response.json()
  } catch (error) {
    logger.error(error, 'Failed to parse JSON response')
  }

  return { response, payload }
}

/**
 * @param {{ checkUrl: string, csrfToken: string, feature: object }} params
 */
async function checkBoundary({ checkUrl, csrfToken, feature }) {
  const { response, payload } = await postJson(
    checkUrl,
    { geometry: feature?.geometry },
    { csrfToken }
  )

  return { ok: response.ok, payload }
}

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
  state.latestPayload = null
  interactiveMap.showPanel(PANEL_ID)
  renderPanel({ summary: 'Checking boundary...' })

  try {
    const { ok, payload } = await checkBoundary({
      checkUrl,
      csrfToken,
      feature
    })

    if (!ok) {
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
  }
}

/**
 * @param {object} interactiveMap
 * @param {{ checkUrl: string, csrfToken: string, saveAndContinueUrl: string }} params
 */
export function wireBoundaryInfoPanel(
  interactiveMap,
  { checkUrl, csrfToken, saveAndContinueUrl }
) {
  const state = { latestPayload: null }

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

  function onDrawStarted() {
    setSaveButtonDisabled(true)
  }

  function onDrawCancelled() {
    if (state.latestPayload) {
      setSaveButtonDisabled(false)
    }
  }

  function onDrawDelete() {
    state.latestPayload = null
    renderPanel({ summary: 'Draw a boundary to check it.' })
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
