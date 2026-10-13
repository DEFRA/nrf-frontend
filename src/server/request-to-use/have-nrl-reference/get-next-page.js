// Pages not built yet: swap for route-path.js imports when they exist
const quoteReferencePath = '/request-to-use/quote-reference'
const noNrlReferencePath = '/request-to-use/no-nrl-reference'

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
