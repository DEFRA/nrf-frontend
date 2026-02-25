import joi from 'joi'

const requiredErrorMessage = 'Enter the number of residential units'
const integerErrorMessage = 'Enter a whole number'

export default function () {
  return joi.object({
    residentialBuildingCount: joi.number().integer().required().messages({
      'any.required': requiredErrorMessage,
      'number.base': requiredErrorMessage,
      'number.integer': integerErrorMessage
    })
  })
}
