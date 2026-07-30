export const PANEL_ROOT_ID = 'draw-boundary-boundary-info'
export const SAVE_ACTION = 'save'
const NOT_AVAILABLE_TEXT = 'Not available'

export function buildPanelHtml() {
  return `
    <div id="${PANEL_ROOT_ID}" class="app-boundary-info-panel">
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

/**
 * @param {{ hectares: number, acres: number }} area
 */
function formatArea(area) {
  if (area?.hectares == null || area?.acres == null) {
    return NOT_AVAILABLE_TEXT
  }
  return `${area.hectares}ha (${area.acres} acres)`
}

/**
 * @param {{ kilometres: number, miles: number }} perimeter
 */
function formatPerimeter(perimeter) {
  if (perimeter?.kilometres == null || perimeter?.miles == null) {
    return NOT_AVAILABLE_TEXT
  }
  return `${perimeter.kilometres}km (${perimeter.miles} miles)`
}

/**
 * @param {string|{ name?: string, label?: string, code?: string, id?: string }} edp
 */
function formatEdp(edp) {
  if (typeof edp === 'string') {
    return edp
  }
  return edp?.name || edp?.label || edp?.code || edp?.id || JSON.stringify(edp)
}

function getPanelRoot() {
  return document.getElementById(PANEL_ROOT_ID)
}

export function setSaveButtonDisabled(disabled) {
  const panelRoot = getPanelRoot()
  const saveButton = panelRoot?.querySelector(
    `[data-boundary-action="${SAVE_ACTION}"]`
  )
  if (saveButton) {
    saveButton.disabled = disabled
  }
}

/**
 * @param {{ summary?: string, error?: string, results?: object }} params
 */
export function renderPanel({ summary, error, results }) {
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
  saveButton.hidden = !results
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
