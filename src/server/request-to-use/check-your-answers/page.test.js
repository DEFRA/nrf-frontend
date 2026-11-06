import { getByRole, queryByRole } from '@testing-library/dom'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { mockCommitmentCertificate } from '../../../test-utils/mock-get-quote.js'
import { completeDefraSignIn } from '../../../test-utils/complete-defra-sign-in.js'
import { passDefraIdCheck } from '../../../test-utils/pass-defra-id-check.js'
import { defraIdSignInHandlers } from '../../../test-utils/defra-id-sign-in-handlers.js'
import { mockUser } from '../../../test-utils/fixtures/mock-user.js'
import { getYarCookie } from '../../../test-utils/yar-cookie.js'

const pagePath = '/request-to-use/check-your-answers'
const startPath = '/manage/start-page'
const confirmationPath = '/request-to-use/confirmation'

const silentSignInPath = '/auth/sign-in?prompt=none'

const mswServer = setupMswServer(
  ...defraIdSignInHandlers({ getClaims: () => mockUser })
)

describe('Check your answers page', () => {
  const getServer = setupTestServer()
  const getSeededServer = setupSeededRequestToUseServer()

  const load = async () =>
    loadPage({
      requestUrl: pagePath,
      server: getSeededServer(),
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

  it('should redirect to the start page when there is no session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPath)
  })

  it('should render the heading, title and submit button', async () => {
    const document = await load()

    expect(document.title).toBe(
      'Check your answers - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Check your answers'
    )
    expect(
      getByRole(document, 'button', { name: 'Confirm and submit' })
    ).toBeInTheDocument()
  })

  it('should link back to the enter address page', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/enter-address'
    )
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await load()

    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it('should not show a delete link', async () => {
    const document = await load()

    expect(
      queryByRole(document, 'link', { name: /Delete/ })
    ).not.toBeInTheDocument()
  })

  const passCheck = async () => {
    const server = getSeededServer()
    return passDefraIdCheck({
      server,
      requestUrl: pagePath,
      cookie: await withCompleteQuoteSession(server)
    })
  }

  it('should check with Defra ID before submitting, without calling the backend', async () => {
    const requests = mockCommitmentCertificate(mswServer)

    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getSeededServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(silentSignInPath)
    expect(requests).toEqual([])
  })

  it('should return to check your answers once the Defra ID check passes', async () => {
    const { response } = await passCheck()

    expect(response.headers.location).toBe(pagePath)
  })

  it('should record the commitment certificate and redirect to the confirmation page on submit after the Defra ID check', async () => {
    const requests = mockCommitmentCertificate(mswServer)
    const { cookie } = await passCheck()

    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getSeededServer(),
      formData: {},
      cookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(confirmationPath)
    expect(requests).toEqual([{ createCommitmentCertificate: true }])
  })

  it('should check with Defra ID again for a second submit', async () => {
    mockCommitmentCertificate(mswServer)
    const server = getSeededServer()
    const { cookie } = await passCheck()
    const submitted = await submitForm({
      requestUrl: pagePath,
      server,
      formData: {},
      cookie
    })

    const { response } = await submitForm({
      requestUrl: pagePath,
      server,
      formData: {},
      cookie: submitted.cookie
    })

    expect(response.headers.location).toBe(silentSignInPath)
  })

  it('should go through a normal sign-in and return to check your answers when Defra ID has no session', async () => {
    const server = getSeededServer()
    const requests = mockCommitmentCertificate(mswServer)
    const started = await submitForm({
      requestUrl: pagePath,
      server,
      formData: {},
      cookie: await withCompleteQuoteSession(server)
    })
    const silent = await server.inject({
      method: 'GET',
      url: silentSignInPath,
      headers: { cookie: started.cookie }
    })
    const state = new URL(silent.headers.location).searchParams.get('state')

    const noSession = await server.inject({
      method: 'GET',
      url: `/login/return?error=interaction_required&state=${state}`,
      headers: { cookie: getYarCookie(silent) }
    })
    const { response, cookie } = await completeDefraSignIn({
      server,
      cookie: getYarCookie(noSession) || getYarCookie(silent)
    })
    const submitted = await submitForm({
      requestUrl: pagePath,
      server,
      formData: {},
      cookie
    })

    expect(noSession.headers.location).toBe('/auth/sign-in')
    expect(response.headers.location).toBe(pagePath)
    expect(submitted.response.headers.location).toBe(confirmationPath)
    expect(requests).toEqual([{ createCommitmentCertificate: true }])
  })

  it('should redirect to the start page without calling the backend when there is no session', async () => {
    const requests = mockCommitmentCertificate(mswServer)

    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: {}
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(startPath)
    expect(requests).toEqual([])
  })

  it.each([404, 409, 500])(
    'should show the 500 error page when the backend responds with %i',
    async (status) => {
      mockCommitmentCertificate(mswServer, { status })
      const { cookie } = await passCheck()

      const { response, document } = await submitForm({
        requestUrl: pagePath,
        server: getSeededServer(),
        formData: {},
        cookie
      })

      expect(response.statusCode).toBe(500)
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'Sorry, there is a problem with the service'
      )
    }
  )
})
