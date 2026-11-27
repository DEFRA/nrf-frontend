import { referenceParam } from '@defra/nrf-library'
import { originalCommittedOptions } from '../../original-committed/options.js'
import { variationOptions } from '../../variation/options.js'

/**
 * Whether the planning amendment answers that apply have been given: the
 * original permission answer only applies to an amendment, and its reference
 * only when the original permission was committed to the levy.
 * @param {object | null} requestToUse - the request to use session data
 * @returns {boolean}
 */
const hasPlanningAmendmentAnswers = (requestToUse) => {
  const { variation, originalCommitted, originalNrlReference } =
    requestToUse ?? {}
  const isAmendmentAnswered = variationOptions.some(
    ({ value }) => value === variation
  )
  const isOriginalPermissionAnswered = originalCommittedOptions.some(
    ({ value }) => value === originalCommitted
  )

  return (
    isAmendmentAnswered &&
    (variation !== 'yes' ||
      (isOriginalPermissionAnswered &&
        (originalCommitted !== 'yes' ||
          referenceParam.validate(originalNrlReference).error === undefined)))
  )
}

/**
 * Whether every answer the check your answers page confirms has been given for
 * the signed in account, and the quote's reference the submit sends is saved
 * and well formed. A blank or malformed one means the request cannot be
 * checked or submitted: the page fails with the incomplete answers error page,
 * except that a direct load is redirected to the review and amend page.
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
    hasPlanningAmendmentAnswers(requestToUse) &&
    Boolean(actualUserType) &&
    requiredAddressLines.every(Boolean) &&
    hasFullName
  )
}
