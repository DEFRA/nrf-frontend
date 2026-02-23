/**
 * Maps Joi validation error details to a display-friendly format.
 *
 * @param {Array} errors - The `details` array from a Joi `ValidationError` (i.e. `err.details`).
 *   Each item has the shape:
 *   - `path`    {string[]} - Path to the invalid field, e.g. `['boundaryType']`
 *   - `message` {string}   - Human-readable error text (customised via Joi `.messages()`)
 *   - `type`    {string}   - The Joi rule that failed, e.g. `'any.required'`
 */
export const mapValidationErrorsForDisplay = (errors = []) => {
  const summary = errors.map((error) => {
    const field = error.path
    return {
      href: `#${field}`,
      text: error.message,
      field
    }
  })

  const messagesByFormField = summary.reduce((error, obj) => {
    error[obj.field] = obj
    return error
  }, {})

  return {
    summary,
    messagesByFormField
  }
}
