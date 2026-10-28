import { getOrganisationHeadingData } from './get-organisation-heading-data.js'
import { getOrganisationFromToken } from '../../auth/get-organisation-from-auth-token.js'
import {
  agentClaims,
  citizenClaims,
  firstOrgName,
  multiOrgEmployeeClaims,
  singleOrgEmployeeClaims
} from '../../../test-utils/fixtures/defra-id-org-claims.js'

const buildRequest = ({ claims, url = 'http://localhost/profile' } = {}) => {
  const parsedUrl = new URL(url)
  return {
    path: parsedUrl.pathname,
    url: parsedUrl,
    auth: {
      credentials: claims && {
        profile: {
          name: 'Test User',
          organisation: getOrganisationFromToken(claims)
        }
      }
    }
  }
}

describe('#getOrganisationHeadingData', () => {
  it('shows the organisation name and a change link for an Employee linked to several organisations', () => {
    const result = getOrganisationHeadingData(
      buildRequest({ claims: multiOrgEmployeeClaims })
    )

    expect(result).toEqual({
      orgOrUserName: firstOrgName,
      changeOrganisationUrl: '/auth/change-organisation?redirectTo=%2Fprofile'
    })
  })

  it.each([
    ['an Employee of one organisation', singleOrgEmployeeClaims],
    ['a Citizen', citizenClaims],
    ['an Agent', agentClaims]
  ])('shows nothing for %s with one enrolment', (_, claims) => {
    const result = getOrganisationHeadingData(buildRequest({ claims }))

    expect(result).toEqual({ orgOrUserName: null, changeOrganisationUrl: null })
  })

  it('shows the user name and a change link for a Citizen with several enrolments', () => {
    const result = getOrganisationHeadingData(
      buildRequest({ claims: { ...citizenClaims, enrolmentCount: 2 } })
    )

    expect(result).toEqual({
      orgOrUserName: 'Test User',
      changeOrganisationUrl: '/auth/change-organisation?redirectTo=%2Fprofile'
    })
  })

  it('shows nothing when the request is unauthenticated', () => {
    const result = getOrganisationHeadingData(buildRequest())

    expect(result).toEqual({ orgOrUserName: null, changeOrganisationUrl: null })
  })

  it('returns the user to the current page, including its query string', () => {
    const result = getOrganisationHeadingData(
      buildRequest({
        claims: multiOrgEmployeeClaims,
        url: 'http://localhost/quote/summary?tab=a&b=c'
      })
    )

    expect(result.changeOrganisationUrl).toBe(
      '/auth/change-organisation?redirectTo=%2Fquote%2Fsummary%3Ftab%3Da%26b%3Dc'
    )
  })
})
