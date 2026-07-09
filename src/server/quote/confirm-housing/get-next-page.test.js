import getNextPage from './get-next-page.js'

describe('getNextPage', () => {
  it('returns the residential route when isHousing is "yes"', () => {
    expect(getNextPage({ isHousing: 'yes' })).toBe('/quote/residential')
  })

  it('returns the not-housing route when isHousing is "no"', () => {
    expect(getNextPage({ isHousing: 'no' })).toBe('/quote/not-housing')
  })
})
