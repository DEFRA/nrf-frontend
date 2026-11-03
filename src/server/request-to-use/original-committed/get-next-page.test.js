import getNextPage from './get-next-page.js'

describe('getNextPage', () => {
  it('goes to the original reference page when the original was committed', () => {
    expect(getNextPage({ originalCommitted: 'yes' })).toBe(
      '/request-to-use/original-reference'
    )
  })

  it('goes to the Defra account user type page when the original was not committed', () => {
    expect(getNextPage({ originalCommitted: 'no' })).toBe(
      '/request-to-use/defra-account-user-type'
    )
  })
})
