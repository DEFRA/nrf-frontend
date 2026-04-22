import { createMap, DEFAULT_MAP_BOUNDS } from './base-map/config.js'
import { drawFeature } from './base-map/features.js'
import {
  logWarning,
  parseDatasetJson,
  parseGeojson,
  runWhenMapStyleReady
} from './base-map/helpers.js'
import { addEdpBoundaryLayer } from './boundary-map/layers.js'

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

  const map = createMap({
    mapElementId: 'boundary-map',
    mapLabel: 'Red line boundary',
    mapErrorMessage: 'Boundary map error',
    containerHeight: '400px',
    options: {
      // Ensure the OS copyright attribution overlay renders on this map.
      // The interactive-map core hides attribution at the "mobile" breakpoint,
      // and the default maxMobileWidth (640px) matches the two-thirds column
      // width this map sits in. Lowering it to 500 classifies the column as
      // tablet so the attribution is shown (matching the draw-boundary page),
      // while real phone viewports (~320–430px) stay in the mobile breakpoint.
      maxMobileWidth: 500
    }
  })

  if (!map) {
    return
  }

  map.on('map:ready', function (event) {
    const mapInstance = event.map

    runWhenMapStyleReady(mapInstance, function () {
      drawFeature(mapInstance, {
        boundaryGeojson: geojson,
        fallbackBounds: DEFAULT_MAP_BOUNDS
      })
      addEdpBoundaryLayer(mapInstance, edpBoundaryGeojson)
    })
  })
})
