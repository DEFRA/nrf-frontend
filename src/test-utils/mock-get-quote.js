import { http, HttpResponse } from 'msw'
import { config } from '../config/config.js'
import { fullQuote } from './fixtures/quote.js'

export const mockReadQuote = (mswServer, quoteData = fullQuote) => {
  mswServer.use(
    http.get(
      `${config.get('backend').apiUrl}/quotes/${quoteData.reference}`,
      () => HttpResponse.json(quoteData)
    )
  )
}

export const mockGetQuoteError = (mswServer, reference, status) => {
  mswServer.use(
    http.get(`${config.get('backend').apiUrl}/quotes/${reference}`, () =>
      HttpResponse.json({ ok: false }, { status })
    )
  )
}

export const mockEmailQuoteLink = (mswServer, matchingQuote = fullQuote) => {
  mswServer.use(
    http.post(
      `${config.get('backend').apiUrl}/quotes/email-quote-link`,
      async ({ request }) => {
        const { reference, email } = await request.json()
        const matched =
          reference === matchingQuote.reference &&
          email.toLowerCase() === matchingQuote.email.address.toLowerCase()
        return HttpResponse.json({ matched })
      }
    )
  )
}

export const mockEmailQuoteLinkError = (mswServer, status) => {
  mswServer.use(
    http.post(`${config.get('backend').apiUrl}/quotes/email-quote-link`, () =>
      HttpResponse.json({ ok: false }, { status })
    )
  )
}

export const mockRedeemToken = (
  mswServer,
  { reference = fullQuote.reference, accessStatus = 'valid' } = {}
) => {
  const requests = []
  mswServer.use(
    http.post(
      `${config.get('backend').apiUrl}/quotes/${reference}/redeem-token`,
      async ({ request }) => {
        requests.push(await request.json())
        return HttpResponse.json({ accessStatus })
      }
    )
  )
  return requests
}
