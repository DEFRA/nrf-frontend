import joi from 'joi'
import { defraAccountUserTypeOptions } from './options.js'

const errorMessage =
  'Select who you are requesting to use the nature restoration levy for'

export default function formValidation() {
  return joi.object({
    defraAccountUserType: joi
      .string()
      .valid(...defraAccountUserTypeOptions.map((o) => o.value))
      .required()
      .messages({
        'any.required': errorMessage,
        'any.only': errorMessage
      })
  })
}
