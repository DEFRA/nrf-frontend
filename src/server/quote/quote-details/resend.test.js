import { getByRole, queryByLabelText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import {
  mockGetQuoteStatus,
  mockResendKnown,
  mockResendUnknown
} from '../../../test-utils/mock-get-quote.js'

const reference = 'NRF-123456'
const token = 'abcdeftoken123'
const linkUrl = `/quote/${reference}/${token}`
const humanClick = { 'sec-fetch-user': '?1' }
const genericMessage = "If a matching quote is found, we've sent a new link."

const mswServer = setupMswServer()

describe('Quote resend flows', () => {
  const getServer = setupTestServer()

  describe('State 2 — known expired link page', () => {
    it('shows a single one-click button with a hidden token and no email field', async () => {
      mockGetQuoteStatus(mswServer, reference, 'expired')

      const document = await loadPage({
        requestUrl: linkUrl,
        server: getServer(),
        headers: humanClick
      })

      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'This link is no longer active'
      )
      expect(
        getByRole(document, 'button', { name: 'Send me a new link' })
      ).toBeInTheDocument()
      expect(
        queryByLabelText(
          document,
          'Enter the email address you used for the quote'
        )
      ).not.toBeInTheDocument()

      const hiddenToken = document.querySelector('input[name="token"]')
      expect(hiddenToken).toBeInTheDocument()
      expect(hiddenToken.value).toBe(token)
    })
  })

  describe('State 3 — unknown expired link page', () => {
    it.each([
      ['invalid', 'The link is invalid'],
      [
        'not_found',
        'The NRF reference you have supplied does not match an existing quote'
      ]
    ])(
      'shows the %s heading with an email field and send button',
      async (status, heading) => {
        mockGetQuoteStatus(mswServer, reference, status)

        const document = await loadPage({
          requestUrl: linkUrl,
          server: getServer(),
          headers: humanClick
        })

        expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
          heading
        )
        expect(
          queryByLabelText(
            document,
            'Enter the email address you used for the quote'
          )
        ).toBeInTheDocument()
        expect(
          getByRole(document, 'button', { name: 'Send new link' })
        ).toBeInTheDocument()
      }
    )
  })

  describe('known resend submission', () => {
    it('redirects to the confirmation page which shows the masked email (PRG)', async () => {
      mockResendKnown(mswServer, reference, {
        ok: true,
        message: "We've sent a new link to dev**@example.com"
      })

      const { response, cookie } = await submitForm({
        requestUrl: `/quote/${reference}/resend-known`,
        server: getServer(),
        formData: { token }
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(`/quote/${reference}/resend-known`)

      const confirmation = await getServer().inject({
        method: 'GET',
        url: `/quote/${reference}/resend-known`,
        headers: { cookie }
      })
      const { document } = new JSDOM(confirmation.result).window

      expect(confirmation.statusCode).toBe(200)
      expect(document.body.textContent).toContain(
        "We've sent a new link to dev**@example.com"
      )
    })

    it('renders the invalid link error page for a malformed token instead of a raw 400', async () => {
      const { response, document } = await submitForm({
        requestUrl: `/quote/${reference}/resend-known`,
        server: getServer(),
        formData: { token: 'not a valid token!' }
      })

      expect(response.statusCode).toBe(200)
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'The link is invalid'
      )
      const form = document.querySelector(
        `form[action="/quote/${reference}/resend-unknown"]`
      )
      expect(form).toBeInTheDocument()
    })

    it('shows the invalid link email form, carrying the token, when the backend will not honour it', async () => {
      mockResendKnown(mswServer, reference, { ok: true })

      const { response, document } = await submitForm({
        requestUrl: `/quote/${reference}/resend-known`,
        server: getServer(),
        formData: { token }
      })

      expect(response.statusCode).toBe(200)
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'The link is invalid'
      )
      const form = document.querySelector(
        `form[action="/quote/${reference}/resend-unknown"]`
      )
      expect(form).toBeInTheDocument()
      // The hidden token must be carried through so the form can be submitted —
      // an empty token fails payload validation and redirects to a dead URL.
      expect(form.querySelector('input[name="token"]').value).toBe(token)
    })

    it('lets the email form rendered from a rejected token be submitted successfully', async () => {
      mockResendKnown(mswServer, reference, { ok: true })
      mockResendUnknown(mswServer, reference)

      const { document } = await submitForm({
        requestUrl: `/quote/${reference}/resend-known`,
        server: getServer(),
        formData: { token }
      })
      const carriedToken = document.querySelector(
        'form[action$="/resend-unknown"] input[name="token"]'
      ).value

      const { response } = await submitForm({
        requestUrl: `/quote/${reference}/resend-unknown`,
        server: getServer(),
        formData: { token: carriedToken, email: 'developer@housebuilder.com' }
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(
        `/quote/${reference}/resend-unknown`
      )
    })

    it('shows the error page when the backend fails to send the email', async () => {
      mockResendKnown(mswServer, reference, { ok: false }, 502)

      const { response } = await submitForm({
        requestUrl: `/quote/${reference}/resend-known`,
        server: getServer(),
        formData: { token }
      })

      expect(response.statusCode).toBe(502)
      const { document } = new JSDOM(response.result).window
      expect(document.body.textContent).toContain('Something went wrong')
    })

    it('redirects to the start of the service if the confirmation is visited without a fresh resend', async () => {
      const confirmation = await getServer().inject({
        method: 'GET',
        url: `/quote/${reference}/resend-known`
      })

      expect(confirmation.statusCode).toBe(303)
      expect(confirmation.headers.location).toBe('/')
    })
  })

  describe('unknown resend submission', () => {
    it('redirects to the confirmation page showing the generic message (PRG)', async () => {
      mockResendUnknown(mswServer, reference)

      const { response, cookie } = await submitForm({
        requestUrl: `/quote/${reference}/resend-unknown`,
        server: getServer(),
        formData: { token, email: 'developer@housebuilder.com' }
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(
        `/quote/${reference}/resend-unknown`
      )

      const confirmation = await getServer().inject({
        method: 'GET',
        url: `/quote/${reference}/resend-unknown`,
        headers: { cookie }
      })
      const { document } = new JSDOM(confirmation.result).window

      expect(confirmation.statusCode).toBe(200)
      expect(document.body.textContent).toContain(genericMessage)
    })

    it('shows the identical generic confirmation when the backend reports no match', async () => {
      // The backend always returns the same body; the page must not differ.
      mockResendUnknown(mswServer, reference)

      const { cookie } = await submitForm({
        requestUrl: `/quote/${reference}/resend-unknown`,
        server: getServer(),
        formData: { token, email: 'not-the-owner@example.com' }
      })

      const confirmation = await getServer().inject({
        method: 'GET',
        url: `/quote/${reference}/resend-unknown`,
        headers: { cookie }
      })
      const { document } = new JSDOM(confirmation.result).window

      expect(document.body.textContent).toContain(genericMessage)
    })

    it('redirects back to the invalid link page with an inline error for a malformed email', async () => {
      mockGetQuoteStatus(mswServer, reference, 'invalid')

      const { response, cookie } = await submitForm({
        requestUrl: `/quote/${reference}/resend-unknown`,
        server: getServer(),
        formData: { token, email: 'not-an-email' }
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(`/quote/${reference}/${token}`)

      const page = await getServer().inject({
        method: 'GET',
        url: `/quote/${reference}/${token}`,
        headers: { cookie, ...humanClick }
      })
      const { document } = new JSDOM(page.result).window

      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'The link is invalid'
      )
      const errorSummary = document.querySelector('.govuk-error-summary')
      expect(errorSummary).toBeInTheDocument()
      expect(errorSummary).toHaveTextContent('There is a problem')
      expect(errorSummary).toHaveTextContent(
        'Enter an email address in the correct format'
      )
    })
  })
})
