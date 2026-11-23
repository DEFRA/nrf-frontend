import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { getYarCookie } from '../../../test-utils/yar-cookie.js'

const ROUTE_PATH = '/request-to-use/enter-address'
const SIGN_IN_PATH = '/auth/sign-in'
const MINUTE_MS = 60 * 1000
const DEFRA_ID_TOKEN_LIFETIME_MS = 60 * MINUTE_MS
const SERVICE_SESSION_LIFETIME_MS = 120 * MINUTE_MS

const { getServer, signIn } = setupSignedInTestServer()

describe('Enter address page when the session has expired', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const loadPageAfter = async (elapsedMs) => {
    const { cookie } = await signIn()
    const signedIn = await getServer().inject({
      method: 'GET',
      url: ROUTE_PATH,
      headers: { cookie }
    })
    expect(signedIn.statusCode).toBe(200)

    vi.setSystemTime(Date.now() + elapsedMs)

    return getServer().inject({
      method: 'GET',
      url: ROUTE_PATH,
      headers: { cookie }
    })
  }

  const expectRedirectToSignInThenBack = async (response) => {
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(SIGN_IN_PATH)

    const { response: returned } = await signIn({
      cookie: getYarCookie(response)
    })
    expect(returned.headers.location).toBe(ROUTE_PATH)
  }

  it('is still available just inside the Defra ID token lifetime', async () => {
    const { cookie } = await signIn()

    vi.setSystemTime(Date.now() + DEFRA_ID_TOKEN_LIFETIME_MS - 2 * MINUTE_MS)

    const response = await getServer().inject({
      method: 'GET',
      url: ROUTE_PATH,
      headers: { cookie }
    })

    expect(response.statusCode).toBe(200)
  })

  it('redirects to Defra ID sign-in once the Defra ID session has expired after 1 hour, then returns to the page', async () => {
    const response = await loadPageAfter(DEFRA_ID_TOKEN_LIFETIME_MS + MINUTE_MS)

    await expectRedirectToSignInThenBack(response)
  })

  it('redirects to Defra ID sign-in once the Defra ID session has expired after 1 hour and the service session after 2 hours, then returns to the page', async () => {
    const saveSession = vi.spyOn(getServer().app.sessionCache, 'set')
    const { cookie } = await signIn()
    const [sessionId] = saveSession.mock.calls[0]
    expect(await getServer().app.sessionCache.get(sessionId)).not.toBeNull()

    vi.setSystemTime(Date.now() + SERVICE_SESSION_LIFETIME_MS + MINUTE_MS)

    expect(await getServer().app.sessionCache.get(sessionId)).toBeNull()
    const response = await getServer().inject({
      method: 'GET',
      url: ROUTE_PATH,
      headers: { cookie }
    })

    await expectRedirectToSignInThenBack(response)
  })
})
