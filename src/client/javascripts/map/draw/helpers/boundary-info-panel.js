import { EDP_BOUNDARY_STROKE_COLOUR } from '../../shared-helpers/datasets.js'

export const PANEL_ROOT_ID = 'draw-boundary-boundary-info'
export const EDIT_ACTION = 'edit'
export const SAVE_ACTION = 'save'
const NOT_AVAILABLE_TEXT = 'Not available'
const UNSUPPORTED_AREA_MESSAGE =
  'An area not supported by an Environmental Delivery Plan (EDP)'
const EDP_HEADING = 'Environmental Delivery Plan (EDP)'

export function buildPanelHtml() {
  return `
    <div id="${PANEL_ROOT_ID}" class="app-boundary-info-panel govuk-!-padding-top-3">
      <h2 class="govuk-heading-s govuk-!-margin-bottom-0" data-boundary-info-heading>Boundary information</h2>
      <p class="govuk-body-s app-boundary-info-panel__summary" data-boundary-info-summary>Draw a boundary to check it.</p>
      <p class="govuk-body-s app-boundary-info-panel__error" data-boundary-info-error hidden></p>
      <dl class="app-boundary-info-panel__stats" data-boundary-info-results hidden>
        <div class="app-boundary-info-panel__stats-row">
          <dt class="govuk-body-s app-boundary-info-panel__stats-key">Area</dt>
          <dd class="govuk-body-s app-boundary-info-panel__stats-value" data-boundary-info-area>${NOT_AVAILABLE_TEXT}</dd>
        </div>
        <div class="app-boundary-info-panel__stats-row">
          <dt class="govuk-body-s app-boundary-info-panel__stats-key">Perimeter</dt>
          <dd class="govuk-body-s app-boundary-info-panel__stats-value" data-boundary-info-perimeter>${NOT_AVAILABLE_TEXT}</dd>
        </div>
      </dl>
      <div class="app-boundary-info-panel__edps" data-boundary-info-edps hidden>
        <p class="govuk-body-s govuk-!-margin-bottom-2 app-boundary-info-panel__edps-intro">Your red line boundary is in:</p>
        <ul class="app-boundary-info-panel__edp-list" data-boundary-info-intersections></ul>
      </div>
      <div class="app-boundary-info-panel__actions">
      <button class="govuk-button govuk-button--secondary app-boundary-info-panel__action-button" data-boundary-action="${EDIT_ACTION}" type="button" hidden>Edit</button>
      <button class="govuk-button app-boundary-info-panel__action-button" data-boundary-action="${SAVE_ACTION}" type="button" hidden>Save and continue</button>
      </div>
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
 * The boundary check API's EDP attributes are sourced from a shapefile and
 * can be missing per-feature (e.g. label is null where the source data has
 * no "Label" attribute), so several fallbacks are tried before giving up —
 * returning null rather than the raw object so callers can omit the name
 * line entirely instead of dumping unreadable JSON.
 *
 * @param {string|{ label?: string, n2k_site_name?: string, name?: string, code?: string, id?: string }} edp
 * @returns {string|null}
 */
function formatEdp(edp) {
  if (typeof edp === 'string') {
    return edp
  }
  return (
    edp?.label ||
    edp?.n2k_site_name ||
    edp?.name ||
    edp?.code ||
    edp?.id ||
    null
  )
}

/**
 * @param {string|{ label?: string, n2k_site_name?: string, name?: string, code?: string, id?: string }} edp
 */
function buildEdpListItem(edp) {
  const item = document.createElement('li')
  item.className = 'app-boundary-info-panel__edp-item'

  const swatchWrap = document.createElement('span')
  swatchWrap.className = 'app-boundary-info-panel__edp-swatch-wrap'

  const swatch = document.createElement('span')
  swatch.className = 'app-boundary-info-panel__edp-swatch'
  swatch.style.backgroundColor = EDP_BOUNDARY_STROKE_COLOUR
  swatch.setAttribute('aria-hidden', 'true')
  swatchWrap.append(swatch)

  const text = document.createElement('div')
  text.className = 'app-boundary-info-panel__edp-text'

  const name = document.createElement('span')
  name.className = 'govuk-body-s app-boundary-info-panel__edp-name'
  name.textContent = EDP_HEADING

  const edpName = formatEdp(edp)
  text.append(name)
  if (edpName) {
    const descriptionEl = document.createElement('p')
    descriptionEl.className =
      'govuk-body-s app-boundary-info-panel__edp-description'
    descriptionEl.textContent = edpName
    text.append(descriptionEl)
  }

  item.append(swatchWrap, text)

  return item
}

function buildUnsupportedAreaListItem() {
  const item = document.createElement('li')
  item.className = 'app-boundary-info-panel__edp-item'

  const name = document.createElement('span')
  name.className = 'govuk-body-s app-boundary-info-panel__edp-name'
  name.textContent = UNSUPPORTED_AREA_MESSAGE

  item.append(name)
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

  const headingEl = panelRoot.querySelector('[data-boundary-info-heading]')
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

  headingEl.classList.toggle('govuk-visually-hidden', Boolean(error))

  resultsEl.hidden = !results
  edpsEl.hidden = !results
  editButton.hidden = !results && !error
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
  const items = edps.length
    ? edps.map(buildEdpListItem)
    : [buildUnsupportedAreaListItem()]
  items.forEach((item) => intersectionsEl.appendChild(item))
}
