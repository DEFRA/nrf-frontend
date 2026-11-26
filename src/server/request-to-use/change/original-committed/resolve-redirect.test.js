import resolveRedirect from './resolve-redirect.js'
import { createSessionRequest } from '../../../../test-utils/create-session-request.js'
import { originalNrlReference } from '../../../../test-utils/fixtures/quote.js'

const checkYourAnswersPath = '/request-to-use/check-your-answers'
const changeOriginalReferencePath = '/request-to-use/change/original-reference'

const redirectFor = (requestToUse) =>
  resolveRedirect({
    request: createSessionRequest({ session: { requestToUse } })
  })

describe('resolveRedirect for the change original committed page', () => {
  it('continues to the original reference page for yes with no reference', () => {
    expect(redirectFor({ variation: 'yes', originalCommitted: 'yes' })).toBe(
      changeOriginalReferencePath
    )
  })

  it.each([
    ['no', { variation: 'yes', originalCommitted: 'no' }],
    [
      'yes with a reference already saved',
      { variation: 'yes', originalCommitted: 'yes', originalNrlReference }
    ],
    ['no session', null]
  ])('returns to check your answers for %s', (_scenario, requestToUse) => {
    expect(redirectFor(requestToUse)).toBe(checkYourAnswersPath)
  })
})
