import { describe, it, expect } from 'vitest'
import { getEnterAddressVariant } from './index.js'

describe('getEnterAddressVariant', () => {
  it.each([
    ['Agent', 'agent'],
    ['Employee', 'employee'],
    ['Citizen', 'individual']
  ])(
    'maps the Defra ID relationship %s to the %s variant',
    (relationshipType, variant) => {
      expect(
        getEnterAddressVariant({ userRelationshipType: relationshipType })
      ).toBe(variant)
    }
  )

  it('renders the individual variant with no relationship', () => {
    expect(getEnterAddressVariant()).toBe('individual')
  })
})
