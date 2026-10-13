import joi from 'joi'
import { referenceParam } from '@defra/nrf-library'

const missingMessage = 'Enter your NRL reference'
const formatMessage =
  'Enter a NRL reference in the correct format, like NRL-123456'

// Whitespace is trimmed, lowercase accepted (nrl-123456 becomes NRL-123456) and
// a bare six digit number gets the NRL- prefix before the shared reference
// pattern is applied.
export const nrlReferenceField = referenceParam
  .trim()
  .uppercase()
  .replace(/^(\d{6})$/, 'NRL-$1')
  .messages({
    'any.required': missingMessage,
    'string.empty': missingMessage,
    'string.base': formatMessage,
    'string.pattern.base': formatMessage
  })

export default function formValidation() {
  return joi.object({
    nrlReference: nrlReferenceField
  })
}
