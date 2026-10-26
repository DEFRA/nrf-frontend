import joi from 'joi'
import { acceptLevyOptions } from './options.js'

const errorMessage =
  'Select yes if you accept the nature restoration levy amount'

export default function formValidation() {
  return joi.object({
    acceptLevy: joi
      .string()
      .valid(...acceptLevyOptions.map((o) => o.value))
      .required()
      .messages({
        'any.required': errorMessage,
        'any.only': errorMessage
      })
  })
}
