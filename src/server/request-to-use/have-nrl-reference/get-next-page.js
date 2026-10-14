import { routePath as noNrlReferencePath } from '../no-nrl-reference/route-path.js'
import { routePath as enterNrlReferencePath } from '../enter-nrl-reference/route-path.js'

/**
 * @param {{ hasNrlReference: string }} formData - the validated payload
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage({ hasNrlReference }) {
  if (hasNrlReference === 'yes') {
    return enterNrlReferencePath
  }

  return noNrlReferencePath
}
