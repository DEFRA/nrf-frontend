import { routePath as planningTypePath } from '../../quote/planning-type/route-path.js'

// Page not built yet: swap for a route-path.js import when it exists
const haveNrlReferencePath = '/request-to-use/have-nrl-reference'

/**
 * @param {{ whatWouldYouLikeToDo: string }} formData - the validated payload
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage({ whatWouldYouLikeToDo }) {
  if (whatWouldYouLikeToDo === 'request-to-use') {
    return haveNrlReferencePath
  }

  return planningTypePath
}
