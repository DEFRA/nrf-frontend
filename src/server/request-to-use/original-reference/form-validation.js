import joi from 'joi'
import { referenceParam } from '@defra/nrf-library'

const missingMessage =
  'Enter the NRL reference for the original planning permission'
const formatMessage =
  'Enter an NRL reference in the correct format, like NRL-123456'

// Whitespace is trimmed and lowercase accepted (nrl-123456 becomes NRL-123456)
// before the shared reference pattern is applied. Unlike the enter your NRL
// reference page, six digits without the NRL- prefix are rejected: the
// prototype shows the format error for them.
export const originalReferenceField = referenceParam
  .trim()
  .uppercase()
  .messages({
    'any.required': missingMessage,
    'string.empty': missingMessage,
    'string.base': formatMessage,
    'string.pattern.base': formatMessage
  })

export default function formValidation() {
  return joi.object({
    originalReference: originalReferenceField
  })
}
