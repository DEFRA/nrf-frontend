import { referenceParam } from '@defra/nrf-library'

/**
 * Whether every answer the check your answers page confirms has been given for
 * the signed in account, and the quote's reference the submit sends is saved
 * and well formed. A blank or malformed one means the request cannot be
 * checked or submitted, so the page fails with the incomplete answers error
 * page.
 * @param {object} params
 * @param {object | null} params.requestToUse - the request to use session data
 * @param {object} [params.address] - the saved enter address answers, already checked against the signed in relationship
 * @returns {boolean}
 */
export function areRequiredAnswersComplete({ requestToUse, address } = {}) {
  const actualUserType = requestToUse?.signin?.actualUserType
  const hasValidReference =
    referenceParam.validate(requestToUse?.nrlReference).error === undefined
  const requiredAddressLines = [
    address?.addressLine1,
    address?.townOrCity,
    address?.postcode
  ]
  // Only an agent types the developer's name; for everyone else it comes from
  // their Defra ID account
  const hasFullName = actualUserType !== 'agent' || Boolean(address?.fullName)

  return (
    hasValidReference &&
    Boolean(requestToUse?.levy) &&
    requestToUse?.acceptLevy === 'yes' &&
    Boolean(actualUserType) &&
    requiredAddressLines.every(Boolean) &&
    hasFullName
  )
}
