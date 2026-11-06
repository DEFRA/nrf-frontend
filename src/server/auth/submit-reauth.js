import { AUTH_SIGN_IN_PATH } from './auth-urls.js'

const SUBMIT_REAUTH_KEY = 'submitReauth'
const PENDING = 'pending'
const VERIFIED = 'verified'

export const SILENT_SIGN_IN_PATH = `${AUTH_SIGN_IN_PATH}?prompt=none`

const NO_SESSION_ERRORS = new Set(['interaction_required', 'login_required'])

/**
 * Marks that a submit is waiting for Defra ID to confirm the user is still signed in.
 * @param {import('@hapi/hapi').Request} request
 */
export const startSubmitReauth = (request) =>
  request.yar.set(SUBMIT_REAUTH_KEY, PENDING)

/**
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} true while a submit is waiting for the Defra ID check
 */
export const isSubmitReauthPending = (request) =>
  request.yar.get(SUBMIT_REAUTH_KEY) === PENDING

/**
 * Whether the OAuth callback is Defra ID answering a pending silent check with
 * "no Defra ID session" (state must match, so a forged callback is not honoured).
 * @param {import('@hapi/hapi').Request} request - the /login/return request
 * @returns {boolean}
 */
export const isNoDefraIdSessionCallback = (request) =>
  NO_SESSION_ERRORS.has(request.query.error) &&
  isSubmitReauthPending(request) &&
  request.query.state === request.yar.get('oauth_state')

/**
 * Records that the pending Defra ID check passed (silent or full sign-in).
 * @param {import('@hapi/hapi').Request} request
 */
export const completeSubmitReauth = (request) => {
  if (isSubmitReauthPending(request)) {
    request.yar.set(SUBMIT_REAUTH_KEY, VERIFIED)
  }
}

/**
 * One-shot: lets exactly one submit through after a passed Defra ID check.
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean} true if the check had passed
 */
export const consumeVerifiedSubmitReauth = (request) => {
  const verified = request.yar.get(SUBMIT_REAUTH_KEY) === VERIFIED
  if (verified) {
    request.yar.clear(SUBMIT_REAUTH_KEY)
  }
  return verified
}
