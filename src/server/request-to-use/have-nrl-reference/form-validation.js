import joi from 'joi'
import { hasNrlReferenceOptions } from './options.js'

const errorMessage = 'Select yes if you have an NRL reference'

export default function formValidation() {
  return joi.object({
    hasNrlReference: joi
      .string()
      .valid(...hasNrlReferenceOptions.map((o) => o.value))
      .required()
      .messages({
        'any.required': errorMessage,
        'any.only': errorMessage
      })
  })
}
