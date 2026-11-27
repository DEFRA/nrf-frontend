import { requestToUseSession } from '../../helpers/request-to-use-session/index.js'
import { routePath as checkYourAnswersPath } from '../../check-your-answers/route-path.js'
import { routePath as changeOriginalCommittedPath } from '../original-committed/route-path.js'

/**
 * A yes with no original permission answers (never given, or discarded by an
 * earlier no) continues through them before returning to check your answers.
 * @param {{ request: import('@hapi/hapi').Request }} params
 * @returns {string} redirect path
 */
export default function resolveRedirect({ request }) {
  const { variation, originalCommitted } =
    requestToUseSession.get(request) ?? {}

  return variation === 'yes' && originalCommitted === undefined
    ? changeOriginalCommittedPath
    : checkYourAnswersPath
}
