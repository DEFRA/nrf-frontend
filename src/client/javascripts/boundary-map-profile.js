import {
  addBoundaryLayer,
  addEdpBoundaryLayer,
  addEdpIntersectionLayer
} from './boundary-map-layers.js'
import {
  createInlineMapOptions,
  getMapStyleUrl
} from './interactive-map-profile-common.js'
import { logWarning, parseDatasetJson } from './interactive-map-utils.js'
import { runWhenMapStyleReady } from './interactive-map-base.js'

export const BOUNDARY_MAP_ELEMENT_ID = 'boundary-map'

/** Bounding box for England in [lng, lat] format (WGS84). */
const ENGLAND_WEST_LNG = -5.75
const ENGLAND_SOUTH_LAT = 49.95
const ENGLAND_EAST_LNG = 1.8
const ENGLAND_NORTH_LAT = 55.85

// Min zoom level avoids showing unsightly blank white space where we do
// not have vector tile coverage for the rest of the world.
const MIN_ZOOM = 4

const DEFAULT_MAP_BOUNDS = [
  [ENGLAND_WEST_LNG, ENGLAND_SOUTH_LAT],
  [ENGLAND_EAST_LNG, ENGLAND_NORTH_LAT]
]

function parseGeojson(mapEl) {
  return parseDatasetJson(mapEl, 'geojson', 'Failed to parse boundary GeoJSON')
}

function parseEdpBoundaryGeojson(mapEl) {
  return parseDatasetJson(
    mapEl,
    'edpBoundaryGeojson',
    'Failed to parse EDP boundary GeoJSON'
  )
}

function parseEdpIntersectionGeojson(mapEl) {
  return parseDatasetJson(
    mapEl,
    'edpIntersectionGeojson',
    'Failed to parse EDP intersection GeoJSON'
  )
}

export function getBoundaryMapProfile() {
  return {
    mapElementId: BOUNDARY_MAP_ELEMENT_ID,
    warnOnMissingElement: true,
    missingElementMessage: 'Boundary map element not found',
    prepareContext({ mapEl }) {
      return {
        geojson: parseGeojson(mapEl),
        edpBoundaryGeojson: parseEdpBoundaryGeojson(mapEl),
        edpIntersectionGeojson: parseEdpIntersectionGeojson(mapEl)
      }
    },
    getMapOptions({ mapEl, defraApi }) {
      return createInlineMapOptions({
        mapProvider: defraApi.maplibreProvider(),
        mapLabel: 'Red line boundary',
        containerHeight: '400px',
        mapStyleUrl: getMapStyleUrl(mapEl)
      })
    },
    onMapCreated({ map, context }) {
      map.on('map:ready', function (event) {
        const mapInstance = event.map

        mapInstance.setMinZoom(MIN_ZOOM)
        mapInstance.setMaxBounds([
          [ENGLAND_WEST_LNG, ENGLAND_SOUTH_LAT],
          [ENGLAND_EAST_LNG, ENGLAND_NORTH_LAT]
        ])

        mapInstance.on('error', function (err) {
          logWarning('Boundary map error', err.error || err)
        })

        function addLayers() {
          if (context.geojson) {
            addBoundaryLayer(mapInstance, context.geojson)
          } else {
            // No boundary geometry available — zoom to England extent
            mapInstance.fitBounds(DEFAULT_MAP_BOUNDS, { padding: 20 })
          }
          addEdpBoundaryLayer(mapInstance, context.edpBoundaryGeojson)
          addEdpIntersectionLayer(mapInstance, context.edpIntersectionGeojson)
        }

        runWhenMapStyleReady(mapInstance, addLayers)
      })
    }
  }
}
