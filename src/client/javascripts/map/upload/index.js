import { createCommonMapPlugins } from '../shared-helpers/common-map-plugins.js'
import { FILL_LAYER_IDS } from '../shared-helpers/datasets.js'
import { wireFillOpacityOnZoom } from '../shared-helpers/fill-opacity-on-zoom.js'
import { readExistingBoundary } from '../shared-helpers/read-boundary-metadata.js'
import { wireSavedBoundary } from './helpers/saved-boundary.js'
import { wireMapErrorLogging } from '../shared-helpers/map-error-logging.js'
import { createInteractiveMap } from './helpers/create-interactive-map.js'

const MAP_ELEMENT_ID = 'boundary-map'

function initUploadPreviewMap() {
  const mapElement = document.getElementById(MAP_ELEMENT_ID)

  if (!mapElement) {
    return
  }

  const { initialFeature, bounds, center } = readExistingBoundary(mapElement)

  const { mapStyles, datasetsPlugin, mapStylesPlugin, scaleBarPlugin } =
    createCommonMapPlugins()

  const interactiveMap = createInteractiveMap(MAP_ELEMENT_ID, {
    mapStyles,
    bounds,
    center,
    plugins: [datasetsPlugin, mapStylesPlugin, scaleBarPlugin]
  })

  function onMapReady(mapReadyEvent) {
    wireMapErrorLogging(mapReadyEvent.map)
    wireSavedBoundary(mapReadyEvent.map, initialFeature)
  }

  interactiveMap.on('map:ready', onMapReady)

  wireFillOpacityOnZoom(interactiveMap, { fillLayerIds: FILL_LAYER_IDS })
}

document.addEventListener('DOMContentLoaded', initUploadPreviewMap)
