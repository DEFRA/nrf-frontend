/**
 * Creates a Joi custom validator for plain positive integers.
 * Rejects scientific notation (1e3), plus/minus signs, decimal numbers,
 * and non-numeric input. Server-side validation for progressive enhancement.
 *
 * @param {Object} options - Configuration options
 * @param {number} options.min - Minimum allowed value (inclusive)
 * @param {number} options.max - Maximum allowed value (inclusive)
 * @returns {Function} Joi custom validator function
 */
const ERROR_REQUIRED = 'any.required'
const ERROR_FORMAT = 'number.format'
const ERROR_MIN = 'number.min'
const ERROR_MAX = 'number.max'

export function createPlainIntegerValidator({ min, max }) {
  return function plainIntegerValidator(value, helpers) {
    const cleanedValue = String(value).trim().replaceAll(/\s+/g, '')

    // Reject empty
    if (cleanedValue === '') {
      return helpers.error(ERROR_REQUIRED)
    }

    // Check for negative numbers (digits preceded by minus sign)
    if (/^-\d+$/.test(cleanedValue)) {
      return helpers.error(ERROR_MIN)
    }

    // Check for decimal numbers (e.g. 2.4, -3.5)
    if (/^-?\d+\.\d+$/.test(cleanedValue)) {
      return helpers.error(ERROR_MIN)
    }

    // Must be digits only (reject letters, scientific notation, plus signs)
    if (!/^\d+$/.test(cleanedValue)) {
      return helpers.error(ERROR_FORMAT)
    }

    const num = Number.parseInt(cleanedValue, 10)

    if (num < min) {
      return helpers.error(ERROR_MIN)
    }

    if (num > max) {
      return helpers.error(ERROR_MAX)
    }

    return num
  }
}
