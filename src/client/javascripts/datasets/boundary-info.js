const PANEL_ID = 'boundaryInfo'
const PANEL_ROOT_ID = 'draw-boundary-datasets-boundary-info'
const SAVE_ACTION = 'save'
const NOT_AVAILABLE_TEXT = 'Not available'

function buildPanelHtml() {
  return `
    <div id="${PANEL_ROOT_ID}">
      <p class="govuk-body-s govuk-!-margin-bottom-2" data-boundary-info-summary>Draw a boundary to check it.</p>
      <p class="govuk-error-message govuk-!-margin-bottom-2" data-boundary-info-error hidden></p>
      <dl class="govuk-summary-list govuk-!-margin-bottom-3" data-boundary-info-results hidden>
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key govuk-!-font-size-16">Area</dt>
          <dd class="govuk-summary-list__value govuk-!-font-size-16" data-boundary-info-area>${NOT_AVAILABLE_TEXT}</dd>
        </div>
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key govuk-!-font-size-16">Perimeter</dt>
          <dd class="govuk-summary-list__value govuk-!-font-size-16" data-boundary-info-perimeter>${NOT_AVAILABLE_TEXT}</dd>
        </div>
      </dl>
      <div data-boundary-info-edps hidden>
        <h3 class="govuk-heading-s govuk-!-margin-bottom-2">EDPs in your boundary</h3>
        <ul class="govuk-list govuk-list--bullet govuk-body-s" data-boundary-info-intersections></ul>
      </div>
      <button class="govuk-button govuk-!-margin-bottom-0 govuk-!-width-full" data-boundary-action="${SAVE_ACTION}" type="button" hidden>Save and continue</button>
    </div>
  `
}

function formatArea(area) {
  if (area?.hectares == null || area?.acres == null) {
    return NOT_AVAILABLE_TEXT
  }
  return `${area.hectares}ha (${area.acres} acres)`
}

function formatPerimeter(perimeter) {
  if (perimeter?.kilometres == null || perimeter?.miles == null) {
    return NOT_AVAILABLE_TEXT
  }
  return `${perimeter.kilometres}km (${perimeter.miles} miles)`
}

function formatEdp(edp) {
  if (typeof edp === 'string') {
    return edp
  }
  return edp?.name || edp?.label || edp?.code || edp?.id || JSON.stringify(edp)
}

function getPanelRoot() {
  return document.getElementById(PANEL_ROOT_ID)
}

function setSaveButtonDisabled(disabled) {
  const panelRoot = getPanelRoot()
  const saveButton = panelRoot?.querySelector(
    `[data-boundary-action="${SAVE_ACTION}"]`
  )
  if (saveButton) {
    saveButton.disabled = disabled
  }
}

function renderPanel({ summary, error, results }) {
  const panelRoot = getPanelRoot()
  if (!panelRoot) {
    return
  }

  const summaryEl = panelRoot.querySelector('[data-boundary-info-summary]')
  const errorEl = panelRoot.querySelector('[data-boundary-info-error]')
  const resultsEl = panelRoot.querySelector('[data-boundary-info-results]')
  const areaEl = panelRoot.querySelector('[data-boundary-info-area]')
  const perimeterEl = panelRoot.querySelector('[data-boundary-info-perimeter]')
  const edpsEl = panelRoot.querySelector('[data-boundary-info-edps]')
  const intersectionsEl = panelRoot.querySelector(
    '[data-boundary-info-intersections]'
  )
  const saveButton = panelRoot.querySelector(
    `[data-boundary-action="${SAVE_ACTION}"]`
  )

  summaryEl.textContent = summary || ''
  summaryEl.hidden = !summary

  errorEl.textContent = error || ''
  errorEl.hidden = !error

  resultsEl.hidden = !results
  edpsEl.hidden = !results
  saveButton.hidden = !results?.isValid
  saveButton.disabled = false

  if (!results) {
    return
  }

  areaEl.textContent = formatArea(results.boundaryMetadata?.area)
  perimeterEl.textContent = formatPerimeter(results.boundaryMetadata?.perimeter)

  intersectionsEl.textContent = ''
  const edps = Array.isArray(results.intersectingEdps)
    ? results.intersectingEdps
    : []
  const items = edps.length ? edps.map(formatEdp) : ['None']
  items.forEach((text) => {
    const item = document.createElement('li')
    item.textContent = text
    intersectionsEl.appendChild(item)
  })
}

async function checkBoundary({ checkUrl, csrfToken, feature }) {
  const headers = { 'Content-Type': 'application/json' }
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }

  const response = await fetch(checkUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ geometry: feature?.geometry })
  })

  const payload = await response.json().catch(() => null)

  return { ok: response.ok, payload }
}

async function submitSaveAndContinue({ saveAndContinueUrl, csrfToken, state }) {
  if (!saveAndContinueUrl || !state.latestPayload) {
    return
  }

  setSaveButtonDisabled(true)

  const headers = { 'Content-Type': 'application/json' }
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }

  let response
  try {
    response = await fetch(saveAndContinueUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ boundaryGeojson: state.latestPayload })
    })
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

export function wireBoundaryInfoPanel(
  interactiveMap,
  { checkUrl, csrfToken, saveAndContinueUrl }
) {
  const state = { latestPayload: null }

  interactiveMap.on('map:ready', function () {
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
  })

  document.addEventListener('click', function (event) {
    const button = event.target.closest(
      `#${PANEL_ROOT_ID} [data-boundary-action="${SAVE_ACTION}"]`
    )
    if (!button || button.disabled) {
      return
    }

    submitSaveAndContinue({ saveAndContinueUrl, csrfToken, state })
  })

  interactiveMap.on('draw:created', function (feature) {
    runBoundaryCheck(interactiveMap, { checkUrl, csrfToken, state }, feature)
  })

  interactiveMap.on('draw:edited', function (feature) {
    runBoundaryCheck(interactiveMap, { checkUrl, csrfToken, state }, feature)
  })

  interactiveMap.on('draw:started', function () {
    setSaveButtonDisabled(true)
  })

  interactiveMap.on('draw:cancelled', function () {
    if (state.latestPayload) {
      setSaveButtonDisabled(false)
    }
  })

  interactiveMap.on('draw:delete', function () {
    state.latestPayload = null
    renderPanel({ summary: 'Draw a boundary to check it.' })
    interactiveMap.hidePanel(PANEL_ID)
  })
}
