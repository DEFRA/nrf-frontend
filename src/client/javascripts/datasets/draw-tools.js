const DRAW_LAYERS = new Set(['fill-inactive.cold', 'stroke-inactive.cold'])

export function createDrawToolsPlugins() {
  const interactPlugin = window.defra.interactPlugin({
    layers: [
      { layerId: 'fill-inactive.cold', idProperty: 'id' },
      { layerId: 'stroke-inactive.cold', idProperty: 'id' }
    ],
    interactionModes: ['selectFeature'],
    multiSelect: true,
    deselectOnClickOutside: true
  })

  const drawPlugin = window.defra.drawMLPlugin()

  return { interactPlugin, drawPlugin }
}

function buildDrawStartPanel(onClick) {
  const panel = document.createElement('div')
  panel.className = 'app-draw-start-panel'
  // Matches the position, padding and shadow of the library's own
  // Cancel/Done action panel, using its CSS custom properties directly.
  panel.style.cssText = [
    'position:absolute',
    'left:50%',
    'bottom:calc(var(--primary-gap) * 2)',
    'transform:translateX(-50%)',
    'z-index:1',
    'background-color:var(--background-color, #fff)',
    'padding:var(--panel-margin, 15px)',
    'border-radius:var(--panel-border-radius, 0)',
    'box-shadow:var(--panel-box-shadow)'
  ].join(';')

  const button = document.createElement('button')
  button.type = 'button'
  button.className =
    'govuk-button govuk-button--primary govuk-!-margin-bottom-0'
  button.textContent = 'Draw'
  button.addEventListener('click', onClick)

  panel.appendChild(button)
  return panel
}

function wireDrawStartPanel(interactiveMap, { mapElementId, startDraw }) {
  const mapElement = document.getElementById(mapElementId)
  if (!mapElement) {
    return
  }

  const panel = buildDrawStartPanel(startDraw)
  mapElement.appendChild(panel)

  interactiveMap.on('draw:started', function () {
    panel.hidden = true
  })

  interactiveMap.on('draw:created', function () {
    panel.hidden = false
  })

  interactiveMap.on('draw:edited', function () {
    panel.hidden = false
  })

  interactiveMap.on('draw:cancelled', function () {
    panel.hidden = false
  })
}

function buildDrawToolsMenuItems({
  interactiveMap,
  interactPlugin,
  drawPlugin,
  startDrawPolygon,
  getSelectedFeatureIds
}) {
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
      onClick: function () {
        if (!drawPlugin.editFeature(getSelectedFeatureIds()[0])) {
          return
        }
        interactiveMap.toggleButtonState('drawTools', 'hidden', true)
        interactPlugin.disable()
      }
    },
    {
      id: 'deleteFeature',
      label: 'Delete feature',
      iconSvgContent:
        '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
      isDisabled: true,
      onClick: function () {
        drawPlugin.deleteFeature(getSelectedFeatureIds())
        interactPlugin.clear()
        interactiveMap.toggleButtonState('drawTools', 'hidden', false)
        interactiveMap.toggleButtonState('drawPolygon', 'disabled', false)
        interactiveMap.toggleButtonState('editFeature', 'disabled', true)
        interactiveMap.toggleButtonState('deleteFeature', 'disabled', true)
      }
    }
  ]
}

function wireDrawStateEvents(interactiveMap, { interactPlugin }) {
  interactiveMap.on('draw:started', function () {
    interactPlugin.disable()
  })

  interactiveMap.on('draw:created', function () {
    interactiveMap.toggleButtonState('drawTools', 'hidden', false)
    interactPlugin.enable()
  })

  interactiveMap.on('draw:edited', function () {
    interactiveMap.toggleButtonState('drawTools', 'hidden', false)
    interactPlugin.enable()
  })

  interactiveMap.on('draw:cancelled', function () {
    interactiveMap.toggleButtonState('drawTools', 'hidden', false)
    interactPlugin.enable()
  })
}

function wireSelectionEvents(interactiveMap, { setSelectedFeatureIds }) {
  interactiveMap.on('interact:selectionchange', function (e) {
    const singleFeature = e.selectedFeatures.length === 1
    const anyFeature = e.selectedFeatures.length > 0
    const isDrawFeature =
      singleFeature && DRAW_LAYERS.has(e.selectedFeatures[0].layerId)
    const allDrawFeatures =
      anyFeature && e.selectedFeatures.every((f) => DRAW_LAYERS.has(f.layerId))
    setSelectedFeatureIds(e.selectedFeatures.map((f) => f.featureId))
    interactiveMap.toggleButtonState('drawPolygon', 'disabled', singleFeature)
    interactiveMap.toggleButtonState('drawLine', 'disabled', singleFeature)
    interactiveMap.toggleButtonState('editFeature', 'disabled', !isDrawFeature)
    interactiveMap.toggleButtonState(
      'deleteFeature',
      'disabled',
      !allDrawFeatures
    )
  })
}

export function wireDrawTools(
  interactiveMap,
  { interactPlugin, drawPlugin, mapElementId }
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

  interactiveMap.on('map:ready', function () {
    interactPlugin.enable()

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
        getSelectedFeatureIds
      })
    })

    wireDrawStartPanel(interactiveMap, {
      mapElementId,
      startDraw: startDrawPolygon
    })
  })

  wireDrawStateEvents(interactiveMap, { interactPlugin })
  wireSelectionEvents(interactiveMap, { setSelectedFeatureIds })
}
