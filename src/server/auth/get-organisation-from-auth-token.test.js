import { getOrganisationFromToken } from './get-organisation-from-auth-token.js'
import {
  agentClaims,
  citizenClaims,
  firstOrgId,
  firstOrgName,
  multiOrgAgentClaims,
  multiOrgEmployeeClaims,
  singleOrgEmployeeClaims
} from '../../test-utils/fixtures/defra-id-org-claims.js'

const errorLogger = vi.fn()
vi.mock('../common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({ error: errorLogger }))
}))

const defaultCitizen = {
  userRelationshipType: 'Citizen',
  hasMultipleOrgPickerEntries: false,
  shouldShowOrgOrUserName: false,
  shouldShowCitizenName: true
}

describe('#getOrganisationFromToken', () => {
  describe('organisation the user signed in as', () => {
    it.each([
      [
        'an Employee of one organisation',
        singleOrgEmployeeClaims,
        {
          organisationName: firstOrgName,
          userRelationshipType: 'Employee',
          hasMultipleOrgPickerEntries: false,
          shouldShowOrgOrUserName: true,
          shouldShowCitizenName: false
        }
      ],
      [
        'an Employee with more enrolments than roles',
        { ...singleOrgEmployeeClaims, enrolmentCount: 3 },
        {
          organisationName: firstOrgName,
          userRelationshipType: 'Employee',
          hasMultipleOrgPickerEntries: true,
          shouldShowOrgOrUserName: true,
          shouldShowCitizenName: false
        }
      ],
      [
        'an Employee linked to several organisations',
        multiOrgEmployeeClaims,
        {
          organisationName: firstOrgName,
          userRelationshipType: 'Employee',
          hasMultipleOrgPickerEntries: true,
          shouldShowOrgOrUserName: true,
          shouldShowCitizenName: false
        }
      ],
      [
        'an Agent for an organisation',
        agentClaims,
        {
          organisationName: 'CDP Beneficiary Org',
          userRelationshipType: 'Agent',
          hasMultipleOrgPickerEntries: false,
          shouldShowOrgOrUserName: false,
          shouldShowCitizenName: false
        }
      ],
      [
        'an Agent linked to several organisations',
        multiOrgAgentClaims,
        {
          organisationName: 'CDP Beneficiary Org',
          userRelationshipType: 'Agent',
          hasMultipleOrgPickerEntries: true,
          shouldShowOrgOrUserName: true,
          shouldShowCitizenName: false
        }
      ],
      [
        'a Citizen with a single relationship',
        citizenClaims,
        {
          organisationName: 'CDP Org',
          userRelationshipType: 'Citizen',
          hasMultipleOrgPickerEntries: false,
          shouldShowOrgOrUserName: false,
          shouldShowCitizenName: true
        }
      ]
    ])('returns the organisation details for %s', (_, claims, expected) => {
      expect(getOrganisationFromToken(claims)).toEqual({
        organisationId: firstOrgId,
        ...expected
      })
    })
  })

  describe('invalid or missing data', () => {
    it.each([
      [
        'currentRelationshipId is missing',
        { ...singleOrgEmployeeClaims, currentRelationshipId: undefined }
      ],
      [
        'enrolmentCount is missing',
        { ...singleOrgEmployeeClaims, enrolmentCount: undefined }
      ],
      [
        'relationships is not an array',
        { ...singleOrgEmployeeClaims, relationships: 'not-an-array' }
      ],
      [
        'roles is not an array',
        { ...singleOrgEmployeeClaims, roles: 'not-an-array' }
      ],
      [
        'relationships is empty',
        { ...singleOrgEmployeeClaims, relationships: [], enrolmentCount: 0 }
      ]
    ])('treats the user as a Citizen when %s', (_, claims) => {
      expect(getOrganisationFromToken(claims)).toEqual(defaultCitizen)
    })

    it('treats the user as a Citizen with no organisation when no relationship matches', () => {
      const result = getOrganisationFromToken({
        ...singleOrgEmployeeClaims,
        currentRelationshipId: 'non-matching-id'
      })

      expect(result).toEqual({
        organisationId: undefined,
        organisationName: undefined,
        ...defaultCitizen
      })
    })

    it('keeps the organisation id when the relationship string is incomplete', () => {
      const result = getOrganisationFromToken({
        ...singleOrgEmployeeClaims,
        relationships: [
          `${singleOrgEmployeeClaims.currentRelationshipId}:27d48d6c`
        ]
      })

      expect(result).toEqual({
        organisationId: '27d48d6c',
        organisationName: undefined,
        ...defaultCitizen
      })
    })

    it('falls back to Citizen and logs an error when the relationship type is invalid', () => {
      const result = getOrganisationFromToken({
        ...singleOrgEmployeeClaims,
        relationships: [
          `${singleOrgEmployeeClaims.currentRelationshipId}:${firstOrgId}:${firstOrgName}:0:InvalidRole:0`
        ]
      })

      expect(result).toEqual({
        organisationId: firstOrgId,
        organisationName: firstOrgName,
        ...defaultCitizen
      })
      expect(errorLogger).toHaveBeenCalledWith(
        'Invalid relationship type: InvalidRole'
      )
    })
  })
})
