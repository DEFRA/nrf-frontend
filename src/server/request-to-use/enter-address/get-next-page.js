// Literal paths: the review pages are not built yet. Swap for route-path.js
// imports when they exist.
const reviewDeveloperDetailsPath = '/request-to-use/review-developer-details'
const reviewYourDetailsPath = '/request-to-use/review-your-details'

/**
 * The developer details variant is reviewed on its own page; the individual
 * and organisation variants share one. The variant is resolved on the server
 * by saveEnterAddress, never from the submitted form.
 * @param {{ formVariant?: string }} data - the merged request to use session data with the server-resolved variant
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage(data = {}) {
  return data.formVariant === 'agent'
    ? reviewDeveloperDetailsPath
    : reviewYourDetailsPath
}
