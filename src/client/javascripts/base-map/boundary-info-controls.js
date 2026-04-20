import { BOUNDARY_INFO_PANEL_ID } from './constants.js'
import { normalizeBoundaryInfoResponse } from './boundary-info-normalization.js'
import {
  buildBoundaryInfoPanelHtml,
  registerBoundaryInfoSaveHandler,
  renderBoundaryPanel
} from './boundary-info-view.js'
import {
  createBoundaryValidationRunner,
  registerBoundaryInfoMapEvents
} from './boundary-info-validation.js'

function wireBoundaryInfoPanel(
  map,
  { mapElementId, boundaryInfoOptions = {} }
) {
  const state = {
    activeFeature: null,
    latestResponse: null,
    inFlightRequest: null
  }

  const {
    endpoint,
    method = 'POST',
    requestBuilder = (feature) => ({ geojson: feature }),
    responseParser = normalizeBoundaryInfoResponse,
    csrfToken,
    saveAndContinueUrl,
    onSaveAndContinue
  } = boundaryInfoOptions

  const runValidation = createBoundaryValidationRunner({
    map,
    mapElementId,
    state,
    endpoint,
    method,
    requestBuilder,
    responseParser,
    csrfToken,
    saveAndContinueUrl,
    onSaveAndContinue
  })

  registerBoundaryInfoSaveHandler({
    mapElementId,
    state,
    onSaveAndContinue,
    saveAndContinueUrl,
    csrfToken
  })
  registerBoundaryInfoMapEvents({ map, state, runValidation, mapElementId })

  renderBoundaryPanel(mapElementId, {
    summary: 'Draw a boundary to validate it.'
  })
}

export function wireBoundaryInfoControls(
  map,
  { mapElementId, boundaryInfoOptions }
) {
  map.on('app:ready', function () {
    map.addPanel(BOUNDARY_INFO_PANEL_ID, {
      label: 'Boundary information',
      html: buildBoundaryInfoPanelHtml(mapElementId),
      mobile: {
        slot: 'left-top',
        modal: false,
        open: false,
        dismissible: false
      },
      tablet: {
        slot: 'right-bottom',
        modal: false,
        width: '520px',
        open: false,
        dismissible: false
      },
      desktop: {
        slot: 'right-bottom',
        modal: false,
        width: '520px',
        open: false,
        dismissible: false
      }
    })

    wireBoundaryInfoPanel(map, { mapElementId, boundaryInfoOptions })
  })
}
