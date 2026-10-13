import joi from 'joi'
import { referenceParam } from '@defra/nrf-library'

const missingMessage = 'Enter your NRL reference'
const formatMessage =
  'Enter a NRL reference in the correct format, like NRL-123456'

// Whitespace is trimmed and lowercase accepted (nrl-123456 becomes NRL-123456)
// before the shared reference pattern is applied.
export const nrlReferenceField = referenceParam.trim().uppercase().messages({
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
