export const PANEL_ROOT_ID = 'draw-boundary-boundary-info'
export const EDIT_ACTION = 'edit'
export const SAVE_ACTION = 'save'
const NOT_AVAILABLE_TEXT = 'Not available'

export function buildPanelHtml() {
  return `
    <div id="${PANEL_ROOT_ID}" class="app-boundary-info-panel">
      <p class="app-boundary-info-panel__summary" data-boundary-info-summary>Draw a boundary to check it.</p>
      <p class="govuk-error-message" data-boundary-info-error hidden></p>
      <dl class="app-boundary-info-panel__stats" data-boundary-info-results hidden>
        <div class="app-boundary-info-panel__stats-row">
          <dt class="app-boundary-info-panel__stats-key">Area</dt>
          <dd class="app-boundary-info-panel__stats-value" data-boundary-info-area>${NOT_AVAILABLE_TEXT}</dd>
        </div>
        <div class="app-boundary-info-panel__stats-row">
          <dt class="app-boundary-info-panel__stats-key">Perimeter</dt>
          <dd class="app-boundary-info-panel__stats-value" data-boundary-info-perimeter>${NOT_AVAILABLE_TEXT}</dd>
        </div>
      </dl>
      <div class="app-boundary-info-panel__edps" data-boundary-info-edps hidden>
        <p class="app-boundary-info-panel__edps-intro">Your red line boundary is in:</p>
        <ul class="app-boundary-info-panel__edp-list" data-boundary-info-intersections></ul>
      </div>
      <button class="govuk-button govuk-button--secondary app-boundary-info-panel__action-button" data-boundary-action="${EDIT_ACTION}" type="button" hidden>Edit</button>
      <button class="govuk-button app-boundary-info-panel__action-button" data-boundary-action="${SAVE_ACTION}" type="button" hidden>Save and continue</button>
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

/**
 * @param {string|{ name?: string, label?: string, code?: string, id?: string, description?: string }} edp
 */
function buildEdpListItem(edp) {
  const item = document.createElement('li')
  item.className = 'app-boundary-info-panel__edp-item'

  const heading = document.createElement('div')
  heading.className = 'app-boundary-info-panel__edp-heading'

  const swatch = document.createElement('span')
  swatch.className = 'app-boundary-info-panel__edp-swatch'
  swatch.setAttribute('aria-hidden', 'true')

  const name = document.createElement('span')
  name.className = 'app-boundary-info-panel__edp-name'
  name.textContent = formatEdp(edp)

  heading.append(swatch, name)
  item.append(heading)

  const description = typeof edp === 'object' ? edp?.description : null
  if (description) {
    const descriptionEl = document.createElement('p')
    descriptionEl.className = 'app-boundary-info-panel__edp-description'
    descriptionEl.textContent = description
    item.append(descriptionEl)
  }

  return item
}

function buildNoneListItem() {
  const item = document.createElement('li')
  item.className =
    'app-boundary-info-panel__edp-item app-boundary-info-panel__edp-item--none'
  item.textContent = 'None'
  return item
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
  const editButton = panelRoot.querySelector(
    `[data-boundary-action="${EDIT_ACTION}"]`
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
  editButton.hidden = !results
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
  const items = edps.length ? edps.map(buildEdpListItem) : [buildNoneListItem()]
  items.forEach((item) => intersectionsEl.appendChild(item))
}
