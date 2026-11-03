import joi from 'joi'
import { originalCommittedOptions } from './options.js'

const errorMessage =
  'Select yes if the original planning permission was committed to using the nature restoration levy'

export default function formValidation() {
  return joi.object({
    originalCommitted: joi
      .string()
      .valid(...originalCommittedOptions.map((o) => o.value))
      .required()
      .messages({
        'any.required': errorMessage,
        'any.only': errorMessage
      })
  })
}
