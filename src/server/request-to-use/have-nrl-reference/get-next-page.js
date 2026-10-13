import { routePath as enterNrlReferencePath } from '../enter-nrl-reference/route-path.js'

// Page not built yet: swap for a route-path.js import when it exists
const noNrlReferencePath = '/request-to-use/no-nrl-reference'

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
