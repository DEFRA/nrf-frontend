import { routePath as reviewDetailsPath } from '../review-details/route-path.js'

/**
 * Every variant is reviewed on the same page, so the redirect needs no
 * branching on the submitted data.
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage() {
  return reviewDetailsPath
}
