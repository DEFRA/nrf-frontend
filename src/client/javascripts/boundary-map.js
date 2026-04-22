import { createMap } from './base-map/config.js'
import { BOUNDARY_MAP_MAX_ZOOM } from './base-map/constants.js'
import { addSourceAndLayers } from './base-map/features.js'
import {
  logWarning,
  parseDatasetJson,
  parseGeojson,
  runWhenMapStyleReady
} from './base-map/helpers.js'
import { addEdpBoundaryLayer } from './boundary-map/layers.js'

const DEFAULT_CENTER = [1.1405503, 52.7089441] // Norfolk
const BOUNDARY_SOURCE_ID = 'boundary'
const BOUNDARY_COLOR = '#d4351c'
const BOUNDARY_FILL_OPACITY = 0.1
const BOUNDARY_LINE_WIDTH = 3

function getExistingBoundaryBounds(bounds) {
  return bounds
    ? [...(bounds.bottomLeft || {}), ...(bounds.topRight || {})]
    : null
}

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
  const existingBoundaryMetadata = parseDatasetJson(
    mapEl,
    'existingBoundaryMetadata',
    'Failed to parse existing boundary metadata'
  )
  const bounds = getExistingBoundaryBounds(existingBoundaryMetadata?.bounds)

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
      maxMobileWidth: 500,
      bounds: bounds || null,
      center: existingBoundaryMetadata?.centre || DEFAULT_CENTER,
      maxZoom: BOUNDARY_MAP_MAX_ZOOM
    }
  })

  if (!map) {
    return
  }

  map.on('map:ready', function (event) {
    const mapInstance = event.map

    runWhenMapStyleReady(mapInstance, function () {
      addSourceAndLayers(mapInstance, {
        sourceId: BOUNDARY_SOURCE_ID,
        geojson,
        color: BOUNDARY_COLOR,
        fillOpacity: BOUNDARY_FILL_OPACITY,
        lineWidth: BOUNDARY_LINE_WIDTH
      })
      addEdpBoundaryLayer(mapInstance, edpBoundaryGeojson)
    })
  })
})
