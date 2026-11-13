const variantsByRelationshipType = {
  Agent: 'agent',
  Employee: 'employee'
}

/**
 * Resolves which of the enter address page's three variants applies from the
 * Defra ID relationship the user signed in with: the developer details variant
 * for an agent, the organisation address variant for an employee, and the
 * individual address variant for anyone else.
 * @param {object} [data]
 * @param {string} [data.userRelationshipType] - Agent, Employee or Citizen
 * @returns {'individual' | 'employee' | 'agent'} the variant to render
 */
export function getEnterAddressVariant({ userRelationshipType } = {}) {
  return variantsByRelationshipType[userRelationshipType] ?? 'individual'
}
