import { createMap } from './base-map/config.js'
import { BOUNDARY_MAP_MAX_ZOOM } from './base-map/constants.js'
import {
  getDrawMapContainerHeight,
  parseDatasetJson
} from './base-map/helpers.js'

const UK_WEST_LNG = -8.75
const UK_SOUTH_LAT = 49.8
const UK_EAST_LNG = 2.5
const UK_NORTH_LAT = 60.95
const UK_BOUNDS = [UK_WEST_LNG, UK_SOUTH_LAT, UK_EAST_LNG, UK_NORTH_LAT]
const DEFAULT_LAYER_FILL_OPACITY = 0.15
const DARK_LAYER_FILL_OPACITY = 0.16
const DEFAULT_LAYER_LINE_WIDTH = 2
const EMPTY_FEATURE_PROPERTIES = Object.freeze({})
const DEFAULT_IMPACT_ASSESSOR_LAYERS = ['edp_boundaries']
const DEFAULT_CENTER = [1.1405503, 52.7089441] // Norfolk
const DEFAULT_ZOOM = 8.5

const LAYER_COLOR_CONFIG = {
  edp_boundaries: {
    fillColor: '#feca57',
    lineColor: '#feca57',
    dark: { fillColor: '#9ddfa6', lineColor: '#9ddfa6' }
  },
  lpa_boundaries: {
    fillColor: '#1d70b8',
    lineColor: '#1d70b8',
    dark: { fillColor: '#8fc8ff', lineColor: '#8fc8ff' }
  },
  nn_catchments: {
    fillColor: '#d53880',
    lineColor: '#d53880',
    dark: { fillColor: '#ff92c2', lineColor: '#ff92c2' }
  },
  subcatchments: {
    fillColor: '#f47738',
    lineColor: '#f47738',
    dark: { fillColor: '#ffbf96', lineColor: '#ffbf96' }
  },
  wwtw_catchments: {
    fillColor: '#6f72af',
    lineColor: '#6f72af',
    dark: { fillColor: '#bec0ef', lineColor: '#bec0ef' }
  }
}

function formatLayerLabel(layerParam) {
  return layerParam
    .split('_')
    .map((part) => part.toUpperCase())
    .join(' ')
}

function buildLayerDefinitions(layerParams) {
  return layerParams.map((layerParam, index) => ({
    ...LAYER_COLOR_CONFIG[layerParam],
    label: formatLayerLabel(layerParam),
    sourceId: `${layerParam}-tiles`,
    sourceLayer: layerParam,
    tilesUrl: `/impact-assessor-map/tiles/${layerParam}/{z}/{x}/{y}.mvt`,
    fillOpacity: DEFAULT_LAYER_FILL_OPACITY,
    lineWidth: DEFAULT_LAYER_LINE_WIDTH,
    paintByStyle: {
      dark: {
        ...(LAYER_COLOR_CONFIG[layerParam]?.dark || {}),
        fillOpacity: DARK_LAYER_FILL_OPACITY
      }
    },
    defaultVisible: index === 0
  }))
}

function normalizeInitialDrawFeature(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  if (value.type === 'FeatureCollection') {
    return normalizeInitialDrawFeature(value.features?.[0])
  }

  if (value.type === 'Feature') {
    return value.geometry
      ? {
          id: value.id,
          type: 'Feature',
          geometry: value.geometry,
          properties: value.properties ?? EMPTY_FEATURE_PROPERTIES
        }
      : null
  }

  if (value.type && value.coordinates) {
    return {
      type: 'Feature',
      geometry: value,
      properties: EMPTY_FEATURE_PROPERTIES
    }
  }

  return null
}

function getExistingBoundaryBounds(bounds) {
  return bounds
    ? [...(bounds.bottomLeft || {}), ...(bounds.topRight || {})]
    : null
}

document.addEventListener('DOMContentLoaded', function () {
  const mapElement = document.getElementById('draw-boundary-map')
  const boundaryValidationUrl = mapElement?.dataset?.boundaryValidationUrl
  const saveAndContinueUrl = mapElement?.dataset?.saveAndContinueUrl
  const csrfToken = mapElement?.dataset?.csrfToken
  const existingBoundaryGeojson = mapElement
    ? parseDatasetJson(
        mapElement,
        'existingBoundaryGeojson',
        'Failed to parse existing boundary GeoJSON'
      )
    : null
  const existingBoundaryMetadata = mapElement
    ? parseDatasetJson(
        mapElement,
        'existingBoundaryMetadata',
        'Failed to parse existing boundary metadata'
      )
    : null
  const bounds = getExistingBoundaryBounds(existingBoundaryMetadata?.bounds)
  const initialDrawFeature = normalizeInitialDrawFeature(
    existingBoundaryGeojson
  )
  const layerParams = mapElement?.dataset?.impactAssessorLayers
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const impactAssessorLayers = layerParams?.length
    ? layerParams
    : DEFAULT_IMPACT_ASSESSOR_LAYERS

  createMap({
    mapElementId: 'draw-boundary-map',
    mapLabel: 'Draw boundary map',
    mapErrorMessage: 'Draw boundary map error',
    containerHeight: getDrawMapContainerHeight,
    showStyleControls: true,
    showDrawControls: true,
    showSearch: true,
    drawControlOptions: {
      ...(initialDrawFeature ? { initialFeature: initialDrawFeature } : {})
    },
    showBoundaryInfoPanel: true,
    showLayerControls: true,
    boundaryInfoOptions: {
      ...(boundaryValidationUrl ? { endpoint: boundaryValidationUrl } : {}),
      requestBuilder: (feature) => ({ geometry: feature?.geometry ?? feature }),
      ...(csrfToken ? { csrfToken } : {}),
      ...(saveAndContinueUrl ? { saveAndContinueUrl } : {})
    },
    layerControlOptions: {
      layers: buildLayerDefinitions(impactAssessorLayers)
    },
    options: {
      maxBounds: UK_BOUNDS,
      bounds: bounds || null,
      center: existingBoundaryMetadata?.centre || DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      maxZoom: BOUNDARY_MAP_MAX_ZOOM
    }
  })
})
