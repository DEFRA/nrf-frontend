import joi from 'joi'
import { browserLogsController } from './controller.js'
import { statusCodes } from '../common/constants/status-codes.js'

const MAX_STRING_LENGTH = 2000

const ACTION_VALUES = [
  'error',
  'info',
  'warning',
  'debug',
  'map-load',
  'map-element-missing',
  'plugin-unavailable',
  'deps-unavailable'
]

const ERROR_TYPE_VALUES = [
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
  'EvalError'
]

// Strip angle brackets from freeform fields — two simple character replacements
// with no quantifier backtracking, avoiding ReDoS on malformed input
const sanitizedString = joi
  .string()
  .max(MAX_STRING_LENGTH)
  .custom((value) => value.replace(/</g, '').replace(/>/g, ''))

const payloadSchema = joi.object({
  level: joi.string().valid('error', 'warn', 'info', 'debug').default('error'),
  message: sanitizedString.required(),
  timestamp: joi.number().required(),
  action: joi
    .string()
    .valid(...ACTION_VALUES)
    .optional(),
  url: joi.string().uri().max(MAX_STRING_LENGTH).optional(),
  userAgent: sanitizedString.optional(),
  stack: sanitizedString.optional(),
  errorType: joi
    .string()
    .valid(...ERROR_TYPE_VALUES)
    .optional()
})

export const browserLogs = {
  plugin: {
    name: 'browser-logs',
    register(server) {
      server.route({
        method: 'POST',
        path: '/api/browser-logs',
        options: {
          ...browserLogsController.options,
          validate: {
            payload: payloadSchema,
            failAction: (request, h, err) => {
              request.logger.info(
                { err },
                'Invalid browser log payload rejected'
              )
              return h.response().code(statusCodes.noContent).takeover()
            }
          }
        },
        handler: browserLogsController.handler
      })
    }
  }
}
