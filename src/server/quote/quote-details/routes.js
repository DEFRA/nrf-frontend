import joi from 'joi'
import { quoteDetailsGetController } from './controller-get.js'

export const routePath = '/quote/{reference}/{token}'
export const referencePattern = /NRF-\d{6}/
export const tokenPattern = /[a-zA-Z0-9-]+/

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
        })
      }
    },
    ...quoteDetailsGetController
  }
]
