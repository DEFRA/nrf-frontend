import getNextPage from './get-next-page.js'

const reviewYourDetailsPath = '/request-to-use/review-your-details'

describe('getNextPage', () => {
  it('goes to the review developer details page for the agent variant', () => {
    expect(getNextPage({ formVariant: 'agent' })).toBe(
      '/request-to-use/review-developer-details'
    )
  })

  it('goes to the review your details page for the individual variant', () => {
    expect(getNextPage({ formVariant: 'individual' })).toBe(
      reviewYourDetailsPath
    )
  })

  it('goes to the review your details page for the organisation variant', () => {
    expect(getNextPage({ formVariant: 'organisation' })).toBe(
      reviewYourDetailsPath
    )
  })

  it('goes to the review your details page when no variant is resolved', () => {
    expect(getNextPage({})).toBe(reviewYourDetailsPath)
  })
})
