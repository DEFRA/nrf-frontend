import { logWarning } from './base-map/helpers.js'

/** Bounding box for England in [lng, lat] format (WGS84). */
export const ENGLAND_WEST_LNG = -5.75
export const ENGLAND_SOUTH_LAT = 49.95
export const ENGLAND_EAST_LNG = 1.8
export const ENGLAND_NORTH_LAT = 55.85

export const DEFAULT_MAP_BOUNDS = [
  [ENGLAND_WEST_LNG, ENGLAND_SOUTH_LAT],
  [ENGLAND_EAST_LNG, ENGLAND_NORTH_LAT]
]

// Min zoom level avoids showing unsightly blank white space where we do
// not have vector tile coverage for the rest of the world.
export const MIN_ZOOM = 4

export function getMapStyleUrl(mapEl) {
  return mapEl.dataset.mapStyleUrl
}

function getOrdnanceSurveyAttribution() {
  return `&copy; Crown copyright and database rights ${new Date().getFullYear()} Ordnance Survey`
}

export function createInlineMapOptions({
  mapProvider,
  mapLabel,
  mapStyles,
  containerHeight,
  extraOptions = {}
}) {
  return {
    mapProvider,
    behaviour: 'inline',
    mapLabel,
    containerHeight,
    enableZoomControls: true,
    mapStyle: {
      url: mapStyles[0]?.url,
      attribution: getOrdnanceSurveyAttribution()
    },
    ...extraOptions
  }
}

export function configureEnglandMap(mapInstance) {
  mapInstance.setMinZoom(MIN_ZOOM)
  mapInstance.setMaxBounds([
    [ENGLAND_WEST_LNG, ENGLAND_SOUTH_LAT],
    [ENGLAND_EAST_LNG, ENGLAND_NORTH_LAT]
  ])
  mapInstance.on('error', function (err) {
    logWarning('Map error', err.error || err)
  })
}
