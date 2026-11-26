import resolveRedirect from './resolve-redirect.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'
import { originalNrlReference } from '../../../../test-utils/fixtures/quote.js'

const checkYourAnswersPath = '/request-to-use/check-your-answers'
const changeOriginalCommittedPath = '/request-to-use/change/original-committed'

const redirectFor = (requestToUse) =>
  resolveRedirect({
    request: createSessionRequest({ session: { requestToUse } })
  })

describe('resolveRedirect for the change variation page', () => {
  it.each([
    ['yes with no original permission answer', { variation: 'yes' }],
    [
      'yes with only a reference left over',
      { variation: 'yes', originalNrlReference }
    ]
  ])(
    'continues to the original committed page for %s',
    (_scenario, requestToUse) => {
      expect(redirectFor(requestToUse)).toBe(changeOriginalCommittedPath)
    }
  )

  it.each([
    ['no', { variation: 'no' }],
    [
      'yes with the original permission answered',
      { variation: 'yes', originalCommitted: 'no' }
    ],
    ['no session', null]
  ])('returns to check your answers for %s', (_scenario, requestToUse) => {
    expect(redirectFor(requestToUse)).toBe(checkYourAnswersPath)
  })
})
