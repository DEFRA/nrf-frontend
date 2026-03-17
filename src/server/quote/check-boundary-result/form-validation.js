import joi from 'joi'

const errorMessage = 'Select if the boundary is correct'

export default function formValidation() {
  return joi.object({
    boundaryCorrect: joi.string().valid('yes', 'no').optional().messages({
      'any.only': errorMessage
    })
  })
}
