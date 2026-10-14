import { createSessionRequest } from './create-session-request.js'
import { requestToUseJourneySession } from './fixtures/session.js'

/**
 * A mock request for a retrieve quote page, in a valid retrieve quote session
 * unless told otherwise.
 * @param {object} params
 * @param {string} params.path
 * @param {string} [params.method]
 * @param {object} [params.query]
 * @param {Record<string, unknown>} [params.session]
 * @returns {object}
 */
export const createRetrieveQuoteRequest = ({
  path,
  method = 'get',
  query = {},
  session = requestToUseJourneySession
}) => createSessionRequest({ session, path, method, query })
