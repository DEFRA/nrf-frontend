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
