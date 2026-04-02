import { createMap, DEFAULT_MAP_BOUNDS } from './base-map/config.js'
import { drawFeature } from './base-map/features.js'
import {
  logWarning,
  parseDatasetJson,
  parseGeojson,
  runWhenMapStyleReady
} from './base-map/helpers.js'
import {
  addEdpBoundaryLayer,
  addEdpIntersectionLayer
} from './boundary-map/layers.js'

document.addEventListener('DOMContentLoaded', function () {
  const mapEl = document.getElementById('boundary-map')
  if (!mapEl) {
    logWarning('Boundary map element not found')
    return
  }

  const geojson = parseGeojson(mapEl)
  const edpBoundaryGeojson = parseDatasetJson(
    mapEl,
    'edpBoundaryGeojson',
    'Failed to parse EDP boundary GeoJSON'
  )
  const edpIntersectionGeojson = parseDatasetJson(
    mapEl,
    'edpIntersectionGeojson',
    'Failed to parse EDP intersection GeoJSON'
  )

  const map = createMap({
    mapElementId: 'boundary-map',
    mapLabel: 'Red line boundary',
    containerHeight: '400px'
  })

  if (!map) return

  map.on('map:ready', function (event) {
    const mapInstance = event.map
    mapInstance.on('error', function (err) {
      logWarning('Boundary map error', err.error || err)
    })

    runWhenMapStyleReady(mapInstance, function () {
      drawFeature(mapInstance, {
        boundaryGeojson: geojson,
        fallbackBounds: DEFAULT_MAP_BOUNDS
      })
      addEdpBoundaryLayer(mapInstance, edpBoundaryGeojson)
      addEdpIntersectionLayer(mapInstance, edpIntersectionGeojson)
    })
  })
})
