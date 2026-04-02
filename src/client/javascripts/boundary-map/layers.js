/**
 * Map layer functions for the boundary map.
 */

import { addSourceAndLayers, fitMapToBounds } from '../base-map/features.js'

// MapLibre source IDs – each source holds GeoJSON data rendered by one or more layers
const MAP_SOURCE_BOUNDARY = 'boundary'
const MAP_SOURCE_EDP_BOUNDARY = 'edp-boundary'
const MAP_SOURCE_EDP_INTERSECTION = 'edp-intersection'

const BOUNDARY_COLOR = '#d4351c'
const BOUNDARY_FILL_OPACITY = 0.1
const BOUNDARY_LINE_WIDTH = 3
const EDP_BOUNDARY_COLOR = '#00703c'
const EDP_BOUNDARY_FILL_OPACITY = 0.08
const EDP_BOUNDARY_LINE_WIDTH = 2
const EDP_INTERSECTION_COLOR = '#1d70b8'
const EDP_INTERSECTION_FILL_OPACITY = 0.3
const EDP_INTERSECTION_LINE_WIDTH = 2
const EDP_INTERSECTION_DASH_PATTERN = [4, 2]

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

export function addEdpIntersectionLayer(mapInstance, edpGeojson) {
  if (!edpGeojson?.features?.length) {
    return
  }

  addSourceAndLayers(mapInstance, {
    sourceId: MAP_SOURCE_EDP_INTERSECTION,
    geojson: edpGeojson,
    color: EDP_INTERSECTION_COLOR,
    fillOpacity: EDP_INTERSECTION_FILL_OPACITY,
    lineWidth: EDP_INTERSECTION_LINE_WIDTH,
    linePaint: {
      'line-dasharray': EDP_INTERSECTION_DASH_PATTERN
    }
  })
}
