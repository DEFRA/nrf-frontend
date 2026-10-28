import joi from 'joi'
import { createSessionNamespace } from '../../../common/helpers/session-namespace/index.js'
import enterNrlReferenceValidation from '../../enter-nrl-reference/form-validation.js'

const nrlReference = enterNrlReferenceValidation().extract('nrlReference')

const levy = joi.object({
  calculationDate: joi.string().required(),
  provisionalAmount: joi.number().required(),
  inflationAdjustedAmount: joi.number().required()
})

export const requestToUseSession = createSessionNamespace({
  key: 'requestToUse',
  schema: joi.object({
    nrlReference,
    levy
  })
})
