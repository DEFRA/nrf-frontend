import getNextPage from './get-next-page.js'

describe('getNextPage', () => {
  it('goes to the who are you requesting to use the levy for page', () => {
    expect(getNextPage({ originalReference: 'NRL-123456' })).toBe(
      '/request-to-use/defra-account-user-type'
    )
  })
})
