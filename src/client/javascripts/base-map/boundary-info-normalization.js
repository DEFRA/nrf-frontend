import { NOT_AVAILABLE_TEXT } from './constants.js'

export function formatArea(area) {
  if (!area || typeof area !== 'object') {
    return NOT_AVAILABLE_TEXT
  }
  const { hectares, acres } = area
  if (hectares == null || acres == null) {
    return NOT_AVAILABLE_TEXT
  }
  return `${hectares}ha (${acres}acres)`
}

export function formatPerimeter(perimeter) {
  if (!perimeter || typeof perimeter !== 'object') {
    return NOT_AVAILABLE_TEXT
  }
  const { kilometres, miles } = perimeter
  if (kilometres == null || miles == null) {
    return NOT_AVAILABLE_TEXT
  }
  return `${kilometres}km (${miles}mi)`
}

function formatIntersectionItem(item) {
  if (typeof item === 'string') {
    return item
  }

  if (!item || typeof item !== 'object') {
    return String(item)
  }

  const name = item.name ?? item.label
  const code = item.code ?? item.id

  if (name && code) {
    return `${name} (${code})`
  }

  if (name) {
    return String(name)
  }

  if (code) {
    return String(code)
  }

  return JSON.stringify(item)
}

export function formatIntersections(intersections) {
  if (!Array.isArray(intersections)) {
    return [NOT_AVAILABLE_TEXT]
  }

  if (!intersections.length) {
    return ['None']
  }

  return intersections.map(formatIntersectionItem)
}

export function renderIntersections(container, intersections) {
  const formatted = formatIntersections(intersections)

  container.textContent = ''

  formatted.forEach((value) => {
    const item = document.createElement('li')
    item.textContent = value
    container.appendChild(item)
  })
}

function resolveField(...candidates) {
  for (const candidate of candidates) {
    if (candidate !== null && candidate !== undefined) {
      return candidate
    }
  }

  return null
}

function resolveIntersectingEdps(payload, src) {
  return resolveField(
    payload?.intersectingEdps,
    src?.intersectingEdps,
    payload?.edps,
    src?.edps,
    payload?.intersections?.edps,
    src?.intersections?.edps
  )
}

function resolveGeometry(payload, src) {
  return resolveField(
    payload?.boundaryGeometryWgs84,
    src?.boundaryGeometryWgs84,
    payload?.boundaryGeometryOriginal,
    src?.boundaryGeometryOriginal,
    payload?.geometry,
    src?.geometry,
    payload?.geojson?.geometry,
    src?.geojson?.geometry
  )
}

function resolveError(payload, src) {
  return resolveField(
    payload?.error,
    src?.error,
    payload?.message,
    src?.message
  )
}

function resolveIsValid(payload, src, geometry, intersectingEdps, error) {
  const explicit = resolveField(
    payload?.isValid,
    src?.isValid,
    payload?.valid,
    src?.valid,
    payload?.validation?.isValid,
    src?.validation?.isValid
  )

  const inferred =
    Boolean(geometry) && Array.isArray(intersectingEdps) && !error

  return !!(explicit ?? inferred)
}

function extractAllCoords(geometry) {
  if (!geometry) {
    return []
  }
  if (geometry.type === 'FeatureCollection') {
    return geometry.features.flatMap((f) => extractAllCoords(f.geometry))
  }
  if (geometry.type === 'Feature') {
    return extractAllCoords(geometry.geometry)
  }
  return geometry.coordinates ? geometry.coordinates.flat(Infinity) : []
}

function computeBoundsFromGeometry(geometry) {
  const flat = extractAllCoords(geometry)
  if (!flat.length) {
    return null
  }

  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  for (let i = 0; i < flat.length - 1; i += 2) {
    const lng = flat[i]
    const lat = flat[i + 1]
    if (lng < minLng) {
      minLng = lng
    }
    if (lat < minLat) {
      minLat = lat
    }
    if (lng > maxLng) {
      maxLng = lng
    }
    if (lat > maxLat) {
      maxLat = lat
    }
  }

  if (!Number.isFinite(minLng)) {
    return null
  }
  return [minLng, minLat, maxLng, maxLat]
}

export function normalizeBoundaryInfoResponse(payload) {
  const src = payload?.geojson ?? payload ?? {}
  const intersectingEdps = resolveIntersectingEdps(payload, src)
  const geometry = resolveGeometry(payload, src)
  const error = resolveError(payload, src)
  const metadata = payload?.boundaryMetadata ?? src?.boundaryMetadata

  return {
    isValid: resolveIsValid(payload, src, geometry, intersectingEdps, error),
    area: metadata?.area ?? null,
    perimeter: metadata?.perimeter ?? null,
    intersectingEdps,
    bounds: computeBoundsFromGeometry(geometry),
    error,
    raw: payload
  }
}
