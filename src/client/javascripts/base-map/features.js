import { logWarning } from './helpers.js'

const FEATURE_SOURCE_ID = 'feature'
const BOUNDARY_SOURCE_ID = 'boundary'
const DEFAULT_FIT_BOUNDS_PADDING = 40
const DEFAULT_MAX_ZOOM = 15
const DEFAULT_FIT_BOUNDS_OPTIONS = {
  padding: DEFAULT_FIT_BOUNDS_PADDING,
  maxZoom: DEFAULT_MAX_ZOOM
}
const FALLBACK_FIT_BOUNDS_PADDING = 20
const FEATURE_COLOR = '#1d70b8'
const FEATURE_FILL_OPACITY = 0.2
const FEATURE_LINE_WIDTH = 2
const BOUNDARY_COLOR = '#d4351c'
const BOUNDARY_FILL_OPACITY = 0.1
const BOUNDARY_LINE_WIDTH = 3

function collectCoords(c, coords) {
  if (!Array.isArray(c)) {
    return
  }

  if (typeof c[0] === 'number') {
    coords.push(c)
    return
  }

  c.forEach(function (inner) {
    collectCoords(inner, coords)
  })
}

function getBoundsFromGeojson(geojson) {
  if (!geojson) {
    return null
  }

  const coords = []
  ;(geojson.features || [geojson]).forEach(function (feature) {
    const geometry = feature.geometry ? feature.geometry : feature
    collectCoords(geometry.coordinates, coords)
  })

  if (!coords.length) {
    return null
  }

  let west = coords[0][0]
  let south = coords[0][1]
  let east = coords[0][0]
  let north = coords[0][1]

  coords.forEach(function (coord) {
    if (coord[0] < west) {
      west = coord[0]
    }
    if (coord[0] > east) {
      east = coord[0]
    }
    if (coord[1] < south) {
      south = coord[1]
    }
    if (coord[1] > north) {
      north = coord[1]
    }
  })

  return [
    [west, south],
    [east, north]
  ]
}

export function fitMapToBounds(map, geojson, fitBoundsOptions) {
  if (!map || !geojson) {
    return false
  }

  const bounds = getBoundsFromGeojson(geojson)
  if (!bounds) {
    return false
  }

  const resolvedFitBoundsOptions =
    fitBoundsOptions || DEFAULT_FIT_BOUNDS_OPTIONS

  map.fitBounds(bounds, resolvedFitBoundsOptions)
  return true
}

export function addSourceAndLayers(
  map,
  { sourceId, geojson, color, fillOpacity, lineWidth, linePaint = {} }
) {
  if (!geojson) {
    return false
  }

  if (map.getSource(sourceId)) {
    return false
  }

  map.addSource(sourceId, {
    type: 'geojson',
    data: geojson
  })

  map.addLayer({
    id: `${sourceId}-fill`,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': color,
      'fill-opacity': fillOpacity
    }
  })

  map.addLayer({
    id: `${sourceId}-line`,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': color,
      'line-width': lineWidth,
      ...linePaint
    }
  })

  return true
}

export function drawFeature(map, options = {}) {
  const { featureGeojson, boundaryGeojson, fallbackBounds, fitBoundsOptions } =
    options
  const resolvedFitBoundsOptions =
    fitBoundsOptions || DEFAULT_FIT_BOUNDS_OPTIONS

  if (!map) {
    return
  }

  addSourceAndLayers(map, {
    sourceId: FEATURE_SOURCE_ID,
    geojson: featureGeojson,
    color: FEATURE_COLOR,
    fillOpacity: FEATURE_FILL_OPACITY,
    lineWidth: FEATURE_LINE_WIDTH
  })

  addSourceAndLayers(map, {
    sourceId: BOUNDARY_SOURCE_ID,
    geojson: boundaryGeojson,
    color: BOUNDARY_COLOR,
    fillOpacity: BOUNDARY_FILL_OPACITY,
    lineWidth: BOUNDARY_LINE_WIDTH
  })

  const primaryGeojson = featureGeojson || boundaryGeojson
  if (fitMapToBounds(map, primaryGeojson, resolvedFitBoundsOptions)) {
    return
  }

  if (!primaryGeojson && fallbackBounds) {
    map.fitBounds(fallbackBounds, { padding: FALLBACK_FIT_BOUNDS_PADDING })
  }
}

export async function getLayers({
  layersUrl,
  filters = {},
  fetchImpl = globalThis.fetch
} = {}) {
  if (!layersUrl || typeof fetchImpl !== 'function') {
    return []
  }

  try {
    const url = new URL(layersUrl, globalThis.location?.origin)
    Object.entries(filters).forEach(function ([key, value]) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })

    const response = await fetchImpl(url.toString())
    if (!response.ok) {
      throw new Error(`Layer API returned ${response.status}`)
    }

    const payload = await response.json()
    if (Array.isArray(payload)) {
      return payload
    }

    if (Array.isArray(payload.layers)) {
      return payload.layers
    }

    return []
  } catch (err) {
    logWarning('Failed to load map layers', err)
    return []
  }
}
