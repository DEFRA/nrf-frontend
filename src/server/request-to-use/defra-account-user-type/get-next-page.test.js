import getNextPage from './get-next-page.js'

describe('getNextPage', () => {
  it('goes to the individual Defra account page for an individual', () => {
    expect(getNextPage({ defraId: { userType: 'individual' } })).toBe(
      '/request-to-use/defra-account-individual'
    )
  })

  it('goes to the organisation Defra account page for an organisation', () => {
    expect(getNextPage({ defraId: { userType: 'organisation' } })).toBe(
      '/request-to-use/defra-account-organisation'
    )
  })

  it('goes to the agent Defra account page for an agent', () => {
    expect(getNextPage({ defraId: { userType: 'agent' } })).toBe(
      '/request-to-use/defra-account-agent'
    )
  })

  it('goes to enter address when there is no saved answer', () => {
    expect(getNextPage({})).toBe('/request-to-use/enter-address')
  })
})
