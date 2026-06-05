import { http, HttpResponse } from 'msw'
import { config } from '../config/config.js'
import { fullQuote } from './fixtures/quote.js'

export const mockGetQuote = (
  mswServer,
  quoteData = fullQuote,
  accessStatus = 'valid'
) => {
  mswServer.use(
    http.get(
      `${config.get('backend').apiUrl}/quotes/${quoteData.reference}`,
      () => HttpResponse.json({ accessStatus, quote: quoteData })
    )
  )
}

export const mockGetQuoteStatus = (mswServer, reference, accessStatus) => {
  mswServer.use(
    http.get(`${config.get('backend').apiUrl}/quotes/${reference}`, () =>
      HttpResponse.json({ accessStatus, quote: null })
    )
  )
}

export const mockResendKnown = (
  mswServer,
  reference,
  body = { ok: true, message: "We've sent a new link to dev**@example.com" },
  status = 200
) => {
  mswServer.use(
    http.post(
      `${config.get('backend').apiUrl}/quotes/${reference}/resend-known`,
      () => HttpResponse.json(body, { status })
    )
  )
}

export const mockResendUnknown = (
  mswServer,
  reference,
  body = {
    ok: true,
    message: "If a matching quote is found, we've sent a new link."
  }
) => {
  mswServer.use(
    http.post(
      `${config.get('backend').apiUrl}/quotes/${reference}/resend-unknown`,
      () => HttpResponse.json(body)
    )
  )
}
