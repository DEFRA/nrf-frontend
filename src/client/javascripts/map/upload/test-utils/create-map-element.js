const MAP_ELEMENT_ID = 'boundary-map'

/**
 * @param {{ existingBoundaryGeojson?: object|string, existingBoundaryMetadata?: object|string }} [params]
 */
export function createMapElement({
  existingBoundaryGeojson,
  existingBoundaryMetadata
} = {}) {
  const el = document.createElement('div')
  el.id = MAP_ELEMENT_ID
  if (existingBoundaryGeojson !== undefined) {
    el.dataset.existingBoundaryGeojson =
      typeof existingBoundaryGeojson === 'string'
        ? existingBoundaryGeojson
        : JSON.stringify(existingBoundaryGeojson)
  }
  if (existingBoundaryMetadata !== undefined) {
    el.dataset.existingBoundaryMetadata =
      typeof existingBoundaryMetadata === 'string'
        ? existingBoundaryMetadata
        : JSON.stringify(existingBoundaryMetadata)
  }
  document.body.appendChild(el)
  return el
}
