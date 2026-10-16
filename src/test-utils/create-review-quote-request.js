import { createSessionRequest } from './create-session-request.js'
import { reviewQuoteSession } from './fixtures/session.js'

/**
 * A mock request for the review quote details page, in a valid review quote
 * session unless told otherwise.
 * @param {object} params
 * @param {string} params.path
 * @param {string} [params.method]
 * @param {object} [params.query]
 * @param {Record<string, unknown>} [params.session]
 * @returns {object}
 */
export const createReviewQuoteRequest = ({
  path,
  method = 'get',
  query = {},
  session = reviewQuoteSession
}) => createSessionRequest({ session, path, method, query })
