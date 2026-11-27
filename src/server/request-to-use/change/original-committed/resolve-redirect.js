import { requestToUseSession } from '../../helpers/request-to-use-session/index.js'
import { routePath as checkYourAnswersPath } from '../../check-your-answers/route-path.js'
import { routePath as changeOriginalReferencePath } from '../original-reference/route-path.js'

/**
 * A yes with no reference (never given, or discarded by an earlier no)
 * continues to the reference page before returning to check your answers.
 * @param {{ request: import('@hapi/hapi').Request }} params
 * @returns {string} redirect path
 */
export default function resolveRedirect({ request }) {
  const { originalCommitted, originalNrlReference } =
    requestToUseSession.get(request) ?? {}

  return originalCommitted === 'yes' && originalNrlReference === undefined
    ? changeOriginalReferencePath
    : checkYourAnswersPath
}
