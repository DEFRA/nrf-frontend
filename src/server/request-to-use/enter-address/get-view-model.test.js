import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'
import {
  currentRelationshipId,
  firstOrgName
} from '../../../test-utils/fixtures/defra-id-org-claims.js'

const address = { addressLine1: '1 Road', townOrCity: 'Leeds' }

const employee = {
  currentRelationshipId,
  organisation: {
    organisationName: firstOrgName,
    userRelationshipType: 'Employee'
  }
}

describe('enter address getViewModel', () => {
  it('uses a heading without the organisation name when the profile has none', () => {
    expect(
      getViewModel({
        signedInUser: { organisation: { userRelationshipType: 'Agent' } }
      }).pageHeading
    ).toBe('What are the details for the business or organisation?')
  })

  it('names the organisation in the heading for an employee', () => {
    expect(getViewModel({ signedInUser: employee }).pageHeading).toBe(
      `What is the address for ${firstOrgName}?`
    )
  })

  it('pre-fills the address entered under the signed-in relationship', () => {
    const viewModel = getViewModel({
      session: {
        requestToUse: {
          address,
          signin: { relationshipId: currentRelationshipId }
        }
      },
      signedInUser: employee
    })

    expect(viewModel.formData).toEqual(address)
  })

  it('does not pre-fill an address entered under another relationship', () => {
    const viewModel = getViewModel({
      session: {
        requestToUse: { address, signin: { relationshipId: 'another-rel-id' } }
      },
      signedInUser: employee
    })

    expect(viewModel.formData).toBeUndefined()
  })

  it.each([
    ['there are no earlier answers', undefined, '/request-to-use/variation'],
    [
      'the original permission was committed',
      { variation: 'yes', originalCommitted: 'yes' },
      '/request-to-use/original-reference'
    ]
  ])(
    'links back to the right question when %s',
    (_, requestToUse, expected) => {
      expect(
        getViewModel({ session: { requestToUse: requestToUse ?? null } })
          .backLinkPath
      ).toBe(expected)
    }
  )
})
