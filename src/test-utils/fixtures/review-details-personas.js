import { firstOrgName } from './defra-id-org-claims.js'

// The developer's name the agent types on the enter address page, and the
// name Defra ID reports for the signed-in employee or individual.
export const developerFullName = 'Trevor Barker'
export const accountFullName = 'Test User'

export const agentOrganisationName = 'CDP Beneficiary Org'

export const reviewDetailsAddress = {
  addressLine1: '1 Development Road',
  addressLine2: 'Building 2',
  townOrCity: 'Development',
  county: 'Devonshire',
  postcode: 'DV1 6RP'
}

// Seeded request to use sessions for each persona, in the shape saveEnterAddress
// writes: the address answers plus the snapshot of who confirmed them.
export const reviewDetailsSessions = {
  agent: {
    address: { ...reviewDetailsAddress, fullName: developerFullName },
    signin: {
      actualUserType: 'agent',
      organisation: { organisationName: agentOrganisationName }
    }
  },
  employee: {
    address: { ...reviewDetailsAddress, fullName: '' },
    signin: {
      actualUserType: 'employee',
      organisation: { organisationName: firstOrgName }
    }
  },
  individual: {
    address: { ...reviewDetailsAddress, fullName: '' },
    signin: {
      actualUserType: 'individual',
      organisation: { organisationName: '' }
    }
  }
}
