import joi from 'joi'

const errorMessage = 'Select if the boundary is correct'

export default function formValidation() {
  return joi.object({
    boundaryCorrect: joi.string().valid('yes', 'no').required().messages({
      'any.required': errorMessage,
      'any.only': errorMessage
    })
  })
}
