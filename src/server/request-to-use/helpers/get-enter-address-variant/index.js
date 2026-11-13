const variantsByUserType = {
  individual: 'individual',
  organisation: 'employee',
  agent: 'agent'
}

const variantsByRelationshipType = {
  Agent: 'agent',
  Employee: 'employee'
}

/**
 * Resolves which of the enter address page's three variants applies: the
 * developer details variant for an agent, the organisation address variant for
 * an employee, and the individual address variant for anyone else. The who are
 * you requesting to use the levy for answer saved in the request to use
 * session wins; the Defra ID relationship is the fallback for users who were
 * already signed in and skipped that question.
 * @param {object} [data] - the session answer and the Defra ID relationship
 * @param {string} [data.defraIdUserType] - individual, organisation or agent
 * @param {string} [data.userRelationshipType] - Agent, Employee or Citizen
 * @returns {'individual' | 'employee' | 'agent'} the variant to render
 */
export function getEnterAddressVariant({
  defraIdUserType,
  userRelationshipType
} = {}) {
  return (
    variantsByUserType[defraIdUserType] ??
    variantsByRelationshipType[userRelationshipType] ??
    'individual'
  )
}
