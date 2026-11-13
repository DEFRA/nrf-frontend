// Literal path: the review details page is not built yet. Swap for a
// route-path.js import when it exists.
const reviewDetailsPath = '/request-to-use/review-details'

/**
 * Every variant is reviewed on the same page, so the redirect needs no
 * branching on the submitted data.
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage() {
  return reviewDetailsPath
}
