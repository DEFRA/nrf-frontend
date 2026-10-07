export const VTS_STYLE_BASE_URL = '/public/data/vts'
export const VTS_THUMBNAIL_BASE_URL = '/public/data/vts/thumbnails'

export const BOUNDARY_MAP_MAX_ZOOM = 18

// The APGB aerial WMTS tile matrix stops at zoom 21, and MapLibre's default
// map maximum is 22 — so without this cap the aerial style maxes out one zoom
// lower than the OS vector styles. 21 is the lowest common maximum every
// basemap can genuinely serve.
export const DRAW_MAP_MAX_ZOOM = 21

const NORFOLK_LONGITUDE = 1.1405503
const NORFOLK_LATITUDE = 52.7089441

export const DEFAULT_MAP_CENTER = [NORFOLK_LONGITUDE, NORFOLK_LATITUDE]

// England plus a margin, so a boundary on the coast or the Welsh or Scottish
// border can still be seen in context.
const ENGLAND_WEST_LONGITUDE = -7.5
const ENGLAND_SOUTH_LATITUDE = 49.5
const ENGLAND_EAST_LONGITUDE = 2.5
const ENGLAND_NORTH_LATITUDE = 56.2

export const ENGLAND_MAX_BOUNDS = [
  ENGLAND_WEST_LONGITUDE,
  ENGLAND_SOUTH_LATITUDE,
  ENGLAND_EAST_LONGITUDE,
  ENGLAND_NORTH_LATITUDE
]
