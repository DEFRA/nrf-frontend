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

    // Reject scientific notation, plus signs, and minus signs
    if (/[eE+-]/.test(strValue)) {
      return helpers.error('number.base')
    }

    // Reject decimal numbers (contains a decimal point)
    if (strValue.includes('.')) {
      return helpers.error('number.integer')
    }

    // Must be digits only
    if (!/^\d+$/.test(strValue)) {
      return helpers.error('number.base')
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
