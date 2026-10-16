import { routePath as emailConfirmationPath } from '../email-confirmation/route-path.js'
import { routePath as quoteNotMatchedPath } from '../quote-not-matched/route-path.js'

/**
 * @param {boolean} quoteMatched - whether a quote exists for the NRL reference and email
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage(quoteMatched) {
  return quoteMatched ? emailConfirmationPath : quoteNotMatchedPath
}
