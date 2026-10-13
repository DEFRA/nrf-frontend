import joi from 'joi'
import { whatWouldYouLikeToDoOptions } from './options.js'

const errorMessage = 'Select what you would like to do'

export default function formValidation() {
  return joi.object({
    whatWouldYouLikeToDo: joi
      .string()
      .valid(...whatWouldYouLikeToDoOptions.map((o) => o.value))
      .required()
      .messages({
        'any.required': errorMessage,
        'any.only': errorMessage
      })
  })
}
