import { getMapStyles } from './styles.js'
import { createMapDatasetsPlugin, FILL_LAYER_IDS } from './map-datasets.js'
import { wireFillOpacityOnZoom } from './fill-opacity-on-zoom.js'
import { readExistingBoundary } from './existing-boundary.js'
import { BOUNDARY_MAP_MAX_ZOOM } from './constants.js'
import { addSourceAndLayers } from './features.js'
import { wireMapErrorLogging } from './helpers.js'

const MAP_ELEMENT_ID = 'boundary-map'
const BOUNDARY_SOURCE_ID = 'boundary'
const BOUNDARY_COLOR = '#d4351c'
const BOUNDARY_FILL_OPACITY = 0.1
const BOUNDARY_LINE_WIDTH = 3
const DEFAULT_CENTER = [1.1405503, 52.7089441] // Norfolk

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

// A single once('style.load', ...) listener can miss the point at which the
// style actually finishes loading — 'styledata' fires multiple times while a
// style is being built up, so re-check isStyleLoaded() after every occurrence
// rather than trusting the first one.
function whenStyleReady(map, callback) {
  if (map.isStyleLoaded()) {
    callback()
    return
  }

  map.once('styledata', function () {
    whenStyleReady(map, callback)
  })
}

document.addEventListener('DOMContentLoaded', function () {
  const mapElement = document.getElementById(MAP_ELEMENT_ID)

  if (
    !mapElement ||
    !window.defra?.InteractiveMap ||
    !window.defra.maplibreProvider
  ) {
    return
  }

  const { initialFeature, bounds, center } = readExistingBoundary(mapElement)

  const mapStyles = getMapStyles()
  const datasetsPlugin = createMapDatasetsPlugin()
  const mapStylesPlugin = window.defra.mapStylesPlugin({ mapStyles })

  const interactiveMap = new window.defra.InteractiveMap(MAP_ELEMENT_ID, {
    behaviour: 'inline',
    mapProvider: window.defra.maplibreProvider(),
    mapLabel: 'Red line boundary',
    mapStyle: mapStyles[0],
    center: center || DEFAULT_CENTER,
    bounds,
    maxZoom: BOUNDARY_MAP_MAX_ZOOM,
    containerHeight: '400px',
    enableZoomControls: true,
    transformRequest,
    plugins: [datasetsPlugin, mapStylesPlugin]
  })

  interactiveMap.on('map:ready', function (event) {
    wireMapErrorLogging(event.map)

    whenStyleReady(event.map, function () {
      addSourceAndLayers(event.map, {
        sourceId: BOUNDARY_SOURCE_ID,
        geojson: initialFeature,
        color: BOUNDARY_COLOR,
        fillOpacity: BOUNDARY_FILL_OPACITY,
        lineWidth: BOUNDARY_LINE_WIDTH
      })
    })
  })

  wireFillOpacityOnZoom(interactiveMap, { fillLayerIds: FILL_LAYER_IDS })
})
