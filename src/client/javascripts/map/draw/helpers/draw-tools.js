import createInteractPlugin from '@defra/interactive-map/plugins/interact'
import createDrawMLPlugin from '@defra/interactive-map/plugins/draw-ml'

const DRAW_LAYERS = new Set(['fill-inactive.cold', 'stroke-inactive.cold'])

export function createDrawToolsPlugins() {
  const interactPlugin = createInteractPlugin({
    layers: [
      { layerId: 'fill-inactive.cold', idProperty: 'id' },
      { layerId: 'stroke-inactive.cold', idProperty: 'id' }
    ],
    interactionModes: ['selectFeature'],
    multiSelect: true,
    deselectOnClickOutside: true
  })

  const drawPlugin = createDrawMLPlugin()

  return { interactPlugin, drawPlugin }
}

/**
 * @param {Function} onClick
 * @param {{ hidden: boolean }} params
 */
function buildDrawStartPanel(onClick, { hidden }) {
  const panel = document.createElement('div')
  panel.className = 'app-draw-start-panel'
  panel.hidden = hidden

  const button = document.createElement('button')
  button.type = 'button'
  button.className =
    'govuk-button govuk-button--primary govuk-!-margin-bottom-0'
  button.textContent = 'Draw'
  button.addEventListener('click', onClick)

  panel.appendChild(button)
  return panel
}

function noop() {}

/**
 * @param {object} interactiveMap
 * @param {{ mapElementId: string, startDraw: Function, hasExistingBoundary: boolean }} params
 */
function wireDrawStartPanel(
  interactiveMap,
  { mapElementId, startDraw, hasExistingBoundary }
) {
  const mapElement = document.getElementById(mapElementId)
  if (!mapElement) {
    return { setHidden: noop }
  }

  const panel = buildDrawStartPanel(startDraw, { hidden: hasExistingBoundary })
  mapElement.appendChild(panel)

  const setHidden = (hidden) => {
    panel.hidden = hidden
  }

  function onDrawStarted() {
    setHidden(true)
  }

  function onDrawCreatedOrEdited() {
    setHidden(false)
  }

  interactiveMap.on('draw:started', onDrawStarted)
  interactiveMap.on('draw:created', onDrawCreatedOrEdited)
  interactiveMap.on('draw:edited', onDrawCreatedOrEdited)
  interactiveMap.on('draw:cancelled', onDrawCreatedOrEdited)

  return { setHidden }
}

/**
 * @param {{ interactiveMap: object, interactPlugin: object, drawPlugin: object, startDrawPolygon: Function, getSelectedFeatureIds: Function, setStartPanelHidden: Function }} params
 */
function buildDrawToolsMenuItems({
  interactiveMap,
  interactPlugin,
  drawPlugin,
  startDrawPolygon,
  getSelectedFeatureIds,
  setStartPanelHidden
}) {
  function onEditFeatureClick() {
    if (!drawPlugin.editFeature(getSelectedFeatureIds()[0])) {
      return
    }
    interactiveMap.toggleButtonState('drawTools', 'hidden', true)
    interactPlugin.disable()
    setStartPanelHidden(true)
  }

  function onDeleteFeatureClick() {
    drawPlugin.deleteFeature(getSelectedFeatureIds())
    interactPlugin.clear()
    interactiveMap.toggleButtonState('drawTools', 'hidden', false)
    interactiveMap.toggleButtonState('drawPolygon', 'disabled', false)
    interactiveMap.toggleButtonState('editFeature', 'disabled', true)
    interactiveMap.toggleButtonState('deleteFeature', 'disabled', true)
  }

  return [
    {
      id: 'drawPolygon',
      label: 'Draw polygon',
      iconSvgContent:
        '<path d="M19.5 7v10M4.5 7v10M7 19.5h10M7 4.5h10"/><path d="M22 18v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1zm0-15v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1zM7 18v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1zM7 3v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1z"/>',
      onClick: startDrawPolygon
    },
    {
      id: 'editFeature',
      label: 'Edit feature',
      iconSvgContent:
        '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
      isDisabled: true,
      onClick: onEditFeatureClick
    },
    {
      id: 'deleteFeature',
      label: 'Delete feature',
      iconSvgContent:
        '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
      isDisabled: true,
      onClick: onDeleteFeatureClick
    }
  ]
}

