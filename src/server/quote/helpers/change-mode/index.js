import { routePath as applicationTypeNotAvailablePath } from '../../application-type-not-available/route-path.js'
import { routePath as notHousingPath } from '../../not-housing/route-path.js'
import { routePath as notInEdpPath } from '../../not-in-edp/route-path.js'
import { routePath as excludedAreaPath } from '../../excluded-area/route-path.js'

// Pages that end the journey with an ineligible answer. In change mode these
// still take precedence over the return to check-your-answers (the user must
// see why they can't continue), and they link back into the journey carrying
// change=true so a corrected answer returns to check-your-answers instead of
// restarting the whole journey.
const dropoutPaths = new Set([
  applicationTypeNotAvailablePath,
  notHousingPath,
  notInEdpPath,
  excludedAreaPath
])

/**
 * @param {string} path
 * @returns {boolean}
 */
export const isDropoutPage = (path) => dropoutPaths.has(path)

/**
 * Whether the request is in change mode — the user is editing a previous
 * answer from check-your-answers rather than walking the journey forwards.
 * @param {object} [query] - the parsed request query
 * @returns {boolean}
 */
export const isChangeMode = (query) => query?.change === 'true'

/**
 * Appends ?change=true when the request is in change mode, so redirects and
 * back links keep the mode alive across PRG navigations.
 * @param {string} path - a path without an existing query string is assumed to
 * be a bare path; an existing query string is preserved
 * @param {object} [query] - the parsed request query
 * @returns {string}
 */
export const appendChangeParam = (path, query) => {
  if (!isChangeMode(query)) {
    return path
  }
  const [pathname, search] = path.split('?')
  const params = new URLSearchParams(search)
  params.set('change', 'true')
  return `${pathname}?${params.toString()}`
}
