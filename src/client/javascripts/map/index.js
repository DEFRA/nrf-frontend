import { getMapStyles } from './styles.js'
import { wireBoundaryInfoPanel } from './boundary-info.js'
import { createDrawToolsPlugins, wireDrawTools } from './draw-tools.js'
import {
  createMapDatasetsPlugin,
  ALL_LAYER_IDS,
  FILL_LAYER_IDS
} from './map-datasets.js'
import { wireFillOpacityOnZoom } from './fill-opacity-on-zoom.js'
import { wireHideLayersOnDraw } from './hide-layers-on-draw.js'
import { getContainerHeight, wireResizeMapHeight } from './resize-map-height.js'
import {
  readExistingBoundary,
  hydrateInitialDrawFeature
} from './existing-boundary.js'

const MAP_ELEMENT_ID = 'draw-boundary-map'
const DEFAULT_ZOOM = 8.5
const NORFOLK_LNG = 1.1405503
const NORFOLK_LAT = 52.7089441

// MapLibre fetches tiles from a Web Worker, which has no implicit base URL,
// so relative URLs (e.g. '/impact-assessor-map/...') fail to parse there.
// Resolving to an absolute URL up front avoids that.
function transformRequest(url) {
  const absoluteUrl =
    typeof url === 'string' && url.startsWith('/')
      ? `${window.location.origin}${url}`
      : url

  return { url: absoluteUrl }
}

document.addEventListener('DOMContentLoaded', function () {
  const mapElement = document.getElementById(MAP_ELEMENT_ID)

  if (!mapElement || !window.defra) {
    return
  }

  const mapStyles = getMapStyles()

  const datasetsPlugin = createMapDatasetsPlugin()

  const mapStylesPlugin = window.defra.mapStylesPlugin({ mapStyles })

  const { interactPlugin, drawPlugin } = createDrawToolsPlugins()

  const searchPlugin = window.defra.searchPlugin({
    osNamesURL: '/os-names-search?query={query}',
    regions: ['england']
  })

  const { initialFeature, bounds, center } = readExistingBoundary(mapElement)

  const interactiveMap = new window.defra.InteractiveMap(MAP_ELEMENT_ID, {
    behaviour: 'inline',
    mapProvider: window.defra.maplibreProvider(),
    mapStyle: mapStyles[0],
    center: center || [NORFOLK_LNG, NORFOLK_LAT],
    bounds,
    zoom: DEFAULT_ZOOM,
    containerHeight: getContainerHeight(mapElement),
    transformRequest,
    plugins: [
      datasetsPlugin,
      mapStylesPlugin,
      interactPlugin,
      drawPlugin,
      searchPlugin
    ]
  })

  // The draw-ml plugin creates its underlying MapboxDraw control asynchronously
  // (a React effect gated on the map being ready), so drawPlugin.addFeature is a
  // no-op if called straight from 'map:ready' — it silently drops the feature
  // because the control doesn't exist yet. 'draw:ready' fires once that control
  // has actually been created.
  interactiveMap.on('draw:ready', function () {
    const hydrated = hydrateInitialDrawFeature({ drawPlugin, initialFeature })

    if (hydrated) {
      interactiveMap.fitToBounds(initialFeature)
    }
  })

  wireBoundaryInfoPanel(interactiveMap, {
    checkUrl: '/quote/draw-boundary/check',
    saveAndContinueUrl: '/quote/draw-boundary/save',
    csrfToken: mapElement.dataset.csrfToken
  })

  wireDrawTools(interactiveMap, {
    interactPlugin,
    drawPlugin,
    mapElementId: MAP_ELEMENT_ID
  })

  wireFillOpacityOnZoom(interactiveMap, { fillLayerIds: FILL_LAYER_IDS })

  wireHideLayersOnDraw(interactiveMap, { layerIds: ALL_LAYER_IDS })

  wireResizeMapHeight(mapElement)
})
