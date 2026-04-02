import { logWarning } from './helpers.js'

const FEATURE_SOURCE_ID = 'feature'
const BOUNDARY_SOURCE_ID = 'boundary'

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

export function fitMapToBounds(
  map,
  geojson,
  fitBoundsOptions = { padding: 40, maxZoom: 15 }
) {
  if (!map || !geojson) {
    return false
  }

  const bounds = getBoundsFromGeojson(geojson)
  if (!bounds) {
    return false
  }

  map.fitBounds(bounds, fitBoundsOptions)
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

export function drawFeature(
  map,
  {
    featureGeojson,
    boundaryGeojson,
    fallbackBounds,
    fitBoundsOptions = { padding: 40, maxZoom: 15 }
  }
) {
  if (!map) {
    return
  }

  addSourceAndLayers(map, {
    sourceId: FEATURE_SOURCE_ID,
    geojson: featureGeojson,
    color: '#1d70b8',
    fillOpacity: 0.2,
    lineWidth: 2
  })

  addSourceAndLayers(map, {
    sourceId: BOUNDARY_SOURCE_ID,
    geojson: boundaryGeojson,
    color: '#d4351c',
    fillOpacity: 0.1,
    lineWidth: 3
  })

  const primaryGeojson = featureGeojson || boundaryGeojson
  if (fitMapToBounds(map, primaryGeojson, fitBoundsOptions)) {
    return
  }

  if (!primaryGeojson && fallbackBounds) {
    map.fitBounds(fallbackBounds, { padding: 20 })
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
