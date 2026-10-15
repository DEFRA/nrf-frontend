import { describe, expect, it } from 'vitest'
import {
  clearAllSessionData,
  clearJourneySessions,
  isJourneySelected,
  journeys,
  selectJourney
} from './index.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'
import { quoteUploadSession } from '../../../../test-utils/fixtures/upload-session.js'

const MANAGE_KEY = 'manage'
const QUOTE_KEY = 'quote'
const RETRIEVE_QUOTE_KEY = 'retrieveQuote'
const REQUEST_TO_USE_KEY = 'requestToUse'

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

      expect(result).toEqual({ whatWouldYouLikeToDo: journeys.quote })
      expect(request.yar.get(MANAGE_KEY)).toEqual({
        whatWouldYouLikeToDo: journeys.quote
      })
    })

    it('creates an empty quote and clears the request to use data when quote is chosen', () => {
      const request = buildRequest({
        retrieveQuote: retrieveQuoteAnswers,
        requestToUse: requestToUseAnswers
      })

      selectJourney({ request, journey: journeys.quote })

      expect(request.yar.get(QUOTE_KEY)).toEqual({})
      expect(request.yar.get(RETRIEVE_QUOTE_KEY)).toBeNull()
      expect(request.yar.get(REQUEST_TO_USE_KEY)).toBeNull()
    })

    it('creates empty retrieve quote data and clears the quote and request to use data when request to use is chosen', () => {
      const request = buildRequest({
        quote: quoteAnswers,
        requestToUse: requestToUseAnswers
      })

      selectJourney({ request, journey: journeys.requestToUse })

      expect(request.yar.get(RETRIEVE_QUOTE_KEY)).toEqual({})
      expect(request.yar.get(QUOTE_KEY)).toBeNull()
      expect(request.yar.get(REQUEST_TO_USE_KEY)).toBeNull()
    })

    it.each([
      {
        journey: journeys.quote,
        key: QUOTE_KEY,
        answers: quoteAnswers
      },
      {
        journey: journeys.requestToUse,
        key: RETRIEVE_QUOTE_KEY,
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

  describe('isJourneySelected', () => {
    it('is true for the journey in the manage session', () => {
      const request = buildRequest({
        manage: { whatWouldYouLikeToDo: journeys.requestToUse }
      })

      expect(
        isJourneySelected({ request, journey: journeys.requestToUse })
      ).toBe(true)
      expect(isJourneySelected({ request, journey: journeys.quote })).toBe(
        false
      )
    })

    it('is false when nothing has been chosen', () => {
      expect(
        isJourneySelected({ request: buildRequest(), journey: journeys.quote })
      ).toBe(false)
    })
  })

  describe('quote upload state', () => {
    const uploadKeys = Object.keys(quoteUploadSession)

    it('is cleared when request to use is chosen', () => {
      const request = buildRequest({
        quote: quoteAnswers,
        ...quoteUploadSession
      })

      selectJourney({ request, journey: journeys.requestToUse })

      for (const key of uploadKeys) {
        expect(request.yar.get(key)).toBeNull()
      }
    })

    it('is kept when quote is chosen again', () => {
      const request = buildRequest({
        quote: quoteAnswers,
        ...quoteUploadSession
      })

      selectJourney({ request, journey: journeys.quote })

      for (const key of uploadKeys) {
        expect(request.yar.get(key)).toEqual(quoteUploadSession[key])
      }
    })

    it('is cleared when the journeys are cleared', () => {
      const request = buildRequest({ ...quoteUploadSession })

      clearJourneySessions(request)

      for (const key of uploadKeys) {
        expect(request.yar.get(key)).toBeNull()
      }
    })
  })

  describe('clearJourneySessions', () => {
    it('clears the quote, retrieve quote and request to use data but keeps manage', () => {
      const manage = { whatWouldYouLikeToDo: journeys.requestToUse }
      const request = buildRequest({
        manage,
        quote: quoteAnswers,
        retrieveQuote: retrieveQuoteAnswers,
        requestToUse: requestToUseAnswers
      })

      clearJourneySessions(request)

      expect(request.yar.get(QUOTE_KEY)).toBeNull()
      expect(request.yar.get(RETRIEVE_QUOTE_KEY)).toBeNull()
      expect(request.yar.get(REQUEST_TO_USE_KEY)).toBeNull()
      expect(request.yar.get(MANAGE_KEY)).toEqual(manage)
    })
  })

  describe('clearAllSessionData', () => {
    it('clears every journey key, the what would you like to do answer and the validation flash', () => {
      const request = buildRequest({
        manage: { whatWouldYouLikeToDo: journeys.requestToUse },
        quote: quoteAnswers,
        retrieveQuote: retrieveQuoteAnswers,
        requestToUse: requestToUseAnswers,
        quoteFlash: { validationErrors: {}, formSubmitData: {} }
      })

      clearAllSessionData(request)

      for (const key of [
        MANAGE_KEY,
        QUOTE_KEY,
        RETRIEVE_QUOTE_KEY,
        REQUEST_TO_USE_KEY,
        'quoteFlash'
      ]) {
        expect(request.yar.get(key)).toBeNull()
      }
    })
  })
})
