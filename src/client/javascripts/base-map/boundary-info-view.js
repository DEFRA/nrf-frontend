import { BOUNDARY_ACTION_SAVE, NOT_AVAILABLE_TEXT } from './constants.js'
import {
  formatBounds,
  renderIntersections
} from './boundary-info-normalization.js'

export function buildBoundaryInfoPanelHtml(mapElementId) {
  return `
    <div class="app-boundary-info-panel" data-map-element-id="${mapElementId}">
      <p class="govuk-body-s govuk-!-margin-bottom-2" data-boundary-info-summary>Draw a boundary to validate it.</p>
      <p class="govuk-body-s govuk-!-margin-bottom-2" data-boundary-info-loading hidden aria-live="polite">Checking boundary...</p>
      <p class="govuk-error-message govuk-!-margin-bottom-2" data-boundary-info-error hidden></p>
      <dl class="govuk-summary-list govuk-!-margin-bottom-3" data-boundary-info-results hidden>
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key govuk-!-font-size-16">Bounds</dt>
          <dd class="govuk-summary-list__value govuk-!-font-size-16" data-boundary-info-bounds>${NOT_AVAILABLE_TEXT}</dd>
        </div>
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key govuk-!-font-size-16">EDPs in your red line boundary</dt>
          <dd class="govuk-summary-list__value govuk-!-font-size-16" data-boundary-info-intersections>${NOT_AVAILABLE_TEXT}</dd>
        </div>
      </dl>
      <button class="govuk-button govuk-!-margin-bottom-0" data-boundary-action="${BOUNDARY_ACTION_SAVE}" type="button" hidden>Save & Continue</button>
    </div>
  `
}

function submitSaveAndContinue(saveAndContinueUrl, csrfToken) {
  if (!saveAndContinueUrl) {
    return
  }

  const form = document.createElement('form')
  form.method = 'POST'
  form.action = saveAndContinueUrl
  form.style.display = 'none'

  if (csrfToken) {
    const tokenInput = document.createElement('input')
    tokenInput.type = 'hidden'
    tokenInput.name = 'csrfToken'
    tokenInput.value = csrfToken
    form.appendChild(tokenInput)
  }

  document.body.appendChild(form)
  form.submit()
}

function getBoundaryPanelRoot(mapElementId) {
  return document.querySelector(
    `.app-boundary-info-panel[data-map-element-id="${mapElementId}"]`
  )
}

export function renderBoundaryPanel(mapElementId, viewModel) {
  const {
    summary,
    loading = false,
    error,
    results,
    canContinue = false
  } = viewModel

  const panelRoot = getBoundaryPanelRoot(mapElementId)
  if (!panelRoot) {
    return
  }

  const summaryEl = panelRoot.querySelector('[data-boundary-info-summary]')
  const loadingEl = panelRoot.querySelector('[data-boundary-info-loading]')
  const errorEl = panelRoot.querySelector('[data-boundary-info-error]')
  const resultsEl = panelRoot.querySelector('[data-boundary-info-results]')
  const boundsEl = panelRoot.querySelector('[data-boundary-info-bounds]')
  const intersectionsEl = panelRoot.querySelector(
    '[data-boundary-info-intersections]'
  )
  const saveButton = panelRoot.querySelector(
    `[data-boundary-action="${BOUNDARY_ACTION_SAVE}"]`
  )

  summaryEl.textContent = summary
  loadingEl.hidden = !loading
  errorEl.hidden = !error
  errorEl.textContent = error || ''
  resultsEl.hidden = !results

  if (results) {
    boundsEl.textContent = formatBounds(results.bounds)
    renderIntersections(intersectionsEl, results.intersectingEdps)
  }

  const canShowSave = !!results?.isValid
  saveButton.hidden = !canShowSave
  saveButton.disabled = !canContinue
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

    submitSaveAndContinue(saveAndContinueUrl, csrfToken)
  })
}
