import { fullQuote } from './quote.js'
import { boundaryGeojson } from './boundary-geojson.js'

export const requestToUseJourneySession = {
  manage: { whatWouldYouLikeToDo: 'request-to-use' },
  retrieveQuote: {}
}

export const quoteJourneySession = {
  manage: { whatWouldYouLikeToDo: 'quote' }
}

export const reviewQuoteSession = {
  quote: {
    planningType: 'full-planning-permission',
    isHousing: 'yes',
    housingUnits: 42,
    boundaryEntryType: 'draw',
    boundaryGeojson,
    boundaryFilename: null,
    email: 'test@example.com'
  },
  requestToUse: { nrlReference: fullQuote.reference }
}
