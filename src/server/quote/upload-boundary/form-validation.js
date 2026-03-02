import joi from 'joi'

const errorMessage = 'Select a file'

export default function () {
  return joi.object({
    file: joi.any().required().messages({
      'any.required': errorMessage
    })
  })
}
