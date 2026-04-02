import {
  addBoundaryLayer,
  addEdpBoundaryLayer,
  addEdpIntersectionLayer
} from './layers.js'
import { DEFAULT_MAP_BOUNDS } from '../base-map/config.js'
import {
  parseDatasetJson,
  parseGeojson,
  runWhenMapStyleReady
} from '../base-map/helpers.js'

export function prepareBoundaryContext(mapEl) {
  return {
    geojson: parseGeojson(mapEl),
    edpBoundaryGeojson: parseDatasetJson(
      mapEl,
      'edpBoundaryGeojson',
      'Failed to parse EDP boundary GeoJSON'
    ),
    edpIntersectionGeojson: parseDatasetJson(
      mapEl,
      'edpIntersectionGeojson',
      'Failed to parse EDP intersection GeoJSON'
    )
  }
}

export function addBoundaryMapLayers(mapInstance, context) {
  if (context.geojson) {
    addBoundaryLayer(mapInstance, context.geojson)
  } else {
    mapInstance.fitBounds(DEFAULT_MAP_BOUNDS, { padding: 20 })
  }

  addEdpBoundaryLayer(mapInstance, context.edpBoundaryGeojson)
  addEdpIntersectionLayer(mapInstance, context.edpIntersectionGeojson)
}

export function wireBoundaryMapReady(map, context, configureMap) {
  map.on('map:ready', function (event) {
    const mapInstance = event.map
    configureMap(mapInstance)

    runWhenMapStyleReady(mapInstance, function () {
      addBoundaryMapLayers(mapInstance, context)
    })
  })
}
