import createSearchPlugin from '@defra/interactive-map/plugins/search'
import { createCommonMapPlugins } from '../shared-helpers/common-map-plugins.js'
import { wireBoundaryInfoPanel } from './helpers/boundary-info.js'
import { createDrawToolsPlugins, wireDrawTools } from './helpers/draw-tools.js'
import { ALL_LAYER_IDS, FILL_LAYER_IDS } from '../shared-helpers/datasets.js'
import { wireFillOpacityOnZoom } from '../shared-helpers/fill-opacity-on-zoom.js'
import { wireHideLayersOnDraw } from './helpers/hide-layers-on-draw.js'
import { wireBackButton } from './helpers/back-button.js'
import { readExistingBoundary } from '../shared-helpers/read-boundary-metadata.js'
import { wireSavedBoundary } from './helpers/saved-boundary.js'
import { createInteractiveMap } from './helpers/create-interactive-map.js'
import { wireMapErrorLogging } from '../shared-helpers/map-error-logging.js'
import { toAbsoluteUrl } from '../shared-helpers/to-absolute-url.js'

const MAP_ELEMENT_ID = 'draw-boundary-map'

function initDrawBoundaryMap() {
  const mapElement = document.getElementById(MAP_ELEMENT_ID)

  if (!mapElement) {
    return
  }

  const { mapStyles, datasetsPlugin, mapStylesPlugin, scaleBarPlugin } =
    createCommonMapPlugins()
  const { interactPlugin, drawPlugin } = createDrawToolsPlugins()
  const searchPlugin = createSearchPlugin({
    osNamesURL: '/os-names-search?query={query}',
    regions: ['england']
  })

  const { initialFeature, bounds, center } = readExistingBoundary(mapElement)

  const interactiveMap = createInteractiveMap(MAP_ELEMENT_ID, {
    mapStyles,
    bounds,
    center,
    plugins: [
      datasetsPlugin,
      mapStylesPlugin,
      scaleBarPlugin,
      interactPlugin,
      drawPlugin,
      searchPlugin
    ]
  })

  interactiveMap.on('map:ready', (mapReadyEvent) =>
    wireMapErrorLogging(mapReadyEvent.map)
  )

  const boundaryInfoPanel = wireBoundaryInfoPanel(interactiveMap, {
    checkUrl: toAbsoluteUrl('/quote/draw-boundary/check'),
    saveAndContinueUrl: toAbsoluteUrl('/quote/draw-boundary/save'),
    csrfToken: mapElement.dataset.csrfToken
  })

  wireSavedBoundary(interactiveMap, {
    drawPlugin,
    initialFeature,
    boundaryInfoPanel
  })

  wireDrawTools(interactiveMap, {
    interactPlugin,
    drawPlugin,
    mapElementId: MAP_ELEMENT_ID,
    hasExistingBoundary: Boolean(initialFeature)
  })

  wireFillOpacityOnZoom(interactiveMap, { fillLayerIds: FILL_LAYER_IDS })

  wireHideLayersOnDraw(interactiveMap, { layerIds: ALL_LAYER_IDS })

  wireBackButton(interactiveMap, {
    backLinkPath: mapElement.dataset.backLinkPath
  })
}

document.addEventListener('DOMContentLoaded', initDrawBoundaryMap)
