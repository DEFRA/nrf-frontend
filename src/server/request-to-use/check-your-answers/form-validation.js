import joi from 'joi'
import { confirmInformationOptions } from './options.js'

const tickBoxMessage =
  'Tick the box to confirm the information is true, accurate and complete'

export default function () {
  return joi.object({
    confirmInformation: joi
      .array()
      .items(
        joi
          .string()
          .valid(...confirmInformationOptions.map((option) => option.value))
      )
      .single()
      .required()
      .messages({
        'any.required': tickBoxMessage,
        'any.only': tickBoxMessage
      })
  })
}
