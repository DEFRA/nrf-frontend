import joi from 'joi'
import { quoteDetailsGetController } from './controller-get.js'
import getErrorViewModel from './get-error-view-model.js'
import { quoteAccessStatus } from './quote-access-status.js'

export const routePath = '/quote/{reference}/{token}'
export const referencePattern = /NRF-\d{6}/
export const tokenPattern = /[a-zA-Z0-9-]+/

const invalidLinkFailAction = (_request, h) =>
  h
    .view(
      'quote/quote-details/error',
      getErrorViewModel(quoteAccessStatus.invalid)
    )
    .takeover()

export default [
  {
    method: 'GET',
    path: routePath,
    options: {
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
