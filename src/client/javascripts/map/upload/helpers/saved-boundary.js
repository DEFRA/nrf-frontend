// Renders the saved boundary as a static, non-interactive GeoJSON source with
// fixed fill/line paint layers. This is only for read-only preview use (e.g.
// the upload-preview map). The draw map hydrates the saved boundary into
// MapboxDraw instead (see draw/helpers/saved-boundary.js),
// because there it must stay editable — reusing this function there would
// render the shape without making it selectable/editable in the draw tool.

/**
 * @param {object} map - MapLibre map instance
 * @param {object} options
 * @param {string} options.sourceId
 * @param {object} options.geojson
 * @param {string} options.color
 * @param {number} options.fillOpacity
 * @param {number} options.lineWidth
 * @param {object} [options.linePaint]
 * @returns {boolean}
 */
export function renderSavedBoundary(
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

const BOUNDARY_SOURCE_ID = 'boundary'

// Copied from the shapeStroke/shapeFill/strokeWidth defaults in
// @defra/interactive-map's draw-ml plugin
// (node_modules/@defra/interactive-map/plugins/beta/draw-ml/src/defaults.js).
// That plugin has no public API for these values, so this is duplicated by
// hand to keep the read-only preview visually matching the boundary drawn by
// the draw tool.
const BOUNDARY_COLOR = 'rgba(212,53,28,1)'
const BOUNDARY_FILL_OPACITY = 0.1
const BOUNDARY_LINE_WIDTH = 2

/**
 * @param {object} map
 * @param {object|null} initialFeature
 */
export function wireSavedBoundary(map, initialFeature) {
  // A single once('style.load', ...) listener can miss the point at which
  // the style actually finishes loading — 'styledata' fires multiple times
  // while a style is being built up, so re-check isStyleLoaded() on every
  // occurrence rather than trusting the first one.
  //
  // This listener is kept subscribed (not once()) rather than detached after
  // the first successful render, because switching the base map style (via
  // the map styles panel) calls maplibre's setStyle(), which fully replaces
  // the style and clears any manually-added sources/layers — including this
  // boundary. Re-running on every styledata event re-adds it after a style
  // switch too; renderSavedBoundary is a no-op while the source still exists.
  function renderIfStyleReady() {
    if (!map.isStyleLoaded()) {
      return
    }

    renderSavedBoundary(map, {
      sourceId: BOUNDARY_SOURCE_ID,
      geojson: initialFeature,
      color: BOUNDARY_COLOR,
      fillOpacity: BOUNDARY_FILL_OPACITY,
      lineWidth: BOUNDARY_LINE_WIDTH
    })
  }

  renderIfStyleReady()
  map.on('styledata', renderIfStyleReady)
}
