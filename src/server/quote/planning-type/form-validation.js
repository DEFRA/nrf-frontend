import joi from 'joi'
import { planningTypeOptions } from './options.js'

const errorMessage = 'Select a planning application type'

export default function planningTypeValidation() {
  return joi.object({
    planningType: joi
      .string()
      .valid(...planningTypeOptions.map((o) => o.value))
      .required()
      .messages({
        'any.required': errorMessage,
        'any.only': errorMessage
      })
  })
}
