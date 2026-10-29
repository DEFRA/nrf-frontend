import { mockRedeemToken } from './mock-get-quote.js'
import { fullQuote } from './fixtures/quote.js'
import { magicLinkToken } from './fixtures/magic-link-token.js'
import { mergeCookies } from './merge-cookies.js'
import { loadPage } from './load-page.js'
import { submitForm } from './submit-form.js'
import { routePath as linkExpiredPath } from '../server/request-to-use/link-expired/route-path.js'

export const expiredLinkReference = fullQuote.reference
export const expiredLinkToken = magicLinkToken

/**
 * Prime the link expired session by driving the real route: open a magic link
 * the backend reports as expired. Returns the session cookie.
 * @param {object} params
 * @param {object} params.server
 * @param {object} params.mswServer
 * @returns {Promise<string>}
 */
export async function withExpiredLinkSession({ server, mswServer }) {
  mockRedeemToken(mswServer, { accessStatus: 'expired' })
  const response = await server.inject({
    method: 'GET',
    url: `/request-to-use/retrieve/${expiredLinkReference}/${expiredLinkToken}`
  })
  return mergeCookies(undefined, response.headers['set-cookie'])
}

/**
 * Open a magic link the backend reports as expired, then load the link
 * expired page with the session that creates.
 * @param {object} params
 * @param {object} params.server
 * @param {object} params.mswServer
 * @returns {Promise<{ document: Document, cookie: string }>}
 */
export async function loadExpiredLinkPage({ server, mswServer }) {
  const cookie = await withExpiredLinkSession({ server, mswServer })
  const document = await loadPage({
    requestUrl: linkExpiredPath,
    server,
    cookie
  })
  return { document, cookie }
}

/**
 * Open a magic link the backend reports as expired, then submit the request a
 * new link form on the link expired page.
 * @param {object} params
 * @param {object} params.server
 * @param {object} params.mswServer
 */
export async function submitRequestNewLink({ server, mswServer }) {
  const cookie = await withExpiredLinkSession({ server, mswServer })
  return submitForm({
    requestUrl: linkExpiredPath,
    server,
    formData: {},
    cookie
  })
}
