import joi from 'joi'
import { createNrlReferenceField } from '../../common/validation/nrl-reference.js'

const missingMessage = 'Enter your NRL reference'
const formatMessage =
  'Enter a NRL reference in the correct format, like NRL-123456'

export const nrlReferenceField = createNrlReferenceField({
  missingMessage,
  formatMessage,
  prefixBareDigits: true
})

export default function formValidation() {
  return joi.object({
    nrlReference: nrlReferenceField
  })
}
