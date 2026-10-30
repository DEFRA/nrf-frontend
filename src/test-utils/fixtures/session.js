import { fullQuote } from './quote.js'
import { boundaryGeojson } from './boundary-geojson.js'
import { recalculatedLevy } from './levy.js'

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

export const acceptLevySession = {
  ...reviewQuoteSession,
  requestToUse: { ...reviewQuoteSession.requestToUse, levy: recalculatedLevy }
}

// The full session state magic link redemption leaves behind, plus keys from
// earlier steps that a successful delete must also wipe
export const redeemedQuoteSession = {
  ...reviewQuoteSession,
  retrieveQuote: { nrlReference: fullQuote.reference },
  pendingUploadId: 'an-upload-key-clearJourneySessions-removes'
}
