import getViewModel from './get-view-model.js'

describe('defra account user type getViewModel backLinkPath', () => {
  it.each([
    {
      scenario: 'there is no session data',
      sessionData: undefined,
      expected: '/request-to-use/variation'
    },
    {
      scenario: 'the development is not a variation',
      sessionData: { variation: 'no' },
      expected: '/request-to-use/variation'
    },
    {
      scenario: 'the original was not committed to the levy',
      sessionData: { variation: 'yes', originalCommitted: 'no' },
      expected: '/request-to-use/original-committed'
    },
    {
      scenario: 'the original was committed to the levy',
      sessionData: { variation: 'yes', originalCommitted: 'yes' },
      expected: '/request-to-use/original-reference'
    },
    {
      scenario: 'a stale original committed answer follows a change to "no"',
      sessionData: { variation: 'no', originalCommitted: 'yes' },
      expected: '/request-to-use/variation'
    }
  ])('should be $expected when $scenario', ({ sessionData, expected }) => {
    expect(getViewModel(sessionData).backLinkPath).toBe(expected)
  })
})
