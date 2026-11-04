import joi from 'joi'
import { createNrlReferenceField } from '../../common/validation/nrl-reference.js'

const missingMessage =
  'Enter the NRL reference for the original planning permission'
const formatMessage =
  'Enter an NRL reference in the correct format, like NRL-123456'

// Unlike the enter your NRL reference page, six digits without the NRL-
// prefix are rejected: the prototype shows the format error for them.
export const originalReferenceField = createNrlReferenceField({
  missingMessage,
  formatMessage
})

export default function formValidation() {
  return joi.object({
    originalReference: originalReferenceField
  })
}
