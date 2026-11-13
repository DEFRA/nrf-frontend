import { describe, it, expect } from 'vitest'
import { getEnterAddressVariant } from './index.js'

describe('getEnterAddressVariant', () => {
  it.each([
    ['individual', 'individual'],
    ['organisation', 'employee'],
    ['agent', 'agent']
  ])('maps the saved answer %s to the %s variant', (userType, variant) => {
    expect(getEnterAddressVariant({ defraIdUserType: userType })).toBe(variant)
  })

  it.each([
    ['Agent', 'agent'],
    ['Employee', 'employee'],
    ['Citizen', 'individual']
  ])(
    'falls back to the Defra ID relationship %s for the %s variant',
    (relationshipType, variant) => {
      expect(
        getEnterAddressVariant({ userRelationshipType: relationshipType })
      ).toBe(variant)
    }
  )

  it('prefers the saved answer over the Defra ID relationship', () => {
    expect(
      getEnterAddressVariant({
        defraIdUserType: 'agent',
        userRelationshipType: 'Employee'
      })
    ).toBe('agent')
  })

  it('renders the individual variant with no answer and no relationship', () => {
    expect(getEnterAddressVariant()).toBe('individual')
  })
})
