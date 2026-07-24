import { logger } from '../logger/index.js'

const EMPTY_FEATURE_PROPERTIES = Object.freeze({})

function parseDatasetJson(mapElement, datasetKey, errorMessage) {
  try {
    const value = mapElement.dataset?.[datasetKey]
    return value ? JSON.parse(value) : null
  } catch (error) {
    logger.error(error, errorMessage)
    return null
  }
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

/**
 * @param {HTMLElement} mapElement
 * @returns {{ initialFeature: object|null, bounds: number[]|null, center: number[]|null }}
 */
export function readExistingBoundary(mapElement) {
  const existingBoundaryGeojson = parseDatasetJson(
    mapElement,
    'existingBoundaryGeojson',
    'Failed to parse existing boundary GeoJSON'
  )
  const existingBoundaryMetadata = parseDatasetJson(
    mapElement,
    'existingBoundaryMetadata',
    'Failed to parse existing boundary metadata'
  )

  return {
    initialFeature: normalizeInitialDrawFeature(existingBoundaryGeojson),
    bounds: getExistingBoundaryBounds(existingBoundaryMetadata?.bounds),
    center: existingBoundaryMetadata?.centre ?? null
  }
}

/**
 * @param {{ drawPlugin: object, initialFeature: object|null }} params
 * @returns {boolean}
 */
export function hydrateInitialDrawFeature({ drawPlugin, initialFeature }) {
  if (
    initialFeature?.type !== 'Feature' ||
    !initialFeature?.geometry ||
    typeof drawPlugin?.addFeature !== 'function'
  ) {
    return false
  }

  drawPlugin.addFeature({
    ...initialFeature,
    id: initialFeature.id || crypto.randomUUID(),
    properties: initialFeature.properties ?? EMPTY_FEATURE_PROPERTIES
  })

  return true
}
