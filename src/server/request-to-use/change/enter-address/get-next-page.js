import { routePath as checkYourAnswersPath } from '../../check-your-answers/route-path.js'

/**
 * A changed address or full name returns to the page it was edited from.
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage() {
  return checkYourAnswersPath
}
