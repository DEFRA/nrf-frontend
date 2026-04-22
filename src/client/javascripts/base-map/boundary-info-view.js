import { BOUNDARY_ACTION_SAVE, NOT_AVAILABLE_TEXT } from './constants.js'
import {
  formatArea,
  formatPerimeter,
  renderIntersections
} from './boundary-info-normalization.js'

export function buildBoundaryInfoPanelHtml(mapElementId) {
  return `
    <div class="app-boundary-info-panel" data-map-element-id="${mapElementId}">
      <p role="status" aria-live="polite" aria-atomic="true" class="govuk-visually-hidden" data-boundary-info-status></p>
      <p class="govuk-body-s govuk-!-margin-bottom-2" data-boundary-info-summary>Draw a boundary to validate it.</p>
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
      <div data-boundary-info-edps hidden class="govuk-!-margin-bottom-4">
        <h3 class="govuk-heading-s govuk-!-margin-bottom-2">EDPs in your red line boundary</h3>
        <h4 class="govuk-heading-xs govuk-!-margin-bottom-1 app-boundary-info-panel__edp-heading">
          <span class="app-boundary-info-panel__edp-swatch" aria-hidden="true"></span>Nature Restoration Fund nutrients levy
        </h4>
        <ul class="govuk-list govuk-list--bullet govuk-body-s govuk-!-margin-bottom-3" data-boundary-info-intersections></ul>
      </div>
      <button class="govuk-button govuk-!-margin-bottom-0 govuk-!-width-full" data-boundary-action="${BOUNDARY_ACTION_SAVE}" type="button" hidden>Save and continue</button>
    </div>
  `
}

async function submitSaveAndContinue(
  saveAndContinueUrl,
  csrfToken,
  boundaryGeojson
) {
  if (!saveAndContinueUrl) {
    return
  }
  let response
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken
    }

    response = await fetch(saveAndContinueUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ boundaryGeojson })
    })
  } catch (err) {
    console.error(`submitSaveAndContinue error: ${err.message}`)
  }

  if (response?.redirected) {
    window.location.assign(response.url)
  }
}

function getBoundaryPanelRoot(mapElementId) {
  return document.querySelector(
    `.app-boundary-info-panel[data-map-element-id="${mapElementId}"]`
  )
}

export function renderBoundaryPanel(mapElementId, viewModel) {
  const {
    summary,
    announce,
    focusHeading = false,
    error,
    results,
    canContinue = false
  } = viewModel

  const panelRoot = getBoundaryPanelRoot(mapElementId)
  if (!panelRoot) {
    return
  }

  const statusEl = panelRoot.querySelector('[data-boundary-info-status]')
  const headingEl = panelRoot
    .closest('[id$="-panel-boundary-info"]')
    ?.querySelector('h2')
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
    `[data-boundary-action="${BOUNDARY_ACTION_SAVE}"]`
  )

  if (announce !== undefined) {
    statusEl.textContent = announce
  }

  summaryEl.textContent = summary
  summaryEl.hidden = !summary
  errorEl.hidden = !error
  errorEl.textContent = error || ''
  resultsEl.hidden = !results
  edpsEl.hidden = !results

  if (results) {
    areaEl.textContent = formatArea(results.area)
    perimeterEl.textContent = formatPerimeter(results.perimeter)
    renderIntersections(intersectionsEl, results.intersectingEdps)
  }

  const canShowSave = !!results?.isValid
  saveButton.hidden = !canShowSave
  saveButton.disabled = !canContinue

  if (focusHeading && headingEl) {
    headingEl.tabIndex = -1
    headingEl.focus()
  }
}

export function registerBoundaryInfoSaveHandler({
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

    submitSaveAndContinue(
      saveAndContinueUrl,
      csrfToken,
      state.latestResponse?.raw
    )
  })
}
