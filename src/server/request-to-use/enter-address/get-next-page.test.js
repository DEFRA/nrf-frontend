import getNextPage from './get-next-page.js'

describe('getNextPage', () => {
  it('goes to the review details page for every variant', () => {
    expect(getNextPage({ accountType: 'agent' })).toBe(
      '/request-to-use/review-details'
    )
    expect(getNextPage({ accountType: 'employee' })).toBe(
      '/request-to-use/review-details'
    )
    expect(getNextPage()).toBe('/request-to-use/review-details')
  })
})
