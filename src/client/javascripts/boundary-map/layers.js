/**
 * Map layer functions for the boundary map.
 */

import { addSourceAndLayers, fitMapToBounds } from '../base-map/features.js'

// MapLibre source IDs – each source holds GeoJSON data rendered by one or more layers
const MAP_SOURCE_BOUNDARY = 'boundary'
const MAP_SOURCE_EDP_BOUNDARY = 'edp-boundary'
const MAP_SOURCE_EDP_INTERSECTION = 'edp-intersection'

const BOUNDARY_COLOR = '#d4351c'

export function addBoundaryLayer(mapInstance, geojson) {
  const added = addSourceAndLayers(mapInstance, {
    sourceId: MAP_SOURCE_BOUNDARY,
    geojson,
    color: BOUNDARY_COLOR,
    fillOpacity: 0.1,
    lineWidth: 3
  })

  if (added) {
    fitMapToBounds(mapInstance, geojson)
  }
}

export function addEdpBoundaryLayer(mapInstance, edpBoundaryGeojson) {
  if (!edpBoundaryGeojson?.features?.length) {
    return
  }

  addSourceAndLayers(mapInstance, {
    sourceId: MAP_SOURCE_EDP_BOUNDARY,
    geojson: edpBoundaryGeojson,
    color: '#00703c',
    fillOpacity: 0.08,
    lineWidth: 2
  })
}

export function addEdpIntersectionLayer(mapInstance, edpGeojson) {
  if (!edpGeojson?.features?.length) {
    return
  }

  addSourceAndLayers(mapInstance, {
    sourceId: MAP_SOURCE_EDP_INTERSECTION,
    geojson: edpGeojson,
    color: '#1d70b8',
    fillOpacity: 0.3,
    lineWidth: 2,
    linePaint: {
      'line-dasharray': [4, 2]
    }
  })
}
