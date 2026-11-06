import { getPreSignInBackLinkPath } from './index.js'

describe('getPreSignInBackLinkPath', () => {
  it.each([
    ['there is no session data', undefined, '/request-to-use/variation'],
    ['variation is "no"', { variation: 'no' }, '/request-to-use/variation'],
    [
      'variation is "no" with a stale originalCommitted answer',
      { variation: 'no', originalCommitted: 'yes' },
      '/request-to-use/variation'
    ],
    [
      'variation is "yes" and the original was not committed',
      { variation: 'yes', originalCommitted: 'no' },
      '/request-to-use/original-committed'
    ],
    [
      'variation is "yes" and the original was committed',
      { variation: 'yes', originalCommitted: 'yes' },
      '/request-to-use/original-reference'
    ]
  ])('returns the right path when %s', (_, sessionData, expected) => {
    expect(getPreSignInBackLinkPath(sessionData)).toBe(expected)
  })
})
