import {
  BOUNDS_DECIMAL_PLACES,
  BOUNDS_MAX_X_INDEX,
  BOUNDS_MAX_Y_INDEX,
  BOUNDS_MIN_X_INDEX,
  BOUNDS_MIN_Y_INDEX,
  NOT_AVAILABLE_TEXT
} from './constants.js'

export function formatBounds(bounds) {
  if (!Array.isArray(bounds) || bounds.length !== 4) {
    return NOT_AVAILABLE_TEXT
  }

  return bounds
    .map((value) => Number(value).toFixed(BOUNDS_DECIMAL_PLACES))
    .join(', ')
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

  if (
    formatted.length === 1 &&
    [NOT_AVAILABLE_TEXT, 'None'].includes(formatted[0])
  ) {
    container.textContent = formatted[0]
    return
  }

  container.textContent = ''
  const list = document.createElement('ul')
  list.className =
    'govuk-list govuk-list--bullet govuk-!-font-size-16 govuk-!-margin-bottom-0'

  formatted.forEach((value) => {
    const item = document.createElement('li')
    item.textContent = value
    list.appendChild(item)
  })

  container.appendChild(list)
}

function collectCoordinatePairs(value, pairs = []) {
  if (!Array.isArray(value)) {
    return pairs
  }

  if (
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  ) {
    pairs.push(value)
    return pairs
  }

  value.forEach((item) => collectCoordinatePairs(item, pairs))
  return pairs
}

function getBoundsFromGeometry(geometry) {
  const coordinatePairs = collectCoordinatePairs(geometry?.coordinates)
  if (!coordinatePairs.length) {
    return null
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  coordinatePairs.forEach(([x, y]) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  })

  return [minX, minY, maxX, maxY]
}

function mergeBounds(a, b) {
  if (!a) {
    return b || null
  }

  if (!b) {
    return a
  }

  return [
    Math.min(a[BOUNDS_MIN_X_INDEX], b[BOUNDS_MIN_X_INDEX]),
    Math.min(a[BOUNDS_MIN_Y_INDEX], b[BOUNDS_MIN_Y_INDEX]),
    Math.max(a[BOUNDS_MAX_X_INDEX], b[BOUNDS_MAX_X_INDEX]),
    Math.max(a[BOUNDS_MAX_Y_INDEX], b[BOUNDS_MAX_Y_INDEX])
  ]
}

function getBoundsFromGeoJsonValue(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  if (value.type === 'FeatureCollection' && Array.isArray(value.features)) {
    return value.features.reduce(
      (bounds, feature) =>
        mergeBounds(bounds, getBoundsFromGeoJsonValue(feature)),
      null
    )
  }

  if (value.type === 'Feature') {
    return getBoundsFromGeoJsonValue(value.geometry)
  }

  return getBoundsFromGeometry(value)
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

function resolveBounds(payload, src, geometry) {
  return resolveField(
    payload?.bounds,
    src?.bounds,
    payload?.boundingBox,
    src?.boundingBox,
    payload?.bbox,
    src?.bbox,
    getBoundsFromGeoJsonValue(geometry)
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

export function normalizeBoundaryInfoResponse(payload) {
  const src = payload?.geojson ?? payload ?? {}
  const intersectingEdps = resolveIntersectingEdps(payload, src)
  const geometry = resolveGeometry(payload, src)
  const error = resolveError(payload, src)

  return {
    isValid: resolveIsValid(payload, src, geometry, intersectingEdps, error),
    bounds: resolveBounds(payload, src, geometry),
    intersectingEdps,
    error,
    raw: payload
  }
}
