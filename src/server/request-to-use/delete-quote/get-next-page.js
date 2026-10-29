// Literal path: the delete quote confirmation page for this journey is not
// built yet. Swap for its route-path import when it exists.
const deleteQuoteConfirmationPath = '/request-to-use/delete-quote-confirmation'

/**
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage() {
  return deleteQuoteConfirmationPath
}
