/**
 * Map layer functions for the boundary map.
 */

import { addSourceAndLayers, fitMapToBounds } from '../base-map/features.js'

// MapLibre source IDs – each source holds GeoJSON data rendered by one or more layers
const MAP_SOURCE_BOUNDARY = 'boundary'
const MAP_SOURCE_EDP_BOUNDARY = 'edp-boundary'

const BOUNDARY_COLOR = '#d4351c'
const BOUNDARY_FILL_OPACITY = 0.1
const BOUNDARY_LINE_WIDTH = 3
const EDP_BOUNDARY_COLOR = '#feca57'
const EDP_BOUNDARY_FILL_OPACITY = 0.08
const EDP_BOUNDARY_LINE_WIDTH = 2

export function addBoundaryLayer(mapInstance, geojson) {
  const added = addSourceAndLayers(mapInstance, {
    sourceId: MAP_SOURCE_BOUNDARY,
    geojson,
    color: BOUNDARY_COLOR,
    fillOpacity: BOUNDARY_FILL_OPACITY,
    lineWidth: BOUNDARY_LINE_WIDTH
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
    color: EDP_BOUNDARY_COLOR,
    fillOpacity: EDP_BOUNDARY_FILL_OPACITY,
    lineWidth: EDP_BOUNDARY_LINE_WIDTH
  })
}
