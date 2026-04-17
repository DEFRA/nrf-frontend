import { logWarning } from './helpers.js'
import {
  DRAW_ACTION_DELETE,
  DRAW_ACTION_DRAW,
  DRAW_ACTION_EDIT,
  DRAW_EVENT_CREATED,
  DRAW_PANEL_ID
} from './constants.js'

function buildDrawPanelHtml(mapElementId) {
  return `
    <div class="app-draw-panel" data-map-element-id="${mapElementId}">
      <div class="govuk-button-group govuk-!-margin-bottom-0">
        <button class="govuk-button govuk-button--primary govuk-!-margin-bottom-0" data-draw-action="${DRAW_ACTION_DRAW}" type="button">Draw</button>
        <button class="govuk-button govuk-button--secondary govuk-!-margin-bottom-0" data-draw-action="${DRAW_ACTION_EDIT}" type="button">Edit</button>
        <button class="govuk-button govuk-button--warning govuk-!-margin-bottom-0" data-draw-action="${DRAW_ACTION_DELETE}" type="button">Delete</button>
      </div>
    </div>
  `
}

function createFeatureId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `boundary-${Date.now()}`
}

function getDrawPanelButtons(mapElementId) {
  return document.querySelectorAll(
    `.app-draw-panel[data-map-element-id="${mapElementId}"] [data-draw-action]`
  )
}

function refreshDrawPanelButtons(mapElementId, drawState) {
  const hasConfirmedFeature = !!drawState.featureId
  const drawBusy = !!(drawState.featureId || drawState.pendingFeatureId)

  getDrawPanelButtons(mapElementId).forEach((button) => {
    const action = button.dataset.drawAction
    if (action === DRAW_ACTION_DRAW) {
      button.disabled = drawBusy
      return
    }

    if (action === DRAW_ACTION_EDIT || action === DRAW_ACTION_DELETE) {
      button.disabled = !hasConfirmedFeature
    }
  })
}

function runDrawPanelAction({
  action,
  drawPlugin,
  drawState,
  hideDrawPanel,
  refreshButtonState
}) {
  if (!drawPlugin) {
    logWarning('Draw plugin not available, action ignored')
    return
  }

  if (action === DRAW_ACTION_DRAW) {
    const featureId = createFeatureId()
    hideDrawPanel()
    drawPlugin.newPolygon?.(featureId)
    drawState.pendingFeatureId = featureId
    refreshButtonState()
    return
  }

  if (!drawState.featureId) {
    return
  }

  if (action === DRAW_ACTION_EDIT) {
    hideDrawPanel()
    drawPlugin.editFeature?.(drawState.featureId)
    return
  }

  if (action === DRAW_ACTION_DELETE) {
    drawPlugin.deleteFeature?.([drawState.featureId])
    drawState.featureId = null
    refreshButtonState()
  }
}

function registerDrawPanelClickHandler({ mapElementId, runAction }) {
  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-draw-action]')
    if (!button) {
      return
    }

    if (
      !button.closest(`.app-draw-panel[data-map-element-id="${mapElementId}"]`)
    ) {
      return
    }

    runAction(button.dataset.drawAction)
  })
}

function bindDrawStateEvents({
  map,
  drawState,
  refreshButtonState,
  hideDrawPanel,
  showDrawPanel
}) {
  map.on('draw:started', function () {
    hideDrawPanel()
  })

  map.on(DRAW_EVENT_CREATED, function (feature) {
    drawState.featureId = feature?.id || drawState.pendingFeatureId || null
    drawState.pendingFeatureId = null
    refreshButtonState()
    showDrawPanel()
  })

  map.on('draw:edited', function (feature) {
    drawState.featureId = feature?.id || drawState.featureId
    drawState.pendingFeatureId = null
    refreshButtonState()
    showDrawPanel()
  })

  map.on('draw:updated', function (feature) {
    drawState.featureId = feature?.id || drawState.featureId
    refreshButtonState()
  })

  map.on('draw:delete', function ({ featureIds = [] } = {}) {
    if (drawState.featureId && featureIds.includes(drawState.featureId)) {
      drawState.featureId = null
    }

    if (
      drawState.pendingFeatureId &&
      featureIds.includes(drawState.pendingFeatureId)
    ) {
      drawState.pendingFeatureId = null
    }

    refreshButtonState()
  })

  map.on('draw:cancelled', function (feature) {
    drawState.featureId = feature?.id || drawState.featureId
    drawState.pendingFeatureId = null
    refreshButtonState()
    showDrawPanel()
  })
}

