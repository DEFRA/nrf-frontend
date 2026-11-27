import { seedRequestToUseSessionWith } from './setup-seeded-request-to-use-server.js'
import { withCompleteQuoteSession } from './with-complete-quote-session.js'

/**
 * Seeds request to use answers after every response the server sends, as
 * `seedRequestToUseSessionWith` does, and owns the answers so a test file
 * needs no variable or setup helper of its own. The answers are cleared after
 * each test, so a test that seeds none runs with no request to use session.
 * @param {object} params
 * @param {() => import('@hapi/hapi').Server} params.getServer - the test server getter
 * @param {import('./setup-signed-in-test-server.js').SignIn} params.signIn - the signed-in test server's sign-in function
 * @returns {{ setSession: (session: object | null) => void, signInWithAnswers: (options: { claims?: object, session: object | null }) => Promise<string> }}
 */
export function setupSeededRequestToUseAnswers({ getServer, signIn }) {
  let session = null

  beforeAll(() => {
    seedRequestToUseSessionWith(getServer(), () => session)
  })

  afterEach(() => {
    session = null
  })

  /**
   * @param {object | null} answers - the request to use answers to save after every later response; null saves none
   * @returns {void}
   */
  function setSession(answers) {
    session = answers
  }

  /**
   * Seeds the answers, then signs in as the persona over a completed quote
   * session, so a page's guards see both the saved quote and the answers.
   * @param {object} options
   * @param {object} [options.claims] - the Defra ID token claims of the persona to sign in as
   * @param {object | null} options.session - the request to use answers to seed
   * @returns {Promise<string>} the signed-in session cookie
   */
  async function signInWithAnswers({ claims, session: answers }) {
    setSession(answers)

    const { cookie } = await signIn({
      claims,
      cookie: await withCompleteQuoteSession(getServer())
    })

    return cookie
  }

  return { setSession, signInWithAnswers }
}
