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
export function createPlainIntegerValidator({ min, max }) {
  return function plainIntegerValidator(value, helpers) {
    const strValue = String(value).trim()

    // Reject empty
    if (strValue === '') {
      return helpers.error('any.required')
    }

    // Must be digits only (reject letters, scientific notation, plus/minus signs, decimals)
    if (!/^\d+$/.test(strValue)) {
      return helpers.error('number.format')
    }

    const num = Number.parseInt(strValue, 10)

    if (num < min) {
      return helpers.error('number.min')
    }

    if (num > max) {
      return helpers.error('number.max')
    }

    return num
  }
}
