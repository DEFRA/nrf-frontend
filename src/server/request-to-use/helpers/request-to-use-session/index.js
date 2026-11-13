import joi from 'joi'
import { createSessionNamespace } from '../../../common/helpers/session-namespace/index.js'
import enterNrlReferenceValidation from '../../enter-nrl-reference/form-validation.js'
import acceptLevyValidation from '../../accept-levy/form-validation.js'
import originalReferenceValidation from '../../original-reference/form-validation.js'
import defraAccountUserTypeValidation from '../../defra-account-user-type/form-validation.js'
import variationValidation from '../../variation/form-validation.js'
import originalCommittedValidation from '../../original-committed/form-validation.js'
import { getEnterAddressVariant } from '../get-enter-address-variant/index.js'

const nrlReference = enterNrlReferenceValidation().extract('nrlReference')

// The reference entered on the original reference page, kept apart from the
// quote's own nrlReference so the not matched page can show what was entered.
// Optional because it is not set until that page has been completed.
const originalNrlReference = originalReferenceValidation()
  .extract('originalReference')
  .optional()

const acceptLevy = acceptLevyValidation().extract('acceptLevy').optional()

const userType = defraAccountUserTypeValidation().extract(
  'defraAccountUserType'
)

const variation = variationValidation().extract('variation').optional()

const originalCommitted = originalCommittedValidation()
  .extract('originalCommitted')
  .optional()

const defraId = joi.object({
  userType
})

const levy = joi.object({
  calculationDate: joi.string().required(),
  provisionalAmount: joi.number().required(),
  inflationAdjustedAmount: joi.number().required()
})

// The enter address answers, hand-written rather than extracted from the page
// schema: the fullName rule is conditional on the hidden formVariant field,
// which is never saved, and the postcode rule normalises values that are
// already normalised here. Length caps mirror the page validation.
const maxTextLength = 255
const maxPostcodeLength = 10

const fullName = joi.string().max(maxTextLength).allow('').optional()
const addressLine1 = joi.string().max(maxTextLength).allow('').optional()
const addressLine2 = joi.string().max(maxTextLength).allow('').optional()
const townOrCity = joi.string().max(maxTextLength).allow('').optional()
const county = joi.string().max(maxTextLength).allow('').optional()
const postcode = joi.string().max(maxPostcodeLength).allow('').optional()

// A snapshot of who was submitting, taken when the address is confirmed, so
// the review page and the eventual commitment certificate record have the
// resolved account type and organisation without re-reading the claims.
const accountType = joi
  .string()
  .valid('individual', 'employee', 'agent')
  .optional()
const organisationName = joi.string().max(maxTextLength).allow('').optional()
const organisationId = joi.string().max(maxTextLength).allow('').optional()

export const requestToUseSession = createSessionNamespace({
  key: 'requestToUse',
  schema: joi.object({
    nrlReference,
    originalNrlReference,
    levy,
    acceptLevy,
    variation,
    originalCommitted,
    defraId,
    fullName,
    addressLine1,
    addressLine2,
    townOrCity,
    county,
    postcode,
    accountType,
    organisationName,
    organisationId
  })
})

/**
 * Saves the NRL reference for the original planning permission, leaving the
 * rest of the request to use session untouched.
 * @param {import('@hapi/hapi').Request} request
 * @param {{ originalReference: string }} payload
 * @returns {object | null} the merged request to use data
 */
export const saveOriginalReference = (request, payload) =>
  requestToUseSession.save(request, {
    originalNrlReference: payload.originalReference
  })

/**
 * Saves the who are you requesting to use the levy for answer under defraId,
 * keeping any other post-login values already saved there.
 * @param {import('@hapi/hapi').Request} request
 * @param {{ defraAccountUserType: string }} payload
 * @returns {object | null} the merged request to use data
 */
export const saveDefraAccountUserType = (request, payload) =>
  requestToUseSession.save(request, {
    defraId: {
      ...requestToUseSession.get(request)?.defraId,
      userType: payload.defraAccountUserType
    }
  })

/**
 * Saves the enter address answers together with a snapshot of the resolved
 * account type and the organisation, leaving the rest of the request to use
 * session untouched. The account type is resolved on the server; the hidden
 * formVariant field is never saved.
 * @param {import('@hapi/hapi').Request} request
 * @param {{ fullName?: string, addressLine1: string, addressLine2?: string, townOrCity: string, county?: string, postcode: string }} payload
 * @returns {object | null} the merged request to use data
 */
export const saveEnterAddress = (request, payload) => {
  const { organisation } = request.auth.credentials?.profile ?? {}
  const session = requestToUseSession.get(request)
  const accountType = getEnterAddressVariant({
    defraIdUserType: session?.defraId?.userType,
    userRelationshipType: organisation?.userRelationshipType
  })

  return requestToUseSession.save(request, {
    fullName: payload.fullName ?? '',
    addressLine1: payload.addressLine1,
    addressLine2: payload.addressLine2 ?? '',
    townOrCity: payload.townOrCity,
    county: payload.county ?? '',
    postcode: payload.postcode,
    accountType,
    organisationName: organisation?.organisationName ?? '',
    organisationId: organisation?.organisationId ?? ''
  })
}
