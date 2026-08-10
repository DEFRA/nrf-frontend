const MAP_ELEMENT_ID = 'draw-boundary-map'

/**
 * @param {{ csrfToken?: string, backLinkPath?: string, boundaryValidationUrl?: string, saveAndContinueUrl?: string, existingBoundaryGeojson?: object, existingBoundaryMetadata?: object }} [params]
 */
export function createMapElement({
  csrfToken = 'csrf-token',
  backLinkPath = '/quote/boundary-type',
  boundaryValidationUrl = '/quote/draw-boundary/check',
  saveAndContinueUrl = '/quote/draw-boundary/save',
  existingBoundaryGeojson,
  existingBoundaryMetadata
} = {}) {
  const el = document.createElement('div')
  el.id = MAP_ELEMENT_ID
  el.dataset.csrfToken = csrfToken
  el.dataset.backLinkPath = backLinkPath
  el.dataset.boundaryValidationUrl = boundaryValidationUrl
  el.dataset.saveAndContinueUrl = saveAndContinueUrl
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
