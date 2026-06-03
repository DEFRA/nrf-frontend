import joi from 'joi'
import { quoteDetailsGetController } from './controller-get.js'
import getErrorViewModel from './get-error-view-model.js'
import { quoteAccessStatus } from './quote-access-status.js'
import { getQuoteAccessRateLimiter } from './rate-limiter.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { getClientIp } from '../../common/helpers/get-client-ip.js'

export const routePath = '/quote/{reference}/{token}'
export const referencePattern = /NRF-\d{6}/
export const tokenPattern = /[a-zA-Z0-9_-]+/

const invalidLinkFailAction = (_request, h) =>
  h
    .view(
      'quote/quote-details/error',
      getErrorViewModel(quoteAccessStatus.invalid)
    )
    .takeover()

// DoS protection: cap requests per IP for the quote access link.
const rateLimit = async (request, h) => {
  try {
    await getQuoteAccessRateLimiter().consume(getClientIp(request))
    return h.continue
  } catch {
    return h.response().code(statusCodes.tooManyRequests).takeover()
  }
}

// Prevent the token leaking via the Referer header to outbound links.
const setReferrerPolicy = (request, h) => {
  const { response } = request
  if (!response.isBoom) {
    response.header('Referrer-Policy', 'no-referrer')
  }
  return h.continue
}

export default [
  {
    method: 'GET',
    path: routePath,
    options: {
      pre: [{ method: rateLimit }],
      ext: {
        onPreResponse: { method: setReferrerPolicy }
      },
      validate: {
        params: joi.object({
          reference: joi
            .string()
            .pattern(new RegExp(`^${referencePattern.source}$`))
            .required(),
          token: joi
            .string()
            .pattern(new RegExp(`^${tokenPattern.source}$`))
            .required()
        }),
        failAction: invalidLinkFailAction
      }
    },
    ...quoteDetailsGetController
  }
]
