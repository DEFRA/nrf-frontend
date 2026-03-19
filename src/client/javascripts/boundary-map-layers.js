/**
 * Map layer functions for the boundary map.
 */

import { fitMapToBounds } from './boundary-map-geo.js'

// MapLibre source IDs – each source holds GeoJSON data rendered by one or more layers
const MAP_SOURCE_BOUNDARY = 'boundary'
const MAP_SOURCE_EDP_BOUNDARY = 'edp-boundary'
const MAP_SOURCE_EDP_INTERSECTION = 'edp-intersection'

export function addBoundaryLayer(mapInstance, geojson) {
  if (mapInstance.getSource(MAP_SOURCE_BOUNDARY)) {
    return
  }

  mapInstance.addSource(MAP_SOURCE_BOUNDARY, {
    type: 'geojson',
    data: geojson
  })

  mapInstance.addLayer({
    id: 'boundary-fill',
    type: 'fill',
    source: MAP_SOURCE_BOUNDARY,
    paint: {
      'fill-color': '#d4351c',
      'fill-opacity': 0.1
    }
  })

  mapInstance.addLayer({
    id: 'boundary-line',
    type: 'line',
    source: MAP_SOURCE_BOUNDARY,
    paint: {
      'line-color': '#d4351c',
      'line-width': 3
    }
  })

  fitMapToBounds(mapInstance, geojson)
}

export function addEdpBoundaryLayer(mapInstance, edpBoundaryGeojson) {
  if (!edpBoundaryGeojson?.features?.length) {
    return
  }

  if (mapInstance.getSource(MAP_SOURCE_EDP_BOUNDARY)) {
    return
  }

  mapInstance.addSource(MAP_SOURCE_EDP_BOUNDARY, {
    type: 'geojson',
    data: edpBoundaryGeojson
  })

  mapInstance.addLayer({
    id: 'edp-boundary-fill',
    type: 'fill',
    source: MAP_SOURCE_EDP_BOUNDARY,
    paint: {
      'fill-color': '#00703c',
      'fill-opacity': 0.08
    }
  })

  mapInstance.addLayer({
    id: 'edp-boundary-line',
    type: 'line',
    source: MAP_SOURCE_EDP_BOUNDARY,
    paint: {
      'line-color': '#00703c',
      'line-width': 2
    }
  })
}

export function addEdpIntersectionLayer(mapInstance, edpGeojson) {
  if (!edpGeojson?.features?.length) {
    return
  }

  if (mapInstance.getSource(MAP_SOURCE_EDP_INTERSECTION)) {
    return
  }

  mapInstance.addSource(MAP_SOURCE_EDP_INTERSECTION, {
    type: 'geojson',
    data: edpGeojson
  })

  mapInstance.addLayer({
    id: 'edp-intersection-fill',
    type: 'fill',
    source: MAP_SOURCE_EDP_INTERSECTION,
    paint: {
      'fill-color': '#1d70b8',
      'fill-opacity': 0.3
    }
  })

  mapInstance.addLayer({
    id: 'edp-intersection-line',
    type: 'line',
    source: MAP_SOURCE_EDP_INTERSECTION,
    paint: {
      'line-color': '#1d70b8',
      'line-width': 2,
      'line-dasharray': [4, 2]
    }
  })
}
