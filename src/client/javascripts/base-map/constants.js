export const VTS_STYLE_BASE_URL = '/public/data/vts'
export const VTS_THUMBNAIL_BASE_URL = '/public/data/vts/thumbnails'

export const ENGLAND_WEST_LNG = -5.75
export const ENGLAND_SOUTH_LAT = 49.95
export const ENGLAND_EAST_LNG = 1.8
export const ENGLAND_NORTH_LAT = 55.85
export const ENGLAND_BOUNDS = [
  ENGLAND_WEST_LNG,
  ENGLAND_SOUTH_LAT,
  ENGLAND_EAST_LNG,
  ENGLAND_NORTH_LAT
]
export const DEFAULT_MAP_BOUNDS = [
  [ENGLAND_WEST_LNG, ENGLAND_SOUTH_LAT],
  [ENGLAND_EAST_LNG, ENGLAND_NORTH_LAT]
]
export const ENGLAND_MIN_ZOOM = 4

export const DEFAULT_LAYER_FILL_OPACITY = 0.08
export const DEFAULT_LAYER_LINE_WIDTH = 2
export const LEGEND_OPACITY_MULTIPLIER = 4
export const LEGEND_MIN_OPACITY = 0.25

export const DRAW_PANEL_ID = 'draw'
export const BOUNDARY_INFO_PANEL_ID = 'boundary-info'
export const LAYERS_PANEL_ID = 'layers'
export const DRAW_ACTION_DRAW = 'draw'
export const DRAW_ACTION_EDIT = 'edit'
export const DRAW_ACTION_DELETE = 'delete'
export const BOUNDARY_ACTION_SAVE = 'save'
export const LAYER_ACTION_TOGGLE = 'toggle-layer'
export const DRAW_EVENT_CREATED = 'draw:created'
export const NOT_AVAILABLE_TEXT = 'Not available'

export const PENCIL_SVG =
  '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'
export const LAYERS_SVG =
  '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>'
