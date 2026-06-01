import { http, HttpResponse } from 'msw'
import { config } from '../config/config.js'
import { fullQuote } from './fixtures/quote.js'

export const mockGetQuote = (
  mswServer,
  quoteData = fullQuote,
  status = 'valid'
) => {
  mswServer.use(
    http.get(
      `${config.get('backend').apiUrl}/quotes/${quoteData.reference}`,
      () => HttpResponse.json({ status, quote: quoteData })
    )
  )
}

export const mockGetQuoteStatus = (mswServer, reference, status) => {
  mswServer.use(
    http.get(`${config.get('backend').apiUrl}/quotes/${reference}`, () =>
      HttpResponse.json({ status, quote: null })
    )
  )
}
