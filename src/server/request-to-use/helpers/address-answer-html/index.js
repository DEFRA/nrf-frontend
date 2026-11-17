import escapeHtml from 'lodash/escape.js'

/**
 * The address answer as one line per saved value, blank lines dropped. Each
 * line is escaped: only the joining br tags are markup, so user-controlled
 * values never reach the template unescaped.
 * @param {object} [address] - the saved enter address answers
 * @returns {string} html for the summary list value
 */
export const addressAnswerHtml = (address) =>
  [
    address?.addressLine1,
    address?.addressLine2,
    address?.townOrCity,
    address?.county,
    address?.postcode
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join('<br>')
