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
