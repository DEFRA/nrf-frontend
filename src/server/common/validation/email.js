import joi from 'joi'

export const maxEmailLength = 254

export const emailErrorMessages = {
  required: 'Enter your email address',
  format: 'Enter an email address in the correct format, like name@example.com',
  maxLength: `Email address must be ${maxEmailLength} characters or less`,
  spaces: 'Email address must not contain spaces'
}

/**
 * Shared Joi fragment for an email address field. TLD validation is disabled so
 * the same rules apply on the frontend and backend (a divergence would let one
 * accept an address the other rejects).
 *
 * @param {object} [options]
 * @param {boolean} [options.noSpaces] - also reject any whitespace, surfacing
 *   the dedicated "must not contain spaces" message
 * @returns {import('joi').StringSchema}
 */
export const emailField = ({ noSpaces = false } = {}) => {
  let schema = joi.string().trim().max(maxEmailLength)

  if (noSpaces) {
    schema = schema.pattern(/^\S*$/)
  }

  return schema
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.empty': emailErrorMessages.required,
      'any.required': emailErrorMessages.required,
      'string.pattern.base': emailErrorMessages.spaces,
      'string.email': emailErrorMessages.format,
      'string.max': emailErrorMessages.maxLength
    })
}
