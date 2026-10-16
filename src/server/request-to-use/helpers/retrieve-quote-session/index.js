import joi from 'joi'
import { createSessionNamespace } from '../../../common/helpers/session-namespace/index.js'
import haveNrlReferenceValidation from '../../have-nrl-reference/form-validation.js'
import enterNrlReferenceValidation from '../../enter-nrl-reference/form-validation.js'
import enterEmailValidation from '../../enter-email/form-validation.js'

const hasNrlReference = haveNrlReferenceValidation().extract('hasNrlReference')
const nrlReference = enterNrlReferenceValidation().extract('nrlReference')
const email = enterEmailValidation().extract('email')

export const retrieveQuoteSession = createSessionNamespace({
  key: 'retrieveQuote',
  schema: joi.object({
    hasNrlReference: hasNrlReference.optional().allow(null),
    nrlReference: nrlReference.optional().allow(null),
    email: email.optional().allow(null)
  })
})

/**
 * Saves the do you have an NRL reference answer. Anything other than yes
 * clears a previously saved reference so a stale one is not shown again.
 * @param {import('@hapi/hapi').Request} request
 * @param {{ hasNrlReference: string }} payload
 * @returns {object | null} the merged retrieve quote data
 */
export const saveHasNrlReference = (request, payload) =>
  retrieveQuoteSession.save(request, {
    ...payload,
    ...(payload.hasNrlReference === 'yes' ? {} : { nrlReference: null })
  })