function canHydrateInitialDrawFeature(initialFeature, drawPlugin) {
  return (
    initialFeature?.type === 'Feature' &&
    !!initialFeature?.geometry &&
    typeof drawPlugin?.addFeature === 'function'
  )
}

function resolveInitialDrawFeature(initialFeature) {
  return {
    ...initialFeature,
    id: initialFeature.id || createFeatureId(),
    properties: initialFeature.properties || {}
  }
}

function wireDrawPanelButtons({
  map,
  drawPlugin,
  mapElementId,
  drawControlOptions = {}
}) {
  const { initialFeature } = drawControlOptions
  const drawState = { featureId: null, pendingFeatureId: null }
  let hasHydratedInitialFeature = false
  const hideDrawPanel = () => map.hidePanel?.(DRAW_PANEL_ID)
  const showDrawPanel = () => map.showPanel?.(DRAW_PANEL_ID)

  const refreshButtonState = () =>
    refreshDrawPanelButtons(mapElementId, drawState)

  const runAction = (action) =>
    runDrawPanelAction({
      action,
      drawPlugin,
      drawState,
      hideDrawPanel,
      refreshButtonState
    })

  registerDrawPanelClickHandler({ mapElementId, runAction })
  bindDrawStateEvents({
    map,
    drawState,
    refreshButtonState,
    hideDrawPanel,
    showDrawPanel
  })

  const hydrateInitialFeature = () => {
    if (hasHydratedInitialFeature) {
      return
    }

    if (!canHydrateInitialDrawFeature(initialFeature, drawPlugin)) {
      return
    }

    const resolvedInitialFeature = resolveInitialDrawFeature(initialFeature)

    drawPlugin.addFeature(resolvedInitialFeature)
    drawState.featureId = resolvedInitialFeature.id
    hasHydratedInitialFeature = true
    refreshButtonState()
    showDrawPanel()

    map.fitToBounds?.(resolvedInitialFeature)

    map.emit?.(DRAW_EVENT_CREATED, resolvedInitialFeature)
  }

  map.on('draw:ready', hydrateInitialFeature)

  refreshButtonState()
}

export function wireDrawControls(
  map,
  { drawPlugin, mapElementId, drawControlOptions }
) {
  map.on('app:ready', function () {
    // DRAW PANEL SHOWN ALWAYS, NO TOGGLE
    // map.addButton(DRAW_PANEL_ID, {
    //   label: 'Draw',
    //   panelId: DRAW_PANEL_ID,
    //   iconSvgContent: PENCIL_SVG,
    //   mobile: { slot: 'top-left', showLabel: false, order: 2 },
    //   tablet: { slot: 'top-left', showLabel: false, order: 2 },
    //   desktop: { slot: 'top-left', showLabel: false, order: 2 }
    // })

    map.addPanel(DRAW_PANEL_ID, {
      label: 'Draw a red line boundary',
      html: buildDrawPanelHtml(mapElementId),
      mobile: { slot: 'drawer', modal: false, open: true, dismissible: false },
      tablet: {
        slot: 'left-bottom',
        modal: false,
        dismissible: false,
        width: 'auto',
        open: true
      },
      desktop: {
        slot: 'left-bottom',
        modal: false,
        dismissible: false,
        width: 'auto',
        open: true
      }
    })

    wireDrawPanelButtons({
      map,
      drawPlugin,
      mapElementId,
      drawControlOptions
    })
  })
}
