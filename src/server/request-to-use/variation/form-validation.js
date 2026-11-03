import joi from 'joi'
import { variationOptions } from './options.js'

const errorMessage =
  'Select yes if the development is an amendment to an existing planning permission'

export default function formValidation() {
  return joi.object({
    variation: joi
      .string()
      .valid(...variationOptions.map((o) => o.value))
      .required()
      .messages({
        'any.required': errorMessage,
        'any.only': errorMessage
      })
  })
}
