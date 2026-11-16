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

const intendedUserType = defraAccountUserTypeValidation().extract(
  'defraAccountUserType'
)

const variation = variationValidation().extract('variation').optional()

const originalCommitted = originalCommittedValidation()
  .extract('originalCommitted')
  .optional()

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
const actualUserType = joi
  .string()
  .valid('individual', 'employee', 'agent')
  .optional()
const organisation = joi
  .object({
    organisationName: joi.string().max(maxTextLength).allow('').optional(),
    organisationId: joi.string().max(maxTextLength).allow('').optional()
  })
  .optional()

// intendedUserType is the user's answer before signing in, kept as a record
// only. actualUserType and organisation come from the Defra ID account the
// user signed in with and are cleared when they switch account.
const signin = joi.object({
  intendedUserType: intendedUserType.optional(),
  actualUserType,
  organisation
})

const address = joi.object({
  fullName,
  addressLine1,
  addressLine2,
  townOrCity,
  county,
  postcode
})

export const requestToUseSession = createSessionNamespace({
  key: 'requestToUse',
  schema: joi.object({
    nrlReference,
    originalNrlReference,
    levy,
    acceptLevy,
    variation,
    originalCommitted,
    signin,
    address
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
 * Saves the who are you requesting to use the levy for answer as the user's
 * intended user type, keeping any other sign in values already saved.
 * @param {import('@hapi/hapi').Request} request
 * @param {{ defraAccountUserType: string }} payload
 * @returns {object | null} the merged request to use data
 */
export const saveDefraAccountUserType = (request, payload) =>
  requestToUseSession.save(request, {
    signin: {
      ...requestToUseSession.get(request)?.signin,
      intendedUserType: payload.defraAccountUserType
    }
  })

/**
 * Saves the enter address answers together with a snapshot of the resolved
 * user type and the organisation, leaving the rest of the request to use
 * session untouched. The user type is resolved on the server from the Defra ID
 * relationship; the hidden formVariant field is never saved.
 * @param {import('@hapi/hapi').Request} request
 * @param {{ fullName?: string, addressLine1: string, addressLine2?: string, townOrCity: string, county?: string, postcode: string }} payload
 * @returns {object | null} the merged request to use data
 */
export const saveEnterAddress = (request, payload) => {
  const profileOrganisation =
    request.auth.credentials?.profile?.organisation ?? {}
  const actualUserType = getEnterAddressVariant({
    userRelationshipType: profileOrganisation.userRelationshipType
  })

  return requestToUseSession.save(request, {
    address: {
      fullName: payload.fullName ?? '',
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2 ?? '',
      townOrCity: payload.townOrCity,
      county: payload.county ?? '',
      postcode: payload.postcode
    },
    signin: {
      ...requestToUseSession.get(request)?.signin,
      actualUserType,
      organisation: {
        organisationName: profileOrganisation.organisationName ?? '',
        organisationId: profileOrganisation.organisationId ?? ''
      }
    }
  })
}

/**
 * Clears what belongs to the Defra ID account the user signed in with (the
 * address, the organisation and the resolved user type), keeping the intended
 * user type and every other answer.
 * @param {import('@hapi/hapi').Request} request
 * @returns {void}
 */
export const clearAccountAnswers = (request) => {
  const session = requestToUseSession.get(request)
  if (!session) {
    return
  }
  const { address: _address, signin, ...rest } = session
  const { intendedUserType } = signin ?? {}
  requestToUseSession.clear(request)
  requestToUseSession.save(request, {
    ...rest,
    ...(intendedUserType && { signin: { intendedUserType } })
  })
}
