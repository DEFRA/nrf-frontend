import { routePath as noNrlReferencePath } from '../no-nrl-reference/route-path.js'

// Pages not built yet: swap for route-path.js imports when they exist
const quoteReferencePath = '/request-to-use/quote-reference'

/**
 * @param {{ hasNrlReference: string }} formData - the validated payload
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage({ hasNrlReference }) {
  if (hasNrlReference === 'yes') {
    return quoteReferencePath
  }

  return noNrlReferencePath
}
