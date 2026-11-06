import { submitForm } from './submit-form.js'
import { completeDefraSignIn } from './complete-defra-sign-in.js'

const silentSignInPath = '/auth/sign-in?prompt=none'

/**
 * Drives a page's submit through the silent Defra ID check (the POST, then the
 * prompt=none sign-in returning) until the user is back on the page, ready to submit again.
 * @param {Object} options
 * @param {import('@hapi/hapi').Server} options.server - Initialised Hapi server
 * @param {string} options.requestUrl - Path of the page that checks before submitting
 * @param {string} options.cookie - Session cookie holding the journey answers
 * @returns {ReturnType<typeof completeDefraSignIn>} the /login/return response and the session cookie to submit with
 */
export async function passDefraIdCheck({ server, requestUrl, cookie }) {
  const started = await submitForm({
    requestUrl,
    server,
    formData: {},
    cookie
  })
  return completeDefraSignIn({
    server,
    cookie: started.cookie,
    signInUrl: silentSignInPath
  })
}
