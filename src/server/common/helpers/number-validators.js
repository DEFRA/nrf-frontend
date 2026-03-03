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
    const cleanedValue = String(value).trim().replace(/\s+/g, '')

    // Reject empty
    if (cleanedValue === '') {
      return helpers.error('any.required')
    }

    // Check for negative numbers (digits preceded by minus sign)
    if (/^-\d+$/.test(cleanedValue)) {
      return helpers.error('number.min')
    }

    // Check for decimal numbers (e.g. 2.4, -3.5)
    if (/^-?\d+\.\d+$/.test(cleanedValue)) {
      return helpers.error('number.min')
    }

    // Must be digits only (reject letters, scientific notation, plus signs)
    if (!/^\d+$/.test(cleanedValue)) {
      return helpers.error('number.format')
    }

    const num = Number.parseInt(cleanedValue, 10)

    if (num < min) {
      return helpers.error('number.min')
    }

    if (num > max) {
      return helpers.error('number.max')
    }

    return num
  }
}
