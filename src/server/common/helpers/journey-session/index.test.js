import { describe, expect, it } from 'vitest'
import {
  clearAllSessionData,
  clearJourneySessions,
  journeys,
  selectJourney
} from './index.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'

const quoteAnswers = { planningType: 'full-planning-permission' }
const retrieveQuoteAnswers = {
  hasNrlReference: 'yes',
  nrlReference: 'NRL-123456'
}
const requestToUseAnswers = { nrlReference: 'NRL-123456' }

const buildRequest = (session = {}) => createSessionRequest({ session })

describe('journey session', () => {
  describe('selectJourney', () => {
    it('saves the chosen journey', () => {
      const request = buildRequest()

      const result = selectJourney({ request, journey: journeys.quote })

      expect(result).toEqual({ whatWouldYouLikeToDo: 'quote' })
      expect(request.yar.get('manage')).toEqual({
        whatWouldYouLikeToDo: 'quote'
      })
    })

    it('creates an empty quote and clears the request to use data when quote is chosen', () => {
      const request = buildRequest({
        retrieveQuote: retrieveQuoteAnswers,
        requestToUse: requestToUseAnswers
      })

      selectJourney({ request, journey: journeys.quote })

      expect(request.yar.get('quote')).toEqual({})
      expect(request.yar.get('retrieveQuote')).toBeNull()
      expect(request.yar.get('requestToUse')).toBeNull()
    })

    it('creates empty retrieve quote data and clears the quote and request to use data when request to use is chosen', () => {
      const request = buildRequest({
        quote: quoteAnswers,
        requestToUse: requestToUseAnswers
      })

      selectJourney({ request, journey: journeys.requestToUse })

      expect(request.yar.get('retrieveQuote')).toEqual({})
      expect(request.yar.get('quote')).toBeNull()
      expect(request.yar.get('requestToUse')).toBeNull()
    })

    it.each([
      {
        journey: journeys.quote,
        key: 'quote',
        answers: quoteAnswers
      },
      {
        journey: journeys.requestToUse,
        key: 'retrieveQuote',
        answers: retrieveQuoteAnswers
      }
    ])(
      'keeps existing $key answers when $journey is chosen again',
      ({ journey, key, answers }) => {
        const request = buildRequest({
          manage: { whatWouldYouLikeToDo: journey },
          [key]: answers
        })

        selectJourney({ request, journey })

        expect(request.yar.get(key)).toEqual(answers)
      }
    )
  })

  describe('clearJourneySessions', () => {
    it('clears the quote, retrieve quote and request to use data but keeps manage', () => {
      const manage = { whatWouldYouLikeToDo: 'request-to-use' }
      const request = buildRequest({
        manage,
        quote: quoteAnswers,
        retrieveQuote: retrieveQuoteAnswers,
        requestToUse: requestToUseAnswers
      })

      clearJourneySessions(request)

      expect(request.yar.get('quote')).toBeNull()
      expect(request.yar.get('retrieveQuote')).toBeNull()
      expect(request.yar.get('requestToUse')).toBeNull()
      expect(request.yar.get('manage')).toEqual(manage)
    })
  })

  describe('clearAllSessionData', () => {
    it('clears every journey key, the what would you like to do answer and the validation flash', () => {
      const request = buildRequest({
        manage: { whatWouldYouLikeToDo: 'request-to-use' },
        quote: quoteAnswers,
        retrieveQuote: retrieveQuoteAnswers,
        requestToUse: requestToUseAnswers,
        quoteFlash: { validationErrors: {}, formSubmitData: {} }
      })

      clearAllSessionData(request)

      for (const key of [
        'manage',
        'quote',
        'retrieveQuote',
        'requestToUse',
        'quoteFlash'
      ]) {
        expect(request.yar.get(key)).toBeNull()
      }
    })
  })
})
