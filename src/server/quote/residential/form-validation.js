import joi from 'joi'

const MAX_RESIDENTIAL_UNITS = 999999

const requiredErrorMessage = 'Enter the number of residential units'
const minErrorMessage = 'Enter a whole number greater than zero'
const maxErrorMessage = 'Enter a smaller whole number within the allowed range'

// Custom validator that validates string format then converts to number
// Rejects scientific notation (1e3), plus signs (+10), and non-integer formats
const plainIntegerValidator = (value, helpers) => {
  const strValue = String(value).trim()

  // Reject empty
  if (strValue === '') {
    return helpers.error('any.required')
  }

  // Reject scientific notation and plus signs
  if (/[eE+]/.test(strValue)) {
    return helpers.error('number.base')
  }

  // Reject decimal numbers (contains a decimal point)
  if (strValue.includes('.')) {
    return helpers.error('number.integer')
  }

  // Must be a plain integer (optional minus, then digits only)
  if (!/^-?\d+$/.test(strValue)) {
    return helpers.error('number.base')
  }

  const num = Number.parseInt(strValue, 10)

  if (num < 1) {
    return helpers.error('number.min')
  }

  if (num > MAX_RESIDENTIAL_UNITS) {
    return helpers.error('number.max')
  }

  return num
}

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
