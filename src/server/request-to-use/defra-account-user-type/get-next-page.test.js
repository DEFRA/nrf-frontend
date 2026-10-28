import getNextPage from './get-next-page.js'

describe('getNextPage', () => {
  it('goes to the individual Defra account page for an individual', () => {
    expect(getNextPage({ defraId: { userType: 'individual' } })).toBe(
      '/request-to-use/defra-account-individual'
    )
  })

  it.each([
    {
      scenario: 'an organisation',
      data: { defraId: { userType: 'organisation' } }
    },
    { scenario: 'an agent', data: { defraId: { userType: 'agent' } } },
    { scenario: 'no saved answer', data: {} }
  ])('goes to enter address for $scenario', ({ data }) => {
    expect(getNextPage(data)).toBe('/request-to-use/enter-address')
  })
})
