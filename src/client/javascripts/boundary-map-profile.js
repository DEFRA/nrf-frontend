import {
  addBoundaryLayer,
  addEdpBoundaryLayer,
  addEdpIntersectionLayer
} from './boundary-map-layers.js'
import {
  configureEnglandMap,
  createInlineMapOptions,
  DEFAULT_MAP_BOUNDS,
  getMapStyleUrl
} from './interactive-map-profile-common.js'
import { parseDatasetJson, parseGeojson } from './interactive-map-utils.js'
import { runWhenMapStyleReady } from './interactive-map-base.js'

export const BOUNDARY_MAP_ELEMENT_ID = 'boundary-map'

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
        mapStyles: [{ url: getMapStyleUrl(mapEl) }]
      })
    },
    onMapCreated({ map, context }) {
      map.on('map:ready', function (event) {
        const mapInstance = event.map

        configureEnglandMap(mapInstance)

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
