import joi from 'joi'

const requiredErrorMessage = 'Enter an email address'
const formatErrorMessage =
  'Enter an email address in the correct format, like name@example.com'
const maxLengthErrorMessage = 'Email address must be 256 characters or less'

export default function getSchema() {
  return joi.object({
    email: joi
      .string()
      .trim()
      .max(256)
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.empty': requiredErrorMessage,
        'any.required': requiredErrorMessage,
        'string.email': formatErrorMessage,
        'string.max': maxLengthErrorMessage
      })
  })
}
