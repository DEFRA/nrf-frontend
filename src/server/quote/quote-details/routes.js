import { referenceParam, tokenParam } from '@defra/nrf-library'
import joi from 'joi'
import { quoteDetailsGetController } from './controller-get.js'
import getErrorViewModel from './get-error-view-model.js'
import { quoteAccessStatus } from './helpers/quote-access-status.js'

export const routePath = '/quote/{reference}/{token}'

// A malformed reference can't correspond to a real quote, so there is nothing
// to recover — show the dead-end "no quote" page rather than the email-entry
// form (which would loop, since the resend route rejects the same reference).
// A malformed token against a well-formed reference is still treated as an
// invalid-but-recoverable link.
const invalidLinkFailAction = (request, h, err) => {
  const { reference, token } = request.params
  const referenceInvalid = err.details?.some((d) => d.path?.[0] === 'reference')
  const status = referenceInvalid
    ? quoteAccessStatus.notFound
    : quoteAccessStatus.invalid
  return h
    .view(
      'quote/quote-details/error',
      getErrorViewModel(status, { reference, token })
    )
    .takeover()
}

export default [
  {
    method: 'GET',
    path: routePath,
    options: {
      validate: {
        params: joi.object({
          reference: referenceParam,
          token: tokenParam
        }),
        failAction: invalidLinkFailAction
      }
    },
    ...quoteDetailsGetController
  }
]
