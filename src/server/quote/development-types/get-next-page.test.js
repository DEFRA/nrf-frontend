import getNextPage from './get-next-page.js'

describe('getNextPage', () => {
  it('returns the residential route if housing is selected', () => {
    expect(getNextPage({ developmentTypes: ['housing'] })).toBe(
      '/quote/residential'
    )
  })

  it('returns the residential route if housing is selected alongside other types', () => {
    expect(
      getNextPage({ developmentTypes: ['housing', 'other-residential'] })
    ).toBe('/quote/residential')
  })

  it('returns the people-count route if housing is not selected', () => {
    expect(getNextPage({ developmentTypes: ['other-residential'] })).toBe(
      '/quote/people-count'
    )
  })
})
