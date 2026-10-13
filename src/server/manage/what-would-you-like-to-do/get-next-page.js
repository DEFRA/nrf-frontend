import { routePath as planningTypePath } from '../../quote/planning-type/route-path.js'
import { routePath as haveNrlReferencePath } from '../../request-to-use/have-nrl-reference/route-path.js'

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
