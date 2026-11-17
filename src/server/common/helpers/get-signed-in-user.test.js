import { getSignedInUser } from './get-signed-in-user.js'
import { getOrganisationFromToken } from '../../auth/get-organisation-from-auth-token.js'
import {
  currentRelationshipId,
  firstOrgId,
  firstOrgName,
  multiOrgEmployeeClaims
} from '../../../test-utils/fixtures/defra-id-org-claims.js'

const profile = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  name: 'Test User',
  currentRelationshipId,
  organisation: getOrganisationFromToken(multiOrgEmployeeClaims)
}

const buildRequest = (credentials) => ({
  path: '/request-to-use/enter-address',
  url: new URL('http://localhost/request-to-use/enter-address'),
  auth: { credentials }
})

describe('#getSignedInUser', () => {
  it('returns nothing for a signed out request', () => {
    expect(getSignedInUser(buildRequest(null))).toBeUndefined()
  })

  it('returns the profile with the display name and organisation heading data', () => {
    expect(getSignedInUser(buildRequest({ profile }))).toEqual({
      ...profile,
      displayName: 'Test User',
      orgOrUserName: firstOrgName,
      changeOrganisationUrl:
        '/auth/change-organisation?redirectTo=%2Frequest-to-use%2Fenter-address'
    })
  })

  it('exposes the organisation resolved from the token', () => {
    const { organisation } = getSignedInUser(buildRequest({ profile }))

    expect(organisation).toMatchObject({
      organisationId: firstOrgId,
      organisationName: firstOrgName,
      userRelationshipType: 'Employee'
    })
  })

  it('does not expose the tokens held in the credentials', () => {
    const user = getSignedInUser(
      buildRequest({
        profile,
        token: 'access-token',
        refreshToken: 'refresh-token',
        idToken: 'id-token'
      })
    )

    expect(JSON.stringify(user)).not.toMatch(/token/i)
  })
})
