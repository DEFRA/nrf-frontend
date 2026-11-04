import { referenceParam } from '@defra/nrf-library'

/**
 * Shared Joi fragment for a typed NRL reference form field: trims and
 * uppercases before the shared reference pattern is applied, with the
 * page's own missing and format wording.
 *
 * @param {object} options
 * @param {string} options.missingMessage - shown when the field is empty
 * @param {string} options.formatMessage - shown when the pattern fails
 * @param {boolean} [options.prefixBareDigits] - give a bare six digit
 *   number the NRL- prefix instead of failing the pattern
 * @returns {import('joi').StringSchema}
 */
export const createNrlReferenceField = ({
  missingMessage,
  formatMessage,
  prefixBareDigits = false
}) => {
  let schema = referenceParam.trim().uppercase()

  if (prefixBareDigits) {
    schema = schema.replace(/^(\d{6})$/, 'NRL-$1')
  }

  return schema.messages({
    'any.required': missingMessage,
    'string.empty': missingMessage,
    'string.base': formatMessage,
    'string.pattern.base': formatMessage
  })
}
