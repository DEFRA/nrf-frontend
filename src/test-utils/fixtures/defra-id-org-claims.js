export const currentRelationshipId = '81d48d6c-6e94-f011-b4cc-000d3ac28f39'

export const firstOrgId = '27d48d6c-6e94-f011-b4cc-000d3ac28f39'
export const firstOrgName = 'CDP Child Org 1'

// The relationship with a second organisation: the users with several
// organisations have it as a second link, and otherOrgEmployeeClaims signs in
// with it
export const secondRelationshipId = '91d48d6c-6e94-f011-b4cc-000d3ac28f39'

const employeeRelationship = `${currentRelationshipId}:${firstOrgId}:${firstOrgName}:0:Employee:0`
export const secondEmployeeRelationship = `${secondRelationshipId}:37d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 2:0:Employee:0`

// Claims of a different Defra ID account: an employee of another organisation
export const otherOrgEmployeeClaims = {
  currentRelationshipId: secondRelationshipId,
  relationships: [secondEmployeeRelationship],
  enrolmentCount: 1,
  roles: ['role2']
}

// Defra ID token claims describing the organisation the user signed in as
export const singleOrgEmployeeClaims = {
  currentRelationshipId,
  relationships: [employeeRelationship],
  enrolmentCount: 1,
  roles: ['role1']
}

export const multiOrgEmployeeClaims = {
  currentRelationshipId,
  relationships: [employeeRelationship, secondEmployeeRelationship],
  enrolmentCount: 2,
  roles: ['role1', 'role2']
}

export const agentClaims = {
  ...singleOrgEmployeeClaims,
  relationships: [
    `${currentRelationshipId}:${firstOrgId}:CDP Beneficiary Org:0:Agent:0`
  ]
}

export const multiOrgAgentClaims = {
  currentRelationshipId,
  relationships: [
    `${currentRelationshipId}:${firstOrgId}:CDP Beneficiary Org:0:Agent:0`,
    `${secondRelationshipId}:37d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Beneficiary Org 2:0:Agent:0`
  ],
  enrolmentCount: 2,
  roles: ['role1', 'role2']
}

export const citizenClaims = {
  ...singleOrgEmployeeClaims,
  relationships: [`${currentRelationshipId}:${firstOrgId}:CDP Org:0:Citizen:0`]
}
