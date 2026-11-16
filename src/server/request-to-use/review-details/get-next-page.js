import { routePath as readThisPath } from '../read-this/route-path.js'

/**
 * Confirming the details moves every persona on to the details to read page,
 * so the redirect needs no branching on the session data.
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage() {
  return readThisPath
}
