const MAP_ELEMENT_ID = 'draw-boundary-map'

/**
 * @param {{ csrfToken?: string, backLinkPath?: string, existingBoundaryGeojson?: object, existingBoundaryMetadata?: object }} [params]
 */
export function createMapElement({
  csrfToken = 'csrf-token',
  backLinkPath = '/quote/boundary-type',
  existingBoundaryGeojson,
  existingBoundaryMetadata
} = {}) {
  const el = document.createElement('div')
  el.id = MAP_ELEMENT_ID
  el.dataset.csrfToken = csrfToken
  el.dataset.backLinkPath = backLinkPath
  if (existingBoundaryGeojson !== undefined) {
    el.dataset.existingBoundaryGeojson = JSON.stringify(existingBoundaryGeojson)
  }
  if (existingBoundaryMetadata !== undefined) {
    el.dataset.existingBoundaryMetadata = JSON.stringify(
      existingBoundaryMetadata
    )
  }
  document.body.appendChild(el)
  return el
}
