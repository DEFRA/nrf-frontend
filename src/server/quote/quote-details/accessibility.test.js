// @vitest-environment jsdom
import { JSDOM } from 'jsdom'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import {
  mockGetQuote,
  mockGetQuoteStatus,
  mockResendKnown
} from '../../../test-utils/mock-get-quote.js'
import { submitForm } from '../../../test-utils/submit-form.js'

const mswServer = setupMswServer()
const humanClick = { 'sec-fetch-user': '?1' }

describe('Quote details page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues', async () => {
    mockGetQuote(mswServer)
    const document = await loadPage({
      requestUrl: '/quote/NRF-123456/testtoken123',
      server: getServer(),
      headers: humanClick
    })
    await runAxeChecks(document.documentElement)
  })

  it('should have no HTML accessibility issues on the unknown-expired resend page', async () => {
    mockGetQuoteStatus(mswServer, 'NRF-123456', 'invalid')
    const document = await loadPage({
      requestUrl: '/quote/NRF-123456/testtoken123',
      server: getServer(),
      headers: humanClick
    })
    await runAxeChecks(document.documentElement)
  })

  it('should have no HTML accessibility issues on the known-expired resend page', async () => {
    mockGetQuoteStatus(mswServer, 'NRF-123456', 'expired')
    const document = await loadPage({
      requestUrl: '/quote/NRF-123456/testtoken123',
      server: getServer(),
      headers: humanClick
    })
    await runAxeChecks(document.documentElement)
  })

  it('should have no HTML accessibility issues on the resend confirmation page', async () => {
    mockResendKnown(mswServer, 'NRF-123456')
    const { cookie } = await submitForm({
      requestUrl: '/quote/NRF-123456/resend-known',
      server: getServer(),
      formData: { token: 'testtoken123' }
    })
    const confirmation = await getServer().inject({
      method: 'GET',
      url: '/quote/NRF-123456/resend-known',
      headers: { cookie }
    })
    const { document } = new JSDOM(confirmation.result).window
    await runAxeChecks(document.documentElement)
  })
})