/**
 * @param {object} interactiveMap
 * @param {{ interactPlugin: object }} params
 */
function wireDrawStateEvents(interactiveMap, { interactPlugin }) {
  function onDrawStarted() {
    interactPlugin.disable()
  }

  function onDrawFinished() {
    interactiveMap.toggleButtonState('drawTools', 'hidden', false)
    interactPlugin.enable()
  }

  interactiveMap.on('draw:started', onDrawStarted)
  interactiveMap.on('draw:created', onDrawFinished)
  interactiveMap.on('draw:edited', onDrawFinished)
  interactiveMap.on('draw:cancelled', onDrawFinished)
}

/**
 * @param {object} interactiveMap
 * @param {{ setSelectedFeatureIds: Function }} params
 */
function wireSelectionEvents(interactiveMap, { setSelectedFeatureIds }) {
  function onSelectionChange(selectionChangeEvent) {
    const selectedFeatures = selectionChangeEvent.selectedFeatures
    const singleFeature = selectedFeatures.length === 1
    const anyFeature = selectedFeatures.length > 0
    const isDrawFeature =
      singleFeature && DRAW_LAYERS.has(selectedFeatures[0].layerId)
    const allDrawFeatures =
      anyFeature && selectedFeatures.every((f) => DRAW_LAYERS.has(f.layerId))
    setSelectedFeatureIds(selectedFeatures.map((f) => f.featureId))
    interactiveMap.toggleButtonState('drawPolygon', 'disabled', singleFeature)
    interactiveMap.toggleButtonState('drawLine', 'disabled', singleFeature)
    interactiveMap.toggleButtonState('editFeature', 'disabled', !isDrawFeature)
    interactiveMap.toggleButtonState(
      'deleteFeature',
      'disabled',
      !allDrawFeatures
    )
  }

  interactiveMap.on('interact:selectionchange', onSelectionChange)
}

/**
 * @param {object} interactiveMap
 * @param {{ interactPlugin: object, drawPlugin: object, mapElementId: string, hasExistingBoundary?: boolean }} params
 */
export function wireDrawTools(
  interactiveMap,
  { interactPlugin, drawPlugin, mapElementId, hasExistingBoundary = false }
) {
  let selectedFeatureIds = []
  const getSelectedFeatureIds = () => selectedFeatureIds
  const setSelectedFeatureIds = (ids) => {
    selectedFeatureIds = ids
  }

  function startDrawPolygon() {
    interactiveMap.toggleButtonState('drawTools', 'hidden', true)
    drawPlugin.newPolygon(crypto.randomUUID())
  }

  function addDrawToolsButton() {
    interactPlugin.enable()

    const { setHidden: setStartPanelHidden } = wireDrawStartPanel(
      interactiveMap,
      {
        mapElementId,
        startDraw: startDrawPolygon,
        hasExistingBoundary
      }
    )

    interactiveMap.addButton('drawTools', {
      label: 'Draw tools',
      mobile: { slot: 'bottom-right' },
      tablet: { slot: 'top-middle' },
      desktop: { slot: 'top-middle' },
      menuItems: buildDrawToolsMenuItems({
        interactiveMap,
        interactPlugin,
        drawPlugin,
        startDrawPolygon,
        getSelectedFeatureIds,
        setStartPanelHidden
      })
    })
  }

  interactiveMap.on('map:ready', addDrawToolsButton)

  wireDrawStateEvents(interactiveMap, { interactPlugin })
  wireSelectionEvents(interactiveMap, { setSelectedFeatureIds })
}
