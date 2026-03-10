import joi from 'joi'

const errorMessage = 'Enter the maximum number of people to continue'

export default function () {
  return joi.object({
    peopleCount: joi.number().integer().min(1).required().messages({
      'any.required': errorMessage,
      'number.base': errorMessage,
      'number.integer': errorMessage,
      'number.min': errorMessage
    })
  })
}
