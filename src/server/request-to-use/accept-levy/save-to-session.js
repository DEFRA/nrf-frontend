import { requestToUseSession } from '../helpers/request-to-use-session/index.js'

/**
 * Saves an accepted levy amount only. Declining is not an answer to keep: it
 * takes the delete quote path, and backing out must leave the question as it
 * was, so the submitted value is returned unsaved for the next page to
 * resolve from.
 * @param {import('@hapi/hapi').Request} request
 * @param {{ acceptLevy: string }} payload - the validated payload
 * @returns {object | null} the merged session data for the next page
 */
export const saveAcceptedLevy = (request, payload) =>
  payload.acceptLevy === 'yes'
    ? requestToUseSession.save(request, payload)
    : { ...requestToUseSession.get(request), acceptLevy: payload.acceptLevy }
