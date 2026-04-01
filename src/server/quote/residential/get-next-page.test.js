import getNextPage from './get-next-page.js'

describe('getNextPage', () => {
  it('returns the people-count route if other-residential is selected', () => {
    expect(getNextPage({ developmentTypes: ['other-residential'] })).toBe(
      '/quote/people-count'
    )
  })

  it('returns the people-count route if other-residential is selected alongside other types', () => {
    expect(
      getNextPage({ developmentTypes: ['housing', 'other-residential'] })
    ).toBe('/quote/people-count')
  })

  it('returns the waste-water route if other-residential is not selected', () => {
    expect(getNextPage({ developmentTypes: ['housing'] })).toBe(
      '/quote/waste-water'
    )
  })
})
