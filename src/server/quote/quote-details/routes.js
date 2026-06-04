import joi from 'joi'
import { quoteDetailsGetController } from './controller-get.js'
import getErrorViewModel from './get-error-view-model.js'
import { quoteAccessStatus } from './helpers/quote-access-status.js'

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
