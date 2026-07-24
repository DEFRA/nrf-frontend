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
