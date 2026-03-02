import joi from 'joi'

export default function formValidation() {
  return joi.object({
    file: joi.any().required().messages({
      'any.required': 'Select a file'
    })
  })
}
