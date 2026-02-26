import joi from 'joi'

import { createPlainIntegerValidator } from '../../common/helpers/number-validators.js'

const MAX_RESIDENTIAL_UNITS = 999999

const requiredErrorMessage = 'Enter the number of residential units'
const minErrorMessage = 'Enter a whole number greater than zero'
const maxErrorMessage = 'Enter a smaller whole number within the allowed range'

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
        'number.base': requiredErrorMessage,
        'number.integer': minErrorMessage,
        'number.min': minErrorMessage,
        'number.max': maxErrorMessage
      })
  })
}
