const userTypes = new Set(['individual', 'organisation', 'agent'])

const variantsByRelationshipType = {
  Agent: 'agent',
  Employee: 'organisation'
}

/**
 * Resolves which of the page's three variants applies: the developer details
 * variant for an agent, the individual address variant for an individual, and
 * the organisation address variant for anyone else representing an
 * organisation. The who are you requesting to use the levy for answer saved in
 * the request to use session wins; the Defra ID relationship is the fallback
 * for users who were already signed in and skipped that question.
 * @param {object} [data] - the session answer and the Defra ID relationship
 * @param {string} [data.defraIdUserType] - individual, organisation or agent
 * @param {string} [data.userRelationshipType] - Agent, Employee or Citizen
 * @returns {'individual' | 'organisation' | 'agent'} the variant to render
 */
export function getEnterAddressVariant({
  defraIdUserType,
  userRelationshipType
} = {}) {
  if (userTypes.has(defraIdUserType)) {
    return defraIdUserType
  }

  return variantsByRelationshipType[userRelationshipType] ?? 'individual'
}
