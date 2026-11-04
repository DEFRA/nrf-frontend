import { routePath as excludedAreaPath } from '../../excluded-area/route-path.js'
import { routePath as notInEdpPath } from '../../not-in-edp/route-path.js'

/**
 * The dropout page an ineligible saved boundary must show, derived from the
 * cached boundary check result — the boundary save handlers cache the geojson
 * (including its intersect lists) before redirecting to a dropout, so a
 * continue from check your answers or the review page can rerun the same
 * decision without calling the boundary check again.
 * @param {object} [quoteData] - the cached quote data
 * @returns {string | undefined} the quote journey's dropout path, or undefined
 *   when the boundary is eligible or not saved yet
 */
export const getBoundaryDropoutPath = (quoteData) => {
  const { boundaryGeojson } = quoteData ?? {}
  if (!boundaryGeojson) {
    return undefined
  }

  const { intersectingEdps = [], intersectingExcludedAreas = [] } =
    boundaryGeojson

  // Exclusion zones sit inside their EDP, so intersectingEdps stays populated
  // for an excluded boundary — the excluded check must win, matching the order
  // the boundary save handlers redirect in. A boundary seeded from a saved
  // quote has no intersectingExcludedAreas key, hence the default.
  if (intersectingExcludedAreas.length > 0) {
    return excludedAreaPath
  }

  return intersectingEdps.length === 0 ? notInEdpPath : undefined
}
