import { describe, expect, it } from 'vitest'
import {
  isRetrieveQuoteEmailSent,
  isRetrieveQuoteEmailSentSession
} from './index.js'
import { createRetrieveQuoteRequest } from '../../../../test-utils/create-retrieve-quote-request.js'
import { fullQuote } from '../../../../test-utils/fixtures/quote.js'
import {
  quoteJourneySession,
  requestToUseJourneySession
} from '../../../../test-utils/fixtures/session.js'

const email = fullQuote.email.address
const nrlReference = fullQuote.reference

describe('isRetrieveQuoteEmailSent', () => {
  it.each([
    { scenario: 'only an email remains', answers: { email }, expected: true },
    {
      scenario: 'the other answers were cleared to null',
      answers: { hasNrlReference: null, nrlReference: null, email },
      expected: true
    },
    { scenario: 'there is no email', answers: {}, expected: false },
    {
      scenario: 'the user said they have no NRL reference',
      answers: { hasNrlReference: 'no', email },
      expected: false
    },
    {
      scenario: 'the user said they have an NRL reference',
      answers: { hasNrlReference: 'yes', email },
      expected: false
    },
    {
      scenario: 'an NRL reference is saved',
      answers: { nrlReference, email },
      expected: false
    }
  ])('returns $expected when $scenario', ({ answers, expected }) => {
    expect(isRetrieveQuoteEmailSent(answers)).toBe(expected)
  })
})

describe('isRetrieveQuoteEmailSentSession', () => {
  it.each([
    {
      scenario: 'request to use was chosen and only an email remains',
      session: {
        manage: requestToUseJourneySession.manage,
        retrieveQuote: { email }
      },
      expected: true
    },
    {
      scenario: 'the quote journey was chosen',
      session: { ...quoteJourneySession, retrieveQuote: { email } },
      expected: false
    },
    {
      scenario: 'there is no retrieve quote session',
      session: { manage: requestToUseJourneySession.manage },
      expected: false
    }
  ])('returns $expected when $scenario', ({ session, expected }) => {
    const request = createRetrieveQuoteRequest({ path: '/', session })

    expect(isRetrieveQuoteEmailSentSession(request)).toBe(expected)
  })
})
