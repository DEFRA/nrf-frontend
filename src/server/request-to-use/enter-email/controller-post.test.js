import { describe, it, expect, beforeEach } from 'vitest'
import { enterEmailPostController } from './controller-post.js'
import { createSessionRequest } from '../../../test-utils/create-session-request.js'
import { createMockRedirectToolkit } from '../../../test-utils/create-mock-redirect-toolkit.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { mockReadQuote } from '../../../test-utils/mock-get-quote.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'
import { quoteUploadSession } from '../../../test-utils/fixtures/upload-session.js'

const nrlReference = fullQuote.reference
const matchingEmail = fullQuote.email.address
const otherEmail = 'other@example.com'

const manage = { whatWouldYouLikeToDo: 'request-to-use' }
const retrieveQuoteAnswers = { hasNrlReference: 'yes', nrlReference }
const quoteAnswers = { planningType: 'full-planning-permission' }
const requestToUseAnswers = { nrlReference }

// The mock session copies these entries, so the seed stays pristine for
// comparison after the handler has written to the session.
const seededSession = {
  manage,
  quote: quoteAnswers,
  retrieveQuote: retrieveQuoteAnswers,
  requestToUse: requestToUseAnswers,
  ...quoteUploadSession
}

const clearedKeys = [
  'quote',
  'retrieveQuote',
  'requestToUse',
  ...Object.keys(quoteUploadSession)
]

const buildRequest = () => createSessionRequest({ session: seededSession })

const submitEmail = async ({ request, email }) => {
  request.payload = { email }
  await enterEmailPostController.handler(request, createMockRedirectToolkit())
}

describe('enterEmailPostController', () => {
  const mswServer = setupMswServer()

  beforeEach(() => {
    mockReadQuote(mswServer)
  })

  it('should clear every journey key except manage when a quote matches', async () => {
    const request = buildRequest()

    await submitEmail({ request, email: matchingEmail })

    for (const key of clearedKeys) {
      expect(request.yar.get(key), `${key} should be cleared`).toBeNull()
    }
    expect(request.yar.get('manage')).toEqual(manage)
  })

  it('should keep every journey key when no quote matches', async () => {
    const request = buildRequest()

    await submitEmail({ request, email: otherEmail })

    const keptKeys = clearedKeys.filter((key) => key !== 'retrieveQuote')
    for (const key of keptKeys) {
      expect(request.yar.get(key), `${key} should be kept`).toEqual(
        seededSession[key]
      )
    }
    expect(request.yar.get('manage')).toEqual(manage)
    expect(request.yar.get('retrieveQuote')).toEqual({
      ...retrieveQuoteAnswers,
      email: otherEmail
    })
  })
})
