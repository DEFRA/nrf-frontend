import Joi from 'joi'

import { AUTH_STRATEGY_NAME } from './auth-urls.js'

const rulesSchema = Joi.object({ requireAuth: Joi.boolean() })

/**
 * Teaches Hapi a `rules: { requireAuth: true }` route setting that protects the
 * route with the Defra ID session strategy. Must be called on the root server
 * before any routes are registered, and after the defra-identity plugin has
 * registered the strategy.
 * @param {import('@hapi/hapi').Server} server - Root Hapi server
 */
export function registerAuthRules(server) {
  server.rules(
    function authRulesProcessor(rules) {
      if (!rules?.requireAuth) {
        return undefined
      }
      return { auth: AUTH_STRATEGY_NAME }
    },
    { validate: { schema: rulesSchema } }
  )
}
