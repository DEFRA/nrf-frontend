import { AUTH_SIGN_IN_PATH } from './auth-urls.js'

const SUBMIT_REAUTH_KEY = 'submitReauth'
const PENDING = 'pending'
const VERIFIED = 'verified'

export const SILENT_SIGN_IN_PATH = `${AUTH_SIGN_IN_PATH}?prompt=none`

const NO_SESSION_ERRORS = new Set(['interaction_required', 'login_required'])

/**
 * Whether Defra ID reported, for a prompt=none request, that the user has no Defra ID session.
 * @param {string | undefined} error - the OAuth `error` query value
 * @returns {boolean}
 */
export const isNoDefraIdSessionError = (error) => NO_SESSION_ERRORS.has(error)

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
