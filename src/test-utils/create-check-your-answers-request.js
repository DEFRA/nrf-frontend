import { createSessionRequest } from './create-session-request.js'
import { currentRelationshipId } from './fixtures/defra-id-org-claims.js'

const checkYourAnswersPath = '/request-to-use/check-your-answers'

/**
 * A mock request for the request to use check your answers page, signed in as
 * the Defra ID relationship the fixtures' address was entered under unless
 * told otherwise.
 * @param {object} [params]
 * @param {object | undefined} [params.requestToUse] - the request to use session data; omitted for no session
 * @param {object} [params.query] - the parsed request query
 * @param {string} [params.relationshipId] - the signed-in user's relationship
 * @returns {object}
 */
export const createCheckYourAnswersRequest = ({
  requestToUse,
  query = {},
  relationshipId = currentRelationshipId
} = {}) =>
  createSessionRequest({
    session: { requestToUse },
    path: checkYourAnswersPath,
    query,
    auth: {
      credentials: { profile: { currentRelationshipId: relationshipId } }
    }
  })
