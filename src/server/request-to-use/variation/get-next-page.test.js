import getNextPage from './get-next-page.js'

describe('getNextPage', () => {
  it('goes to the original committed page for an amendment', () => {
    expect(getNextPage({ variation: 'yes' })).toBe(
      '/request-to-use/original-committed'
    )
  })

  it('goes to the Defra account user type page when not an amendment', () => {
    expect(getNextPage({ variation: 'no' })).toBe(
      '/request-to-use/defra-account-user-type'
    )
  })
})
