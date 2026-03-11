import joi from 'joi'

const errorMessage = 'Enter the maximum number of people to continue'
const errorMessageInteger = 'Enter a whole number greater than zero'

export default function formValidation() {
  return joi.object({
    peopleCount: joi.number().integer().min(1).required().messages({
      'any.required': errorMessage,
      'number.base': errorMessage,
      'number.integer': errorMessageInteger,
      'number.min': errorMessageInteger
    })
  })
}
