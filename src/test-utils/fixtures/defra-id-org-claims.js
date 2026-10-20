const currentRelationshipId = '81d48d6c-6e94-f011-b4cc-000d3ac28f39'

export const firstOrgId = '27d48d6c-6e94-f011-b4cc-000d3ac28f39'
export const firstOrgName = 'CDP Child Org 1'

const employeeRelationship = `${currentRelationshipId}:${firstOrgId}:${firstOrgName}:0:Employee:0`
const secondEmployeeRelationship =
  '91d48d6c-6e94-f011-b4cc-000d3ac28f39:37d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 2:0:Employee:0'

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

export const citizenClaims = {
  ...singleOrgEmployeeClaims,
  relationships: [`${currentRelationshipId}:${firstOrgId}:CDP Org:0:Citizen:0`]
}
