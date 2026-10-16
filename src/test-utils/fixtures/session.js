import { fullQuote } from './quote.js'

export const requestToUseJourneySession = {
  manage: { whatWouldYouLikeToDo: 'request-to-use' },
  retrieveQuote: {}
}

export const quoteJourneySession = {
  manage: { whatWouldYouLikeToDo: 'quote' }
}

// What the review quote details page needs: a saved quote plus the
// requestToUse key magic link redemption (NRF2-1256) will write. housingUnits
// is a number because the quote schema's integer validator converts it.
export const reviewQuoteSession = {
  quote: {
    planningType: 'full-planning-permission',
    isHousing: 'yes',
    housingUnits: 42,
    boundaryEntryType: 'draw',
    boundaryFilename: null,
    email: 'test@example.com'
  },
  requestToUse: { nrlReference: fullQuote.reference }
}
