import joi from 'joi'
import { createSessionNamespace } from '../../../common/helpers/session-namespace/index.js'
import enterNrlReferenceValidation from '../../enter-nrl-reference/form-validation.js'
import defraAccountUserTypeValidation from '../../defra-account-user-type/form-validation.js'

const nrlReference = enterNrlReferenceValidation().extract('nrlReference')

const userType = defraAccountUserTypeValidation().extract(
  'defraAccountUserType'
)

const defraId = joi.object({
  userType
})

const levy = joi.object({
  calculationDate: joi.string().required(),
  provisionalAmount: joi.number().required(),
  inflationAdjustedAmount: joi.number().required()
})

export const requestToUseSession = createSessionNamespace({
  key: 'requestToUse',
  schema: joi.object({
    nrlReference,
    levy,
    defraId
  })
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
