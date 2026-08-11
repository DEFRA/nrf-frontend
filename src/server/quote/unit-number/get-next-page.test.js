import getNextPage from './get-next-page.js'

describe('getNextPage', () => {
  it('returns the boundary-type route', () => {
    expect(getNextPage()).toBe('/quote/boundary-type')
  })
})
