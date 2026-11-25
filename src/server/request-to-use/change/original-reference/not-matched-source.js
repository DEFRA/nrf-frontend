import { routePath } from './route-path.js'

export const referenceNotMatchedSource = 'reference-not-matched'
export const boundaryNotMatchedSource = 'boundary-not-matched'

/**
 * The change original reference page's path when reached from a not matched
 * page, so its back link returns there until the reference is corrected.
 * @param {string} source - which not matched page the user came from
 * @returns {string} the change original reference path carrying the source
 */
export const getPathFromNotMatchedPage = (source) =>
  `${routePath}?${new URLSearchParams({ from: source })}`
