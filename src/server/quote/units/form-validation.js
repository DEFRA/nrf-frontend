import joi from 'joi'

import { createPlainIntegerValidator } from '../../common/helpers/number-validators.js'

const MAX_RESIDENTIAL_UNITS = 50000

const requiredErrorMessage = 'Enter the number of housing units'
const formatErrorMessage = 'Housing units must be a number'
const integerErrorMessage = 'Housing units must be a whole number'
const minErrorMessage = 'Housing units must be 1 or more'
const maxErrorMessage = 'Housing units must be 50,000 or fewer'

const plainIntegerValidator = createPlainIntegerValidator({
  min: 1,
  max: MAX_RESIDENTIAL_UNITS
})

export default function formValidation() {
  return joi.object({
    residentialBuildingCount: joi
      .any()
      .custom(plainIntegerValidator)
      .required()
      .messages({
        'any.required': requiredErrorMessage,
        'number.format': formatErrorMessage,
        'number.integer': integerErrorMessage,
        'number.min': minErrorMessage,
        'number.max': maxErrorMessage
      })
  })
}
