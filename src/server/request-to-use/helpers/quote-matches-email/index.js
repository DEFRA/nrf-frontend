import { getQuoteFromBackend } from '../../../common/services/nrf-backend.js'
import { statusCodes } from '../../../common/constants/status-codes.js'

const normalise = (email) => email.trim().toLowerCase()

/**
 * Checks whether the quote for an NRL reference was made with an email address.
 * A reference with no quote is simply not a match; any other backend failure is
 * rethrown so it is never mistaken for one.
 * @param {{ nrlReference: string, email: string }} params
 * @returns {Promise<boolean>}
 */
export const quoteMatchesEmail = async ({ nrlReference, email }) => {
  let quote
  try {
    ;({ payload: quote } = await getQuoteFromBackend({
      reference: nrlReference
    }))
  } catch (error) {
    if (error.output?.statusCode === statusCodes.notFound) {
      return false
    }
    throw error
  }

  const quoteEmail = quote?.email?.address
  return Boolean(quoteEmail) && normalise(quoteEmail) === normalise(email)
}
